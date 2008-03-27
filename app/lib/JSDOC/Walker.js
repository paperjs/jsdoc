if (typeof JSDOC == "undefined") JSDOC = {};

JSDOC.Walker = function(/**TokenStream*/ts, opt) {
	if (arguments.length > 0) this.init(ts, opt);
}

JSDOC.Walker.prototype.init = function(ts, opt) {
	this.ts = ts;
	this.opt = opt;
	this.namescope = [];
	this.lastDoc = null;
	this.token = null;
	this.symbols = [];
	this.mode = "global";
}

JSDOC.Walker.prototype.walk = function() {
	while(this.token = this.ts.next()) {
		this.step();
	}
}

JSDOC.Walker.prototype.step = function() {

	if (this.token.is("JSDOC")) { // it's a doc comment
	
		var doc = new JSDOC.DocComment(this.token.data);
		
		if (doc.getTag("name").length > 0) { // it's a virtual symbol
			var virtualName = doc.getTag("name")[0].desc;
			if (!virtualName) throw "@name tag requires a value.";
			
			var virtual = new JSDOC.Symbol(virtualName, [], "VIRTUAL", doc);
			virtual.isVirtual = true;
			this.symbols.push(virtual);
			
			this.lastDoc = null;
			return true;
		}
		else if (doc.meta) { // it's a meta doclet
			if (doc.meta == "@+") JSDOC.DocComment.shared = doc.src;
			else if (doc.meta == "@-") JSDOC.DocComment.shared = "";
			else throw "Unrecognized meta comment: "+doc.meta;
			
			this.lastDoc = null;
			return true;
		}
		else if (doc.getTag("overview").length > 0) { // it's a file overview
			this.symbols.push(new JSDOC.Symbol("", [], "FILE", doc));
			
			this.lastDoc = null;
			return true;
		}
		else if (doc.getTag("lends").length > 0) { // it's a new namescope
			// todo @lends changes namescope
			this.lastDoc = null;
			return true;
		}
		else {
			this.lastDoc = doc;
			return false;
		}
	}
	else if (!this.opt.ignoreCode) { // it's code
		
		if (this.token.is("NAME")) {
			var name = this.token.data;
			
			// like function foo() {}
			if (this.ts.look(-1).is("FUNCTION") && this.ts.look(1).is("LEFT_PAREN")) {
				print("~~ function name is  "+name);
			}
			// like foo = function() {}
			else if (this.ts.look(1).is("ASSIGN") && this.ts.look(2).is("FUNCTION")) {
				print("~~ function name is  "+name);
			}
			// like foo: function() {}
			else if (this.ts.look(1).is("COLON") && this.ts.look(2).is("FUNCTION")) {
				print("~~ function name is  "+name);
			}
			else {
				print("~~ name is  "+name);
			}
		}
	}
	return true;
}
