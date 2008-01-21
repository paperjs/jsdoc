function publish(symbolGroup) {
	publish.conf = {  // trailing slash expected for dirs
		ext: ".html",
		outDir: SYS.pwd()+"../out/jsdox/",
		templatesDir: SYS.pwd()+"../templates/",
		symbolsDir: "symbols/",
		srcDir: "src/"
	};
	
	IO.mkPath((publish.conf.outDir+"symbols/src").split("/"));
		
	// used to check the details of things being linked to
	Link.symbolGroup = symbolGroup;

	try {
		var classTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"jsdoc/class.tmpl");
		var filesTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"jsdoc/allfiles.tmpl");
		var classesTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"jsdoc/allclasses.tmpl");
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
 		
 		var srcDir = publish.conf.outDir + "symbols/src/";
// 		IO.mkPath(srcDir.split("/"));
 		makeSrcFile(file, srcDir);
 	}
 	
	publish.classesIndex = classesTemplate.process(classes);
	
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
		var output = "";
		output = classTemplate.process(symbol);
//		IO.mkPath(publish.conf.symbolsDir.split("/"));
		IO.saveFile(publish.conf.outDir+"symbols/", symbol.get("alias")+publish.conf.ext, output);
	}
	
	
	//IO.saveFile(publish.conf.outDir, "allclasses-frame"+publish.conf.ext, classesIndex)

	//var filesIndex = filesTemplate.process(files);
	//IO.saveFile(publish.conf.outDir, "allFiles-frame"+publish.conf.ext, filesIndex)

	// handle static files
	if (publish.conf.outDir) {
		IO.copyFile(publish.conf.templatesDir+"jsdoc/static/index.html", publish.conf.outDir);
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
		if (defined(alias)) this.alias = new String(alias);
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
				linkPath = escape(linkTo.get('alias'))+publish.conf.ext;
				if (!linkTo.is("CONSTRUCTOR")) {
					linkPath = escape(linkTo.get('parentConstructor')) || "_global_";
					linkPath += publish.conf.ext+"#"+linkTo.get('name')
				}
				linkPath = path+linkPath
			}
			
			if (!text) text = alias;
			return "<a href=\""+linkPath+"\""+target+">"+text+"</a>";
		}
		
		function _makeSrcLink(srcFilePath) {
			var srcFile = srcFilePath.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
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
		if (a.get(attribute) != undefined && b.get(attribute) != undefined) {
			a = a.get(attribute).toLowerCase();
			b = b.get(attribute).toLowerCase();
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		}
	}
}

function include(path) {
	var path = publish.conf.templatesDir+"jsdoc/"+path;
	return IO.readFile(path);
}

function makeSrcFile(path, srcDir, name) {
	if (!name) name = path.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
	
	var src = {path: path, name:name, hilited: ""};
	
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onPublishSrc", src);
	}

	if (src.hilited) {
		IO.saveFile(srcDir, name+publish.conf.ext, src.hilited);
	}
}

function makeSignature(params) {
	if (!params) return "()";
	var signature = "("
	+
	params.filter(
		function($) {
			return $.name.indexOf(".") == -1; // don't show config params in signature
		}
	).map(
		function($) {return $.name;}
	).join(", ")
	+
	")";
	return signature;
}

function resolveLinks(str, from) { // for inline @link tags
	if (!from) from = "../"; // within the same directory
	str = str.replace(/\{@link ([^} ]+) ?\}/gi,
		function(match, symbolName) {
			return new Link().toSymbol(symbolName).from(from);
		}
	);
	
	return str;
}