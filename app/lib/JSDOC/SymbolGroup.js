var global;
/**
	@constructor
*/
JSDOC.SymbolGroup = function(symbols) {
	this.symbols = this.filterByOption(symbols, JSDOC.opt);
	
	// generate a dummy class to hold any symbols with no parent class
	global = new JSDOC.Symbol("_global_", [], "CONSTRUCTOR", new JSDOC.DocComment("/** BUILTIN */"));
	global._properties['isNamespace'] = true;
	global.srcFile = "";
	
	this.symbols.push(global);
	
	this.fileIndex = new Hash();
	this.classIndex = {};
	this.nameIndex = new Hash();
	this.typeIndex = new Hash();
	
	this.indexAll();
	this.resolveMemberOf();
	this.indexAll();
	this.resolveNames();
	this.indexAll(this.symbols);
	this.resolveMembers();
	this.resolveInherits();
}

JSDOC.SymbolGroup.prototype.getOverview = function(path) {
	var overviews = this.getSymbolsByType().filter(
		function(symbol) {
			return (symbol.srcfile == path);
		}
	);
	if (overviews.constructor === Array) return overviews[0];
}

/** Apply any effects of -a -A -p (etcetera) commandline options */
JSDOC.SymbolGroup.prototype.filterByOption = function(symbols, options) {			 
	symbols = symbols.filter(
		function(symbol) {
			if (symbol.isInner) symbol.isPrivate = true;
			
			var keep = true;
			
			if (symbol.isa == "FILE") keep = true;
			else if (symbol.desc == "undocumented" && !(options.a ||options.A)) keep = false;
			else if (/(^|[.#-])_/.test(symbol.alias) && !options.A) keep = false;
			else if (symbol.isPrivate && !options.p) keep = false;
			else if (symbol.doc.getTag("ignore").length > 0) keep = false;
			
			if (/#$/.test(symbol.alias)) keep = false; // we don't document prototype
			
			if (keep) return symbol
		}
	);
	return symbols;
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
	var srcfile = symbol.srcfile;
	if (srcfile) {
		if (!this.fileIndex.has(srcfile)) this.fileIndex.put(srcfile, []);
		this.fileIndex.get(srcfile).push(symbol);
	}
	
	// alias=>symbol map, presumes symbol.alias are unique
	if (symbol.alias) {
		this.nameIndex.put(symbol.alias, symbol);
	}

	// isa=>symbol[] map
	if (symbol.isa) {
		var type = symbol.isa;
		if (!this.typeIndex.has(type)) this.typeIndex.put(type, []);
		this.typeIndex.get(type).push(symbol);
	}
}

JSDOC.SymbolGroup.prototype.addBuiltIn = function(isa) {
	if (this.getSymbol(isa)) return; // user defined one of these exists
	var docComment = new JSDOC.DocComment("/** BUILTIN */");
	var builtIn = new JSDOC.Symbol(isa, [], "CONSTRUCTOR", docComment, "");
	builtIn.isStatic = true;
	builtIn.srcfile = "";
	this.symbols.push(builtIn);
	this.indexSymbol(builtIn);
	return builtIn;
}

JSDOC.SymbolGroup.prototype.resolveMemberOf = function(symbol) {
	for (var i = 0, l = this.symbols.length; i < l; i++) {
		var symbol = this.symbols[i];
		if (symbol.alias == "_global_" || symbol.is("FILE")) continue;
		
		if (symbol.memberof) {
			symbol.memberof = symbol.memberof.replace(/\.prototype(\.|$)/g, "#");
			
			if (symbol.memberof.charAt(symbol.memberof.length-1) == "#") {
				symbol.alias = symbol.memberof+symbol.alias;
			}
			else symbol.alias = symbol.memberof+"."+symbol.alias;
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
		symbol.parentConstructor = "";
		for (var node = nameChain.last(); node !== null; node = nameChain.prev()) {
			var parentName = nameChain.joinLeft();
			if (parentName) {
				var parent = this.getSymbol(parentName);
				if (
					(parent && parent.isa == "CONSTRUCTOR")
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
				symbol.memberof = parts[1];
				symbol.name = parts[2];

				if (symbol.memberof) {
					switch (symbol.memberof.charAt(symbol.memberof.length-1)) {
						case '#' :
							symbol.isStatic = false;
							symbol.isInner = false;
						break;
						case '.' :
							symbol.isStatic = true;
							symbol.isInner = false;
						break;
						case '-' :
							symbol.isStatic = true;
							symbol.isInner = true;
						break;
					}
					symbol.memberof = symbol.memberof.substr(0, symbol.memberof.length-1);
				}
				else {
					symbol.isStatic = true;
					symbol.isInner = false;
				}
			}
			if (!this.classIndex[symbol.memberof]) this.classIndex[symbol.memberof] = [];
			this.classIndex[symbol.memberof].push(symbol);
		}
		else { // no parent constructor
			symbol.alias = symbol.alias.replace(/^(_global_#)?([^#]+)(\.[^#.]+)#(.+)$/, "$1$2.$4");
			if (RegExp.$2 && RegExp.$4) symbol.name = RegExp.$2+"."+RegExp.$4;

			if (!symbol.is("CONSTRUCTOR")) {
				if (symbol.alias.indexOf("#") > -1) {
					print("WARNING: Documentation found for instance member: "+this.symbols[i].name+", but no documentation exists for parent class.");
					this.symbols[i] = null;
					continue eachSymbol;
				}
				
				symbol.memberof = "_global_";
				symbol.alias = "_global_#"+symbol.name;
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
				if (member.isa == "FUNCTION") {
					symbol.methods.push(member);
				}
				if (member.isa == "OBJECT") {
					symbol.properties.push(member);
				}
			}
		}
	}
}

JSDOC.SymbolGroup.prototype.resolveInherits = function() {
	for (var i = 0, l = this.symbols.length; i < l; i++) {
		var symbol = this.symbols[i];
		if (symbol.alias == "_global_" || symbol.is("FILE")) continue;
		
		// add in inherited members
		for(var ii = 0, il = symbol.inherits.length; ii < il; ii++) {
			symbol.inherits[ii] = symbol.inherits[ii].replace(/\.prototype(\.|$)/g, "#");
			var inheritedMember = this.getSymbol(symbol.inherits[ii]);
			if (inheritedMember) {
				symbol.inherit(inheritedMember);
				symbol.inheritsFrom.push(inheritedMember.memberof);
			}
		}
		
		for(var ii = 0, il = symbol.augments.length; ii < il; ii++) {
			var contributer = this.getSymbol(symbol.augments[ii]);
			if (contributer) {
				symbol.inheritsFrom.push(contributer.alias);
				if (!isUnique(symbol.inheritsFrom)) {
					LOG.warn("Can't resolve inherits: Circular reference: "+symbol.alias+" inherits from "+contributer.alias+" more than once.");
				}
				else {
					for (var ci = 0, cl = contributer.methods.length; ci < cl; ci++)
						symbol.inherit(contributer.methods[ci]);
					for (var ci = 0, cl = contributer.properties.length; ci < cl; ci++)
						symbol.inherit(contributer.properties[ci]);
				}
			}
		}
	}
}