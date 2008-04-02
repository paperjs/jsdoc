/**
	@namespace
	@requires JSDOC.Walker
	@requires JSDOC.Symbol
	@requires JSDOC.DocComment
*/
JSDOC.Parser = {
	conf: {
		ignoreCode:               JSDOC.opt.n,
		ignoreAnonymous:           true, // factory: true
		treatUnderscoredAsPrivate: true, // factory: true
		explain:                   true  // factory: false
	},
	
	addSymbol: function(symbol) {
		if (JSDOC.Parser.conf.ignoreAnonymous && symbol.name.match(/\$anonymous\b/)) return;
		
		if (typeof JSDOC.Parser._symbolIndex[symbol.name] != "undefined") {
			LOG.warn("The symbol named '"+symbol.name+"' is defined more than once.");
		}
print("~~ adding index to "+symbol.name);
		JSDOC.Parser._symbolIndex[symbol.name] = JSDOC.Parser._symbols.length;
		
		if (JSDOC.Parser.conf.treatUnderscoredAsPrivate && symbol.name.indexOf("_") == 0) {
			symbol.isPrivate = true;
		}
		
		JSDOC.Parser._symbols.push(symbol);
	},
	getSymbols: function() {
		return JSDOC.Parser._symbols
	}
}

JSDOC.Parser.parse = function(/**JSDOC.TokenStream*/ts, /**String*/srcFile) {
	JSDOC.Parser._symbols = [];
	JSDOC.Parser._symbolIndex = {};
	JSDOC.Symbol.srcFile = (srcFile || "");
	JSDOC.DocComment.shared = "";
	
	if (!JSDOC.Walker) load("app/lib/JSDOC/Walker.js");
	var walker = new JSDOC.Walker(ts);
	
	if (JSDOC.Parser.conf.explain) {
		print("\n"+srcFile+"\n-------------------");
		JSDOC.Parser.getSymbols().map(function($){ print($.name) });
	}
	
	return JSDOC.Parser.getSymbols();
}
