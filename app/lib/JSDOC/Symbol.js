/** @constructor */
JSDOC.Symbol = function() {
	var properties = {
		_addOn: "",
		_alias: "",
		_augments: [],
		_author: "",
		_classDesc: "",
		_comment: {},
		_defaultValue: undefined,
		_deprecated: "",
		_desc: "",
		_events: [],
		_example: "",
		_exceptions: [],
		_inherits: [],
		_inheritsFrom: [],
		_isa: "OBJECT",
		_isEvent: false,
		_isIgnored: false,
		_isInner: false,
		_isNamespace: false,
		_isPrivate: false,
		_isStatic: false,
		_memberOf: "",
		_methods: [],
		_name: "",
		_parentConstructor: "",
		_params: [],
		_properties: [],
		_requires: [],
		_returns: [],
		_see: [],
		_since: "",
		_srcFile: {},
		_type: "",
		_version: ""
	};
	
	for (var p in properties) {
		var name = p.substr(1);
		if (typeof JSDOC.Symbol.prototype[name] == "undefined") {
			JSDOC.Symbol.prototype[name] = (
				function(n) { return function() {
					if (arguments.length > 0) {
						this.set.apply(this, [n, arguments[0]]);
					}
					return this.get(n);
				} }
			)(name);
		}
	}
	
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onModifyProperties", properties);
	}
	
	this.init = function(
		/** String */ name,
		/** Object[] */ params,
		/** String */ isa,
		/** JSDOC.DocComment */ comment
	) {
		this.init.args = arguments;
		
		this.set("name", name);
		this.set("alias", this.name());
		this.set("params", params);
		this.set("isa", (isa == "VIRTUAL")? "OBJECT":isa);
		this.set("comment", comment);
		this.set("srcFile", JSDOC.Symbol.srcFile);
		
		if (this.is("FILE")) {
			if (!this.alias()) this.set("alias", this.srcFile());
		}
		this.processTags();
		
		if (defined(JSDOC.PluginManager)) {
			JSDOC.PluginManager.run("onSymbol", this);
		}
		
		return this;
	}
	
	this.hasProperty = function(propName) {
		return (properties.hasOwnProperty("_"+propName));
	}
	
	this.get = function(propName) {
		return properties["_"+propName];
	}

	this.set = function(propName, v) {
		if (this.hasProperty(propName)) {
			switch(propName) {
				case "name":
					v = v.replace(/\.prototype\.?/g, '#');
					break;
				case "isa":
					if (JSDOC.Symbol.validKinds.indexOf(v) < 0) {
						throw "Unknown kind: "+v+" is not in "+Symbol.validKinds+".";
					}
				case "params":
					for (var i = 0; i < v.length; i++) {
						if (v[i].constructor != JSDOC.DocTag) { // may be a generic object parsed from signature, like {type:..., name:...}
							v[i] = new JSDOC.DocTag("param"+((v[i].type)?" {"+v[i].type+"}":"")+" "+v[i].name);
						}
					}
					break;
			}
			properties["_"+propName] = v;
		}
		else throw "Property \""+propName+"\" not defined in properties of class ";//+new Reflection(this).getConstructorName()+".";
	}
	
	this.clone = function() {
		var clone = new this.constructor();
		clone = clone.init.apply(clone, this.init.args);
		// todo: further cloning here
		clone.srcFile = this.srcFile;
		
		return clone;
	}
	
	this.serialize = function() {
		var out = "\n{\n";
		var keys = [];
		for (var p in properties) keys.push(p);
		keys = keys.sort();		
		for (var k in keys) {
			out += keys[k].substring(1)+" => "+Dumper.dump(properties[keys[k]])+",\n";
		}
		
		out += "}\n";
		
		return out;
	}
	
	this.processTags = function() {
		// @author
		var authors = this.comment().getTag("author");
		if (authors.length) {
			this.author(authors.map(function($){return $.desc;}).join(", "));
		}
		
		// @desc
		var descs = this.comment().getTag("desc");
		if (descs.length) {
			this.desc(descs.map(function($){return $.desc;}).join("\n")); // multiple descriptions are concatenated into one
		}
		
		if (this.is("FILE")) {
			if (!this.alias()) this.alias(this.srcFile());
			
			var overviews = this.comment().getTag("overview");
			if (overviews.length) {
				this.desc([this.desc()].concat(overviews.map(function($){return $.desc;})).join("\n"));
			}
		}
		
		// @since
		var sinces = this.comment().getTag("since");
		if (sinces.length) {
			this.since(sinces.map(function($){return $.desc;}).join(", "));
		}
		
		// @version
		var versions = this.comment().getTag("version");
		if (versions.length) {
			this.version(versions.map(function($){return $.desc;}).join(", "));
		}
		
		// @deprecated
		var deprecateds = this.comment().getTag("deprecated");
		if (deprecateds.length) {
			this.deprecated(deprecateds.map(function($){return $.desc;}).join("\n"));
		}
		delete deprecateds;
		
		// @example
		var examples = this.comment().getTag("example");
		if (examples.length) {
			this.example(examples[0]);
		}
		
		// @see
		var sees = this.comment().getTag("see");
		if (sees.length) {
			var thisSee = this.see();
			sees.map(function($){thisSee.push($.desc);});
		}
		
		// @class
		var classes = this.comment().getTag("class");
		if (classes.length) {
			this.isa("CONSTRUCTOR");
			this.classDesc(classes[0].desc); // desc can't apply to the constructor as there is none.
			
		}
		
		// @namespace
		var namespaces = this.comment().getTag("namespace");
		if (namespaces.length) {
			this.classDesc(namespaces[0].desc+"\n"+this.desc()); // desc can't apply to the constructor as there is none.
			this.isa("CONSTRUCTOR");
			this.isNamespace(true);
		}
		
		// @param
		var params = this.comment().getTag("param");
		if (params.length) {
			// user-defined params overwrite those with same name defined by the parser
			var thisParams = this.params();
			if (thisParams.length == 0) { // none exist yet, so just bung all these user-defined params straight in
				this.params(params);
			}
			else { // need to overlay these user-defined params on to existing parser-defined params
				for (var i = 0, l = params.length; i < l; i++) {
					if (thisParams[i]) {
						if (params[i].type) thisParams[i].type = params[i].type;
						thisParams[i].name = params[i].name;
						thisParams[i].desc = params[i].desc;
						thisParams[i].isOptional = params[i].isOptional;
						thisParams[i].defaultValue = params[i].defaultValue;
					}
					else thisParams[i] = params[i];
				}
			}
		}
		
		// @constructor
		var constructors = this.comment().getTag("constructor");
		if (constructors.length) {
			this.isa("CONSTRUCTOR");
		}
		
		// @static
		var statics = this.comment().getTag("static");
		if (statics.length) {
			this.isStatic(true);
			if (this.isa() == "CONSTRUCTOR") {
				this.isNamespace(true);
			}
		}
		
		// @inner
		var inners = this.comment().getTag("inner");
		if (inners.length) {
			this.isInner(true);
			this.isStatic(false);
		}
		
		// @function
		var functions = this.comment().getTag("function");
		if (functions.length) {
			this.isa("FUNCTION");
		}
		
		// @event
		var events = this.comment().getTag("event");
		if (events.length) {
			this.isa("FUNCTION");
			this.isEvent(true);
		}
		
		// @name
		var names = this.comment().getTag("name");
		if (names.length) {
			this.name(names[0].desc);
		}
		
		// @property
		var properties = this.comment().getTag("property");
		if (properties.length) {
			thisProperties = this.properties();
			for (var i = 0; i < properties.length; i++) {
				var thisAlias = this.alias();
				var joiner = ".";
				if (thisAlias.charAt(thisAlias.length-1) == "#" || properties[i].name.charAt(0) == "#") {
					joiner = "";
				}
				properties[i].alias = this.alias + joiner + properties[i].name;
				thisProperties.push(properties[i]);
			}
		}
		
		// @return
		var returns = this.comment().getTag("return");
		if (returns.length) { // there can be many return tags in a single doclet
			this.returns(returns);
			this.type(returns.map(function($){return $.type}).join(", "));
		}
		
		// @exception
		var exceptions = this.comment().getTag("throws");
		if (exceptions.length) {
			this.exceptions(exceptions);
		}
		
		// @requires
		var requires = this.comment().getTag("requires");
		if (requires.length) {
			this.requires(requires.map(function($){return $.desc}));
		}
		
		// @type
		var types = this.comment().getTag("type");
		if (types.length) {
			this.type(types[0].desc); // multiple type tags are ignored
		}
		
		// @private
		var privates = this.comment().getTag("private");
		if (privates.length) {
			this.isPrivate(true);
		}
		
		// @ignore
		var ignores = this.comment().getTag("ignore");
		if (ignores.length) {
			this.isIgnored(true);
		}
		
		// @inherits ... as ...
		var inherits = this.comment().getTag("inherits");
		if (inherits.length) {
			for (var i = 0; i < inherits.length; i++) {
				if (/^\s*([a-z$0-9_.#]+)(?:\s+as\s+([a-z$0-9_.#]+))?/i.test(inherits[i].desc)) {
					var inAlias = RegExp.$1;
					var inAs = RegExp.$2 || inAlias;
					
					if (inAlias) inAlias = inAlias.replace(/\.prototype\.?/g, "#");
					
					if (inAs) {
						inAs = inAs.replace(/\.prototype\.?/g, "#");
						inAs = inAs.replace(/^this\.?/, "#");
					}
					if (inAs.indexOf(inAlias) != 0) { //not a full namepath
						var joiner = ".";
						if (this.alias().charAt(this.alias().length-1) == "#" || inAs.charAt(0) == "#") {
							joiner = "";
						}
						inAs = this.alias() + joiner + inAs;
					}
				}

				this.inherits().push({alias: inAlias, as: inAs});
			}
		}

		// @augments
		var augments = this.comment().getTag("augments");
		if (augments.length) {
			this.augments(augments);
		}
		
		// @default
		var defaults = this.comment().getTag("default");
		if (defaults.length) {
			if (this.is("OBJECT")) {
				this.defaultValue(defaults[0].desc);
			}
		}
		
		// @memberOf
		var memberOfs = this.comment().getTag("memberOf");
		if (memberOfs.length) {
			this.memberOf(memberOfs[0].desc);
		}
	}
}

JSDOC.Symbol.validKinds = ["CONSTRUCTOR", "FILE", "VIRTUAL", "FUNCTION", "OBJECT", "VOID"];

JSDOC.Symbol.prototype.is = function(what) {
	return this.isa() === what;
}

JSDOC.Symbol.prototype.isBuiltin = function() {
	return JSDOC.Lang.isBuiltin(this.alias());
}

JSDOC.Symbol.prototype.hasTag = function(tagTitle) {
	for (var i = 0, l = this.comment().tags.length; i < l; i++) {
		if (this.comment().tags[i].title == tagTitle)
			return true;
	}
	return false;
}

JSDOC.Symbol.prototype.setType = function(/**String*/comment, /**Boolean*/overwrite) {
	if (!overwrite && this.type()) return;
	var typeComment = JSDOC.DocComment.unwrapComment(comment);
	this.type( typeComment);
}


//TODO why make distinction between properties and methods?
JSDOC.Symbol.prototype.inherit = function(symbol) {
	if (!this.hasMember(symbol.name()) && !symbol.isInner()) {
		if (symbol.is("FUNCTION"))
			this.methods().push(symbol);
		else if (symbol.is("OBJECT"))
			this.properties().push(symbol);
	}
}

JSDOC.Symbol.prototype.makeMemberOf = function(alias) {
	alias = alias.replace(/\.prototype(\.|$)/g, "#");
	var thisAlias = this.alias();
	
	var joiner = ".";
	if (alias.charAt(alias.length-1) == "#" || thisAlias.charAt(0) == "#") {
		joiner = "";
	}
	this.alias(alias + joiner + thisAlias);
}

JSDOC.Symbol.prototype.hasMember = function(name) {
	return (this.hasMethod(name) || this.hasProperty(name));
}

JSDOC.Symbol.prototype.hasMethod = function(name) {
	var thisMethods = this.methods();
	for (var i = 0, l = thisMethods.length; i < l; i++) {
		if (thisMethods[i].name() == name) return true;
		if (thisMethods[i].alias() == name) return true;
	}
	return false;
}

JSDOC.Symbol.prototype.addMethod = function(symbol) {
	var methodAlias = symbol.alias();
	var thisMethods = this.methods();
	for (var i = 0, l = thisMethods.length; i < l; i++) {
		if (thisMethods[i].alias() == methodAlias) {
			thisMethods[i] = symbol; // overwriting previous method
			return;
		}
	}
	thisMethods.push(symbol); // new method with this alias
}

JSDOC.Symbol.prototype.hasProperty = function(name) {
	var thisProperties = this.properties();
	for (var i = 0, l = thisProperties.length; i < l; i++) {
		if (thisProperties[i].name() == name) return true;
		if (thisProperties[i].alias() == name) return true;
	}
	return false;
}

JSDOC.Symbol.prototype.addProperty = function(symbol) {
	var propertyAlias = symbol.alias();
	var thisProperties = this.properties();
	for (var i = 0, l = thisProperties.length; i < l; i++) {
		if (thisProperties[i].alias() == propertyAlias) {
			thisProperties[i] = symbol; // overwriting previous property
			return;
		}
	}
	thisProperties.push(symbol); // new property with this alias
}

JSDOC.Symbol.prototype.getMethods = function() {
	return this.methods();
}

JSDOC.Symbol.prototype.getProperties = function() {
	return this.properties();
}

JSDOC.Symbol.prototype.getEvents = function() {
//TODO
}

JSDOC.Symbol.setShortcuts = function(shortcuts) {
	JSDOC.Symbol.shortcuts = eval("JSDOC.Symbol.shortcuts = "+shortcuts);
}

JSDOC.Symbol.shortcuts = {}; // holds map of shortcut names to full names
JSDOC.Symbol.srcFile = ""; // running reference to the current file being parsed
