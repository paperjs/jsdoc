/**
 * @class
 */
function Outer() {


 function Inner(name) /** @scope Outer/open */ {
    /** The title of this. */
 	this.title = name;
 }

 /**
  * @class
  */
 this.open = function(name) {
  return (new Inner(name));
 }
}