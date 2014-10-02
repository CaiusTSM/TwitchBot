var fs = require("fs");
var http = require("http");
var https = require("https");
var cheerio = require("cheerio");
var unzip = require("unzip");

var html = "";

console.log("Scanning for latest version...");
var options = {
    hostname: "github.com",
    port: 443,
    path: "/icefrog50/TwitchBot/tags",
    method: "GET"
};

var req = https.request(options, function(res) {
    res.on("data", function(data) {
        html += data;
    });

    res.on("end", function() {
        exe();
    });
});

req.on("error", function(error) {
    console.error(error);
    process.exit();
});

req.end();

function exe() {
    var downloadLink = "";
    var highest = 0;
    var vNum = 0;
    var $ = cheerio.load(html);

    $("a").each(function(index, elem) {
        var link = $(elem).attr("href");
        if (link.indexOf("/icefrog50/TwitchBot/archive/v") != -1 && link.indexOf(".zip") != -1) {
            console.log("Found: " + link.replace("/icefrog50/TwitchBot/archive/v", "").replace(".zip", ""));
            vNum = parseFloat(link.replace("/icefrog50/TwitchBot/archive/v", "").replace(".zip", ""));
            if (!isNaN(vNum)) {
                if (vNum > highest)
                    highest = vNum;
            }
        }
    });

    if (highest == 0) {
        console.log("[ERROR] No releases found.");
        process.exit();
    }

    downloadLink = "https://codeload.github.com/icefrog50/TwitchBot/zip/v" + highest;
    console.log("Latest Version Found: " + downloadLink + "\nDownloading...");

    var file = fs.createWriteStream(__dirname + "/download.zip");
    var request = https.get(downloadLink, function(response) {
        response.pipe(file);
        response.on("end", function() {
            exe2(highest);
        });
    });
}

function exe2(version) {
    console.log("Downloaded.\nUnzipping...");
    fs.mkdirSync(__dirname + "/download");
    var extract = fs.createReadStream(__dirname + "/download.zip").pipe(unzip.Extract({path: __dirname + "/download"}));

    extract.on("close", function() {
        console.log("Scanning for code files in downloaded folder...");
        var files = readDirResursive(__dirname + "/download/TwitchBot-" + version);
        var jsFiles = [];
        for (var i = 0; i < files.length; i++) {
            if (files[i].indexOf(".js") != -1 || files[i].indexOf("node_modules") != -1)
                jsFiles.push(files[i]);
        }
        console.log("" + jsFiles.length + " Code File(s) found...\n");

        console.log("Moving code files...");
        for (var i = 0; i < jsFiles.length; i++) {
            var newDir = jsFiles[i].replace("download/TwitchBot-" + version + "/", "");
            fs.renameSync(jsFiles[i], newDir);
            console.log(jsFiles[i].replace(__dirname, ".")  + " ---> " + newDir.replace(__dirname, "."));
        }

        console.log("Removing download directory...");
        deleteDirRecursive(__dirname + "/download");

        console.log("Removing download.zip");
        fs.unlinkSync(__dirname + "/download.zip");

        console.log("Done.");
    });
}

var readDirResursive = function(path) {
    if(fs.existsSync(path)) {
        var files = [];

        fs.readdirSync(path).forEach(function(file, index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory())
                files = files.concat(readDirResursive(curPath));
            else
                files.push(curPath);
        });

        return files;
    }
}

var deleteDirRecursive = function(path) {
    if(fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file, index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory())
                deleteDirRecursive(curPath);
            else
                fs.unlinkSync(curPath);
        });

        fs.rmdirSync(path);
    }
};
