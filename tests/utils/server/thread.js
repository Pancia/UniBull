"use strict";

module.exports = function(UTILS, agent) {
    var utils = {};
    var chai = require("chai");
    chai.should();
    var _ = require("lodash");

    utils.validUser = UTILS.validUser;

    utils.makeNewThread = function() {
        var id = _.uniqueId();
        return {
            title: "thread_title_" + id,
            content: "thread_content_" + id
        };
    };

    utils.submitThread = function(classID, thread) {
        return agent
            .post("/rest/class/"+classID+"/submit")
            .send(thread)
            .toPromise();
    };

    utils.getThreads = function(classID) {
        return agent
            .get("/rest/class/"+classID+"/all")
            .toPromise();
    };

    utils.editThread = function(classID, threadID, content, title) {
        return agent
            .put("/rest/class/"+classID+"/thread/"+threadID+"/edit")
            .send({
                title: title,
                content: content
            }).toPromise();
    };

    utils.deleteThread = function(classID, threadID) {
        return agent
            .delete("/rest/class/"+classID+"/thread/"+threadID+"/delete")
            .toPromise();
    };

    return utils;
};