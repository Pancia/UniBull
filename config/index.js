module.exports = (function() {
    "use strict";
    var _ = require("lodash");
    var cfg = {};

    cfg.env = process.env;
    cfg.PORT = cfg.env.PORT || 8080;

    cfg.isTest = cfg.env.NODE_ENV === "test";
    cfg.isDev = (cfg.env.NODE_ENV || "development") === "development";
    cfg.isProd = !(cfg.isTest || cfg.isDev);

    var frozenCFG = Object.freeze(_.cloneDeep(cfg));
    cfg.log = require("./logger.js")(frozenCFG);
    cfg.jwt = require("./jsonwebtoken.js")(frozenCFG);
    cfg.db = require("./database.js")(frozenCFG);

    return cfg;
})();