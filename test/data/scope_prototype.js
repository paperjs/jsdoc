/**
* @constructor
* A car class
*/
function Car() {
}

var Car = Class.create(
	 /** @scope Car.prototype */
	 {
		 /**
		  * Initialize this damn thing
		  */
		 initialize: function(foo, bar) {
			   /**
				* The context in which the custom event is invoked from.  Defaults to the window
				* object.
				* @type String
				*/
			   this.foo = "foo";
			
			   /**
				 * The context in which the custom event is invoked from.  Defaults to the window
				* object.
				* @type String
				*/
			   this.bar = "bar";
		 },
		
		 /**
		  * Just a test for JSDoc Toolkit
		  */
		 someMethod: function() {
		}
	}
)