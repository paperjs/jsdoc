/** @constructor */
var Record = new function(id) {
	var secretRecord = 1;
	
	function getSecretRecord() {
		alert("I am private.");
	}
	
	/**@scope Record*/ 
	return {
		/** a variable */ public_variable: 2,
		
		getRecord: function() {
			this.Reader = function() {
			
			}
			alert("I am public: "+this.public_variable+", "+secretRecord);
		}
	};
}

/** 
  Wrapper for the system file object.
  @constructor
*/
var File = function(path) {
	return
	/** @scope File */ {
		id: 255,
		
		getId: function() {
			alert(this.id);
		}
	};
}()

/** @constructor */
var Entry = function(subject) {
	this.subject = subject;
	this.getSubject = function(subjId) {
		alert(this.subject);
	};
	return this;
}("abc00");

dojo.declare(
	/**
	 * This is the Widget constructor.
	 * @scope dojo.widget.Widget
	 * @constructor
	 * @param container
	 * @param args
	 */
	"dojo.widget.Widget",
	null, 
	{
		initializer: function(container, args) {
			this.children = [];
			this.extraArgs = {};
			this.log = function(){
			};
		}
	}
);

dojo.extend("dojo.widget.Widget",
	/**
		@scope dojo.widget.Widget.prototype
	*/
	{
	    /**
	     * Does something.
	     */
	    doIt : function (one, two) {
	    }
	}
);




Record.getRecord();
File.getId();
Entry.getSubject();
