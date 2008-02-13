function publish(symbolGroup) {
	publish.conf = {  // trailing slash expected for dirs
		ext: ".html",
		outDir: JSDOC.opt.d || SYS.pwd+"../out/jsdoc/",
		templatesDir: SYS.pwd+"../templates/jsdoc/",
		symbolsDir: "symbols/",
		srcDir: "symbols/src/"
	};
	
	IO.mkPath((publish.conf.outDir+"symbols/src").split("/"));
		
	// used to check the details of things being linked to
	Link.symbolGroup = symbolGroup;

	try {
		var classTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"class.tmpl");
		var classesTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"allclasses.tmpl");
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
	
	var files = JSDOC.opt.srcFiles;
 	for (var i = 0, l = files.length; i < l; i++) {
 		var file = files[i];
 		var srcDir = publish.conf.outDir + "symbols/src/";
		makeSrcFile(file, srcDir);
 	}
 	
 	var classes = symbols.filter(isaClass).sort(makeSortby("alias"));
	
	Link.base = "../";
 	publish.classesIndex = classesTemplate.process(classes); // kept in memory
	
	for (var i = 0, l = classes.length; i < l; i++) {
		var symbol = classes[i];
		var output = "";
		output = classTemplate.process(symbol);
		
		IO.saveFile(publish.conf.outDir+"symbols/", symbol.get("alias")+publish.conf.ext, output);
	}
	
	// regenrate the index with different relative links
	Link.base = "";
	publish.classesIndex = classesTemplate.process(classes);
	
	try {
		var classesindexTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"index.tmpl");
	}
	catch(e) { print(e.message); quit(); }
	
	var classesIndex = classesindexTemplate.process(classes);
	IO.saveFile(publish.conf.outDir, "index"+publish.conf.ext, classesIndex);
	classesindexTemplate = classesIndex = classes = null;
	
	try {
		var fileindexTemplate = new JSDOC.JsPlate(publish.conf.templatesDir+"allfiles.tmpl");
	}
	catch(e) { print(e.message); quit(); }
	
	var documentedFiles = symbols.filter(isaFile);
	var allFiles = [];
	
	for (var i = 0; i < files.length; i++) {
		allFiles.push(new JSDOC.Symbol().init(files[i], [], "FILE", new JSDOC.DocComment("/** */")));
	}
	
	for (var i = 0; i < documentedFiles.length; i++) {
		var offset = files.indexOf(documentedFiles[i].get("alias"));
		allFiles[offset] = documentedFiles[i];
	}
		
	allFiles = allFiles.sort(makeSortby("name"));

	var filesIndex = fileindexTemplate.process(allFiles);
	IO.saveFile(publish.conf.outDir, "files"+publish.conf.ext, filesIndex);
	fileindexTemplate = filesIndex = files = null;
}

function Link() {
	this.alias = "";
	this.src = "";
	this.file = "";
	this.text = "";
	this.innerName = "";
	this.targetName = "";
	
	this.target = function(targetName) {
		if (defined(targetName)) this.targetName = targetName;
		return this;
	}
	this.inner = function(inner) {
		if (defined(inner)) this.innerName = inner;
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
	this.toFile = function(file) {
		if (defined(file)) this.file = file;
		return this;
	}
	
	this.toString = function() {
		var linkString;
		var thisLink = this;

		if (this.alias) {
			linkString = this.alias.replace(/(?:^|[^a-z$0-9_])(#[a-z$0-9_#-.]+|[a-z$0-9_#-.]+)(\|)?\b/gi,
				function(match, symbolName, sep) {
					return thisLink._makeSymbolLink(symbolName)+(sep? sep: "");
				}
			);
		}
		else if (this.src) {
			linkString = thisLink._makeSrcLink(this.src);
		}
		else if (this.file) {
			linkString = thisLink._makeFileLink(this.file);
		}
		return linkString;
	}
}

/** Appended to the front of relative link paths. */
Link.base = "";

Link.symbolNameToLinkName = function(symbol) {
	var linker = "";
	if (symbol.get('isStatic')) linker = ".";
	else if (symbol.get('isInner')) linker = "-";
	
	return linker+symbol.get("name");
}

/** Create a link to a snother symbol. */
Link.prototype._makeSymbolLink = function(alias) {
	var linkBase = Link.base+publish.conf.symbolsDir;
	var linkTo;
	var linkPath;
	var target = (this.targetName)? " target=\""+this.targetName+"\"" : "";
	
	// is it an internal link?
	if (alias.charAt(0) == "#") var linkPath = alias;
	// if there is no symbol by that name just return the name unaltered
	else if (!(linkTo = Link.symbolGroup.getSymbol(alias))) return alias;
	// it's a symbol in another file
	else {
		
		if (!linkTo.is("CONSTRUCTOR")) { // it's a method or property
			linkPath = escape(linkTo.get('parentConstructor')) || "_global_";
			linkPath += publish.conf.ext + "#" + Link.symbolNameToLinkName(linkTo);
		}
		else {
			linkPath = escape(linkTo.get('alias'));
			linkPath += publish.conf.ext + "#constructor";
		}
		linkPath = linkBase + linkPath
	}
	
	if (!this.text) this.text = alias;
	return "<a href=\""+linkPath+"\""+target+">"+this.text+"</a>";
}

/** Create a link to a source file. */
Link.prototype._makeSrcLink = function(srcFilePath) {
	var target = (this.targetName)? " target=\""+this.targetName+"\"" : "";
		
	// transform filepath into a filename
	var srcFile = srcFilePath.replace(/\.\.?[\\\/]/g, "").replace(/[\\\/]/g, "_");
	var outFilePath = Link.base + publish.conf.srcDir + srcFile + publish.conf.ext;

	if (!this.text) this.text = JSDOC.Util.fileName(srcFilePath);
	return "<a href=\""+outFilePath+"\""+target+">"+this.text+"</a>";
}

/** Create a link to a source file. */
Link.prototype._makeFileLink = function(filePath) {
	var target = (this.targetName)? " target=\""+this.targetName+"\"" : "";
		
	var outFilePath =  Link.base + filePath;

	if (!this.text) this.text = filePath;
	return "<a href=\""+outFilePath+"\""+target+">"+this.text+"</a>";
}

/** Just the first sentence. */
function summarize(desc) {
	if (typeof desc != "undefined")
		return desc.match(/([\w\W]+?\.)[^a-z0-9]/i)? RegExp.$1 : desc;
}

/** make a symbol sorter by some attribute */
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
	var path = publish.conf.templatesDir+path;
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
		function($) {
			return $.name;
		}
	).join(", ")
	+
	")";
	return signature;
}

/** Find symbol {@link ...} strings in text and turn into html links */
function resolveLinks(str, from) {
	str = str.replace(/\{@link ([^} ]+) ?\}/gi,
		function(match, symbolName) {
			return new Link().toSymbol(symbolName);
		}
	);
	
	return str;
}