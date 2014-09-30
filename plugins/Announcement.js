/*
Name: Announcement.js
Required libs: fs
Required plugins: ...
About: Makes the bot say an announcement message every once in a while.
*/

var fs = require("fs");

var announcement = "";

var announcementInterval = undefined;

var bot = undefined;

var sayMessage = function() {
    if (bot != undefined)
        bot.say(bot.channel, announcement);
}

exports.init = function(config, dir) {
    if (!fs.existsSync(dir + "/data/announcement.txt"))
        fs.writeFileSync(dir + "/data/announcement.txt", "");
    announcement = fs.readFileSync(dir + "/data/announcement.txt", "utf-8");
    if (announcement != "")
        announcementInterval = setInterval(sayMessage, config.announcementTimer * 1000);
}

exports.onExit = function(config, dir) {
    if (announcementInterval != undefined) {
        clearInterval(announcementInterval);
        announcementInterval = undefined;
    }
}

exports.onJoin = null;

exports.onLeave = null;

exports.onMessage = function(config, b, data) {
    if (bot == undefined)
        bot = b;
    bot.channel = data.channel;
}

exports.onPM = null;
