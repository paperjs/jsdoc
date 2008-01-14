function Hash() {
	this._elements = {};
}
Hash.prototype.put = function() {
	for (var i = 0, l = arguments.length; i < l; i++) {
		this._elements[arguments[i]] = arguments[++i];
	}
}
Hash.prototype.has = function(key) {
	return this._elements.hasOwnProperty(key);
}
Hash.prototype.get = function(key) {
	return (this.has(key)) ? this._elements[key] : undefined;
}
Hash.prototype.drop = function(key) {
	if (this.has(key)) {
		delete this._elements[key];
	}
}

Hash.prototype.keys = function() {
	var keys = [];
	for (var key in this._elements) {
		if (this.has(key)) keys.push(key);
	}

	return keys;
}

var h = new Hash();
h.put(
	"name", "Michael",
	"prototype", "fubar",
	"o", {"foo":"bar"}
);

for (var keys = h.keys().sort(), i = 0; i < keys.length; i++) {
	print(keys[i]+" => "+h.get(keys[i]));
}
