/**
	This is the main container for the entire application.
	@namespace
*/
JSDOC = {
};

/** The current version string of this application. */
JSDOC.VERSION = "2.0a";

JSDOC.usage = function() {
	//todo
}


include("app/lib/JSDOC/IO.js");
include(JSDOC.IO.ls(__DIR__+"app/lib/JSDOC/"));
include("app/plugins/tagParamConfig.js");
include("app/plugins/tagSynonyms.js");
include("app/plugins/tagShortcuts.js");
include("app/plugins/publishSrcHilite.js");
