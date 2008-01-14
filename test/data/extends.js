// circular references here

/**
@constructor
@extends TwoColumnPage
*/
function Page() {
	this.reset = function(b) {
	}
}

/**
@extends Page
@constructor
*/
function ThreeColumnPage() {
	this.init = function(p) {
	}
}


/**
@extends ThreeColumnPage
@constructor
*/
function TwoColumnPage() {
	this.init = function(p) {
	}
}