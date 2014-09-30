/*
Name: Merit.js
Required libs: fs
Required plugins: Admin.js
About: Gives each user merit every X time which is defined in global config as meritGain. It is in seconds.
Commands list:
    Admin only:
        !merit on - Turns on merit timer that adds merit to users.
        !merit off - Turns off merit timer that adds merit to users.
        !merit set [username] [amount] - Sets the user's merit to amount.
        !merit give [username] [amount] - Adds to user's merit the given amount.
        !merit take [username] [amount] - Removes from the user's merit the given amount.
    All:
        !merit - Makes the bot say the user's merit in chat.
API:
getUser(name) - returns a user object with the given name or null if that user is not registered.

setMerit(name, amount) - Sets the user's merit to amount.
addMerit(name, amount) - Adds amount to user's merit.
removeMerit(name, amount) - Removes amount from user's merit.
*/

var fs = require("fs");

var conf = undefined;

var directory = undefined;

var users = [];

var meritInterval = null;

var addMerit = function() {
    for (var i = 0; i < users.length; i++)
        if (users[i].online)
            users[i].merit += conf.meritGain;
    var output = "";
    for (var i = 0; i < users.length; i++) {
        var online = users[i].online;
        users[i].online = false;
        output += JSON.stringify(users[i]) + "\r\n";
        users[i].online = online;
    }
    fs.writeFileSync(directory + "/data/merit.txt", output);
}

exports.init = function(config, dir) {
    conf = config;
    directory = dir;
    if(!fs.existsSync(dir + "/data/merit.txt"))
        fs.writeFileSync(dir + "/data/merit.txt", "");
    var fileData = fs.readFileSync(dir + "/data/merit.txt", "utf-8");
    var lines = fileData.split("\r\n");
    for (var i = 0; i < lines.length; i++)
        if (lines[i] != "")
            users.push(JSON.parse(lines[i]));
    meritInterval = setInterval(addMerit, config.meritTimer * 1000);
}

exports.onExit = function(config, dir) {
    var output = "";
    for (var i = 0; i < users.length; i++) {
        users[i].online = false;
        output += JSON.stringify(users[i]) + "\r\n";
    }
    fs.writeFileSync(dir + "/data/merit.txt", output);
    if (meritInterval != undefined) {
        clearInterval(meritInterval);
        meritInterval = undefined;
    }
}

exports.onJoin = function(config, bot, data) {
    for (var i = 0; i < data.online.length; i++) {
        if (data.online[i].toUpperCase() != "JTV" && data.online[i].toUpperCase() != config.username.toUpperCase()) {
            var alreadyUser = false;
            for (var j = 0; j < users.length; j++) {
                if (users[j].name.toUpperCase() == data.online[i].toUpperCase()) {
                    users[j].online = true;
                    alreadyUser = false;
                    break;
                }
            }
            if (!alreadyUser && getUserByName(data.online[i].toUpperCase()) == null)
                users.push({name: data.online[i].toUpperCase(), merit: 0, online: true});
        }
    }
}

exports.onLeave = function(config, bot, data) {
    for (var i = 0; i < data.online.length; i++) {
        if (data.online[i].toUpperCase() != "JTV" && data.online[i].toUpperCase() != config.username.toUpperCase()) {
            var alreadyUser = false;
            for (var j = 0; j < users.length; j++) {
                if (users[j].name.toUpperCase() == data.online[i].toUpperCase()) {
                    users[j].online = false;
                    alreadyUser = false;
                    break;
                }
            }
            if (!alreadyUser && getUserByName(data.online[i].toUpperCase()) == null)
                users.push({name: data.online[i].toUpperCase(), merit: 0, online: false});
        }
    }
}

exports.onMessage = function(config, bot, data) {
    if (data.name.toUpperCase() != "JTV" && data.name.toUpperCase() != config.username.toUpperCase()) {
        var alreadyUser = false;
        for (var j = 0; j < users.length; j++) {
            if (users[j].name.toUpperCase() == data.name.toUpperCase()) {
                users[j].online = true;
                alreadyUser = false;
                break;
            }
        }
        if (!alreadyUser && getUserByName(data.name.toUpperCase()) == null)
            users.push({name: data.name.toUpperCase(), merit: 0, online: true});
        if (data.msg == "!merit")
            bot.say(data.channel, "[Merit] " + data.name + " - merit: " + getUserByName(data.name).merit);
        else if (data.msg.substring(0, 6) == "!merit") {
            var split = data.msg.split(" ");
            if (bot.getPlugin("Admin.js").isAdmin(data.name)) {
                if (split.length == 2) {
                    if (split[1].toUpperCase() == "ON") {
                        if (meritInterval == undefined) {
                            meritInterval = setInterval(addMerit, config.meritTimer * 1000);
                            bot.say(data.channel, "[Merit] Merit enabled.");
                        }
                    }
                    else if (split[1].toUpperCase() == "OFF") {
                        if (meritInterval != undefined) {
                            clearInterval(meritInterval);
                            meritInterval = undefined;
							bot.say(data.channel, "[Merit] Merit disabled.");
                        }
                    }
                }
                else if (split.length == 4) {
                    if (split[1].toUpperCase() == "SET") {
                        var user = getUserByName(split[2]);
                        if (user != null) {
                            var amount = parseInt(split[3]);
                            if (!isNaN(amount)) {
                                if (amount >= 0) {
                                    user.merit = amount;
                                    bot.say(data.channel, "[Merit] Set " + user.name + "'s merit to " + amount);
                                }
                            }
                        }
                    }
                    else if (split[1].toUpperCase() == "GIVE") {
                        var user = getUserByName(split[2]);
                        if (user != null) {
                            var amount = parseInt(split[3]);
                            if (!isNaN(amount)) {
                                if (amount > 0) {
                                    user.merit += amount;
                                    bot.say(data.channel, "[Merit] Gave " + user.name + " " + amount + " merit points.");
                                }
                            }
                        }
                    }
                    else if (split[1].toUpperCase() == "TAKE") {
                        var user = getUserByName(split[2]);
                        if (user != null) {
                            var amount = parseInt(split[3]);
                            if (!isNaN(amount)) {
                                if (amount > 0) {
                                    user.merit -= amount;
                                    if (user.merit < 0)
                                        user.merit = 0;
                                    bot.say(data.channel, "[Merit] Took " + amount + " merit points from " + user.name);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

exports.onPM = function(config, bot, data) {
    for (var i = 0; i < data.online.length; i++) {
        if (data.online[i].toUpperCase() != "JTV" && data.online[i].toUpperCase() != config.username.toUpperCase()) {
            var alreadyUser = false;
            for (var j = 0; j < users.length; j++) {
                if (users[j].name.toUpperCase() == data.online[i].toUpperCase()) {
                    users[j].online = true;
                    alreadyUser = false;
                    break;
                }
            }
            if (!alreadyUser && getUserByName(data.online[i].toUpperCase()) == null)
                users.push({name: data.online[i].toUpperCase(), merit: 0, online: true});
        }
    }
}

var getUserByName = function(name) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].name.toUpperCase() == name.toUpperCase()) {
            return users[i];
        }
    }
    return null;
}

exports.getUser = getUserByName;

exports.setMerit = function(username, amount) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].name.toUpperCase() == username.toUpperCase()) {
            users[i].merit = amount;
            break;
        }
    }
}

exports.addMerit = function(username, amount) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].name.toUpperCase() == username.toUpperCase()) {
            users[i].merit += amount;
            break;
        }
    }
}

exports.removeMerit = function(username, amount) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].name.toUpperCase() == username.toUpperCase()) {
            users[i].merit -= amount;
            break;
        }
    }
}
