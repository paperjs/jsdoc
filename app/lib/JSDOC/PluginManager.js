/**
	@namespace
*/
JSDOC.PluginManager = {
}

JSDOC.PluginManager.registerPlugin = function(name, handlers) {
	if (!defined(JSDOC.PluginManager.plugins))
		JSDOC.PluginManager.plugins = {};
	
	JSDOC.PluginManager.plugins[name] = handlers;
}

JSDOC.PluginManager.run = function(hook, target) {
	for (var name in JSDOC.PluginManager.plugins) {
		if (defined(JSDOC.PluginManager.plugins[name][hook])) {
			JSDOC.PluginManager.plugins[name][hook](target);
		}
	}
}
