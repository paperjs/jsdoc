/**
* A car class
* @name Car
* @constructor
*/
var Car = Class.create(
 /** @scope Car.prototype */
 {
 /**
  * Initialize this thing
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
  * @return Object
  */
 someMethod: function() {

 }
})

/**
* Some method
*/
Car.someOtherMethod = function() {
	function topSecret() {
		this.fireGuns = function(target){
			function reload() {
			}
		}
	}
}