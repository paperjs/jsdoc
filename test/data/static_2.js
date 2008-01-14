/** @class */
Environment = function(os) {
	/**
		The operating system identifier.
		@type string
	*/
	this.os = os;
	this.getVersion = function() {
	}
}

Environment.counter = function() {
}

/**@type integer*/
Environment.count = 0;

Environment.prototype.getOS = function() {
	if (this) return this.os;
}

Environment.getOS = function() {
	return "Amiga";
}

var e = new Environment("mac");
print(e.getOS());
print(Environment.getOS());