var global;
/**
	@constructor
*/
JSDOC.SymbolGroup = function(symbols) {
	this.symbols = this.filterByOption(symbols, JSDOC.opt);
	
	// generate a dummy class to hold any symbols with no parent class
	global = new JSDOC.Symbol("_global_", [], "CONSTRUCTOR", new JSDOC.DocComment("/** BUILTIN */"));
	global.isNamespace = true;
	global.srcFile = "";
	
	this.symbols.push(global);
	
	this.fileIndex = new Hash();
	this.classIndex = {};
	this.nameIndex = new Hash();
	this.typeIndex = new Hash();
	
	this.indexAll();
	this.resolveMixins();
	this.indexAll();
	this.resolveMemberOf();
	this.indexAll();
	this.resolveNames();
	this.indexAll(this.symbols);
	this.resolveMembers();
	this.indexAll();
	this.resolveAugments();
}

JSDOC.SymbolGroup.prototype.getOverview = function(path) {
	var overviews = this.getSymbolsByType().filter(
		function(symbol) {
			return (symbol.srcFile == path);
		}
	);
	if (overviews.constructor === Array) return overviews[0];
}

/** Apply any effects of -a -A -p (etcetera) commandline options */
JSDOC.SymbolGroup.prototype.filterByOption = function(symbols, options) {
	symbols = symbols.filter(
		function(symbol) {
			if (symbol.isInner) symbol.isPrivate = "true";
			
			var keep = true;
			
			if (symbol.is("FILE")) keep = true;
			else if (!symbol.comment.isUserComment && !(options.a /*||options.A*/)) keep = false;
			//else if (/(^|[.#-])_/.test(symbol.alias) && !options.A) keep = false;
			else if (symbol.isPrivate && !options.p) keep = false;
			else if (symbol.isIgnored) keep = false;
			
			if (/#$/.test(symbol.alias)) keep = false; // we don't document prototype
			
			if (keep) return symbol
		}
	);
	return symbols;
}

JSDOC.SymbolGroup.prototype.addSymbol = function(symbol) {
	this.symbols.push(symbol);
	//TODO
}

JSDOC.SymbolGroup.prototype.getSymbol = function(alias) {
	return this.nameIndex.get(alias);
}

JSDOC.SymbolGroup.prototype.getSymbols = function() {
	return this.symbols;
}

JSDOC.SymbolGroup.prototype.getSymbolsByFile = function(filename) {
	return this.fileIndex.get(filename);
}

JSDOC.SymbolGroup.prototype.getSymbolsByClass = function(parentname) {
	return this.classIndex.get(parentname);
}

JSDOC.SymbolGroup.prototype.getSymbolsByType = function(type) {
	return this.typeIndex.get(type);
}

JSDOC.SymbolGroup.prototype.indexAll = function() {
	this.nameIndex.reset();
	this.typeIndex.reset();
	this.fileIndex.reset();
	
	// remove any symbols set to null
	this.symbols = this.symbols.filter(function($){return $ != null});
	
	for (var i = 0, l = this.symbols.length; i < l; i++) {
		this.indexSymbol(this.symbols[i]);
	}
}

JSDOC.SymbolGroup.prototype.indexSymbol = function(symbol) {
	// filename=>symbol[] map
	var srcFile = symbol.srcFile;
	if (srcFile) {
		if (!this.fileIndex.has(srcFile)) this.fileIndex.put(srcFile, []);
		this.fileIndex.get(srcFile).push(symbol);
	}
	
	// alias=>symbol map, presumes symbol.alias are unique
	if (symbol.alias) {
		this.nameIndex.put(symbol.alias, symbol);
	}

	// isa=>symbol[] map
	var kind = symbol.isa;
	if (!this.typeIndex.has(kind)) this.typeIndex.put(kind, []);
	this.typeIndex.get(kind).push(symbol);
}

JSDOC.SymbolGroup.prototype.addBuiltIn = function(isa) {
	if (this.getSymbol(isa)) return; // user defined one of these exists
	var docComment = new JSDOC.DocComment("/** BUILTIN */");
	var builtIn = new JSDOC.Symbol(isa, [], "CONSTRUCTOR", docComment, "");
	builtIn.isStatic = true;
	builtIn.srcFile = "";
	this.symbols.push(builtIn);
	this.indexSymbol(builtIn);
	return builtIn;
}

JSDOC.SymbolGroup.prototype.resolveMemberOf = function(symbol) {
	for (var i = 0, l = this.symbols.length; i < l; i++) {
		var symbol = this.symbols[i];
		if (symbol.alias == "_global_" || symbol.is("FILE")) continue;

// TODO can't this be resolved in init() of the Symbol script?		
		if (symbol.memberOf) {
			symbol.makeMemberOf(symbol.memberOf);	
		}
	}
}

JSDOC.SymbolGroup.prototype.resolveNames = function() {
	eachSymbol:
	for (var i = 0, l = this.symbols.length; i < l; i++) {
		var symbol = this.symbols[i];
		if (symbol.alias == "_global_" || symbol.is("FILE")) continue;
		var nameChain = new Chain(symbol.alias.split(/([#.-])/));

		// find the constructor closest in the chain to "this"
		for (var node = nameChain.last(); node !== null; node = nameChain.prev()) {
			var parentName = nameChain.joinLeft();
			if (parentName) {
				var parent = this.getSymbol(parentName);
				if (
					(parent && (parent.is("CONSTRUCTOR") || parent.isNamespace))
					||
					(symbol.addOn = JSDOC.Lang.isBuiltin(parentName))
				) {
					symbol.parentConstructor = parentName;
					if (symbol.addOn) {
						this.addBuiltIn(parentName);
					}
					break;
				}
			}
		}

		if (symbol.parentConstructor) {
			// constructor#blah#foo => constructor#foo
			var oldAlias = symbol.alias;
			symbol.alias =
				symbol.alias.replace(
					new RegExp("^"+RegExp.escapeMeta(symbol.parentConstructor)+'(\\.|#)[^+]+#'), 
					symbol.parentConstructor+"#"
				);
			this.nameIndex.rename(oldAlias, symbol.alias);

			var parts = symbol.alias.match(/^(.*[.#-])([^.#-]+)$/);
			if (parts) {
				// memberOf like: foo. or foo#
				if (!symbol.memberOf) {
					symbol.memberOf = parts[1];
					symbol.name = parts[2];
				}
				
				if (symbol.memberOf) {
					switch (symbol.memberOf.charAt(symbol.memberOf.length-1)) {
						case '#' :
							symbol.isStatic = false;
							symbol.isInner = false;
						break;
						case '.' :
							if (!symbol.isInner) {
								symbol.isStatic = true;
								symbol.isInner = false;
							}
						break;
						case '-' :
							symbol.isStatic = false;
							symbol.isInner = true;
						break;
					}
				}
				else {
					symbol.isStatic = true;
					symbol.isInner = false;
				}
			}
			
			// TODO trim trailing punctuation if present from memberOf might be more efficient as a regex
			if (symbol.memberOf.match(/[.#-]$/)) {
				symbol.memberOf = symbol.memberOf.substr(0, symbol.memberOf.length-1);
			}
			
			if (!this.classIndex[symbol.memberOf]) this.classIndex[symbol.memberOf] = [];
			this.classIndex[symbol.memberOf].push(symbol);
		}
		else { // no parent constructor
			symbol.alias =symbol.alias.replace(/^(_global_\.)?([^#]+)(\.[^#.]+)#(.+)$/, "$1$2.$4");
			if (RegExp.$2 && RegExp.$4) symbol.name = RegExp.$2+"."+RegExp.$4;

			if (!symbol.is("CONSTRUCTOR") && !symbol.isNamespace) {
				if (symbol.alias.indexOf("#") > -1) {
					LOG.warn("Documentation found for instance member: "+symbol.name+", but no documentation exists for parent class.");
					this.symbols[i] = null;
					continue eachSymbol;
				}
				
				symbol.memberOf = "_global_";
				symbol.alias = "_global_."+symbol.name;
			}
			
			symbol.isStatic = true;
			symbol.isInner = false;
			global.inherit(symbol);
		}
	}
}

JSDOC.SymbolGroup.prototype.resolveMembers = function() {
	for (var i = 0, l = this.symbols.length; i < l; i++) {
		var symbol = this.symbols[i];
		if (symbol.is("FILE")) continue;
		
		var members = this.classIndex[symbol.alias];
		if (members) {
			for(var ii = 0, il = members.length; ii < il; ii++) {
				var member = members[ii];
				if (member.is("FUNCTION")) {
					symbol.addMethod(member);
				}
				if (member.is("OBJECT")) {
					symbol.addProperty(member)
				}
			}
		}
	}
}

JSDOC.SymbolGroup.prototype.resolveMixins = function() {
	for (var i = 0, l = this.symbols.length; i < l; i++) {
		var symbol = this.symbols[i];
		if (symbol.alias == "_global_" || symbol.is("FILE")) continue;
		
		var mixins = symbol.inherits;
		for (var j = 0; j < mixins.length; j++) {
			var mixedin = this.symbols.filter(function($){return $.alias == mixins[j].alias});
			var mixinAs = mixins[j].as;

			if (symbol.hasMember(mixinAs)) continue;
			if (mixedin && mixedin[0]) {
				mixedin = mixedin[0];
			
				var clone = mixedin.clone();
				clone.name = mixinAs;
				clone.alias = mixinAs;
				this.symbols.push(clone);
			}
		}
	}
}

JSDOC.SymbolGroup.prototype.resolveAugments = function() {
	for (var i = 0, l = this.symbols.length; i < l; i++) {
		var symbol = this.symbols[i];
		if (symbol.alias == "_global_" || symbol.is("FILE")) continue;
		
		var augments = symbol.augments;
		for(var ii = 0, il = augments.length; ii < il; ii++) {
			var contributer = this.getSymbol(augments[ii]);
			if (contributer) {
				symbol.inheritsFrom.push(contributer.alias);
				if (!isUnique(symbol.inheritsFrom)) {
					LOG.warn("Can't resolve inherits: Circular reference: "+symbol.alias+" inherits from "+contributer.alias+" more than once.");
				}
				else {
					var cmethods = contributer.methods;
					var cproperties = contributer.properties;
					
					for (var ci = 0, cl = cmethods.length; ci < cl; ci++)
						symbol.inherit(cmethods[ci]);
					for (var ci = 0, cl = cproperties.length; ci < cl; ci++)
						symbol.inherit(cproperties[ci]);
				}
			}
		}
	}
}
