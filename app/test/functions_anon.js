/** an anonymous constructor executed inline */
a = new function() {
	/** a property of instance a */
    this.b = 1;               // a.b
    this.f = function() {     // a.f
    	this.c = 2;           // a.c
    }
}


/**
	named function executed inline
*/
bar1 = function Zoola1() {
	/** property of global */
	this.g = 1;
}();

/**
	named constructor executed inline
*/
bar2 = new function Zoola2() {
	/** property of bar */
	this.p = 1;
};

/** module pattern */
module = (function () {
	/** won't appear in documentation */
	var priv = 1;
	
	/** @scope module */
	return {
		/** will appear as a property of module */
		pub: 1
	}
})();
