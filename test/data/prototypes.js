// prototypes

/** @constructor */
function Article() {
}

Article.prototype = {
	/** Get the title. */
	getTitle: function(){
	}
}

var Word = function(){}
Word.prototype = String.prototype;

/** @constructor */
function Paragraph(text){
	
}
/** The lines of text. */
Paragraph.prototype.lines = []
/** Get the lines. */
Paragraph.prototype.getLines = function() {
	
}

/** setting the prototype with an ob lit */
Paragraph.lines.prototype = {
	cursor: function() {
		function innerF(){}
	}
}

/** setting the prototype with an variable */
Paragraph.words.prototype = Array;

/** set the page */
Article.prototype.page = function(n) {
	/**@scope Article.prototype.page */
	return {turn: function(){}}
}(42);
