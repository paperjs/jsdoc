RegExp.escapeMeta = function(str) {
	return str.replace(/([$^\\\/()|?+*\[\]{}.-])/g, "\\$1");
}

var alias = "foo/bar.baz/zap/zop";
var parentConstructor = "foo";

alias = alias.replace(new RegExp("^"+RegExp.escapeMeta(parentConstructor)+"\/[^\/]+\/"), parentConstructor+"/");
print(alias);

