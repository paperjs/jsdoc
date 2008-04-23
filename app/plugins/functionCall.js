JSDOC.PluginManager.registerPlugin(
	"JSDOC.functionCall",
	{
		onFunctionCall: function(functionCall) {
			print("~~ functionCall.name is "+functionCall.name);
			print("~~ functionCall.arg1 is "+functionCall.arg1);
		}
	}
);