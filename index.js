"use strict";
var uniBull = function(PORT) {
    var Promise = require("bluebird");
    var express = require("express");
    var app = express();
    var path = require("path");
    var cfg = require("./config");
    var log = cfg.log.makeLogger("main,setup");

    // For automagical HTML page reloading
    var reloadify = require("./lib/reloadify");
    reloadify(app, path.join(__dirname, "views"));

    // Render html files with ejs
    var ejs = require("ejs");
    app.engine("html", ejs.renderFile);

    // From now on, when using res.render("str"),
    // it will lookup views/str.html
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "html");

    app.use(express.static(path.join(__dirname, "public")));

    app.get("/", function(req, res) {
        res.render("login");
    });

    return require("./db")().bind({}).then(function(dbModels) {
        this.dbModels = dbModels;
        return ["rest", "views"];
    }).map(function(path) {
        return require("./app/"+path)(this.dbModels);
    }).each(function(router) {
        app.use(router);
    }).then(function() {
        // Error Handlers
        app.use(function(req, res) {
            res.status(404).send("UniBull cannot find that page");
        });
        app.use(function(err, req, res) {
            log.error(err.stack);
            res.status(500).send("You've made UniBull cry, you monster!");
        });
        // Start the server
        var server = app.listen(PORT, function() {
            var host = server.address().address;
            log.info("UniBull is now listening at http://%s:%s", host, PORT);
        });
        return Promise.resolve([app, server]);
    });
};

if (require.main === module) {
    uniBull(process.env.PORT || 8080);
} else {
    module.exports = uniBull;
}
