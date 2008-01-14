/**
 * @class
 */
function Outer() {
function Inner(name) {
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