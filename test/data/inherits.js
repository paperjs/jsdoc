/**
@ class
@constructor
*/
function Layout(p) {
	this.init = function(p) {
	}
	
	this.getId = function() {
	}
	
	/** @type string */
	this.orientation = "landscape";
}

/**
@constructor
@inherits Layout/orientation
*/
function Page() {
	this.reset = function(b) {
	}
}

/**
@constructor
@inherits Layout/orientation
@inherits Layout/init
@inherits Page/reset
*/
function ThreeColumnPage() {
	this.init = function(p) {
	}
}
