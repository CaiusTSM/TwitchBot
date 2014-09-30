/*
Name: Raffle.js
Required libs: fs
Required plugins: Admin.js, Merit.js
About: Allows admins to start a raffle which users can enter by buying tickets with merit.
Config needs to have var "raffleTimer" which is the timeout for a raffle in seconds.
Commands list:
    Admin only:
        !raffle start
        !raffle stop
        !raffle end
    All:
        !raffle [numTickets] - Buys numTickets for user and removes numTickets from their merit.
*/

var fs = require("fs");

var dir = undefined;

var b = {};

var numRaffleTickets = 0;

var raffleTimeout = undefined;

var raffleUsers = [];

var raffleWinner = undefined;

var doRaffle = function() {
    if (raffleUsers.length > 0) {
        var randNum = randomInt(0, numRaffleTickets - 1);
        for (var i = 0; i < raffleUsers.length; i++) {
            if (raffleUsers[i].lower <= randNum && raffleUsers[i].upper >= randNum) {
                raffleWinner = raffleUsers[i];
                raffleUsers = [];
                numRaffleTickets = 0;
                raffleTimeout = undefined;
                b.bot.say(b.channel, "[Raffle] The raffle is over! The winner is... " + raffleWinner.name + "!");
                fs.writeFileSync(dir + "/data/raffle.txt", raffleWinner.name);
            }
        }
    }
    else
        b.bot.say(b.channel, "[Raffle] No one entered the raffle.");
}

exports.init = function(config, directory) {
    dir = directory;
}

exports.onExit = function(config, dir) {
    if (raffleTimeout != undefined) {
        clearTimeout(raffleTimeout);
        raffleTimeout = undefined;
    }
}

exports.onJoin = null;

exports.onLeave = null;

exports.onMessage = function(config, bot, data) {
    b.bot = bot;
    b.channel = data.channel;
    if (bot.getPlugin("Admin.js").isAdmin(data.name)) {
        var split = data.msg.split(" ");
        if (split.length == 2) {
            if (split[0] == "!raffle") {
                if (split[1].toUpperCase() == "START") {
                    if (raffleTimeout == undefined) {
                        raffleTimeout = setTimeout(doRaffle, config.raffleTimer * 1000);
                        bot.say(data.channel, "[Raffle] Started a raffle. Type \"!raffle [numTickets]\" to enter. The number of tickets you buy will by removed from your merit.");
                    }
                }
                else if (split[1].toUpperCase() == "STOP") {
                    if (raffleTimeout != undefined) {
                        clearTimeout(raffleTimeout);
                        raffleTimeout = undefined;
                        var merit_js = bot.getPlugin("Merit.js");
                        for (var i = 0; i < raffleUsers.length; i++) {
                            var user = merit_js.getUser(raffleUsers[i].name);
                            if (user != null)
                                user.merit += raffleUsers[i].numTickets;
                        }
                        raffleUsers = [];
                        numRaffleTickets = 0;
                        bot.say(data.channel, "[Raffle] Stopped raffle. Merit has been returned to those who entered.");
                    }
                }
                else if (split[1].toUpperCase() == "END") {
                    if (raffleTimeout != undefined) {
                        clearTimeout(raffleTimeout);
                        raffleTimeout = undefined;
                        doRaffle();
                    }
                }
            }
        }
    }
    if (raffleTimeout != undefined) {
        var sp = data.msg.split(" ");
        if (sp.length == 2) {
            if (sp[0] == "!raffle") {
                var numTickets = parseInt(sp[1]);
                if (!isNaN(numTickets)) {
                    var alreadyInRaffle = false;
                    for (var i = 0; i < raffleUsers.length; i++) {
                        if (raffleUsers[i].name.toUpperCase() == data.name.toUpperCase()) {
                            alreadyInRaffle = true;
                            break;
                        }
                    }
                    if (!alreadyInRaffle && numTickets > 0) {
                        var merit_js = bot.getPlugin("Merit.js");
                        var user = merit_js.getUser(data.name);
                        if (user != null) {
                            if (user.merit - numTickets >= 0) {
                                user.merit -= numTickets;
                                raffleUsers.push({name: data.name, numTickets: numTickets, lower: numRaffleTickets, upper: numRaffleTickets + numTickets - 1});
                                numRaffleTickets += numTickets;
                            }
                        }
                    }
                }
            }
        }
    }
}

exports.onPM = null;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
