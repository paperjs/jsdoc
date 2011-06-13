JSDOC.PluginManager.registerPlugin(
	"JSDOC.classExample",
	{	
		onSymbol: function(symbol) {
			var classExample = symbol.comment.getTag('classexample');
			symbol.classExample = classExample.map(
				// trim trailing whitespace
				function($) {
					$.desc = $.desc.replace(/\s+$/, "");
					return $;
				}
			);
		}
	}
);