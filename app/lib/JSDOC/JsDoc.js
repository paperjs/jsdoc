/**
	@constructor
*/
JSDOC.JsDoc = function(opt) {
	if (opt.constructor === Array) {
		JSDOC.opt = JSDOC.Util.getOptions(opt, {d:'directory', t:'template', r:'recurse', x:'ext', p:'private', a:'allfunctions', A:'Allfunctions', e:'encoding', o:'out', h:'help', 'D[]':'define'});
	}
	else JSDOC.opt = opt;

	if (!JSDOC.opt.e) JSDOC.opt.e = "utf-8";
	JSDOC.IO.setEncoding(JSDOC.opt.e);
	
	if (JSDOC.opt.r === true) JSDOC.opt.r = 10;

	JSDOC.opt.srcFiles = this.getSrcFiles();
	this.symbolGroup = new JSDOC.SymbolGroup(this.getSymbols());
}

/**
	Lazy retrieval of source file list, only happens when requested, only once.
 */
JSDOC.JsDoc.prototype.getSrcFiles = function() {
	if (this.srcFiles) return this.srcFiles;
	var srcFiles = [];
	var ext = ["js"];
	if (JSDOC.opt.x) ext = JSDOC.opt.x.split(",").map(function(x) {return x.toLowerCase()});
	
	function isJs($) {
		var thisExt = $.split(".").pop().toLowerCase();
		return (ext.indexOf(thisExt) > -1); // we're only interested in files with certain extensions
	}
	
	for (var i = 0; i < JSDOC.opt._.length; i++) {
		srcFiles = srcFiles.concat(
			JSDOC.IO.ls(JSDOC.opt._[i], JSDOC.opt.r).filter(isJs)
		);
	}
	
	this.srcFiles = srcFiles;
	return this.srcFiles;
}

JSDOC.JsDoc.prototype.getSymbols = function() {
	if (this.symbols) return this.symbols;
	var symbols = [];

	for (var i = 0, l = this.srcFiles.length; i < l; i++) {
		var srcFile = this.srcFiles[i];
		
		try {
			var src = JSDOC.IO.readFile(srcFile);
		}
		catch(e) {
			print("oops: "+e.message);
		}

		var tr = new JSDOC.TokenReader();
		var tokens = tr.tokenize(new JSDOC.TextStream(src));

		symbols = symbols.concat(
			JSDOC.Parser.parse(
				new JSDOC.TokenStream(tokens),
				srcFile
			)
		);
	}
	this.symbols = symbols;
	return this.symbols;
}
