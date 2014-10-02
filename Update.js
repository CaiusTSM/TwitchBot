var fs = require("fs");
var jsdom = require("jsdom");
var http = require("http");
var unzip = require("unzip");

jsdom.env("https://github.com/icefrog50/TwitchBot/tags", ["http://code.jquery.com/jquery.js"], function(errors, window) {
    console.log("Scanning for latest version...");
    var downloadLink = "";
    var highest = 0;
    window.$("a").each(function(index) {
        var vNum = parseFloat(this.attr('href').replace("https://github.com/icefrog50/TwitchBot/archive/v", "").replace(".zip", ""));
        if (!isNaN(vNum))
            if (vNum > highest)
                highest = vNum;
    });
    downloadLink = "https://github.com/icefrog50/TwitchBot/archive/v" + vNum + ".zip";
    console.log("Found: " + downloadLink + "\nDownloading...");

    var file = fs.createWriteStream(__dirname + "/download.zip");
    var request = http.get(downloadLink, function(response) {
        response.pipe(file);
    });

    console.log("Downloaded.\nUnzipping...");
    fs.createReadStream(__dirname + "/download.zip").pipe(unzip.Extract({path: __dirname + "/download"}));

    console.log("Removing Download.zip...");
    fs.unlinkSync(__dirname + "/download.zip");

    console.log("Scanning for code files in downloaded folder...");
    var files = fs.readdirSync(__dirname + "/download");
    var jsFiles = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i].indexOf(".js") != -1) {
            jsFiles.push(files[i]);
            console.log("Found: " + files[i]);
        }
    }

    console.log("Moving code files...");
    for (var i = 0; i < jsFiles[i].length; i++) {
        var newDir = jsFiles[i].replace("download/", "");
        fs.renameSync(jsFiles[i], newDir);
        console.log(jsFiles[i] + " ---> " + newDir);
    }

    console.log("Done.");
});
