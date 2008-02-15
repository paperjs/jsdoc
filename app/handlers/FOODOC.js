/**
   This is the main container for the FOODOC handler.
   @namespace
*/
FOODOC = {
};

/** The current version string of this application. */
FOODOC.VERSION = "1.0";

FOODOC.symbolize = function(srcFile, src) {
	LOG.inform("Symbolizing file '" + srcFile + "'");
	
	return [
		new JSDOC.Symbol().init(
			"foo",
			[],
			"VIRTUAL",
			new JSDOC.DocComment("/** This is a foo. */")
		)
	];
};
