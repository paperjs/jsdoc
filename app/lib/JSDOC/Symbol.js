/**
	@constructor
*/
JSDOC.Symbol = function(name, params, isa, comment) {
	
	comment.src = comment.src;
	
	this.alias = this.name = name
	
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onSymbol", this);
	}
	this.name = this.alias = this.alias.replace(/\.prototype\.?/g, '#');
	this.params = (params || []);
	
	for (var i = 0; i < this.params.length; i++) {
		this.params[i] = new JSDOC.DocTag("param"+((this.params[i].type)?" {"+this.params[i].type+"}":"")+" "+this.params[i].name);
	}
	
	this.isa = (isa || "OBJECT");
	this.type = "";
	
	this.desc = "";
	this.classDesc = "";
	this.memberof = "";
	this.isStatic = false;
	this.since = "";
	this.version = "";
	this.deprecated = "";
	this.augments = [];
	this.inherits = [];
	this.inheritsFrom = [];
	this.properties = [];
	this.methods = [];
	//this.file = {};
	this.requires = [];
	this.returns = [];
	this.exceptions = [];
	this.events = [];
	this.doc = comment;
	this.see = [];
	this.srcfile = JSDOC.Symbol.srcfile;

	// move certain data out of the tags and into the Symbol
	var overviews;
	if ((overviews = this.doc.getTag("overview")) && overviews.length) {
		var libraries;
		if ((libraries = this.doc.getTag("name")) && libraries.length) {
			this.name = libraries[0].desc;
		}
		else {
			this.name = JSDOC.Util.fileName(JSDOC.Symbol.srcfile)
		}
		
		this.desc = overviews[0].desc;
	}
	else {
		var since;
		if ((since = this.doc.getTag("since")) && since.length) {
			this.since = since[0].desc;
		}
		
		var version;
		if ((version = this.doc.getTag("version")) && version.length) {
			this.version = version[0].desc;
		}
		
		var deprecated;
		if ((deprecated = this.doc.getTag("deprecated")) && deprecated.length) {
			this.deprecated = deprecated[0];
		}
		
		var see;
		if ((see = this.doc.getTag("see")) && version.length) {
			this.see = see;
		}
		
		var descs;
		if ((descs = this.doc.getTag("desc")) && descs.length) {
			this.desc = descs.join("\n"); // multiple descriptions are concatenated into one
		}
		
		var ns;
		if ((ns = this.doc.getTag("namespace")) && ns.length) {
			this.classDesc += this.desc; // desc can't apply to the constructor as there is none.
			this.classDesc += ns[0].desc;
			this.isa = "CONSTRUCTOR";
			this.isNamespace = true;
		}
		
		var params;
		if ((params = this.doc.getTag("param")) && params.length) { // user defined params override those defined by parser
			if (this.params.length == 0) {
				this.params = params;
			}
			else {
				// merge parser-defined params with user-defined params
				for (var i = 0, l = this.params.length; i < l; i++) {
					var thisParam = this.params[i];
					var userParams = params.filter(function($){return $.name == thisParam.name});
					
					if (userParams && userParams.length) {
						if (!userParams[0].type && thisParam.type) userParams[0].type = thisParam.type;
						this.params[i] = userParams[0];
					}
				}
			}
		}
		
		var constructors;
		if ((constructors = this.doc.getTag("constructor")) && constructors.length) {
			this.isa = "CONSTRUCTOR";
		}
		
		var classes;
		if ((classes = this.doc.getTag("class")) && classes.length) {
			if (this.doc.getTag("static").length > 0) this.isStatic = true;
			this.isa = "CONSTRUCTOR"; // a class tag implies a conctuctor doclet
			
			this.classDesc += classes[0].desc; // multiple class tags are concatenated
		}
		
		var functions;
		if ((functions = this.doc.getTag("function")) && functions.length) {
			this.isa = "FUNCTION";
		}
		
		var events;
		if ((events = this.doc.getTag("event")) && events.length) {
			this.isa = "FUNCTION";
			this.isEvent = true;
		}
		
		var methods;
		if ((functions = this.doc.getTag("method")) && functions.length) {
			this.isa = "FUNCTION";
		}
		
		var names;
		if ((names = this.doc.getTag("name")) && names.length) {
			this.name = names[0].desc;
		}
		
		var properties;
		if ((properties = this.doc.getTag("property")) && properties.length) {
			for (var i = 0; i < properties.length; i++) {
				properties[i].alias = this.alias+"."+properties[i].name;
				this.properties.push(properties[i]);
			}
		}
		
		var returns;
		if ((returns = this.doc.getTag("return")) && returns.length) {
			for (var i = 0; i < returns.length; i++) {
				this.returns.push(returns[i]);
			}
		}
		
		var exceptions;
		if ((exceptions = this.doc.getTag("throws")) && exceptions.length) {
			for (var i = 0; i < exceptions.length; i++) {
				this.exceptions.push(exceptions[i]);
			}
		}
		
		var requires;
		if ((requires = this.doc.getTag("requires")) && requires.length) {
			for (var i = 0; i < requires.length; i++) {
				this.requires.push(requires[i]);
			}
		}
		
		if (this.is("VIRTUAL")) this.isa = "OBJECT";
		
		var types;
		if ((types = this.doc.getTag("type")) && types.length) {
			this.type = (types[0].desc || ""); // multiple type tags are ignored
		}
		
		if (this.doc.getTag("static").length > 0) {
			this.isStatic = true;
		}
		
		if (this.doc.getTag("private").length > 0) {
			this.isPrivate = true;
		}
		
		var inherits;
		if ((inherits = this.doc.getTag("inherits")) && inherits.length) {
			for (var i = 0; i < inherits.length; i++) {
				this.inherits.push(inherits[i].desc);
			}
		}
		
		var augments;
		if ((augments = this.doc.getTag("augments")) && augments.length) {
			for (var i = 0; i < augments.length; i++) {
				this.augments.push(augments[i].desc);
			}
		}
		
		var defaults;
		if ((defaults = this.doc.getTag("default")) && defaults.length) {
			if (this.is("OBJECT")) {
				this.defaultValue = defaults[0];
			}
		}
		
		var memberofs;
		if ((memberofs = this.doc.getTag("memberof")) && memberofs.length) {
			this.memberof = memberofs[0].desc;
		}
		
		if (defined(JSDOC.PluginManager)) {
			JSDOC.PluginManager.run("onSymbol", this);
		}
	}
}

JSDOC.Symbol.prototype.setDescription = function(desc) {
	this.desc = desc;
}
JSDOC.Symbol.prototype.getDescription = function() {
	return this.desc;
}

JSDOC.Symbol.prototype.is = function(what) {
	return this.isa === what;
}

JSDOC.Symbol.prototype.hasTag = function(tagTitle) {
	for (var i = 0, l = this.doc.tags.length; i < l; i++) {
		if (this.doc.tags[i].title == tagTitle)
			return true;
	}
	return false;
}

/** Generate a comma separated list of the parameters. */
JSDOC.Symbol.prototype.signature = function() {
	var result = [];
	for (var i = 0; i < this.params.length; i++) {
		if (this.params[i].name.indexOf(".") == -1) // config information does not appear in the signature
			result.push(this.params[i].name);
	}
	return result.join(", ");
}

JSDOC.Symbol.prototype.inherit = function(symbol) {
	if (!this.hasMember(symbol.name)) {
		if (symbol.isa == "FUNCTION" && !symbol.isInner)
			this.methods.push(symbol);
		else if (symbol.isa == "OBJECT")
			this.properties.push(symbol);
	}
}

JSDOC.Symbol.prototype.getMethods = function() {
	return this.methods.filter(
		function(method) {
			if (!method.isEvent) return method;
		}
	);
}

JSDOC.Symbol.prototype.getProperties = function() {
	return this.properties;
}

JSDOC.Symbol.prototype.getEvents = function() {
	return this.methods.filter(
		function(method) {
			if (method.isEvent) return method;
		}
	);
}

JSDOC.Symbol.prototype.hasMember = function(name) {
	return (this.hasMethod(name) || this.hasProperty(name));
}

JSDOC.Symbol.prototype.hasMethod = function(name) {
	for (var i = 0; i < this.methods.length; i++) {
		if (this.methods[i].name == name) return true
	}
	return false;
}

JSDOC.Symbol.prototype.hasProperty = function(name) {
	for (var i = 0; i < this.properties.length; i++) {
		if (this.properties[i].name == name) return true
	}
	return false;
}

JSDOC.Symbol.setShortcuts = function(shortcuts) {
	JSDOC.Symbol.shortcuts = eval("JSDOC.Symbol.shortcuts = "+shortcuts);
}
JSDOC.Symbol.shortcuts = {}; // holds map of shortcut names to full names
JSDOC.Symbol.srcfile = ""; // running reference to the current file being parsed
