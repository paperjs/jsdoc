JSDOC.PluginManager.registerPlugin(
	"JSDOC.isDeprecated",
	{	
		onSymbol: function(symbol) {
			symbol.isDeprecated = symbol.comment.getTag('deprecated').length > 0;
		}
	}
);