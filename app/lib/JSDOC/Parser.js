load("app/lib/JSDOC/Walker.js");
//load("app/lib/JSDOC/Relator.js");
load("app/lib/JSDOC/SymbolSet.js");

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
		explain:                   false // factory: false
	},
	
	addSymbol: function(symbol) {
		if (JSDOC.Parser.conf.ignoreAnonymous && symbol.name.match(/\$anonymous\b/)) return;
		
		if (JSDOC.Parser.symbols.hasSymbol(symbol.alias)) {
			LOG.warn("The symbol named '"+symbol.name+"' is defined more than once.");
		}

		if (JSDOC.Parser.conf.treatUnderscoredAsPrivate && symbol.name.match(/[.#-]_[^.#-]+$/)) {
			symbol.isPrivate = true;
		}
		
		if ((symbol.isInner || symbol.isPrivate) && !JSDOC.opt.p) return;
		if (symbol.isIgnored) return;
		
		JSDOC.Parser.symbols.addSymbol(symbol);
	},
	
	init: function() {
		JSDOC.Parser.symbols = new JSDOC.SymbolSet();
		JSDOC.Parser.walker = new JSDOC.Walker();
	},
	
	finish: function() {
		JSDOC.Parser.symbols.relate();		

		if (JSDOC.Parser.conf.explain) {
			var symbols = JSDOC.Parser.symbols.toArray();
			var srcFile = "@";
			for (var i = 0, l = symbols.length; i < l; i++) {
				var symbol = symbols[i];
				if (srcFile != symbol.srcFile) {
					srcFile = symbol.srcFile;
					print("\n"+srcFile+"\n-------------------");
				}
				print(i+":\n  alias => "+symbol.alias + "\n  name => "+symbol.name+ "\n  isa => "+symbol.isa + "\n  memberOf => " + symbol.memberOf + "\n  isStatic => " + symbol.isStatic + ",  isInner => " + symbol.isInner);
			}
			print("-------------------\n");
		}
	}
}

JSDOC.Parser.parse = function(/**JSDOC.TokenStream*/ts, /**String*/srcFile) {
	JSDOC.Symbol.srcFile = (srcFile || "");
	JSDOC.DocComment.shared = "";
	
	if (!JSDOC.Parser.walker) JSDOC.Parser.init();
	JSDOC.Parser.walker.walk(ts);
	
	// filter symbols by option
	for (p in JSDOC.Parser.symbols._index) {
		var symbol = JSDOC.Parser.symbols._index[p];
		if (symbol.is("FILE") || symbol.is("GLOBAL")) continue;
		else if (!JSDOC.opt.a && !symbol.comment.isUserComment) {
			JSDOC.Parser.symbols.deleteByAlias(symbol.alias);
		}
		
		if (/#$/.test(symbol.alias)) { // we don't document prototypes
			JSDOC.Parser.symbols.deleteByAlias(symbol.alias);
		}
	}
	
	return JSDOC.Parser.symbols.toArray();
}
