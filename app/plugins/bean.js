JSDOC.PluginManager.registerPlugin(
	"JSDOC.bean",
	{
		beanSymbols: {},
		onSymbol: function(symbol) {
			if (symbol.comment.getTag('bean').length) {
				var bean = symbol.name.match(/([^#]+#)(get|is)(([A-Z])(.*))$/);
				if (bean) {
					symbol.alias  = bean[1] + bean[4].toLowerCase() + bean[5];
					symbol.isa = "OBJECT";
					symbol.readOnly = true;
					this.beanSymbols[symbol.alias] = symbol;

					// Search for a default value in tags
					var tags = symbol.comment.tags;
					for (var i = 0; i < tags.length; i++) {
						var tag = tags[i];
						if (tag.title === 'default' && tag.desc) {
							// Parse it as @default tag should be
							symbol.defaultValue = tag.desc;
							break;
						}
					}
				} else {
					LOG.warn('@bean error: ' + symbol.name);
				}
			}
			var setter = symbol.name.match(/([^#]+#)(set)(([A-Z])(.*))$/);
			if (setter) {
				var getterName = setter[1] + setter[4].toLowerCase() + setter[5];
				var getter = this.beanSymbols[getterName];
				if (getter && getter.readOnly) {
					getter.readOnly = false;
				}
			}
		}
	}
);