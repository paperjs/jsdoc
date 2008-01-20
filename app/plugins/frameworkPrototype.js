JSDOC.PluginManager.registerPlugin(
	"JSDOC.frameworkPrototype",
	{
		onPrototypeClassCreate: function(classCreator) {
			if (classCreator.comment) {
				var desc = classCreator.comment;
			}
			var insert = desc+"/** @name "+classCreator.name+"\n@constructor\n@scope "+classCreator.name+".prototype */"
			
			insert = insert.replace(/\*\/\/\*\*/g, "\n");
			/*DEBUG*///print("insert is "+insert);
			classCreator.addComment.data = insert;
		}
	}
);
