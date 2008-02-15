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
	LOG.inform("JsDoc Toolkit running in test mode at "+new Date()+".");
	IO.include("frame/Testrun.js");
	IO.include("test.js");
}
else if (JSDOC.opt._.length == 0) {
	LOG.warn("No source files to work on. Nothing to do.");
	quit();
}
else {
	LOG.inform("JsDoc Toolkit main() running at "+new Date()+".");
	LOG.inform("With options: ");
	for (var o in JSDOC.opt) {
		LOG.inform("    "+o+": "+JSDOC.opt[o]);
	}
	
	if (JSDOC.opt.Z) { // secret debugging option
		LOG.warn("So you want to see the data structure, eh? This might hang if you have circular refs...");
		IO.include("frame/Dumper.js");
		var symbols = jsdoc.symbolGroup.getSymbols();
		for (var i = 0, l = symbols.length; i < l; i++) {
			var symbol = symbols[i];
			print("// symbol: " + symbol.get("alias"));
			print(symbol.serialize());
		}
	}
	else {
		var template = JSDOC.opt.t;
		var handler = jsdoc.symbolGroup.handler;
		if (handler && handler.publish) {
			handler.publish(jsdoc.symbolGroup);
		}
		else {
			if (typeof template != "undefined") {
				try {
					load(template+"/publish.js");
					if (!publish) LOG.warn("No publish() function is defined in that template so nothing to do.");
					else publish(jsdoc.symbolGroup);
				}
				catch(e) {
					LOG.warn("Sorry, that doesn't seem to be a valid template: "+e);
				}
			}
			else {
				LOG.warn("No template or handlers given. Might as well read the usage notes.");
				JSDOC.usage();
			}
		}
	}
}

if (LOG.warnings.length) {
	print(LOG.warnings.length+" warning"+(LOG.warnings.length != 1? "s":"")+".");
}

if (LOG.out) {
	LOG.out.flush();
	LOG.out.close();
}
