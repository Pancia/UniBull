"use strict";

var _ = require("lodash");
var express = require("express");
var app = express();
var fs = require("fs");
var ejs = require("ejs");
var path = require("path");
var browserify = require("browserify");
var async = require("async");

var cwd = process.cwd();

var cfg = require("./config");
var log = cfg.log.logger;

// For automagical html page reloading
var reloadify = require("./lib/reloadify");
reloadify(app, path.join(cwd, "/views"));//TODO remove "/" ?
app.engine("html", ejs.renderFile);

// From now on, when using res.render(str),
// str will be treated as though its a .html file in views/
app.set("views", path.join(cwd, "views"));
app.set("view engine", "html");

var bodyParser = require("body-parser");
app.use(bodyParser.json());

app.use(express.static(path.join(cwd, "/public")));

app.get("/", function(req, res) {
    res.render("login");
});

// For HTML pages
fs.readdirSync("views").forEach(function(view) {
    var type = view.substr(view.indexOf(".")+1, view.length);
    if (type !== "html") {
        log.warn("ignoring '/views/"+view+"'");
        return;
    }// Only html files from here on out
    var file = view.substr(0, view.indexOf("."));
    var route = "/" + file;

    var jsFile = path.join(cwd, "views", file+".js");
    fs.open(jsFile, "r", function(err, fd) {
        if (err) {
            return log.warn("err:", err.message);
        }
        log.warn("jsFile:", jsFile);
        var readStream = fs.createReadStream(null, {fd: fd});
        var bundle = browserify();
        bundle.require(readStream, {expose: file});
        bundle.bundle(function(err, src) {
            if (err) {
                return log.warn("{file: '%s', err: '%s'}", file, err.message);
            }
            var bundleFile = path.join(cwd, "public", "js", file+"-bundle.js");
            fs.writeFile(bundleFile, src);
        });
    });

    log.info("Adding route: '" + route + "'");
    app.get(route, function(req, res) {
        try {
            var model = require(path.join(cwd, "models", file + ".js"));
            model.locals(req.query, function(locals) {
                _.merge(res.locals, locals);
                res.render(file);
            });
        } catch(err) {
            res.render(file);
        }
    });
});

async.series([
// For REST endpoints
function(seriesCallback) {
    fs.readdir("rest", function(err, files) {
        if (err) {throw err; }
        log.info("files:", files);
        async.each(files, function(file, eachCallback) {
            var filePath = "./rest/" + file;
            var route = "/rest/" + file.substr(0, file.indexOf("."));
            log.info("Adding REST endpoint: (" + route + ")");
            require(filePath)(route, function(router) {
                app.use(route, router);
                eachCallback(null);
            });
        }, function(err) {
            if (err) {
                log.error(err);
            } else {
                log.info("Finished adding REST endpoints");
                seriesCallback(null);
            }
        });
    });
},
function(seriesCallback) {
    //Error Handlers
    app.use(function(req, res) {
        res.status(404).send("UniBull cannot find that page");
    });
    app.use(function(err, req, res) {
        log.error(err.stack);
        res.status(500).send("You've made UniBull cry, you monster!");
    });

    //Start the server
    var server = app.listen(cfg.PORT, function() {
        var host = server.address().address;
        log.info("UniBull is now listening at http://%s:%s", host, cfg.PORT);
        seriesCallback(null);
    });
}]);
