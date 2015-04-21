/*eslint no-underscore-dangle:0, curly:0, no-unused-vars:0, no-unused-expressions:0*/
"use strict";

var chai = require("chai");
chai.should();
var sinon = require("sinon");
var _ = require("lodash");

var cfg = require("../../config");
var log = cfg.log.logger;

var login = require("../../views/login.js").onLogin;

describe("views/login.js", function() {
    context("when the user submits a login form", function() {
        // Wrapping the test function with sinon.test is important,
        // use it, and call this.[spy|stub|mock]()
        // so that things get restored once the test is done.
        it("it should trigger an ajax call", sinon.test(function() {
            var fields = {each: _.identity};
            var jq = {ajax: _.identity};
            sinon.stub(jq, "ajax").yieldsTo("success", {
                redirect: "SUCCESS"
            });
            var callback = this.spy();
            this.stub(console, "log");

            login(jq, fields, callback); // UNIT UNDER TEST

            callback.firstCall.args[1]
                .should.deep.equal({redirect: "SUCCESS"});
            jq.ajax.firstCall.args[0].should.contain({
                type: "POST",
                data: "{}",
                dataType: "json",
                contentType: "application/json"
            });
            jq.ajax.calledWithMatch(sinon.match(function(value) {
                return value.url.should.match(/login$/);
            }));
        }));
    });
});