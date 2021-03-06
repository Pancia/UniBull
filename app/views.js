"use strict";
module.exports = function setupHtmlPages(dbModels) {
    var Promise = require("bluebird");
    var path = require("path");

    var fs = require("fs");
    var cfg = require("../config");
    var log = cfg.log.makeLogger("views,html,setup");

    var express = require("express");
    var router = express.Router();

    var Class = dbModels.Class;

    var publicEndpoints = ["/login", "/signup"];
    require("../app/auth.js").setupAuth(router, publicEndpoints);

    var browserify = require("browserify");
    function makeBundle() {
        return browserify({
            basedir: path.join(__dirname, "../views")
        });
    }

    function addJustRoute(baseFile, options) {
        var getLocals = options.getLocals || function() {return Promise.resolve({}); };
        router.get("/"+baseFile, function(req, res) {
            getLocals().then(function(locals) {
                res.locals = locals;
                res.render(baseFile);
            });
        });
        var middleware = options.middleware;
        if (middleware) {
            router.use("/"+baseFile, middleware);
        }
    }
    // Refactor middlware into opts
    function addBundleRoute(baseFile, options) {
        var opts = options || {};

        var bundle = makeBundle();

        var toAdds = opts.adds || [];
        toAdds.forEach(function(toAdd) {
            var dirPath = toAdd.path || path.join("src", "adds");
            bundle.add(path.join(__dirname, "..", dirPath, toAdd.name));
        });
        var toRequires = opts.requires || [];
        toRequires.forEach(function(toReq) {
            var dirPath = toReq.path || path.join("src", "requires");
            bundle.require(path.join(__dirname, "..", dirPath, toReq.name), {
                expose: toReq.expose || toReq.name
            });
        });

        bundle.bundle(function(err, src) {
            if (err) {throw err; }
            fs.writeFile(path.join(__dirname, "../public", "js",
                        baseFile+"-bundle.js"), src);
        });

        var shouldAddRoute = opts.addRoute || true;
        if (shouldAddRoute) {
            var router = opts.router || undefined;
            var getLocals = opts.getLocals || function() {return Promise.resolve({}); };
            addJustRoute(baseFile, {
                middleware: router,
                getLocals: getLocals
            });
        }
    }

    addBundleRoute("login", {
        adds: [{name: "login.js"}],
        requires: [{name: "login.js", expose: "login"}]
    });
    addBundleRoute("signup", {
        adds: [{name: "signup.js"}],
        requires: [{name: "signup.js", expose: "signup"}]
    });
    addBundleRoute("home", {
        adds: [{name: "home.js"}]
    });

    // Setup for "/class/*"
    (function(router) {
        router.get("/:classID", function(req, res) {
            var classID = req.params.classID;
            log.warn("RENDER - " + classID);
            res.locals.classID = req.params.classID;
            Class.find({
                where: {uuid: classID}
            }).then(function(klass) {
                res.locals.classTitle = klass.title;
                return klass.getThreads({raw: true});
            }).then(function(threads) {
                res.locals.threads = threads;
                return res.render("tmpl/classroom");
            });
        });
        addBundleRoute("classroom", {
            addRoute: false,
            requires: [{name: "classroom.js", expose: "classroom"}],
            adds: [{name: "classroom.js"}]
        });
        addBundleRoute("class", {
            getLocals: function() {
                return Class.findAll({}, {
                    raw: true
                }).then(function(classes) {
                    return {
                        classes: classes
                    };
                });
            },
            router: router,
            requires: [{name: "class.js", expose: "class"}],
            adds: [{name: "class.js"}]
        });
    })(express.Router());

    addBundleRoute("menu", {
        adds: [{name: "menu.js"}],
        requires: [{name: "menu.js", expose: "menu"}]
    });

    return Promise.resolve(router);
};
