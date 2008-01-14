load("app/frame.js");
include("app/lib/Dumper.js");
include("test/JsTestrun.js");

function symbolize(opt) {
	jsdoc = new JSDOC.JsDoc(opt);
	symbols = jsdoc.symbolGroup.symbols;
}


var testCases = [
	function() {
		symbolize({_: [__DIR__+"test/data/functions.js"]});
		
		ok('typeof(jsdoc) != "undefined"', 'jsdoc must be defined.');
		is('symbols[1].alias', "Layout", 'Nested commented method name can be found.');
	},
	function() {
		symbolize({_: [__DIR__+"test/data/class.js"]});
		
		like('symbols[1].desc', /Construct/, 'Untagged description for constructor is found.');
	}
	,
	function() {
		symbolize({_: [__DIR__+"test/data/obliterals.js"]});
		
		is('symbols[1].name', "Document", 'Nested commented object literal name can be found.');
	},
	function() {
		symbolize({_: [__DIR__+"test/data/oblit_func.js"]});
		
		is('symbols[1].name', "Site", 'Mixed object literal name can be found.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/prototypes.js"]});
		
		is('symbols[2].alias', "Article.getTitle", 'Prototype method name assigned from oblit can be found.');
		is('symbols[2].memberof', "Article", 'Prototype method memberof assigned from oblit can be found.');
		is('symbols[1].methods[0].name', "getTitle", 'Prototype method is registered with parent object.');
		is('symbols[5].alias', "Paragraph.lines", 'Prototype property name can be found.');
		is('symbols[5].isa', "OBJECT", 'Prototype property isa can be found.');
		is('symbols[6].alias', "Paragraph.getLines", 'Prototype method name can be found.');
		is('symbols[6].isa', "FUNCTION", 'Prototype method isa can be found.');
		is('symbols[7].alias', "Article.page", 'Prototype set to anonymous function call.');
		is('symbols[8].alias', "Article.page.turn", 'Prototype set to anonymous function call with scoped method.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/prototypes_props.js"]});
		
		is('symbols[1].properties[0].alias', "Person.name", 'Property set via prototype method is on instance.');
		is('symbols[1].methods[1].alias', "Person.getName", 'Method set via prototype method is on instance.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/anonfuncs.js"]});
		
		is('symbols[2].alias', "Item.name", 'Anonymous function call assigned to property can be found.');
		is('symbols[3].name', "Price", 'Anonymous function call assigned to variable can be found.');
		is('symbols[4].name', "Product", 'Anonymous constructor call assigned to variable can be found.');
		is('symbols[5].isa', "OBJECT", 'Anonymous constructor property isa must be "OBJECT".');
		is('symbols[5].alias', "Product.seller", 'Anonymous constructor property name can be found.');
		is('symbols[7].name', "count", 'Anonymous function assigned to a namespace name can be found.');
		is('symbols[7].memberof', "com.shop.Inventory", 'Anonymous function assigned to a namespace memberof can be found.');
	},
	function() {
		symbolize({_: [__DIR__+"test/data/overview.js"]});
		
		is('symbols[1].doc.tags[3].title', "author", 'Author tag in overview can be found.');
	},
	function() {
		symbolize({_: [__DIR__+"test/data/tags.js"]});
		
		is('symbols[2].doc.tags[1].title', "status", 'User-defined tag title can be found.');
		is('symbols[2].doc.tags[1].desc', "experimental", 'User-defined tag with desc, desc can be found.');
		is('symbols[2].doc.tags[2].title', "beta", 'User-defined tag with no desc, title can be found.');
		is('symbols[2].doc.tags[2].desc', "", 'User-defined tag with no desc, desc can be found and is empty.');
	},
	function() {
		symbolize({_ : [__DIR__+"test/data/type.js"]});
		
		is('symbols[1].type', "", 'Constructors can\'t have a type set.');
		//is('symbols[1].doc.tags.length', 0, 'Type doesn\'t appear in tags.');
		is('symbols[2].type', "String", 'Properties can have a type set.');
		is('symbols[3].type', "number", 'Variables can have a type set.');
		is('symbols[4].type', "HTMLElement, HTMLElement[], null", 'Types can be separated with single bars and newlines.');
		is('symbols[5].type', "FontDef, String", 'Types can be separated with double bars.');
		is('symbols[6].type', "number, sizeDef", 'Type tag can be set by setting the type as well as desc.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/functions.js"]});
		
		is('symbols[1].methods.length', 3, 'Undocumented function has undocumented methods.');
		is('symbols[1].methods[2].name', "Canvas", 'Undocumented function has named undocumented methods.');
		is('symbols[3].alias', "Layout.Element", 'Nested undocumented function has name.');
		is('symbols[3].methods[0].name', "expand", 'Nested undocumented method is found.');
		is('symbols[4].name', "expand", 'Nested undocumented function has name.');
		is('symbols[4].alias', "Layout.Element.expand", 'Nested undocumented function has alias.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/virtual.js"]});
		is('symbols[1].name', "twiddle.flick", 'Virtual doclet name can be found.');
		is('symbols[1].isa', "FUNCTION", 'Virtual doclet isa can be found.');
		is('symbols[1].desc', "Twiddle the given flick.", 'Virtual doclet desc can be found.');
		//is('symbols[1].doc.tags.length', 0, 'Virtual doclet should have no tags.');
		
		is('symbols[2].name', "zipZap", 'Undocumented function following virtual doclet name can be found.');
		
		is('symbols[3].name', "Concat", 'Virtual function doclet name can be found.');
		is('symbols[3].isa', "CONSTRUCTOR", 'Virtual function doclet isa can be found.');
		//is('symbols[3].doc.tags.length', 0, 'Virtual function doclet should have no tags.');
		is('symbols[3].params[0].name', "strX", 'Virtual function parameter name can be found.');
		
		is('symbols[4].memberof', "Concat", 'Virtual function can define memberOf.');
		is('symbols[4].alias', "Concat.join", 'Virtual function alias reflects memberOf tag.');
		is('symbols[3].methods[0].name', "join", 'Virtual function appears as method in parent object.');
		
		is('symbols[5].memberof', "Concat", 'Virtual property can define memberOf.');
		is('symbols[5].alias', "Concat.separator", 'Virtual property alias reflects memberOf tag.');
		is('symbols[3].properties[0].name', "separator", 'Virtual property appears as property in parent object.');
		is('symbols[5].type', "String", 'Virtual property can specify its type.');
		
		is('symbols[7].alias', "Employee.employeeId", 'Virtual property inside a function can be seen.');
		is('symbols[6].properties[0].name', "employeeId", 'Virtual property inside a function appears as property.');
	
		is('symbols[8].alias', "Document.title", 'Virtual object inside an object literal can be seen.');
	},
	function() {
		symbolize({A: true, _: [__DIR__+"test/data/properties.js"]});
		is('symbols[2].properties[0].name', "methodId", 'Property in doc comment is added to parent.');
		is('symbols[2].properties[0].type', "Number", 'Property in doc comment has type.');
		
		is('symbols[2].properties[0].desc', "The id of the method.", 'Property in doc comment has description.');
		is('symbols[2].properties[3].desc', "Only used in older browsers.", 'Property in code body has description.');

		is('symbols[2].properties[1].name', "_associated_with", 'Property in code body is added to parent.');
		is('symbols[2].properties.length', 5, 'All properties in code body are added to parent.');
		is('symbols[2].methods[0].name', "associated_with", 'Method in code body is added to parent.');
		is('symbols[3].alias', "Codework.Method._associated_with", 'Property appears as own symbol.');
		is('symbols[3].isa', "OBJECT", 'Property symbol is a object.');
		is('symbols[3].type', "Object", 'Property symbol has type.');
		is('symbols[7].alias', "Codework.Method.associated_with", 'Method appears as own symbol.');
		is('symbols[7].isa', "FUNCTION", 'Method symbol is a function.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/memberof.js"]});
		is('symbols[2].name', "SquareMaker", 'Constructor member name can be found.');
		is('symbols[2].memberof', "ShapeFactory", 'Constructor which is a member of another constructor identified.');
		is('symbols[3].name', "Square", 'Nested constructor member name can be found.');
		is('symbols[3].memberof', "ShapeFactory.SquareMaker", 'Nested constructor which is a member of another constructor identified.');
		is('symbols[6].isa', "CONSTRUCTOR", 'Class tag is a synonym for constructor.');
		is('symbols[6].properties[1].alias', "Circle.getDiameter", 'Member tag is a synonym for memberof.');
	},
	function() {
		symbolize({_: [__DIR__+"test/data/underscore.js"]});
		is('symbols.length', 1, 'No undocumented symbols allowed without -a or -A.');
		
		symbolize({a: true, _: [__DIR__+"test/data/underscore.js"]});
		is('symbols.length', 4, 'No undocumented, underscored symbols allowed with -a but not -A.');
	
		symbolize({A: true, _: [__DIR__+"test/data/underscore.js"]});
		is('symbols.length', 6, 'All undocumented symbols allowed with -A.');
		is('symbols[1].methods[1].name', "_debug", 'Undocumented, underscored methods allowed with -A.');
	},
	function() {
		symbolize({_: [__DIR__+"test/data/allfuncs_option.js"]});
		is('symbols.length', 3, 'Documented method of undocumented and underscored parents found without -a or -A.');
		is('symbols[1].alias', "Action.passTo", 'Documented method of undocumented parent alias includes parent.');
		is('symbols[2].alias', "_Log.dump", 'Documented method of underscored parent alias includes parent.');

		symbolize({A: true, _: [__DIR__+"test/data/allfuncs_option.js"]});
		is('symbols.length', 6, 'All functions found with -A.');
	},
	function() {
		symbolize({_: [__DIR__+"test/data/ignore.js"]});
		is('symbols.length', 1, 'Ignored and private functions are unseen without -p, -a or -A.');	

 		symbolize({A: true, _: [__DIR__+"test/data/ignore.js"]});
 		is('symbols.length', 4, 'Ignored functions are unseen with -A.');
 		is('symbols[1].alias', "Log.warn", 'Ignored parent has visible method with -A.');
 		is('symbols[3].alias', "Action.passTo", 'Ignored method is unseen with -A.');

		symbolize({p: true, A: true, _: [__DIR__+"test/data/ignore.js"]});
 		is('symbols.length', 5, 'Private functions are seen with -p.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/returns.js"]});

		is('symbols[1].returns.length', 1, 'A return tag appears in the returns array.');
		//is('symbols[1].doc.tags.length', 0, 'A return tag does not appear in the tags array.');
		is('symbols[1].returns[0].type', "Array, String", 'A return type can contain multiple values and whitespaces.');
		is('symbols[2].returns.length', 2, 'Multiple return tags are all found.');
		is('symbols[3].returns[0].desc', "Characters from the file.", 'Returns is a synonym for return.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/params.js"]});

		is('symbols[1].params.length', 1, 'A param tag appears in the params array.');
		is('symbols[1].params[0].type', "String, Array", 'A param type can contain multiple values and whitespaces.');
		is('symbols[2].params.length', 3, 'Undocumented param tags appear in the params array.');
		is('symbols[2].signature()', "source, format, target", 'Can get params as a signature.');
		is('symbols[3].params[0].type', "String", 'A param type can come after the name.');
		is('symbols[3].params[0].name', "tag", 'A param name can come before the type.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/scope.js"]});
		
		is('symbols[1].alias', "Record.getRecord", 'Scope recognized as part of alias with new function(){} syntax.');
		is('symbols[1].name', "Record.getRecord", 'Scope recognized as part of name with new function(){} syntax.');
		is('symbols[2].alias', "Record.getRecord.Reader", 'Scope recognized as part of method with new function(){} syntax');
		is('symbols[3].alias', "File.getId", 'Scope recognized as part of name with function(){}() syntax.');
		is('symbols[4].alias', "Entry.getSubject", 'Scope recognized as part of method name with function(){}() syntax.');
		is('symbols[5].alias', "dojo.widget.Widget.initializer", 'Scope within argument list is recognized.');
		is('symbols[8].alias', "dojo.widget.Widget.doIt", 'Scope set to prototype is recognized.');
		is('symbols[8].memberof', "dojo.widget.Widget", 'Scope set to prototype is a method, not static function.');
		is('symbols[9].alias', "extra.widget.doIt", 'Scope set to more than one container is recognized.');
		
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/framework.js"]});
		
		is('symbols[2].alias', "Dragger.scroll", 'Scope recognized as part of method inside param call.');
		is('symbols[3].alias', "Dragger.onChange", 'Function inside param call recognized when labelled function.');
		is('symbols[4].alias', "Dragger.onUpdate", 'Method inside param call recognized when virtual.');
		is('symbols[4].memberof', "Dragger", 'Method inside param call has memberof when virtual.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/throws.js"]});
		
		is('symbols[1].exceptions[0]', "This is the label text.", 'Throws can be found.');
		is('symbols[2].exceptions[0].type', "OutOfMemory", 'Exception is a synonym for throws.');
		is('symbols[3].exceptions[0].type', "IOException", 'Multiple exception tags allowed, first.');
		is('symbols[3].exceptions[1].type', "PermissionDenied", 'Multiple exception tags allowed, second.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/augments.js", __DIR__+"test/data/augments2.js"]});
//print(Dumper.dump(symbols));			
		is('symbols[5].augments[0]', "Layout", 'An augmented class can be found.');
		is('symbols[5].methods[0].alias', "Page.reset", 'Method of augmenter can be found.');
		is('symbols[5].methods[1].alias', "Layout.init", 'Method from augmented can be found.');
		is('symbols[5].properties[0].alias', "Layout.orientation", 'Property from augmented can be found.');
		is('symbols[5].methods.length', 3, 'Methods of augmented class are included in methods array.');
		
		is('symbols[7].augments[0]', "Page", 'The extends tag is a synonym for augments.');
		is('symbols[7].methods[0].alias', "ThreeColumnPage.init", 'Local method overrides augmented method of same name.');
		is('symbols[7].methods.length', 3, 'Local method count is right.');
		
		
		is('symbols[13].augments[0]', "ThreeColumnPage", 'Can augment across file boundaries.');
		is('symbols[13].augments.length', 2, 'Multiple augments are supported.');
		is('symbols[13].inherits[0]', "Junkmail.annoy", 'Inherited method with augments.');
		is('symbols[13].methods.length', 6, 'Methods of augmented class are included in methods array across files.');
		is('symbols[13].properties.length', 1, 'Properties of augmented class are included in properties array across files.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/nested_funcs.js"]});
		
		is('symbols[1].alias', "Foo", 'An enclosing function is seen.');
		is('symbols[2].alias', "Foo.methodOne", 'A nested function attached to the enclosing prototype is seen.');
		is('symbols[3].alias', "Foo.methodTwo", 'A second nested method is seen.');
		is('symbols.length', 4, 'Nested functions unattached to the enclosing prototype is not seen.');
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/events.js"]});
		
		is('symbols[1].getEvents().length', 1, 'An event appears in the array returned by getEvents().');
		is('symbols[1].getEvents()[0].isa', 'FUNCTION', 'The event isa FUNCTION.');
		is('symbols[1].getEvents()[0].isEvent', true, 'The event isEvent is true.');
		is('symbols[1].getEvents()[0].alias', 'Header.changeHeaderEvent', 'The name of the event can be is seen.');

	},
	function() {
		symbolize({A: true, _: [__DIR__+"test/data/function_property.js"]});
		
		is('symbols[1].isa', 'OBJECT', 'Inline functions that are evaluated are objects.');
		is('symbols[2].isa', 'FUNCTION', 'Inline functions that are not evaluated are functions.');
		is('symbols[2].alias', 'WH.FLAG.w3c.getLevel', 'Nested functions inside inline functions that are evaluated are objects are found.');
		is('symbols[3].isa', 'FUNCTION', 'Inline functions that are not evaluated are functions.');

	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/namespace.js"]});

		is('symbols[1].name', 'Filebox.View', 'The name of a namespace is found.');
		is('symbols[1].methods.length', 3, 'All methods of the namespace are found.');
		is('symbols[1].methods[0].name', 'lookup', 'The name of the method found.');
		is('symbols[1].methods[2].memberof', 'Filebox.View', 'The parent of the method is recognized.');

	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/config.js"]});
		
		is('symbols[1].params[0].name', 'person', 'The name of a configuration parameter can be found.');
		is('symbols[1].params[0].properties[0].name', 'person.name', 'The name of a property of a configuration parameter is found.');
		is('symbols[1].params[0].properties[0].type', 'string', 'The type of an non-optional property of a configuration parameter is found.');
		is('symbols[1].params[0].properties[0].isOptional', false, 'An non-optional property of a configuration parameter is marked as optional.');
		is('symbols[1].params[0].properties[1].type', 'integer', 'The type of an optional property of a configuration parameter is found.');
		is('symbols[1].params[0].properties[1].isOptional', true, 'An optional property of a configuration parameter is marked as optional.');
		
		is('symbols[1].params[1].name', 'connection', 'The name of a second configuration parameter can be found.');
		is('symbols[1].params[1].properties[1].name', 'connection.URL', 'The dotted name of a configuration parameter is not altered.');
		is('symbols[1].params[1].properties[0].defaultValue', 'http', 'The default value of an optional configuration parameter is found.');
				
	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/params_optional.js"]});

		is('symbols[1].params[0].name', 'pages', 'The name of a non-optional parameter can be found.');
		is('symbols[1].params[0].defaultValue', '', 'The default value of a non-optional parameter is "".');
		is('symbols[1].params[1].name', 'id', 'The name of an optional parameter is found.');
		is('symbols[1].params[1].isOptional', true, 'An optional parameter is marked as optional.');
		is('symbols[1].params[1].defaultValue', '', 'The default value of an optional parameter with no default is "".');
		is('symbols[1].params[2].name', 'title', 'The name of an optional parameter with a default is found.');
		is('symbols[1].params[2].defaultValue', "This is untitled.", 'The default value of an optional parameter with a default is found.');

	},
	function() {
		symbolize({a: true, _: [__DIR__+"test/data/shared.js"]});

		is('symbols[2].name', 'some', 'The name of a symbol in a shared section is found.');
		is('symbols[2].alias', 'Array.some', 'The alias of a symbol in a shared section is found.');
		is('symbols[2].desc', "Extension to builtin array.", 'A description can be shared.');
		is('symbols[3].desc', "Extension to builtin array.\nChange every element of an array.", 'A shared description is appended.');
		is('symbols[4].desc', "A first in, first out data structure.", 'A description is not shared when outside a shared section.');
	}/*,
	function() {
		opt = {a: true};
		symbolize(__DIR__+"test/data/shortcuts.js");
		print(Dumper.dump(jsdoc));
		is('symbols[1].alias', 'Date.locale', 'Shortcut with prototype is applied.');
		is('symbols[1].memberof', 'Date', 'memberOf of shortcut with prototype is applied.');
		is('symbols[2].alias', 'Number.nth', 'Shortcut can contain regex meta characters.');
		is('symbols[3].alias', 'LOAD.file', 'Shortcut pattern is only applied to beginning of names.');

	}*/
];


//// run and print results

print(testrun(testCases));
