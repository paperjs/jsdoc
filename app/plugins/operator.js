JSDOC.PluginManager.registerPlugin(
	"JSDOC.operator",
	{
		onSymbol: function(symbol) {
			if (symbol.comment.getTag('operator').length)
				symbol.isOperator = true;
		}
	}
);