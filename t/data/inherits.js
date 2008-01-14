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
@inherits Layout.prototype.orientation
*/
function Page() {
	this.reset = function(b) {
	}
}

/**
@constructor
@inherits Layout.prototype.orientation
@inherits Layout.prototype.init
@inherits Page.prototype.reset
*/
function ThreeColumnPage() {
	this.init = function(p) {
	}
}
