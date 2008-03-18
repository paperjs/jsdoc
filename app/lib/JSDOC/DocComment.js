if (typeof JSDOC == "undefined") JSDOC = {};

/**
	Create a new DocComment. This takes a raw documentation comment,
	and wraps it in useful accessors.
	@class Represents a documentation comment object.
 */ 
JSDOC.DocComment = function(/**String*/comment) {
	this.init();
	if (typeof comment != "undefined") {
		this.parse(comment);
	}
}

JSDOC.DocComment.prototype.init = function() {
	this.isUserComment = true;
	this.src           = "";
	this.meta          = "";
	this.tagTexts      = [];
	this.tags          = [];
}

/**
	@requires JSDOC.DocTag
 */
JSDOC.DocComment.prototype.parse = function(/**String*/comment) {
	if (comment == "") {
		comment = "/** @desc */";
		this.isUserComment = false;
	}
	
	this.src = JSDOC.DocComment.unwrapComment(comment);
	
	this.meta = "";
	if (this.src.indexOf("#") == 0) {
		this.meta = this.src.substring(1, 3);
		this.src = this.src.substring(3);
	}
	
	this.fixDesc();
	
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onDocCommentSrc", this);
	}
	
	this.src = JSDOC.DocComment.shared+"\n"+this.src;
	
	this.tagTexts = 
		this.src
		.split(/(^|[\r\n])\s*@/)
		.filter(function($){return $.match(/\S/)});
	
	/**
		The tags found in the comment.
		@type JSDOC.DocTag[]
	 */
	this.tags = this.tagTexts.map(function($){return new JSDOC.DocTag($)});
	
	if (defined(JSDOC.PluginManager)) {
		JSDOC.PluginManager.run("onDocCommentTags", this);
	}
}

/**
	If no @desc tag is provided, this function will add it.
 */
JSDOC.DocComment.prototype.fixDesc = function() {
	if (this.meta && this.meta != "@+") return;
	if (/^\s*[^@\s]/.test(this.src)) {				
		this.src = "@desc "+this.src;
	}
}

/*~t
	assert("testing JSDOC.DocComment#fixDesc");
	
	var com = new JSDOC.DocComment();
	
	com.src = "this is a desc\n@author foo";
	com.fixDesc();
	assertEqual(com.src, "@desc this is a desc\n@author foo", "if no @desc tag is provided one is added.");

	com.src = "x";
	com.fixDesc();
	assertEqual(com.src, "@desc x", "if no @desc tag is provided one is added to a single character.");

	com.src = "\nx";
	com.fixDesc();
	assertEqual(com.src, "@desc \nx", "if no @desc tag is provided one is added to return and character.");
	
	com.src = " ";
	com.fixDesc();
	assertEqual(com.src, " ", "if no @desc tag is provided one is not added to just whitespace.");

	com.src = "";
	com.fixDesc();
	assertEqual(com.src, "", "if no @desc tag is provided one is not added to empty.");

*/

/**
	Remove slash-star comment wrapper from a raw comment string.
	@type String
 */
JSDOC.DocComment.unwrapComment = function(/**String*/comment) {
	if (!comment) return "";
	var unwrapped = comment.replace(/(^\/\*\*|\*\/$)/g, "").replace(/^\s*\* ?/gm, "");
	return unwrapped;
}

/**
	Provides a printable version of the comment.
	@type String
 */
JSDOC.DocComment.prototype.toString = function() {
	return this.src;
}

/**
	Given the title of a tag, returns all tags that have that title.
	@type JSDOC.DocTag[]
 */
JSDOC.DocComment.prototype.getTag = function(/**String*/tagTitle) {
	return this.tags.filter(function($){return $.title == tagTitle});
}

/**/
JSDOC.DocComment.shared = "";

/** @namespace */
JSDOC.DocComment.foo = {
	lala: function(x) {
	}
}
