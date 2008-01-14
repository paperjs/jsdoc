

try { importClass(java.lang.System); }
catch (e) { throw "RuntimeException: The class java.lang.System is required to run this script."; }
//print("System.getProperty(\"jsdoc_dir\") is "+System.getProperty("jsdoc_dir"));
var userDir  = System.getProperty("user.dir");
var envrDir  = (System.getProperty("jsdoc.dir")||System.getProperty("jsdoc_dir"));
var javaLibs = (System.getProperty("java.library.path")).split(":");
var libDirs = [userDir].concat(envrDir, javaLibs);
var jsdocDir = ["jsdoc-toolkit", "../jsdoc-toolkit"];
var libErrors = [];

for(var i = 0, l = libDirs.length; i < l; i++) {
	for (var j = 0, jl = jsdocDir.length; j < jl; j++) {
		var appRootPath = libDirs[i]+Packages.java.io.File.separator+jsdocDir[j]+Packages.java.io.File.separator;
		if(!Packages.java.io.File(appRootPath).exists()) {
			libErrors.push("Could not find: ["+appRootPath+"]");
		}
		else {
			__DIR__ = new String(appRootPath);
			break;
		}
	}
}

//print("__DIR__ is "+__DIR__);
load(__DIR__+"app/frame.js");
load(__DIR__+"app/lib/JSDOC.js");
//include("app/frame/Dumper.js");
	
var myTemplate = "templates/jsdoc";


with (JSDOC) {
	var jsdoc = new JSDOC.JsDoc(arguments);
	
	
// 	var tokens = jsdoc.tokens;
// 	for (var i = 0, l = tokens.length; i < l; i++) {
// 		var token = tokens[i];
// 		//print(Dumper.dump(symbol));
// 		print("t> "+token);
// 	}
// 	
// 	var symbols = jsdoc.symbolGroup.getSymbols();
// 	for (var i = 0, l = symbols.length; i < l; i++) {
// 		var symbol = symbols[i];
// 		//print(Dumper.dump(symbol));
// 		print("s> "+symbol.alias);
// 	}

	include(myTemplate+"/publish.js");
	publish(jsdoc.symbolGroup);
}
