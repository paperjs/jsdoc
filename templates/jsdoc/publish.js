function publish(symbolGroup) {
	publish.conf = {
		ext: ".html",
		outDir: "out/jsdox/", // trailing slash expected
		symbolsDir: "symbols/",
		srcDir: "symbols/src/"
	};
	
	// used to check the details of things being linked to
	Link.symbolGroup = symbolGroup;

	try {
		var classTemplate = new JSDOC.JsPlate("templates/jsdoc/class.tmpl");
		var filesTemplate = new JSDOC.JsPlate("templates/jsdoc/allfiles.tmpl");
		var classesTemplate = new JSDOC.JsPlate("templates/jsdoc/allclasses.tmpl");
	}
	catch(e) {
		print(e.message);
		quit();
	}
	
	// filters
	function hasNoParent($) {return ($.memberof == "")}
	function isaFile($) {return ($.is("FILE"))}
	function isaClass($) {return ($.is("CONSTRUCTOR") || $.isNamespace())}
	
	var symbols = symbolGroup.getSymbols();
	var classes = symbols.filter(isaClass).sort(makeSortby("alias"));

	var files = JSDOC.opt.srcFiles;
	
	for (var i = 0, l = files.length; i < l; i++) {
		var file = files[i];
		
		var srcDir = publish.conf.outDir + publish.conf.srcDir;
		JSDOC.IO.mkPath(srcDir.split("/"));
		makeSrcFile(file, srcDir);
	}
	
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
		
		var output = "";
		output = classTemplate.process(symbol);
		var symbolsDir = publish.conf.outDir + publish.conf.symbolsDir;
		JSDOC.IO.mkPath(symbolsDir.split("/"));
		JSDOC.IO.saveFile(symbolsDir, symbol.alias+publish.conf.ext, output);
	}
	
	var classesIndex = classesTemplate.process(classes);
	JSDOC.IO.saveFile(publish.conf.outDir, "allclasses-frame"+publish.conf.ext, classesIndex)

	var filesIndex = filesTemplate.process(files);
	JSDOC.IO.saveFile(publish.conf.outDir, "allFiles-frame"+publish.conf.ext, filesIndex)

	// handle static files
	if (publish.conf.outDir) {
		JSDOC.IO.copyFile("templates/jsdoc/static/index.html", publish.conf.outDir);
	}

}

function Link() {
	this.alias = "";
	this.Src = "";
	this.text = "";
	this.relativeToPath = "./";
	this.targetName = "";
	
	this.from = function(relativeToPath) {
		if (defined(relativeToPath)) this.relativeToPath = relativeToPath;
		return this;
	}
	this.target = function(targetName) {
		if (defined(targetName)) this.targetName = targetName;
		return this;
	}
	this.withText = function(text) {
		if (defined(text)) this.text = text;
		return this;
	}
	this.toSrc = function(filename) {
		if (defined(filename)) this.src = filename;
		return this;
	}
	this.toSymbol = function(alias) {
		if (defined(alias)) this.alias = alias;
		return this;
	}
	
	this.toString = function() {
		var relativeToPath = (this.relativeToPath)? this.relativeToPath : "";
		var text = this.text;
		var target = (this.targetName)? " target=\""+this.targetName+"\"" : "";
				
		function _makeSymbolLink(alias) {
			var linkTo;
			var linkPath;
			
			if (alias.charAt(0) == "#") var linkPath = alias;
			// if there is no symbol by that name just return the name unaltered
			else if (!(linkTo = Link.symbolGroup.getSymbol(alias))) return alias;
			else {
				linkPath = escape(linkTo.alias)+publish.conf.ext;
				if (!linkTo.is("CONSTRUCTOR")) {
					linkPath = escape(linkTo.parentConstructor) || "_global_";
					linkPath += publish.conf.ext+"#"+linkTo.name
				}
				linkPath = path+linkPath
			}
			
			if (!text) text = alias;
			return "<a href=\""+linkPath+"\""+target+">"+text+"</a>";
		}
		
		function _makeSrcLink(srcFilePath) {
			var srcFile = srcFilePath.replace(/\.\.?\//g, "").replace(/\//g, "_");
			var outFilePath = "src/"+srcFile+publish.conf.ext;

			if (!text) text = JSDOC.Util.fileName(srcFilePath);//srcFile;
			return "<a href=\""+outFilePath+"\""+target+">"+text+"</a>";
		}
		
		if (this.alias) {
			var path = relativeToPath+publish.conf.symbolsDir;
			var linkString = this.alias;

			linkString = linkString.replace(/(?:^|[^a-z$0-9_])(#[a-z$0-9_#-.]+|[a-z$0-9_#-.]+)\b/gi,
				function(match, symbolName) {
					return _makeSymbolLink(symbolName);
				}
			);
		}
		else if (this.src) {
			linkString = _makeSrcLink(this.src);
		}
		
		return linkString;
	}
}

function summarize(desc) {
	if (typeof desc != "undefined")
		return desc.match(/([\w\W]+?\.)[^a-z0-9]/i)? RegExp.$1 : desc;
}

// sorters
function makeSortby(attribute) {
	return function(a, b) {
		if (a[attribute] != undefined && b[attribute] != undefined) {
			a = a[attribute].toLowerCase();
			b = b[attribute].toLowerCase();
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		}
	}
}

function include(path) {
	var path = "templates/jsdoc/"+path;
	return JSDOC.IO.readFile(path);
}

function makeSrcFile(path, srcDir, name) {
	if (!name) name = path.replace(/\.\.?\//g, "").replace(/\//g, "_");
	
	var src = {path: __DIR__+path, name:name, hilited: ""};
	
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onPublishSrc", src);
	}

	if (src.hilited) {
		JSDOC.IO.saveFile(srcDir, name+publish.conf.ext, src.hilited);
	}
}