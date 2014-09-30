var fs = require("fs");
var irc = require("irc");
var chalk = require("chalk");

//Special thing for windows so that it sends SIGINT to process (ctrl+c).
var readLine = require ("readline");

if (process.platform === "win32"){
	var rl = readLine.createInterface ({
        input: process.stdin,
        output: process.stdout
    });

    rl.on ("SIGINT", function (){
        process.emit ("SIGINT");
    });
}

//Parse config.
var config = JSON.parse(fs.readFileSync(__dirname + "/config.txt"));

//Require all plugins.
var plugin_files = fs.readdirSync(__dirname + "/plugins/");

var plugins = [];

for (var i = 0; i < plugin_files.length; i++) {
	plugins.push({name: plugin_files[i], plugin: require(__dirname + "/plugins/" + plugin_files[i])});
    if ("init" in plugins[i].plugin && "onExit" in plugins[i].plugin
        && "onJoin" in plugins[i].plugin && "onLeave" in plugins[i].plugin
        && "onMessage" in plugins[i].plugin && "onPM" in plugins[i].plugin) {
        plugins[i].plugin.init(config, __dirname);
        console.log(chalk.green("[Loaded] " + plugin_files[i] + " plugin."));
    }
    else {
        plugins.splice(i, 1);
        console.log(chalk.red("[Error] " + plugin_files[i] + " is missing a function."));
    }
}

var getPlugin = function(name) {
	for (var i = 0; i < plugins.length; i++)
		if (plugins[i].name.toUpperCase() == name.toUpperCase())
			return plugins[i].plugin;
	return null;
}

//Setup bot.
var botConfig = {
    username: config.username,
    password: config.oauth,
    channels: [config.channels + " " + config.oauthPass],
    port: 80,
    debug: false
};

var bot = new irc.Client(config.server, config.username, botConfig);

bot.getPlugin = getPlugin;

var joined = false;

var onlineUsers = [];

bot.connect(function() {
	console.log("[Info] Connected to " + config.server + " on channel(s) [" + config.channels + "]");
});

//Bot listeners:
bot.addListener('error', function(message) {
	console.log("[Error] ", message);
});

bot.addListener("join", function(channel, who) {
    if (who.toUpperCase() == config.username.toUpperCase()) {
        if (joined)
            bot.part(channel);
        else
            joined = true;
    }
    else if (onlineUsers.indexOf(who.toUpperCase()) == -1) {
        onlineUsers.push(who.toUpperCase());

        if (config.log)
            console.log(who + " joined chat.");
    }

    for (var i = 0; i < plugins.length; i++)
        if (plugins[i].plugin.onJoin != null)
            plugins[i].plugin.onJoin(config, bot, {channel: channel, name: who, online: onlineUsers});
});

bot.addListener("part", function(channel, who) {
    for (var i = 0; i < plugins.length; i++)
        if (plugins[i].plugin.onLeave != null)
            plugins[i].plugin.onLeave(config, bot, {channel: channel, name: who, online: onlineUsers});

    if (who.toUpperCase() == config.username.toUpperCase() && joined)
        joined = false;
    else if (onlineUsers.indexOf(who.toUpperCase()) != -1) {
        onlineUsers.splice(onlineUsers.indexOf(who.toUpperCase()), 1);

        if (config.log)
            console.log(who + " left chat.");
    }
});

bot.addListener("message", function(from, to, message) {
    if (onlineUsers.indexOf(from.toUpperCase()) == -1) {
        onlineUsers.push(from.toUpperCase());

        if (config.log)
            console.log(from + " joined chat.");
    }

    for (var i = 0; i < plugins.length; i++)
        if (plugins[i].plugin.onMessage != null)
            plugins[i].plugin.onMessage(config, bot, {name: from, channel: to, msg: message, online: onlineUsers});

    if (config.log)
        console.log(chalk.bold(chalk.green(from) + ": " + chalk.yellow(message)));
});

bot.addListener("pm", function(from, message) {
    for (var i = 0; i < plugins.length; i++)
        if (plugins[i].plugin.onPM != null)
            plugins[i].plugin.onPM(config, bot, {name: from, msg: message, online: onlineUsers});
    if (config.log)
        console.log(chalk.red(from) + ": " + chalk.magenta(message));
});

//On close terminal window.
process.on('SIGHUP', function() {
    for (var i = 0; i < plugins.length; i++)
        plugins[i].plugin.onExit(config, __dirname);
	process.exit();
});

//On ctrl+C program interrupt.
process.on ("SIGINT", function(){
    for (var i = 0; i < plugins.length; i++)
        plugins[i].plugin.onExit(config, __dirname);
	process.exit();
});
