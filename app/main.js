/**
 * @version $Id$
 */

IO.include("frame.js");
IO.include("lib/JSDOC.js");
IO.includeDir("plugins/");

JSDOC.opt = JSDOC.Util.getOptions(arguments, {d:'directory', c:'conf', t:'template', r:'recurse', x:'ext', p:'private', a:'allfunctions', A:'Allfunctions', e:'encoding', o:'out', T:'test', h:'help', v:'verbose', 'D[]':'define', 'H[]':'handler'});

if (JSDOC.opt.v) LOG.verbose = true;
if (JSDOC.opt.o) LOG.out = IO.open(JSDOC.opt.o);

var jsdoc = new JSDOC.JsDoc();

if (JSDOC.opt.T) {
	LOG.inform("JsDoc Toolkit running in test mode: "+new Date());
	IO.include("frame/Testrun.js");
	IO.include("test.js");
}
else {
	LOG.inform("JsDoc Toolkit main running at: "+new Date());
	LOG.inform("options: ");
	for (var o in JSDOC.opt) {
		LOG.inform("    "+o+": "+JSDOC.opt[o]);
	}
	
	var myTemplate = JSDOC.opt.t;

	if (!myTemplate) {
		IO.include("frame/Dumper.js");
		var symbols = jsdoc.symbolGroup.getSymbols();
		for (var i = 0, l = symbols.length; i < l; i++) {
			var symbol = symbols[i];
			print("s> "+symbol.get("alias"));
			print(symbol.serialize());
		}
	}
	else {
		load(myTemplate+"/publish.js"); // must be path relative to cwd
		if (publish) publish(jsdoc.symbolGroup);
		else LOG.warn("publish() is not defined in that template.");
	}
}

if (LOG.warnings.length) {
	print(LOG.warnings.length+" warnings.");
}

if (LOG.out) {
	LOG.out.flush();
	LOG.out.close();
}
