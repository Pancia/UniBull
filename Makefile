SHELL 				:= /bin/bash
BIN					:= ./bin
NM_BIN		     	:= ./node_modules/.bin
MOCHA		     	:= multi='spec=- html-cov=coverage.html' ${NM_BIN}/mocha
BUNYAN				:= tee logs/bunyan.out | ${NM_BIN}/bunyan
LINTER		     	:= eslint
SEL_SERVER			:= ${BIN}/selenium-server-standalone-2.45.0.jar
PHANTOMJS			:= ${BIN}/phantomjs
MOCHA_OPTS	     	:= --recursive --colors -r blanket --reporter mocha-multi
AUTOTEST_IGNORES 	:= --ignore ./public/ --ignore ./bin/ --ignore ./logs/ --ignore '.[!.]*'

start:
	nodemon ${AUTOTEST_IGNORES} --ext js,json | ${BUNYAN}

start-selenium:
	@ java -jar ${SEL_SERVER}\
		-log ./logs/selenium.log\
		2> ./logs/selenium.err &
	@ echo "Started selenium server"

start-phantomjs:
	@ #4445 because selenium uses 4444
	@ ${PHANTOMJS} --webdriver=4445\
		--webdriver-logfile=./logs/phantomjs-wd.log\
		> ./logs/phantomjs.log\
		2> ./logs/phantomjs.err &
	@ echo "Started phantomjs server"

install:
	npm prune
	npm install
	npm upgrade

run-heroku:
	@ echo "WARNING: don't use this manually, use make start instead"
	NODE_ENV=production node ./index.js | ${BUNYAN}

test: lint test-server test-web

test-server: lint
	@ set -o pipefail && NODE_ENV=test\
		${MOCHA} ${MOCHA_OPTS}\
		${MOCHA_ARGS} ./tests/server | tee logs/mocha-server.out | ${BUNYAN}

test-web: lint
	@ set -o pipefail && NODE_ENV=test\
		${MOCHA} ${MOCHA_OPTS}\
		${MOCHA_ARGS} ./tests/web* | tee logs/mocha-web.out | ${BUNYAN}

test-web-%: lint
	@ set -o pipefail && NODE_ENV=test SEL_BROWSER=$*\
		${MOCHA} ${MOCHA_OPTS} ${MOCHA_ARGS} ./tests/web* | tee logs/mocha-web.out | ${BUNYAN}

test-%: lint test-server
	make test-web-$*

test-coverage: lint
	@ set -o pipefail && NODE_ENV=test COVERAGE=y\
		${MOCHA} ${MOCHA_OPTS}\
		${MOCHA_ARGS} ./tests/server | tee logs/mocha-coverage.out | ${BUNYAN}
	@ set -o pipefail && NODE_ENV=test COVERAGE=y\
		${MOCHA} ${MOCHA_OPTS}\
		${MOCHA_ARGS} ./tests/web* | tee logs/mocha-coverage.out | ${BUNYAN}

autotest:
	@ nodemon ${AUTOTEST_IGNORES} --exec "clear; make _test-server"
_test-server:
	-@ make lint && set -o pipefail && NODE_ENV=test\
		${MOCHA} ${MOCHA_OPTS}\
		${MOCHA_ARGS} ./tests/server | tee logs/mocha-autotest.out | ${BUNYAN}

lint: noTodosOrFixmes
	@ ${LINTER} ./index.js ./config/*.js\
		./app/*.js ./app/**/*.js ./db/*.js\
		./src/**/*.js\
		./tests/server/*.js ./tests/web*/*.js #needs to be last...
noTodosOrFixmes:
	-@ git grep -n 'TODO\|FIXME' --\
		`git ls-files | grep -v '^Makefile\|^public/\|^lib/'`\
		> .todos
	@ [ ! "$$(cat .todos)" ]\
		|| [ "$${SKIPTODOS=n}" != "n" ]\
		|| (echo "$$(cat .todos)"\
			&& echo "Use 'SKIPTODOS= make ...' to skip this check"\
			&& exit 1)

clean:
	-@ rm ./tmp/**/* ./logs/*\
		.todos\
		2> /dev/null
spotless: clean
	-@ rm ./public/js/*-bundle.js
	-@ read -p "Are you sure you want rm node_modules? [y|N]" confirm;\
		echo $${confirm,,};\
		([[ $${confirm,,} =~ ^(yes|y)$$ ]]\
		&& mv ./node_modules ~/.Trash\
		|| echo "aborting...")

help:
	make -rpn | sed -n -e '/^$$/ { n ; /^[^ ]*:/p; }' | sort | egrep --color '^[^ ]*:'

.PHONY: start install lint test test-server test-web autotest clean
