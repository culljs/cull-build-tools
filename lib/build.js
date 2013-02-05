var fs = require("fs");
var uglify = require("uglify-js");
var stripper = require("./guard-stripper");

var minify = function (code) {
    var u = uglify.uglify;
    return u.gen_code(u.ast_squeeze(u.ast_mangle(uglify.parser.parse(code))));
};

var zeroPad = function (num) {
    return num < 10 ? "0" + num : num;
};

var addLicense = function (code) {
    var license = fs.readFileSync("LICENSE", "utf8");
    var pkgJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    var version = pkgJson.version;
    var date = new Date();
    var name = pkgJson.humanName;
    return "/**\n * " + name + " " + version + ", " + date.getFullYear() + "-" +
        zeroPad(date.getMonth() + 1) + "-" + zeroPad(date.getDate()) + "\n * " +
        license.split("\n").join("\n * ") + "\n */\n" + code;
};

var opt = function (short, long) {
    for (var i = 2, l = process.argv.length; i < l; ++i) {
        if (new RegExp(short + "|" + long).test(process.argv[i])) {
            return true;
        }
    }
    return false;
};

if (opt("-h", "--help")) {
    console.log("Produce distribution");
    console.log("Usage:");
    console.log("    script/build [opt]");
    console.log("        -m --minify     Produce minified distribution");
    console.log("        -n --no-license Skip the license header");
    console.log("        -s --no-guards  Remove the helpful error messages");
    console.log("        -h --help       Show this message");
    process.exit(1);
}

module.exports = function (name, sources) {
    try {
        fs.mkdirSync("dist");
    } catch (e) {}

    var content = sources.map(function (file) {
        return fs.readFileSync(file, "utf8");
    }).join("");

    var willMinify = opt("-m", "--minify");

    if (opt("-s", "--no-guards")) {
        content = stripper.stripGuardDecls(stripper.stripGuards(content));
    }

    if (willMinify) {
        content = minify(content);
    }

    if (!opt("-n", "--no-license")) {
        content = addLicense(content);
    }

    var target = "dist/" + name + (willMinify ? ".min.js" : ".js");
    fs.writeFileSync(target, content, "utf8");
    var size = (Math.floor((content.length * 1000 / 1024)) / 1000);
    var message = "Produced " + (willMinify ? "minified " : "");
    console.log(message + target + " (~" + size + "kB)");
};
