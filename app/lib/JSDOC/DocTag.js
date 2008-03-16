if (typeof JSDOC == "undefined") JSDOC = {};

/**
	@constructor
*/
JSDOC.DocTag = function(src) {
	this.init();
	if (typeof src != "undefined") {
		this.parse(src);
	}
}

JSDOC.DocTag.prototype.init = function(src) {
	this.title        = "";
	this.type         = "";
	this.name         = "";
	this.isOptional   = false;
	this.defaultValue = "";
	this.desc         = "";
	
	return this;
}

JSDOC.DocTag.prototype.parse = function(src) {
	try {
		src = this.nibbleTitle(src);
		if (JSDOC.PluginManager) {
			JSDOC.PluginManager.run("onDocTagSynonym", this);
		}
		
		src = this.nibbleType(src);
		
		// only some tags are allowed to have names.
		if (this.title == "param" || this.title == "property" || this.title == "config") { // @config is deprecated
			src = this.nibbleName(src);
		}
	}
	catch(e) {
		if (LOG) LOG.warn(e);
		else throw e;
	}
	this.desc = src; // whatever is left
	
	// example tags need to have whitespace preserved
	if (this.title != "example") this.desc = this.desc.trim();
	
	if (JSDOC.PluginManager) {
		JSDOC.PluginManager.run("onDocTag", this);
	}
}

JSDOC.DocTag.prototype.toString = function() {
	return this.desc;
}

JSDOC.DocTag.prototype.nibbleTitle = function(src) {
	//if (typeof src != "string") throw "src must be a string not "+(typeof src);
	
	var parts = src.match(/^\s*(\S+)(?:\s([\s\S]*))?$/);

	if (parts && parts[1]) this.title = parts[1];
	if (parts && parts[2]) src = parts[2];
	else src = "";
	
	return src;
}
/*?
	requires("../frame/String.js");
	assert("testing JSDOC.DocTag#nibbleTitle");
	
	var tag = new JSDOC.DocTag();
	
	tag.init().nibbleTitle("aTitleGoesHere");
	assertEqual(tag.title, "aTitleGoesHere", "a title can be found in a single-word string.");
	
	var src = tag.init().nibbleTitle("aTitleGoesHere and the rest");
	assertEqual(tag.title, "aTitleGoesHere", "a title can be found in a multi-word string.");
	assertEqual(src, "and the rest", "the rest is returned when the title is nibbled off.");
	
	src = tag.init().nibbleTitle("");
	assertEqual(tag.title, "", "given an empty string the title is empty.");
	assertEqual(src, "", "the rest is empty when the tag is empty.");

	var src = tag.init().nibbleTitle(" aTitleGoesHere\n  a description");
	assertEqual(tag.title, "aTitleGoesHere", "leading and trailing spaces are not part of the title.");
	assertEqual(src, "  a description", "leading spaces (less one) are part of the description.");

	tag.init().nibbleTitle("a.Title::Goes_Here foo");
	assertEqual(tag.title, "a.Title::Goes_Here", "titles with punctuation are allowed.");
?*/

JSDOC.DocTag.prototype.nibbleType = function(src) {
	if (typeof src != "string") throw "src must be a string not "+(typeof src);
	
	if (src.match(/^\s*\{/)) {
		var typeRange = src.balance("{", "}");
		if (typeRange[1] == -1) {
			throw "Malformed comment tag ignored. Tag type requires an opening { and a closing }: "+src;
		}
		this.type = src.substring(typeRange[0]+1, typeRange[1]).trim();
		this.type = this.type.replace(/\s*,\s*/g, "|"); // multiples can be separated by , or |
		src = src.substring(typeRange[1]+1);
	}
	
	return src;
}
/*?
	requires("../frame/String.js");
	assert("testing JSDOC.DocTag.parser.nibbleType");
	
	var tag = new JSDOC.DocTag();
	
	tag.init().nibbleType("{String[]} aliases");
	assertEqual(tag.type, "String[]", "type can have non-alpha characters.");
	
	tag.init().nibbleType("{ aTypeGoesHere  } etc etc");
	assertEqual(tag.type, "aTypeGoesHere", "type is trimmed.");
	
	tag.init().nibbleType("{ oneType, twoType ,\n threeType  } etc etc");
	assertEqual(tag.type, "oneType|twoType|threeType", "multiple types can be separated by commas.");
	
	var error;
	try { tag.init().nibbleType("{widget foo"); }
	catch(e) { error = e; }
	assertEqual(typeof error, "string", "malformed tag type throws error.");
	assertNotEqual(error.indexOf("Malformed"), -1, "error message tells tag is malformed.");
?*/

JSDOC.DocTag.prototype.nibbleName = function(src) {
	if (typeof src != "string") throw "src must be a string not "+(typeof src);
	
	var parts = src.match(/^\s*(\S+)(?:\s([\s\S]*))?$/);
	if (parts) {
		if (parts[1]) this.name = parts[1].trim();
		if (parts[2]) src = parts[2];
		
		// is optional?
		if (this.name.match(/^\[/)) {
			var nameRange = this.name.balance("[", "]");
			if (nameRange[1] == -1) {
				throw "Malformed comment tag ignored. Tag optional name requires an opening [ and a closing ]: "+src;
			}
			this.name = this.name.substring(nameRange[0]+1, nameRange[1]);
			this.isOptional = true;
		}
		
		// has default value?
		var nameAndValue = this.name.split("=");
		if (nameAndValue.length) {
			this.name = nameAndValue.shift().trim();
			this.defaultValue = nameAndValue.join("=");
		}
	}

	return src;
}
/*?
	requires("../frame/String.js");
	assert("testing JSDOC.DocTag.parser.nibbleName");
	
	var tag = new JSDOC.DocTag();
	
	tag.init().nibbleName("[foo] This is a description.");
	assertEqual(tag.isOptional, true, "isOptional syntax is detected.");
	assertEqual(tag.name, "foo", "optional param name is found.");
 	
	tag.init().nibbleName("[foo] This is a description.");
	assertEqual(tag.isOptional, true, "isOptional syntax is detected when no type.");
	assertEqual(tag.name, "foo", "optional param name is found when no type.");
	
	tag.init().nibbleName("[foo=7] This is a description.");
 	assertEqual(tag.name, "foo", "optional param name is found when default value.");
 	assertEqual(tag.defaultValue, 7, "optional param default value is found when default value.");
 	
 	tag.init().nibbleName("[foo=[]] This is a description.");
 	assertEqual(tag.defaultValue, "[]", "optional param default value is found when default value is [] (issue #95).");
 	
 	tag.init().nibbleName("[foo=a=b] This is a description.");
 	assertEqual(tag.name, "foo", "optional param name is found when default value is a=b.");
 	assertEqual(tag.defaultValue, "a=b", "optional param default value is found when default value is a=b.")
?*/


/*?
	requires("../frame/String.js");
	assert("Testing JSDOC.DocTag.parser.");
	
 	var tag = new JSDOC.DocTag();
 	
 	assertEqual(typeof tag, "object", "JSDOC.DocTag.parser with an empty string returns an object.");
 	assertEqual(typeof tag.title, "string", "returned object has a string property 'title'.");
 	assertEqual(typeof tag.type, "string", "returned object has a string property 'type'.");
 	assertEqual(typeof tag.name, "string", "returned object has a string property 'name'.");
 	assertEqual(typeof tag.defaultValue, "string", "returned object has a string property 'defaultValue'.");
 	assertEqual(typeof tag.isOptional, "boolean", "returned object has a boolean property 'isOptional'.");
 	assertEqual(typeof tag.desc, "string", "returned object has a string property 'desc'.");
  
  	tag = new JSDOC.DocTag("param {widget} foo");
  	assertEqual(tag.title, "param", "param title is found.");
  	assertEqual(tag.type, "widget", "param type is found.");
 
 	tag = new JSDOC.DocTag("param {object} date A valid date.");
 	assertEqual(tag.name, "date", "param name is found with a type.");
 	assertEqual(tag.desc, "A valid date.", "param desc is found with a type.");
 	
  	tag = new JSDOC.DocTag("param aName a description goes\n    here.");
	assertEqual(tag.name, "aName", "param name is found without a type.");
 	assertEqual(tag.desc, "a description goes\n    here.", "param desc is found without a type.");
 	
 	tag = new JSDOC.DocTag("param {widget}");
 	assertEqual(tag.name, "", "param name is empty when it is not given.");
	
	tag = new JSDOC.DocTag("param {widget} [foo] This is a description.");
	assertEqual(tag.name, "foo", "optional param name is found.");
	
	tag = new JSDOC.DocTag("return {aType} This is a description.");
	assertEqual(tag.type, "aType", "return has no name, type is found.");
	assertEqual(tag.desc, "This is a description.", "return has no name, desc is found.");
	
	tag = new JSDOC.DocTag("author Joe Coder <jcoder@example.com>");
	assertEqual(tag.title, "author", "author title found.");
	assertEqual(tag.type, "", "author has no name or type.");
	assertEqual(tag.desc, "Joe Coder <jcoder@example.com>", "author has no name, desc is found.");

	tag = new JSDOC.DocTag("example   example(code);");
	assertEqual(tag.desc, "  example(code);", "leading whitespace (less one) in examples code is preserved.");
	
	tag = new JSDOC.DocTag("type   theType  \n");
	assertEqual(tag.desc, "theType", "leading whitespace is trimmed for @type.");
	
?*/