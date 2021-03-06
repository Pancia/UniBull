/*globals classID*/
"use strict";

var bundle = require("classroom")($);

var loadedReplies = {};

var clickedReply = false;
var clickedEditPost = false;
var clickedReportPost = false;

$("#container").layout({
    north: {
    enableCursorHotkey: false,
    closable: false,
    resizable: false,
    spacing_open: 0,
    spacing_closed: 0
  },
  south: {
    enableCursorHotkey: false,
    closable: false,
    resizable: false,
    spacing_open: 0,
    spacing_closed: 0
  }
});

// function collapsible() {
//     $(".accordion").accordion({
//         active: false,
//         collapsible: true,
//         heightStyle: "content",
//         beforeActivate: function(event, ui) {
//             var currHeader;
//             var currContent;
//              // The accordion believes a panel is being opened
//             if (ui.newHeader[0]) {
//                 currHeader = ui.newHeader;
//                 currContent = currHeader.next(".ui-accordion-content");
//              // The accordion believes a panel is being closed
//             } else {
//                 currHeader = ui.oldHeader;
//                 currContent = currHeader.next(".ui-accordion-content");
//             }
//              // Since we"ve changed the default behavior, this detects the actual status
//             var isPanelSelected = currHeader.attr("aria-selected") === "true";
//              // Toggle the panel"s header
//             currHeader.toggleClass("ui-corner-all", isPanelSelected).toggleClass("accordion-header-active ui-state-active ui-corner-top", !isPanelSelected).attr("aria-selected", ((!isPanelSelected).toString()));
//             // Toggle the panel"s icon
//             currHeader.children(".ui-icon").toggleClass("ui-icon-triangle-1-e", isPanelSelected).toggleClass("ui-icon-triangle-1-s", !isPanelSelected);
//              // Toggle the panel"s content
//             currContent.toggleClass("accordion-content-active", !isPanelSelected);
//             if (isPanelSelected) { currContent.slideUp(0); } else { currContent.slideDown(0); }
//             return false; // Cancels the default action
//         }
//     });
// }
// collapsible();

function logout() {
    $.removeCookie("usernameCookie", { expires: 1, path: "/" });
    $.removeCookie("token", { expires: 1, path: "/" });
}
function replyLoaded(threadID, replyID) {
    return $.inArray(replyID, loadedReplies[threadID]);
}

function convertDate(d) {
    var date = new Date(d);

    var m_array = [ "January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December" ];

    var month = m_array[(date.getMonth()+1) > 9 ? (date.getMonth()+1) : "0" + (date.getMonth()+1) - 1];
    var day = (date.getDate()+1) > 9 ? (date.getDate()+1) : "0" + (date.getDate()+1);
    var hours = (date.getHours()) > 9 ? (date.getHours()) : "0" + (date.getHours());
    var minutes = (date.getMinutes()) > 9 ? (date.getMinutes()) : "0" + (date.getMinutes());
    var seconds = (date.getSeconds()) > 9 ? (date.getSeconds()) : "0" + (date.getSeconds());

    var dateString = month + "/" + day + "/" + date.getFullYear() + " " + hours + ":" + minutes + ":" +
        seconds;

    return dateString;
}

function composeReply(threadID, user, content, replyUuid, date) {
    return "<div class=\"reply_container\" data-thread=\""+threadID+"\" data-parent=\""+replyUuid+"\" data-self=\""+replyUuid+"\" name=\"reply_container\">"
     +"            <button class=\"reply_button\" data-thread=\""+threadID+"\" data-self=\""+replyUuid+"\" name=\"view_reply_children\"> [+] </button>"
     +"            <div class=\"reply_auth_date\" data-self\""+replyUuid+"\">"
     +"                <p class=\"reply_author\">"+user+"</p>"
     +"                <p class=\"reply_postdate\">"+date+"</p>"
     +"             </div>"
     +"            <div class=\"reply_content_wrapper\" data-thread=\""+threadID+"\" data-self=\""+replyUuid+"\">"
     +"                <p class=\"reply_content\">"+content+"</p>"
     +"                <p class=\"reply_author\">"+user+"</p>"
     +"                <p class=\"reply_postdate\">"+date+"</p>"
     +"                <div class =\"reply_actionsrply\">"
     +"                    <button class=\"reply_button\" data-self=\""+replyUuid+"\" name=\"replyToReply\"> Reply </button>"
     +"                </div>"
     +"                <div class=\"reply_actionsspam\">"
     +"                    <button class=\"reply_button\" data-self=\""+replyUuid+"\" name=\"editReply\"> Edit </button>"
     +"                    <button class=\"reply_button\" data-self=\""+replyUuid+"\" name=\"deleteReply\"> Delete </button>"
     +"                    <button class=\"reply_button\" data-self=\""+replyUuid+"\" name=\"flagReply\"> Report </button>"
     +"                </div>"
     +"                <div class=\"reply_form_wrapper\" data-self=\""+replyUuid+"\">"
     +"                    <form class=\"reply_form\" name=\"replyToReply_form\" accept-charset=\"utf-8\">"
     +"                        <label for=\"reply_form_content\">Content</label><br>"
     +"                        <textarea class=\"reply_form_content\" src=\"replyToReply\" data-thread=\""+threadID+"\" data-self=\""+replyUuid+"\" type=\"text\" name=\"replyToReplyFormContent\" cols=\"60\" rows=\"3\"></textarea>"
     +"                    </form>"
     +"                    <button class=\"reply_button\" data-thread=\""+threadID+"\" data-self="+replyUuid+" name=\"cancel_reply\">Cancel</button>"
     +"                    <button class=\"reply_button\" data-thread=\""+threadID+"\" data-title=\"thread.title\" name=\"submit_reply\">Submit</button>"
     +"                </div>"
     +"                <div class=\"replyEdit_form_wrapper\" data-thread=\""+threadID+"\">"
     +"                    <form class=\"replyEdit_form\" name=\"edit_form\" accept-charset=\"utf-8\">"
     +"                        <label for=\"replyEdit_form_content\">Edit Post</label><br><br>"
     +"                        <textarea class=\"replyEdit_form_content\" src=\"replyEditPost\" data-thread=\" "+threadID+" \" type=\"text\" name=\"content\" cols=\"65\" rows=\"5\"></textarea>"
     +"                    </form>"
     +"                    <button class=\"reply_button\" data-thread=\""+threadID+"\" data-self="+replyUuid+" name=\"cancel_postEdit\">Cancel</button>"
     +"                    <button class=\"reply_button\" data-thread=\""+threadID+"\" data-self="+replyUuid+" name=\"submit_postEdit\">Submit</button>"
     +"                </div>"
     +"            </div>"
     +"        </div>";
}

function viewReplyChildren(replyID) {
    $("button[name=view_reply_children][data-self*='"+replyID+"']").click(function(reply) {
        console.log("stop clicking me!");
        var replyID = $(reply.currentTarget).attr("data-self");
        var replyContent = $(".reply_content_wrapper[data-self*='"+replyID+"']");
        var replyAuthDate = $(".reply_auth_date[data-self*='"+replyID+"']");
        var viewContentButton = $("button[name=viewcontent][data-self*='"+replyID+"']");
        if (replyContent.is(":visible") && !replyAuthDate.is(":visible")) {
            viewContentButton.html("[+]");
        } else {
            viewContentButton.html("[-]");
        }
        replyContent.slideToggle(0);
        replyAuthDate.slideToggle(0);
    });
}

function addReply(threadID, user, content, replyID, date) {
    loadedReplies[threadID].push(replyID);
    $("div[data-thread*='"+threadID+"'][name*=thread_replies]")
        .append(composeReply(threadID, user, content, replyID, date));
    viewReplyChildren(replyID);
}

function loadReplies(res, threadID) {
    res.replies.forEach(function(reply) {
        if (reply.ThreadUuid === threadID) {
            if (replyLoaded(threadID, reply.uuid) === (-1)) {
                var date = convertDate(reply.createdAt);
                addReply(threadID, reply.username, reply.content, reply.uuid, date);
            }
        }
    });
}

function getReplies(threadID) {
    //make ajax call to get replies...
    var onViewReplies = bundle.onViewReplies;
    onViewReplies(classID, threadID, function(err, res) {
        if (err) { return console.log(err); }
        if (res) {
            loadReplies(res, threadID);
        }
    });
}

$("#logout").button().click(function() {
    logout();
    window.location.href = "/login";
});
$("#home").button().click(function() {
    window.location.href = "/home";
});

$("#toclass").button().click(function() {
    window.location.href = "/class";
});

$("#toclubs").button().click(function() {
    alert("Under Construction");
});

$("#toevents").button().click(function() {
    alert("Under Construction");
});

$("#tomenu").button().click(function() {
    window.location.href = "/menu";
});
$(".rb").button();

$("#newpost").button().click(function() {
    $("#submit_wrapper").slideToggle(0);
});
$("button[name=viewcontent]").click(function(thread) {
    var threadID = $(thread.currentTarget).attr("data-thread");
    var threadContent = $(".thread_content_wrapper[data-thread*='"+threadID+"']");
    var threadAuthDate = $(".thread_auth_date[data-thread*='"+threadID+"']");
    var replies = $("div[data-thread*='"+threadID+"'][name*=thread_replies]");
    var viewContentButton = $("button[name=viewcontent][data-thread*='"+threadID+"']");
    if (threadContent.is(":visible") && !threadAuthDate.is(":visible")) {
        viewContentButton.html("[+]");
        if (replies.is(":visible")) {
            replies.slideToggle(0);
        }
    } else {
        viewContentButton.html("[-]");
    }
    threadContent.slideToggle(0);
    threadAuthDate.slideToggle(0);
});

$("button[name=reply]").click(function(thread) {
    clickedReply = true;
    var threadID = $(thread.currentTarget).attr("data-thread");
    // console.log("Clicked on reply ", threadID);
    // var replyButton = $("button[name=reply][data-thread*="+threadID+"]");
    if (clickedEditPost) {
        var editForm = $(".edit_form_wrapper[data-thread*='"+threadID+"']");
        var editContent = $(".edit_form_content[data-thread*='"+threadID+"'']");
        editForm.slideUp(0);
        editContent.val("");
    }

    if (clickedReportPost) {
        var reportForm = $(".report_form_wrapper[data-thread*='"+threadID+"']");
        reportForm.slideUp(0);
    }

    var replyForm = $(".reply_form_wrapper[data-thread*='"+threadID+"']");
    replyForm.slideToggle(0);
});

$("button[name=cancel_reply]").click(function(thread) {
    clickedReply = false;
    var threadID = $(thread.currentTarget).attr("data-thread");
    var replyForm = $(".reply_form_wrapper[data-thread*='"+threadID+"']");
    var replyContent = $(".reply_form_content[data-thread*='"+threadID+"'']");
    replyForm.slideUp(0);
    replyContent.val("");
});

$("button[name=submit_reply]").click(function(thread) {
    var threadID = $(thread.currentTarget).attr("data-thread");
    var threadTitle = $(thread.currentTarget).attr("data-title");
    console.log("title, ", threadTitle);
    var onSubmitReply = bundle.onSubmitReply;
    var replyForm = $(".reply_form_wrapper[data-thread*='"+threadID+"']");
    var replyContent = $( "textarea[data-thread*='"+threadID+"'][src=reply]");
    console.log("reply content", replyContent);
    var replyContentCheck = $.trim(replyContent.val());
    if (replyContentCheck.length <= 0) {
        console.log("reply check", replyContentCheck);
        alert("You cannot submit an empty reply.");
        clickedReply = false;
        return null;
    }
    return onSubmitReply(classID, threadID, replyContent, function(err, data) {
        console.log("LALALALALA ", data);
        if (err) {
            clickedReply = false;
            return console.log("error: ", err);
        }
        if (data.action) {
            clickedReply = false;
            replyForm.slideToggle(0);
            replyContent.val("");
        }
    });
});

$("button[name=edit]").click(function(thread) {
    clickedEditPost = true;
    var threadID = $(thread.currentTarget).attr("data-thread");
    if (clickedReply) {
        var replyForm = $(".reply_form_wrapper[data-thread*='"+threadID+"']");
        var replyContent = $(".reply_form_content[data-thread*='"+threadID+"'']");
        replyForm.slideUp(0);
        replyContent.val("");
    }

    if (clickedReportPost) {
        var reportForm = $(".report_form_wrapper[data-thread*='"+threadID+"']");
        reportForm.slideUp(0);
    }
    var editForm = $(".edit_form_wrapper[data-thread*='"+threadID+"']");
    editForm.slideToggle(0);
    var prevEditcontent = $(".thread_content[data-thread*='"+threadID+"']").text();
    var prevEdittitle = $(".thread_title[data-thread*='"+threadID+"']").text();

    $( "textarea[data-thread*='"+threadID+"'][src=editPost]").val(prevEditcontent);
    $( "input[data-thread*='"+threadID+"']").val(prevEdittitle);

});

$("button[name=cancel_postEdit]").click(function(thread) {
    var threadID = $(thread.currentTarget).attr("data-thread");
    var editForm = $(".edit_form_wrapper[data-thread*='"+threadID+"']");
    var editContent = $(".edit_form_content[data-thread*='"+threadID+"'']");
    editForm.slideUp(0);
    editContent.val("");
    clickedEditPost = false;
});

$("button[name=submit_postEdit]").click(function(thread) {
    var threadID = $(thread.currentTarget).attr("data-thread");
    //var threadTitle = $(thread.currentTarget).attr("data-title");
    var onSubmitPostEdit = bundle.onSubmitPostEdit;
    var editForm = $(".edit_form_wrapper[data-thread*='"+threadID+"']");
    //var replyContent = $(".reply_form_content[data-thread*='"+threadID+"'']");
    var editContent = $( "textarea[data-thread*='"+threadID+"'][src=editPost]");
    var fields = $( "textarea[data-thread*='"+threadID+"'][src=editPost], input[data-thread*='"+threadID+"']");
    var editContentCheck = $.trim(editContent.val());
    if (editContentCheck.length <= 0) {
        alert("You cannot submit an empty reply.");
        clickedEditPost = false;
        return null;
    }
    return onSubmitPostEdit(classID, threadID, fields, function(err, data) {
        if (err) {
            clickedEditPost = false;
            return console.log("error: ", err);
        }
        clickedEditPost = false;
        var postContent = $(".thread_content[data-thread*='"+threadID+"']");
        var postTitle = $(".thread_title[data-thread*='"+threadID+"']");
        postContent.text(data.thread.content);
        postTitle.text(data.thread.title);
        editForm.slideToggle(0);
        editContent.val("");
    });

});

$("button[name=delete]").click(function(thread) {
    var threadID = $(thread.currentTarget).attr("data-thread");
    var threadTitle = $(".thread_title[data-thread*='"+threadID+"']").text();
    var onDelThread = bundle.onDelThread;
    var fields = $( "textarea[data-thread*='"+threadID+"'][src=editPost], input[data-thread*='"+threadID+"']");
    if (confirm("Are you sure you want to delete the thread '" + threadTitle +"'?")) {
        return onDelThread(classID, threadID, fields, function(err, data) {
            if (err) {
                return console.log("error: ", err);
            }
            if (data) {
                $(".thread_container[data-thread*='"+threadID+"']").remove();
            }
        });
    } else {
        return false;
    }
 });

 $("button[name=report]").click(function(thread) {
     var threadID = $(thread.currentTarget).attr("data-thread");
     clickedReportPost = true;

     if (clickedReply) {
         var replyForm = $(".reply_form_wrapper[data-thread*='"+threadID+"']");
         var replyContent = $(".reply_form_content[data-thread*='"+threadID+"'']");
         replyForm.slideUp(0);
         replyContent.val("");
     }

     if (clickedEditPost) {
         var editForm = $(".edit_form_wrapper[data-thread*='"+threadID+"']");
         var editContent = $(".edit_form_content[data-thread*='"+threadID+"'']");
         editForm.slideUp(0);
         editContent.val("");
     }

     //var threadTitle = $(".thread_title[data-thread*='"+threadID+"']").text();
     $( ".report_reason_list[data-thread*='"+threadID+"']").hide();
     var reportForm = $(".report_form_wrapper[data-thread*='"+threadID+"']");
     reportForm.slideToggle(0);
 });

var otherClicked = false;
var usr_input;
$("button[name=report_reason]").click(function(thread) {
     var threadID = $(thread.currentTarget).attr("data-thread");
     $( ".report_reason_list[data-thread*='"+threadID+"']").menu({
         select: function(event, ui) {
             var usrinput = ui.item.attr("sel");
             if (usrinput === "other") {
                 otherClicked = true;
                 $(".report_other_reason[data-thread*='"+threadID+"']").show();
             } else {
                otherClicked = false;
                usr_input = usrinput;
             }
             if (!otherClicked) {
                 $(".report_other_reason[data-thread*='"+threadID+"']").hide();
             }
            $("input[data-thread*='"+threadID+"'][src=reportPost]").val(usr_input);
             $( ".report_reason_list[data-thread*='"+threadID+"']").hide();
         }
     });
     $( ".report_reason_list[data-thread*='"+threadID+"']").show();
});

$("button[name=cancel_reportThread]").click(function(thread) {
    var threadID = $(thread.currentTarget).attr("data-thread");
    $("input[data-thread*='"+threadID+"'][src=reportPost]").val("");
    var reportForm = $(".report_form_wrapper[data-thread*='"+threadID+"']");
    reportForm.slideUp(0);
    otherClicked = false;
});

$("button[name=submit_reportThread]").click(function(thread) {
    var threadID = $(thread.currentTarget).attr("data-thread");
    var dataToSend;
    if (otherClicked) {
        dataToSend = $("textarea[data-thread*='"+threadID+"'][src=reportPost]");
    } else {
        dataToSend = $("input[data-thread*='"+threadID+"'][src=reportPost]");
    }
    console.log(dataToSend.val());
    var onReportThread = bundle.onReportThread;
    return onReportThread(classID, threadID, dataToSend, function(err, data) {
        if (err) {
            return console.log("error: ", err);
        }
        if (data) {
            var reportForm = $(".report_form_wrapper[data-thread*='"+threadID+"']");
            reportForm.slideUp(0);
            otherClicked = false;
            alert("Thanks! We'll look into it!");
            return console.log(data);
        }
    });
});

// $("button[data-id=submitreply]").button().click(function(thread) {
//     var threadID = $(thread.currentTarget).attr("data-thread");
//     var onSubmitReply = bundle.onSubmitReply;
//     var fields = $(".replycontent[data-thread*='"+threadID+"']");
//     // var content = fields.val();
//     return onSubmitReply(classID, threadID, fields, function(err, data) {
//         if (err) {
//             console.log("data error: ", data.error);
//             return console.log("error", err);
//         }
//         console.log("data", data);
//         if (data.action) {
//             // var user = $.cookie("usernameCookie");
//             $(".replyformwrapper[data-thread*='"+threadID+"']").slideToggle(0);
//             $(".replycontent[data-thread*='"+threadID+"']").val("");
//         }
//     });
// });

// $("button[name=viewreplies]").click(function(thread) {
//     var threadID = $(thread.currentTarget).attr("data-thread");
//     console.log(threadID);
// });

// $("button[name=delete]").click(function(thread) {
//     //var threadID = $(thread.currentTarget).attr("data-thread");
//     //do something with threadID;
// });

// $("button[name=report]").click(function(thread) {
//     //var threadID = $(thread.currentTarget).attr("data-thread");
//     //do something with threadID;
// });

$("button[name=viewreplies]").click(function(thread) {
    var threadID = $(thread.currentTarget).attr("data-thread");
    var viewChildrenButton = $("button[name=viewreplies][data-thread*='"+threadID+"']");
    var replies = $("div[data-thread*='"+threadID+"'][name*=thread_replies]");
    if (!loadedReplies[threadID]) {
        loadedReplies[threadID] = [];
    } else {
        if (!replies.is(":visible")) {
            getReplies(threadID);
            viewChildrenButton.html("Hide Replies");
        } else {
            viewChildrenButton.html("Show Replies");
        }
    }
    replies.slideToggle(0);
});

$("#cancel").button().click(function() {
    $("#submit_wrapper").slideUp(0);
    $("#title").val("");
    $("#content").val("");
});

function submitPost() {
    var onSubmitPost = bundle.onSubmitPost;
    var fields = $("#submitform #content, #submitform #title");
    return onSubmitPost(classID, fields, function(err, data) {
        if (err) { return console.log(err); }
        if (data.action) {
            $("#submit_wrapper").slideUp(0);
            $("#title").val("");
            $("#content").val("");
            window.location.reload();
        }
    });
}
$("#submitform").submit(function(sub) {
    sub.preventDefault();
    submitPost();
});
$("#submit_post").button().click(function() {
    submitPost();
});
