JSDOC.PluginManager.registerPlugin(
	"JSDOC.tagParamConfig",
	{
		onDocCommentTags: function(comment) {
			var currentParam = null;
			var tags = comment.tags;
			for (var i = 0, l = tags.length; i < l; i++) {
				if (tags[i].title == "param") {
					tags[i].properties = [];
					currentParam = i;
				}
				else if (tags[i].title == "config" && currentParam != null) {
					if (tags[i].name.indexOf(tags[currentParam].name+".") != 0)
						tags[i].name = tags[currentParam].name+"."+tags[i].name;
					tags[currentParam].properties.push(tags[i]);
				}
				else {
					currentParam = null;
				}
			}
		}
	}
);
