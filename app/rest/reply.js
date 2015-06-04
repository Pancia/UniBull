"use strict";
module.exports = function(dbModels) {
    var Promise = require("bluebird");
    var express = require("express");
    var router = express.Router();
    var bodyParser = require("body-parser");
    router.use(bodyParser.json());

    var auth = require("../auth.js");
    var cfg = require("../../config");
    var log = cfg.log.makeLogger("rest,reply");

    var User = dbModels.User;
    var Thread = dbModels.Thread;
    var Class = dbModels.Class;
    var Reply = dbModels.Reply;

    router.get("/:classID/thread/:threadID/all", function(req, res) {
        log.info("GET - Get all replies under a thread");
        var threadID = req.params.threadID;
        return Thread.find({
            where: {title: threadID}
        }, {include: [{all: true, nested: true}]
        }).then(function(thread) {
            return res.json({replies: thread.Replies});
        });
    });

    router.post("/:classID/thread/:threadID/reply", function(req, res) {
        log.info("POST - Reply to a thread");
        var classID = req.params.classID;
        var threadID = req.params.threadID;
        log.debug("classID", classID);
        log.debug("threadID", threadID);
        log.debug("newReply", req.body);
        // Verify req body
        // Find the class
        Class.find({where: {title: classID}}).bind({}).then(function(klass) {
            // Find the thread
            return klass.getThreads({where: {title: threadID}});
        }).then(function(threads) {
            var thread = threads[0];
            this.thread = thread;
            // Create the reply
            return Reply.create({
                content: req.body.content
            }).then(function(reply) {
                // Add the reply to the thread
                return thread.addReply(reply);
            });
        }).then(function(reply) {
            this.reply = reply;
            // Save the thread, then return the class replies list
            return this.thread.getReplies({raw: true});
        }).then(function(replies) {
            this.replies = replies;
            // Find the user, add the reply to his list
            var username = auth.decodeRequest(req).username;
            return User.find({where: {username: username}}).bind(this).then(function(user) {
                this.user = user;
                return user.addReply(this.reply);
            });
        }).then(function() {
            return this.user.getReplies({raw: true});
        }).then(function(replies) {
            // Return res with replies list
            return res.json({
                reply: this.reply,
                replies: replies,
                action: "refresh"
            });
        }).catch(function(err) {
            console.log("Error  Reply: ", err);
            return res.status(400).json({
                error: err.message
            });
        });
    });

    router.post("/:classID/thread/:threadID/reply/:replyID/reply", function(req, res) {
        log.info("POST - Reply to a reply");
        var classID = req.params.classID;
        var threadID = req.params.threadID;
        var replyID = req.params.replyID;
        log.debug("classID", classID);
        log.debug("threadID", threadID);
        log.debug("replyID", replyID);

        // Verify req body
        // Find the class
        Class.find({where: {title: classID}}).bind({}).then(function(klass) {
            // Find the thread
            this.class = klass;
            return klass.getThreads({where: {title: threadID}});
        }).then(function(threads) {
            var thread = threads[0];
            this.thread = thread;
            // Find the reply
            return this.thread.getReplies({
                where: {uuid: replyID},
                include: [{all: true, nested: true}]
            });
        }).then(function(replies) {
            this.replies = replies;
            var replyTo = replies[0];
            this.replyTo = replyTo;
            // Add the reply to replyTo
            return Reply.create({
                content: req.body.content
            }).then(function(reply) {
                return replyTo.addReply(reply);
            });
        }).then(function(reply) {
            this.reply = reply;
            return this.replyTo.getReplies().bind(this).then(function(replies) {
                return replies;
            });
        }).then(function() {
            // Find the user, add the reply to his list
            var userID = auth.decodeRequest(req).username;
            return User.find({where: {username: userID}}).bind(this).then(function(user) {
                this.user = user;
                return user.addReply(this.reply);
            });
        }).then(function() {
            return Reply.find({
                where: {uuid: this.replyTo.uuid},
                include: [Reply]
            });
        }).then(function(replyTo) {
            // Return res with replies list
            return res.json({
                reply: this.reply.get(),
                topReply: replyTo
            });
        }).catch(function(err) {
            return res.status(400).json({
                error: err.message,
                stack: err.stack
            });
        });
    });

    router.put("/:classID/thread/:threadID/reply/:replyID/edit", function(req, res) {
        log.info("PUT - editing a reply");
        var classID = req.params.classID;
        var threadID = req.params.threadID;
        var replyID = req.params.replyID;
        var content = req.body.content;
        Class.find({
            where: {title: classID}
        }).bind({}).then(function(klass) {
            this.class = klass;
        }).then(function() {
            var decoded = auth.decodeRequest(req);
            var username = decoded.username;
            return User.find({
                where: {username: username}
            });
        }).then(function(user) {
            if (!user) {
                throw Error(cfg.errmsgs.invalidUserInfo);
            }
            this.user = user;
        }).then(function() {
            return this.class.getThreads({
                where: {title: threadID}
            });
        }).then(function(threads) {
            this.thread = threads[0];
            return this.thread.getReplies({
                where: {uuid: replyID}
            });
        }).then(function(replies) {
            var reply = replies[0];
            if (this.user.uuid !== reply.UserUuid) {
                throw Error(cfg.errmsgs.naughtyUser);
            }
            reply.content = content;
            return reply.save();
        }).then(function(reply) {
            return res.json({
                reply: reply
            });
        }).catch(cfg.handleErr(res));
    });

    router.delete("/:classID/thread/:threadID/reply/:replyID/delete", function(req, res) {
        log.info("DELETE - deleting a reply");
        var classID = req.params.classID;
        var threadID = req.params.threadID;
        var replyID = req.params.replyID;
        Class.find({
            where: {title: classID}
        }).bind({}).then(function(klass) {
            this.class = klass;
        }).then(function() {
            var decoded = auth.decodeRequest(req);
            var username = decoded.username;
            return User.find({
                where: {username: username}
            });
        }).then(function(user) {
            if (!user) {
                throw Error(cfg.errmsgs.invalidUserInfo);
            }
            this.user = user;
        }).then(function() {
            return this.class.getThreads({
                where: {title: threadID}
            });
        }).then(function(threads) {
            this.thread = threads[0];
            return this.thread.getReplies({
                where: {uuid: replyID}
            });
        }).then(function(replies) {
            var reply = replies[0];
            if (this.user.uuid !== reply.UserUuid) {
                throw Error(cfg.errmsgs.naughtyUser);
            }
            return reply.destroy();
        }).then(function() {
            return res.json({
                success: true
            });
        }).catch(cfg.handleErr(res));
    });

    return Promise.resolve(router);
};