if (typeof JSDOC == "undefined") JSDOC = {};

JSDOC.Walker = function(/**JSDOC.TokenStream*/ts) {
	this.init();
	if (typeof ts != "undefined") {
		this.walk(ts);
	}
}

JSDOC.Walker.prototype.init = function() {
	this.ts = null;
	this.namescope = [new JSDOC.Symbol("_global_", [], "GLOBAL", new JSDOC.DocComment(""))];
	this.namescope.last = function(n){ if (!n) n = 0; return this[this.length-(1+n)] || "" };
	this.lastDoc = null;
	this.token = null;
}

JSDOC.Walker.prototype.walk = function(/**JSDOC.TokenStream*/ts) {
	this.ts = ts;
	while (this.token = this.ts.look()) {
		if (this.token.popNamescope) {
			/*debug*///print("~~ }");
			var symbol = this.namescope.pop();
			if (symbol.is("FUNCTION")) {
				if (this.ts.look(1).is("LEFT_PAREN") && symbol.comment.getTag("function").length == 0) {
					symbol.isa = "OBJECT";
				}
			}
		}
		this.step();
		if (!this.ts.next()) break;
	}
}

JSDOC.Walker.prototype.step = function() {
	if (this.token.is("JSDOC")) { // it's a doc comment
	
		var doc = new JSDOC.DocComment(this.token.data);
		
		if (doc.getTag("lends").length > 0) { // it's a new namescope
			var lends = doc.getTag("lends")[0];

			var name = lends.desc
			if (!name) throw "@lends tag requires a value.";
			
			var symbol = new JSDOC.Symbol(name, [], "OBJECT", doc);
			
			this.namescope.push(symbol);
			//JSDOC.Parser.addSymbol(new JSDOC.Symbol(name, [], "OBJECT", doc));
			/*debug*///print("~~ doc is  "+doc);
			/*debug*///print("~~ oblit name is  "+name);
			/*debug*///print("~~ {");
			var matching = this.ts.getMatchingToken("LEFT_CURLY");
			matching.popNamescope = name;
			
			this.lastDoc = null;
			return true;
		}
		else if (doc.getTag("name").length > 0) { // it's a virtual symbol
			var virtualName = doc.getTag("name")[0].desc;
			if (!virtualName) throw "@name tag requires a value.";
			
			var symbol = new JSDOC.Symbol(virtualName, [], "VIRTUAL", doc);
			symbol.isVirtual = true;
			
			JSDOC.Parser.addSymbol(symbol);
			
			this.lastDoc = null;
			return true;
		}
		else if (doc.meta) { // it's a meta doclet
			if (doc.meta == "@+") JSDOC.DocComment.shared = doc.src;
			else if (doc.meta == "@-") JSDOC.DocComment.shared = "";
			else if (doc.meta == "nocode+") JSDOC.Parser.conf.ignoreCode = true;
			else if (doc.meta == "nocode-") JSDOC.Parser.conf.ignoreCode = JSDOC.opt.n;
			else throw "Unrecognized meta comment: "+doc.meta;
			
			this.lastDoc = null;
			return true;
		}
		else if (doc.getTag("overview").length > 0) { // it's a file overview
			symbol = new JSDOC.Symbol("", [], "FILE", doc);
			

			JSDOC.Parser.addSymbol(symbol);
			
			this.lastDoc = null;
			return true;
		}
		else {
			this.lastDoc = doc;
			return false;
		}
	}
	else if (!JSDOC.Parser.conf.ignoreCode) { // it's code
		if (this.token.is("NAME")) {
			var symbol;
			var name = this.token.data;
			var doc = null;
			var params = [];
			
			// it's inside an anonymous object
			if (this.ts.look(1).is("COLON") && this.ts.look(-1).is("LEFT_CURLY") && !(this.ts.look(-2).is("JSDOC") || this.ts.look(-2).is("ASSIGN") || this.ts.look(-2).is("COLON"))) {
				name = "$anonymous";
				name = this.namescope.last().alias+(this.namescope.length?"-":"")+name
				
				params = [];
				
				symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);

				JSDOC.Parser.addSymbol(symbol);
				
				this.namescope.push(symbol);
				
				/*debug*///print("~~ function name is  "+name+" "+params);
				/*debug*///print("~~ {");
				var matching = this.ts.getMatchingToken(null, "RIGHT_CURLY");
				matching.popNamescope = name;
			}
			// function foo() {}
			else if (this.ts.look(-1).is("FUNCTION") && this.ts.look(1).is("LEFT_PAREN")) {
				var isInner;
				if (this.namescope.length) {
					name = this.namescope.last().alias+"-"+name;
					if (!this.namescope.last().is("GLOBAL")) isInner = true;
				}
				else {
					name = this.namescope.last().alias+""+name;
				}
				
				if (this.lastDoc) doc = this.lastDoc;
				params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
				
				symbol = new JSDOC.Symbol(name, params, "FUNCTION", doc);
				if (isInner) symbol.isInner = true;
				
			
				JSDOC.Parser.addSymbol(symbol);
				
				this.namescope.push(symbol);
				/*debug*///print("~~ doc is  "+doc);
				/*debug*///print("~~ function name is  "+name+" "+params);
				/*debug*///print("~~ {");
				var matching = this.ts.getMatchingToken("LEFT_CURLY");
				matching.popNamescope = name;
			}
			// foo = function() {}
			else if (this.ts.look(1).is("ASSIGN") && this.ts.look(2).is("FUNCTION")) {
				var isInner;
				if (this.ts.look(-1).is("VAR")) {
					name = this.namescope.last().alias+(this.namescope.length?"-":"")+name
					if (!this.namescope.last().is("GLOBAL")) isInner = true;
				}
				else if (name.indexOf("this.") == 0) {
					name = this.resolveThis(name);
				}
				
				if (this.lastDoc) doc = this.lastDoc;
				params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
				
				symbol = new JSDOC.Symbol(name, params, "FUNCTION", doc);
				if (isInner) symbol.isInner = true;
				
			
				JSDOC.Parser.addSymbol(symbol);
				
				this.namescope.push(symbol);
				/*debug*///print("~~ doc is  "+doc);
				/*debug*///print("~~ function name is  "+name+" "+params);
				/*debug*///print("~~ {");
				var matching = this.ts.getMatchingToken("LEFT_CURLY");
				matching.popNamescope = name;
			}
			// foo = new function() {}
			else if (this.ts.look(1).is("ASSIGN") && this.ts.look(2).is("NEW") && this.ts.look(3).is("FUNCTION")) {
				var isInner;
				if (this.ts.look(-1).is("VAR")) {
					name = this.namescope.last().alias+(this.namescope.length?"-":"")+name
					if (!this.namescope.last().is("GLOBAL")) isInner = true;
				}
				else if (name.indexOf("this.") == 0) {
					name = this.resolveThis(name);
				}
				
				if (this.lastDoc) doc = this.lastDoc;
				params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
				
				symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
				if (isInner) symbol.isInner = true;
				
			
				JSDOC.Parser.addSymbol(symbol);
				
				symbol.scopeType = "INSTANCE";
				this.namescope.push(symbol);
				/*debug*///print("~~ doc is  "+doc);
				/*debug*///print("~~ function name is  "+name+" "+params);
				/*debug*///print("~~ {");
				var matching = this.ts.getMatchingToken("LEFT_CURLY");
				matching.popNamescope = name;
			}
			// foo: function() {}
			else if (this.ts.look(1).is("COLON") && this.ts.look(2).is("FUNCTION")) {
				name = (this.namescope.last().alias+"."+name).replace("#.", "#");
				
				if (this.lastDoc) doc = this.lastDoc;
				params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
				
				if (doc && doc.getTag("constructs").length) {
					name = name.replace(/\.prototype(\.|$)/, "#");
					name = name.match(/(^[^#]+)/)[0];

					symbol = new JSDOC.Symbol(name, params, "CONSTRUCTOR", doc);
				}
				else if (this.namescope.length) {
					symbol = new JSDOC.Symbol(name, params, "FUNCTION", doc);
				}
				
				
				JSDOC.Parser.addSymbol(symbol);
				
				this.namescope.push(symbol);
				/*debug*///print("~~ doc is  "+doc);
				/*debug*///print("~~ function name is  "+name+" "+params);
				/*debug*///print("~~ {");
				var matching = this.ts.getMatchingToken("LEFT_CURLY");
				matching.popNamescope = name;
			}
			// foo = {}
			else if (this.ts.look(1).is("ASSIGN") && this.ts.look(2).is("LEFT_CURLY")) {
				var isInner;
				if (this.ts.look(-1).is("VAR")) {
					name = this.namescope.last().alias+(this.namescope.length?"-":"")+name
					if (!this.namescope.last().is("GLOBAL")) isInner = true;
				}
				else if (name.indexOf("this.") == 0) {
					name = this.resolveThis(name); //this.namescope.last()+(this.namescope.length?".":"")+name
				}
				
				if (this.lastDoc) doc = this.lastDoc;
				
				symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
				if (isInner) symbol.isInner = true;
				
			
				if (doc) JSDOC.Parser.addSymbol(symbol);

				this.namescope.push(symbol);
				
				/*debug*///print("~~ doc is  "+doc);
				/*debug*///print("~~ oblit name is  "+name);
				/*debug*///print("~~ {");
				var matching = this.ts.getMatchingToken("LEFT_CURLY");
				matching.popNamescope = name;
			}
			// foo = x
			else if (this.ts.look(1).is("ASSIGN")) {
				if (this.lastDoc) doc = this.lastDoc;
				if (!doc) return false;
				var isInner;
				if (this.ts.look(-1).is("VAR")) {
//TODO this.namescope.length will always be > 0 because of global object, so why check?
					name = this.namescope.last().alias+"-"+name
					if (!this.namescope.last().is("GLOBAL")) isInner = true;
				}
				else if (name.indexOf("this.") == 0) {
					name = this.resolveThis(name);
				}
				
				
				symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
				if (isInner) symbol.isInner = true;
				
			
				if (doc) JSDOC.Parser.addSymbol(symbol);

				/*debug*///print("~~ doc is  "+doc);
				/*debug*///print("~~ object name is  "+name);
			}
			// foo: {}
			else if (this.ts.look(1).is("COLON") && this.ts.look(2).is("LEFT_CURLY")) {
				name = (this.namescope.last().alias+"."+name).replace("#.", "#");
				
				if (this.lastDoc) doc = this.lastDoc;
				
				symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
				
			
				if (doc) JSDOC.Parser.addSymbol(symbol);
				
				this.namescope.push(symbol);
				
				/*debug*///print("~~ doc is  "+doc);
				/*debug*///print("~~ oblit name is  "+name);
				/*debug*///print("~~ {");
				var matching = this.ts.getMatchingToken("LEFT_CURLY");
				matching.popNamescope = name;
			}
			// foo: x
			else if (this.ts.look(1).is("COLON")) {
				name = (this.namescope.last().alias+"."+name).replace("#.", "#");;
				
				if (this.lastDoc) doc = this.lastDoc;
				
				symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
				
			
				//if (this.namescope.length) {
					if (doc) JSDOC.Parser.addSymbol(symbol);
				//}
				/*debug*///print("~~ doc is  "+doc);
				/*debug*///print("~~ object name is  "+name);
			}
			this.lastDoc = null;
		}
		else if (this.token.is("FUNCTION")) { // it's an anonymous function
			if (
				(!this.ts.look(-1).is("COLON") || !this.ts.look(-1).is("ASSIGN"))
				&& !this.ts.look(1).is("NAME")
			) {
				name = "$anonymous";
				name = this.namescope.last().alias+(this.namescope.length?"-":"")+name
				
				
				if (this.lastDoc) doc = this.lastDoc;
				params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
				
				symbol = new JSDOC.Symbol(name, params, "FUNCTION", doc);
				
			
				JSDOC.Parser.addSymbol(symbol);
				
				this.namescope.push(symbol);
				
				/*debug*///print("~~ function name is  "+name+" "+params);
				/*debug*///print("~~ {");
				var matching = this.ts.getMatchingToken("LEFT_CURLY");
				matching.popNamescope = name;
			}
		}
	}
	return true;
}

/**
	Resolves what "this." means when it appears in a name.
	@param name The name that starts with "this.".
	@returns The name with "this." resolved.
 */
JSDOC.Walker.prototype.resolveThis = function(name) {
	name.match(/^this\.(.+)$/)
	var nameFragment = RegExp.$1;
	if (!nameFragment) return name;
	
	var symbol = this.namescope.last();
	var scopeType = symbol.scopeType || symbol.isa;

	// if we are in a constructor function, `this` means the instance
	if (scopeType == "CONSTRUCTOR") {
		name = symbol.alias+"#"+nameFragment;
	}
	
	// if we are in an anonymous constructor function, `this` means the instance
	else if (scopeType == "INSTANCE") {
		name = symbol.alias+"."+nameFragment;
	}
	
	// if we are in a function, `this` means the container (possibly the global)
	else if (scopeType == "FUNCTION") {
		var parent = symbol.alias;
		// in a method of a prototype, so `this` means the constructor
		if (parent.match(/(^.*)[#.-][^#.-]+/)) {
			parent = RegExp.$1;
//print("~~ parent.scopeType is "+parent.scopeType);
			name = parent+(symbol.is("CONSTRUCTOR")?"#":".")+nameFragment;
		}
		else {
			parent = this.namescope.last(1);
			name = parent.alias+(parent.is("CONSTRUCTOR")?"#":".")+nameFragment;
		}
	}
	// otherwise it means the global
	else {
		name = nameFragment;
	}
	/*debug*///print("~~ resolved name is "+name);	
	return name;
}

JSDOC.Walker.onParamList = function(/**Array*/paramTokens) {
	var params = [];
	for (var i = 0, l = paramTokens.length; i < l; i++) {
		if (paramTokens[i].is("JSDOC")) {
			var paramType = paramTokens[i].data.replace(/(^\/\*\* *| *\*\/$)/g, "");
			
			if (paramTokens[i+1] && paramTokens[i+1].is("NAME")) {
				i++;
				params.push({type: paramType, name: paramTokens[i].data});
			}
		}
		else if (paramTokens[i].is("NAME")) {
			params.push({name: paramTokens[i].data});
		}
	}
	return params;
}
