
load(__DIR__+"app/frame/Chain.js");
load(__DIR__+"app/frame/Hash.js");
load(__DIR__+"app/frame/Namespace.js");

function defined(o) {
	return (o !== undefined);
}

function include(path) {
	if (!path) return;
	if (path.constructor === Array) {
		for (var i = 0, l = path.length; i < l; i ++) {
			load(path[i]);
		}
	}
	else if (typeof path == "string") {
		load(__DIR__+path);
	}
}

function include_once(path) {
	if (include_once.included.indexOf(path) === -1) {
		include(path);
		include_once.included.push(path);
	}
}
include_once.included = [];

function copy(o) { // todo check for circular refs
	if (o == null || typeof(o) != 'object') return o;
	var c = new o.constructor();
	for(var p in o)	c[p] = copy(o[p]);
	return c;
}

function isUnique(arr) {
	var l = arr.length;
	for(var i = 0; i < l; i++ ) {
		if (arr.lastIndexOf(arr[i]) > i) return false;
	}
	return true;
}

/** Returns the given string with all regex meta characters backslashed. */
RegExp.escapeMeta = function(str) {
	return str.replace(/([$^\\\/()|?+*\[\]{}.-])/g, "\\$1");
}
