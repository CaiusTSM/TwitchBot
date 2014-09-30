/*
Name: Admin.js
Required libs: fs
Required plugins: ...
About: Stores a list of admins into admins.txt.
API:
isAdmin(name) - returns true or false if that name is an admin.
*/

var fs = require("fs");

var admins = [];

exports.init = function(config, dir) {
    if (!fs.existsSync(dir + "/data/admins.txt"))
        fs.writeFileSync(dir + "/data/admins.txt", "");
    var fileData = fs.readFileSync(dir + "/data/admins.txt", "utf-8");
    var lines = fileData.split("\n");
    for (var i = 0; i < lines.length; i++)
        if (lines[i] != "")
            admins.push(lines[i]);
}

exports.onExit = function(config, dir) {
    var output = "";
    for (var i = 0; i < admins.length; i++)
        output += admins[i] + "\n";
    fs.writeFileSync(dir + "/data/admins.txt", output);
}

exports.onJoin = null;

exports.onLeave = null;

exports.onMessage = null;

exports.onPM = null;

exports.isAdmin = function(name) {
    for (var i = 0; i < admins.length; i++)
        if (name.toUpperCase() == admins[i].toUpperCase())
            return true;
    return false;
}
