/**
@ class
@constructor
*/
function Layout(p) {
	/** initilize 1 */
	this.init = function(p) {
	}
	
	/** get the id */
	this.getId = function() {
	}
	
	/** @type string */
	this.orientation = "landscape";
}

/**
@constructor
@adopts Layout.prototype.orientation as #orientation
*/
function Page() {
	/** reset the page */
	this.reset = function(b) {
	}
}

/**
@constructor
@adopts Layout.prototype.orientation  as this.orientation
@adopts Layout.prototype.init as #init
@inherits Page.prototype.reset as #reset
*/
function ThreeColumnPage() {
	/** initilize 2 */
	this.init = function(p) {
	}
}
