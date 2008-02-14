/**
	@constructor
	@param [opt] Used to override the commandline options. Useful for testing.
	@version $Id$
*/
JSDOC.JsDoc = function(/**object*/ opt) {
	if (opt) {
		JSDOC.opt = opt;
	}
	
	// the -c option: use a configuration file
	if (JSDOC.opt.c) {
		eval("JSDOC.conf = " + IO.readFile(JSDOC.opt.c));
		
		LOG.inform("Using configuration file at '"+JSDOC.opt.c+"'.");
		
		for (var c in JSDOC.conf) {
			if (c !== "D" && !defined(JSDOC.opt[c])) { // commandline overrules config file
				JSDOC.opt[c] = JSDOC.conf[c];
			}
		}
		
		if (typeof JSDOC.conf["_"] != "undefined") {
			JSDOC.opt["_"] = JSDOC.opt["_"].concat(JSDOC.conf["_"]);
		}
	}
	
	// defend against options that are not sane 
	if (JSDOC.opt.t === true) JSDOC.usage();

	if (JSDOC.opt.h) {
		JSDOC.usage();
		quit();
	}
	
	if (JSDOC.opt.d) {
		if (!JSDOC.opt.d.charAt(JSDOC.opt.d.length-1).match(/[\\\/]/)) {
			JSDOC.opt.d = JSDOC.opt.d+"/";
		}
		LOG.inform("Output directory set to '"+JSDOC.opt.d+"'.");
		IO.mkPath(JSDOC.opt.d);
	}
	if (JSDOC.opt.e) IO.setEncoding(JSDOC.opt.e);
	
	// the -r option: scan source directories recursively
	if (typeof JSDOC.opt.r == "boolean") JSDOC.opt.r = 10;
	else if (!isNaN(parseInt(JSDOC.opt.r))) JSDOC.opt.r = parseInt(JSDOC.opt.r);
	else JSDOC.opt.r = 1;
	
	// the -D option: define user variables
	var D = {};
	if (JSDOC.opt.D) {
		for (var i = 0; i < JSDOC.opt.D.length; i++) {
			var defineParts = JSDOC.opt.D[i].split(":", 2);
			if (defineParts) D[defineParts[0]] = defineParts[1];
		}
	}
	JSDOC.opt.D = D;
	// combine any conf file D options with the commandline D options
	if (defined(JSDOC.conf)) for (var c in JSDOC.conf.D) {
 		if (!defined(JSDOC.opt.D[c])) {
 			JSDOC.opt.D[c] = JSDOC.conf.D[c];
 		}
 	}

   // Load additional file handlers
   // the -H option: filetype handlers
   var H = {};
   if (JSDOC.opt.H) {
      for (var h in JSDOC.opt.H) {
         // Include additional files for the handlers
         LOG.inform("Adding '." + h + "' file handler '" + JSDOC.opt.H[h].handlerClass + "' @ " + JSDOC.opt.H[h].lib);
         IO.include("handlers/" + JSDOC.opt.H[h].lib);
      }
   }

	// Give plugins a chance to initialize
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onInit", this);
	}

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
	if (JSDOC.opt.x) ext = JSDOC.opt.x.split(",").map(function($) {return $.toLowerCase()});
	
   function isHandled($) {
		var thisExt = $.split(".").pop().toLowerCase();
		return (ext.indexOf(thisExt) > -1); // we're only interested in files with certain extensions
	}
	
	for (var i = 0; i < JSDOC.opt._.length; i++) {
		srcFiles = srcFiles.concat(
			IO.ls(JSDOC.opt._[i], JSDOC.opt.r).filter(isHandled)
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
			var src = IO.readFile(srcFile);
		}
		catch(e) {
			print("oops: "+e.message);
		}

		// Check to see if there is a handler for this file type
		var ext = JSDOC.Util.fileExtension(srcFile);
		if (JSDOC.opt.H && JSDOC.opt.H[ext] != null) {
			LOG.inform(" Using external handler for '" + ext + "'");

			// Get the handler class
			if (typeof JSDOC.opt.H[ext].handlerClass == 'string') {
				// Convert the class name to its class object
				JSDOC.opt.H[ext].handlerClass = eval(JSDOC.opt.H[ext].handlerClass);
				if (typeof JSDOC.opt.H[ext].handlerClass != 'object') {
					LOG.inform("The class for the '" + ext + "' handler is invalid!");
				}
			}

			symbols = symbols.concat( JSDOC.opt.H[ext].handlerClass.symbolize(srcFile, src) );
		}
		else {
				// The default (JSDOC) handler
			var tr = new JSDOC.TokenReader();
			var tokens = tr.tokenize(new JSDOC.TextStream(src));
	
			symbols = symbols.concat(
				JSDOC.Parser.parse(
					new JSDOC.TokenStream(tokens),
					srcFile
				)
			);
		}
	}

	this.symbols = symbols;
	return this.symbols;
}
