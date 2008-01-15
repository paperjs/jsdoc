JSDOC.PluginManager.registerPlugin(
	"JSDOC.tagParamConfig",
	{
		onDocCommentTags: function(symbol) {
			var currentParam = null;
			for (var i = 0, l = symbol.tags.length; i < l; i++) {
				if (symbol.tags[i].title == "param") {
					symbol.tags[i].properties = [];
					currentParam = i;
				}
				else if (symbol.tags[i].title == "config" && currentParam != null) {
					if (symbol.tags[i].name.indexOf(symbol.tags[currentParam].name+".") != 0)
						symbol.tags[i].name = symbol.tags[currentParam].name+"."+symbol.tags[i].name;
					symbol.tags[currentParam].properties.push(symbol.tags[i]);
				}
				else {
					currentParam = null;
				}
			}
		}
	}
);
