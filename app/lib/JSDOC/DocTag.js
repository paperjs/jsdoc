if (typeof JSDOC == "undefined") JSDOC = {};

/**
	@constructor
*/
JSDOC.DocTag = function(src) {
	try {
		var tag = JSDOC.DocTag.parser(src);
	}
	catch(e) {
		if (LOG) LOG.warn(e);
		//throw e;
	}
	
	for (var p in tag) {
		this[p] = tag[p];
	}
	return this;
}

JSDOC.DocTag.prototype.toString = function() {
	return this.desc;
}

/**
	@return {object}
	@requires frame/String.js
 */
JSDOC.DocTag.parser = function(src) {
	var tag = {title: "", type: "", name: "", isOptional: false, defaultValue: "", desc: ""};
	
	try {
		src = JSDOC.DocTag.parser.parseTitle(tag, src);
		src = JSDOC.DocTag.parser.parseType(tag, src);
		
		if (JSDOC.PluginManager) {
			JSDOC.PluginManager.run("onDocTagSynonym", tag);
		}
		
		// only some tags are allowed to have names. @config is deprecated
		if (tag.title == "param" || tag.title == "property" || tag.title == "config") {
			src = JSDOC.DocTag.parser.parseName(tag, src);
		}
	}
	catch(e) {
		throw e;
	}
	tag.desc = src;
	
	if (tag.title != "example") tag.desc = tag.desc.trim();
	
	if (JSDOC.PluginManager) {
		JSDOC.PluginManager.run("onDocTag", tag);
	}
	
	return tag;
}

JSDOC.DocTag.parser.parseTitle = function(tag, src) {
	tag.title = "";
	
	var parts = src.match(/^\s*(\S+)(?:\s([\s\S]*))?$/);

	if (parts && parts[1]) tag.title = parts[1].trim();
	if (parts && parts[2]) src = parts[2];
	else src = "";
	
	return src;
}
/*?
	requires("../frame/String.js");
	assert("testing JSDOC.DocTag.parser.parseTitle");
	
	var tag = {};
	
	JSDOC.DocTag.parser.parseTitle(tag, "aTitleGoesHere");
	assertEqual(tag.title, "aTitleGoesHere", "a title can be found in a single-word string.");
	JSDOC.DocTag.parser.parseTitle(tag, "aTitleGoesHere and the rest");
	assertEqual(tag.title, "aTitleGoesHere", "a title can be found in a multi-word string.");
	JSDOC.DocTag.parser.parseTitle(tag, "");
	assertEqual(tag.title, "", "given an empty string the title is empty.");
	
	var src = JSDOC.DocTag.parser.parseTitle(tag, " aTitleGoesHere\n  a description");
	assertEqual(tag.title, "aTitleGoesHere", "leading and trailing spaces are not part of the title.");
	assertEqual(src, "  a description", "leading spaces (less one) are part of the description.");

	JSDOC.DocTag.parser.parseTitle(tag, "a.Title::Goes_Here foo");
	assertEqual(tag.title, "a.Title::Goes_Here", "titles with punctuation are allowed.");
?*/

JSDOC.DocTag.parser.parseType = function(tag, src) {
	tag.type = "";
	
	if (src.match(/^\s*\{/)) {
		var typeRange = src.balance("{", "}");
		if (typeRange[0] == -1 || typeRange[1] == -1) {
			throw "Malformed comment tag ignored. Tag type requires an opening { and a closing }: "+src;
		}
		tag.type = src.substring(typeRange[0]+1, typeRange[1]).trim();
		tag.type = tag.type.replace(/\s*,\s*/g, "|");
		src = src.substring(typeRange[1]+1).trim();
	}
	
	return src;
}
/*?
	requires("../frame/String.js");
	assert("testing JSDOC.DocTag.parser.parseType");
	
	var tag = {};
	JSDOC.DocTag.parser.parseType(tag, "{String[]} aliases");
	assertEqual(tag.type, "String[]", "type can have non-alpha characters.");
	
	JSDOC.DocTag.parser.parseType(tag, "{ aTypeGoesHere  } etc etc");
	assertEqual(tag.type, "aTypeGoesHere", "type is trimmed.");
	
	JSDOC.DocTag.parser.parseType(tag, "{ oneType, twoType ,\n threeType  } etc etc");
	assertEqual(tag.type, "oneType|twoType|threeType", "multiple types can be separated by commas.");
	
	var error;
	try { tag = JSDOC.DocTag.parser.parseType(tag, "{widget foo"); }
	catch(e) { error = e; }
	assertEqual(typeof error, "string", "malformed tag type throws error.");
	assertNotEqual(error.indexOf("Malformed"), -1, "error message tells tag is malformed.");
?*/

JSDOC.DocTag.parser.parseName = function(tag, src) {
	tag.name = "";
	tag.isOptional = false;
	tag.defaultValue = "";
	
	var parts = src.match(/^\s*(\S+)(?:\s([\s\S]*))?$/);
	if (parts) {
		if (parts[1]) tag.name = parts[1].trim();
		if (parts[2]) src = parts[2].trim();
		
		// is optional
		var nameRange = tag.name.balance("[", "]");
		if (nameRange[0] != -1 && nameRange[1] != -1) {
			tag.name = tag.name.substring(nameRange[0]+1, nameRange[1]);
			tag.isOptional = true;
		}
		
		// has default value
		nameValue = tag.name.split("=");
		if (nameValue.length) {
			tag.name = nameValue.shift().trim();
			tag.defaultValue = nameValue.join("=");
		}
	}
	
	return src;
}
/*?
	requires("../frame/String.js");
	assert("testing JSDOC.DocTag.parser.parseName");
	
	var tag = {};
	src = JSDOC.DocTag.parser.parseName(tag, "[foo] This is a description.");
	assertEqual(tag.isOptional, true, "isOptional syntax is detected.");
	assertEqual(tag.name, "foo", "optional param name is found.");
	
	src = JSDOC.DocTag.parser.parseName(tag, "[foo] This is a description.");
	assertEqual(tag.isOptional, true, "isOptional syntax is detected when no type.");
	assertEqual(tag.name, "foo", "optional param name is found when no type.");
	
	src = JSDOC.DocTag.parser.parseName(tag, "[foo=7] This is a description.");
 	assertEqual(tag.name, "foo", "optional param name is found when default value.");
 	assertEqual(tag.defaultValue, 7, "optional param default value is found when default value.");
 	src = JSDOC.DocTag.parser.parseName(tag, "[foo=[]] This is a description.");
 	assertEqual(tag.defaultValue, "[]", "optional param default value is found when default value is [] (issue #95).");
 	src = JSDOC.DocTag.parser.parseName(tag, "[foo=a=b] This is a description.");
 	assertEqual(tag.name, "foo", "optional param name is found when default value is a=b.");
 	assertEqual(tag.defaultValue, "a=b", "optional param default value is found when default value is a=b.")
?*/


/*?
	requires("../frame/String.js");
	assert("Testing JSDOC.DocTag.parser.");
	
 	var tag = JSDOC.DocTag.parser("");
 	assertEqual(typeof tag, "object", "JSDOC.DocTag.parser with an empty string returns an object.");
 	assertEqual(typeof tag.title, "string", "returned object has a string property 'title'.");
 	assertEqual(typeof tag.type, "string", "returned object has a string property 'type'.");
 	assertEqual(typeof tag.name, "string", "returned object has a string property 'name'.");
 	assertEqual(typeof tag.defaultValue, "string", "returned object has a string property 'defaultValue'.");
 	assertEqual(typeof tag.isOptional, "boolean", "returned object has a boolean property 'isOptional'.");
 	assertEqual(typeof tag.desc, "string", "returned object has a string property 'desc'.");
 
 	tag = JSDOC.DocTag.parser("param {widget} foo");
 	assertEqual(tag.type, "widget", "param type is found.");
 
 	tag = JSDOC.DocTag.parser("param {object} date A valid date.");
 	assertEqual(tag.name, "date", "param name is found with a type.");
 	assertEqual(tag.desc, "A valid date.", "param desc is found with a type.");
 	
 	tag = JSDOC.DocTag.parser("param aName a description goes\n    here.");
 	assertEqual(tag.name, "aName", "param name is found without a type.");
 	assertEqual(tag.desc, "a description goes\n    here.", "param desc is found without a type.");
 	
 	tag = JSDOC.DocTag.parser("param {widget}");
 	assertEqual(tag.name, "", "param name is empty when it is not given.");
	
	tag = JSDOC.DocTag.parser("param {widget} [foo] This is a description.");
	assertEqual(tag.name, "foo", "optional param name is found.");
	
	tag = JSDOC.DocTag.parser("return {aType} This is a description.");
	assertEqual(tag.type, "aType", "return has no name, type is found.");
	assertEqual(tag.desc, "This is a description.", "return has no name, desc is found.");
	
	tag = JSDOC.DocTag.parser("author Joe Coder <jcoder@example.com>");
	assertEqual(tag.title, "author", "author title found.");
	assertEqual(tag.type, "", "author has no name or type.");
	assertEqual(tag.desc, "Joe Coder <jcoder@example.com>", "author has no name, desc is found.");

	tag = JSDOC.DocTag.parser("example   example(code);");
	assertEqual(tag.desc, "  example(code);", "leading whitespace in examples code is preserved.");
	tag = JSDOC.DocTag.parser("type   theType  \n");
	assertEqual(tag.desc, "theType", "leading whitespace is trimmed for @type.");
	
?*/