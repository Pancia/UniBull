"use strict";
module.exports = (function() {
    var _ = require("lodash");
    var cfg = {};

    cfg.env = process.env;
    cfg.PORT = cfg.env.PORT || 8080;

    cfg.isTest = cfg.env.NODE_ENV === "test";
    cfg.isDev = (cfg.env.NODE_ENV || "development") === "development";
    cfg.isProd = !(cfg.isTest || cfg.isDev);
    cfg.errmsgs = require("./errormessages.js");

    cfg.coverage = function() {
        if (!cfg.isProd && cfg.env.COVERAGE === "y") {
            require("blanket")();
        }
    };

    var frozenCFG = Object.freeze(_.cloneDeep(cfg));
    cfg.log = require("./logger.js")(frozenCFG);
    cfg.jwt = require("./jsonwebtoken.js")(frozenCFG);
    cfg.db = require("./database.js")(frozenCFG, cfg.log.makeLogger("db"));

    cfg.webdriver = require("./webdriver.js")(frozenCFG);
    cfg.screenshot = {};
    cfg.screenshot.at = function(name) {
        try {
            throw new Error();
        } catch(e) {
            var prev = e.stack.split("\n")[2];
            var fileAndLineNum =
                // just get the base filename
                prev.substring(prev.lastIndexOf("/")+1)
                    // remove extraneous chars
                    .replace(")", "")
                    // remove col num
                    .match(/(.*):[0-9]+$/)[1];
        }
        var screenshotsDir = "./tmp/screenshots/";
        return screenshotsDir
            + cfg.webdriver.name + "_"
            + fileAndLineNum + "__"
            + name + "__"
            + "+T" + _.now()
            + ".png";
    };

    return cfg;
})();
