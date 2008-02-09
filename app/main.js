IO.include("frame.js");
IO.include("lib/JSDOC.js");
IO.includeDir("plugins/");
/*debug*///IO.include("frame/Dumper.js");

var jsdoc = new JSDOC.JsDoc(arguments);

if (JSDOC.opt.T) {
	IO.include("frame/Testrun.js");
	IO.include("test.js");
}
else {
	var myTemplate = JSDOC.opt.t;

	if (!myTemplate) {
		IO.include("frame/Dumper.js");
		var symbols = jsdoc.symbolGroup.getSymbols();
		for (var i = 0, l = symbols.length; i < l; i++) {
			var symbol = symbols[i]; /*debug*///print("s> "+symbol.get("alias"));
		}
	}
	else {
		load(myTemplate+"/publish.js"); // must be path relative to cwd
		if (publish) publish(jsdoc.symbolGroup);
		else LOG.warn("publish() is not defined in that template.");
	}
}