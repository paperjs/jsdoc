if (typeof JSDOC == "undefined") JSDOC = {};

JSDOC.SymbolSet = function() {
	this.init();
}

JSDOC.SymbolSet.prototype.init = function() {
	this._index = {};
}

JSDOC.SymbolSet.prototype.keys = function() {
	var found = [];
	for (var p in this._index) {
		found.push(p);
	}
	return found;
}

JSDOC.SymbolSet.prototype.hasSymbol = function(alias) {
	return (this._index[alias])? true : false;
}

JSDOC.SymbolSet.prototype.addSymbol = function(symbol) {
	if (this.hasSymbol(symbol.alias)) {
		LOG.warn("Overwriting symbol documentation for: "+symbol.alias + ".");
	}
	this._index[symbol.alias] = symbol;
}


JSDOC.SymbolSet.prototype.getSymbol = function(alias) {
	return this._index[alias];
}

JSDOC.SymbolSet.prototype.toArray = function() {
	var found = [];
	for (var p in this._index) {
		found.push(this._index[p]);
	}
	return found;
}

JSDOC.SymbolSet.prototype.deleteSymbol = function(alias) {
	if (!this._index[alias]) { return; }
	delete this._index[alias];
}

JSDOC.SymbolSet.prototype.renameSymbol = function(oldName, newName) {
	this._index[newName] = this._index[oldName];
	delete this._index[oldName];
	this._index[newName].alias = newName;
	return newName;
}

JSDOC.SymbolSet.prototype.relate = function() {
	this.resolveBorrows();
	this.resolveMemberOf();
	this.resolveAugments();
}

JSDOC.SymbolSet.prototype.resolveBorrows = function() {
	for (p in this._index) {
		var symbol = this._index[p];
		if (symbol.is("FILE") || symbol.is("GLOBAL")) continue;
		
		var borrows = symbol.inherits;
		for (var i = 0; i < borrows.length; i++) {
			var borrowed = this.getSymbol(borrows[i].alias);
			if (!borrowed) {
				LOG.warn("Can't borrow undocumented "+borrows[i].alias+".");
				continue;
			}
			
			var borrowAsName = borrows[i].as;
			var borrowAsAlias = borrowAsName;
			if (!borrowAsName) {
				LOG.warn("Malformed @borrow, 'as' is required.");
				continue;
			}
			
			if (borrowAsName.length > symbol.alias.length && borrowAsName.indexOf(symbol.alias) == 0) {
				borrowAsName = borrowAsName.replace(borrowed.alias, "")
			}
			else {
				var joiner = "";
				if (borrowAsName.charAt(0) != "#") joiner = ".";
				borrowAsAlias = borrowed.alias + joiner + borrowAsName;
			}
			
			borrowAsName = borrowAsName.replace(/^[#.]/, "");
					
			if (this.hasSymbol(borrowAsAlias)) continue;

			var clone = borrowed.clone();
			clone.name = borrowAsName;
			clone.alias = borrowAsAlias;
			this.addSymbol(clone);
		}
	}
}

JSDOC.SymbolSet.prototype.resolveMemberOf = function() {
	var keys = this.keys();
	for (var i = 0; i < keys.length; i++) {
		var k = keys[i];
		if (this._index[k].is("FILE") || this._index[k].is("GLOBAL")) continue;
		
		// the memberOf value was provided in the @memberOf tag
		else if (this._index[k].memberOf) {
			var parts = this._index[k].alias.match(new RegExp("^("+this._index[k].memberOf+"[.#-])(.+)$"));
			
			// like foo.bar is a memberOf foo
			if (parts) {
				this._index[k].memberOf = parts[1];
				this._index[k].name = parts[2];
			}
			// like bar is a memberOf foo
			else {
				var joiner = this._index[k].memberOf.charAt(this._index[k].memberOf.length-1);
				if (!/[.#-]/.test(joiner)) this._index[k].memberOf += ".";
				
				k = this.renameSymbol(k, this._index[k].memberOf + this._index[k].name);
			}
		}
		// the memberOf must be calculated
		else {
			var parts = this._index[k].alias.match(/^(.*[.#-])([^.#-]+)$/);
			if (parts) {
				this._index[k].memberOf = parts[1];
				this._index[k].name = parts[2];				
			}
		}

		// set isStatic, isInner
		if (this._index[k].memberOf) {
			switch (this._index[k].memberOf.charAt(this._index[k].memberOf.length-1)) {
				case '#' :
					this._index[k].isStatic = false;
					this._index[k].isInner = false;
				break;
				case '.' :
					this._index[k].isStatic = true;
					this._index[k].isInner = false;
				break;
				case '-' :
					this._index[k].isStatic = false;
					this._index[k].isInner = true;
				break;
			}
		}
		
		// unowned methods and fields belong to the global object
		if (!this._index[k].is("CONSTRUCTOR") && !this._index[k].isNamespace && this._index[k].memberOf == "") {
			this._index[k].memberOf = "_global_";
		}
		
		// clean up
		if (this._index[k].memberOf.match(/[.#-]$/)) {
			this._index[k].memberOf = this._index[k].memberOf.substr(0, this._index[k].memberOf.length-1);
		}
		
		// add to parent's methods or properties list
		if (this._index[k].memberOf) {
			var container = this.getSymbol(this._index[k].memberOf);
			if (!container) {
				if (JSDOC.Lang.isBuiltin(this._index[k].memberOf)) container = JSDOC.Parser.addBuiltin(this._index[k].memberOf);
				else {
					LOG.warn("Can't document "+this._index[k].name +" as a member of undocumented symbol "+this._index[k].memberOf+".");
				}
			}
			
			if (container) container.addMember(this._index[k]);
		}
	}
}



JSDOC.SymbolSet.prototype.resolveAugments = function() {
	var keys = this.keys();
	for (var i = 0; i < keys.length; i++) {
		var k = keys[i];
		var symbol = this._index[k];
		if (symbol.alias == "_global_" || symbol.is("FILE")) continue;
		
		var augments = symbol.augments;
		for(var ii = 0, il = augments.length; ii < il; ii++) {
			var contributer = this.getSymbol(augments[ii]);
			if (contributer) {
				symbol.inheritsFrom.push(contributer.alias);
				if (!isUnique(symbol.inheritsFrom)) {
					LOG.warn("Can't resolve augments: Circular reference: "+symbol.alias+" inherits from "+contributer.alias+" more than once.");
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
			else LOG.warn("Can't augment contributer: "+augments[ii]+", not found.");

		}
	}
}

