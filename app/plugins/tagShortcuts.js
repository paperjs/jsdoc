JSDOC.PluginManager.registerPlugin(
	"JSDOC.tagShortcuts",
	{
		onSymbol: function(symbol) {			
			for (var n in JSDOC.Symbol.shortcuts) {
				var pat = RegExp.escapeMeta(n);
				var re = new RegExp("^"+pat+"\\b");
				if (re.test(symbol.alias)) {
					symbol.name = symbol.alias = symbol.alias.replace(re, JSDOC.Symbol.shortcuts[n]);
					return;
				}
			}
		}
	}
);