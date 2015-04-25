/*eslint curly:0, no-unused-vars:0, no-unused-expressions:0*/
"use strict";

var chai = require("chai");
chai.should();
var request = require("supertest");
var sinon = require("sinon");
var async = require("async");
var _ = require("lodash");

var app = require("express")();

var cfg = require("../../config");
var log = cfg.log.logger;

var routePrefix = "/rest/user";
describe("'"+routePrefix+"'", function() {
    before(function(done) {
        require("../../db")().then(function(dbModels) {
            require("../../"+routePrefix)(dbModels, routePrefix, function(router) {
                app.use(routePrefix, router);
                done();
            });
        });
    });
    context("without authentication", function() {
        it("GET '/' should return a list of all users", function(done) {
            request(app)
                .get(routePrefix + "/")
                .expect(200)
                .expect(function(res) {
                    res.body.users.should.have.length.above(0);
                }).end(done);
        });
        it("POST '/restricted' should be unauthorized", function(done) {
            request(app)
                .post(routePrefix + "/restricted")
                .expect(401)
                .expect(function(res) {
                    res.body.should.contain.keys("error");
                }).end(done);
        });
    });
    describe("logging in", function() {
        function loginToApp(user, callback) {
            request(app)
                .post(routePrefix + "/login")
                .send(user)
                .end(function(err, res) {
                    if (err) return callback(err);
                    callback(null, res.body);
                });
        }
        context("with invalid credentials", function() {
            it("(none) should return an error", function(done) {
                loginToApp({}, function(err, body) {
                    if (err) return done(err);
                    body.should.have.key("error");
                    return done();
                });
            });
            it("(only username) should return an error", function(done) {
                loginToApp({
                    username: "FirstUser"
                }, function(err, body) {
                    if (err) return done(err);
                    body.should.have.key("error");
                    return done();
                });
            });
            it("(both) should return an error", function(done) {
                loginToApp({
                    username: "FirstUser",
                    password: "imNotTheCorrectPassword"
                }, function(err, body) {
                    if (err) return done(err);
                    body.should.have.key("error");
                    return done();
                });
            });
        });
        context("with valid credentials", function() {
            var validUser = {
                username: "FirstUser",
                password: "mypasswd"
            };
            it("we are auth'd and redirected to '/home'", function(done) {
                request(app)
                    .post(routePrefix + "/login")
                    .send(validUser)
                    .expect(200)
                    .expect("Content-Type", /json/)
                    .expect(function(res) {
                        res.body.token.should.exist;
                        if (!_.startsWith(res.body.token, "Bearer"))
                            return "token should start with 'Bearer '";
                        res.body.redirect.should.equal("/home");
                    }).end(function(err, res) {
                        if (err) return done(err);
                        done();
                    });
            });
            it("we can view restricted pages", function(done) {
                function gotToken(err, body) {
                    if (err)
                        return done(err);
                    request(app)
                        .get(routePrefix+"/restricted")
                        .set("Authorization", body.token)
                        .expect(200)
                        //.expect("Content-Type", /json/)
                        .expect(function(res) {
                            res.body.decoded.should
                                .contain.keys("username", "email");
                        }).end(done);
                }
                loginToApp(validUser, gotToken);
            });
            context("for a long enough time", function() {
                it("we are denied access", function(done) {
                    var clock = sinon.useFakeTimers();
                    function gotToken(err, body) {
                        if (err) return done(err);
                        clock.tick(cfg.jwt.timeoutInSeconds * 1000);
                        request(app)
                            .get(routePrefix+"/restricted")
                            .set("Authorization", body.token)
                            .expect(401, done);
                        clock.restore();
                    }
                    loginToApp(validUser, gotToken);
                });
            });
        });
    });
    describe("after signing up", function() {
        context("with valid user info", function() {
            function signupNewUser(username, callback) {
                request(app)
                    .post(routePrefix + "/signup")
                    .send({
                        username: username,
                        password: "password",
                        email: username + "@email.com"})
                    .expect(200)
                    .expect(function(res) {
                        if (!_.startsWith(res.body.token, "Bearer"))
                            return "Token should start with 'Bearer'";
                        res.body.redirect.should.equal("/home");
                    }).end(function(err, res) {
                        if (err) return callback(err);
                        callback(null, res.body);
                    });
            }
            it("we are auth'd and redirected to '/home'", function(done) {
                signupNewUser(_.uniqueId("newuser_"), function(err, body) {
                    if (err) return done(err);
                    request(app)
                        .get(routePrefix + "/restricted")
                        .set("Authorization", body.token)
                        .expect(200)
                        .end(function(err, res) {
                            if (err) return done(err);
                            if (!body.redirect)
                                return done(Error("missing redirect"));
                            done(null);
                        });
                });
            });
        });
    });
});
