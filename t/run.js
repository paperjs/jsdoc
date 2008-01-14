try { importClass(java.lang.System); }
catch (e) { throw "RuntimeException: The class java.lang.System is required to run this script."; }

var userDir  = System.getProperty("user.dir");
var envrDir  = (System.getProperty("jsdoc.dir")||System.getProperty("jsdoc_dir"));
var javaLibs = (System.getProperty("java.library.path")).split(":");
var libDirs = [userDir].concat(envrDir, javaLibs);
var jsdocDir = ["jsdoc-toolkit", "../jsdoc-toolkit"];
var libErrors = [];

for(var i = 0, l = libDirs.length; i < l; i++) {
	for (var j = 0, jl = jsdocDir.length; j < jl; j++) {
		var appRootPath = libDirs[i]+Packages.java.io.File.separator+jsdocDir[j]+Packages.java.io.File.separator;
		if(!Packages.java.io.File(appRootPath).exists()) {
			libErrors.push("Could not find: ["+appRootPath+"]");
		}
		else {
			__DIR__ = new String(appRootPath);
			break;
		}
	}
}

load(__DIR__+"app/frame.js");
load(__DIR__+"app/lib/JSDOC.js");
include(__DIR__+"app/frame/Dumper.js");
include(__DIR__+"t/JsTestrun.js");

function symbolize(opt) {
	jsdoc = null;
	symbols = null;
	jsdoc = new JSDOC.JsDoc(opt);
	symbols = jsdoc.symbolGroup.getSymbols();
}


var testCases = [
	function() {
		symbolize({a:true, p:true, _: [__DIR__+"t/data/prototype.js"]});
//print(Dumper.dump(symbols));		
		is('symbols[0].name', "Article", 'Function set to constructor prototype with inner constructor name is found.');
		is('symbols[0].methods[0].name', "init", 'The initializer method name of prototype function is correct.');
		is('symbols[0].properties[0].name', "title", 'A property set on the initializer "this"  is on the outer constructor.');
		is('symbols[3].name', "counter", 'A static property set in the initializer has the name set correctly.');
		is('symbols[3].memberof', "Article", 'A static property set in the initializer has the memberof set correctly.');
		is('symbols[3].isStatic', true, 'A static property set in the initializer has isStatic set to true.');

	}
	,
	function() {
		symbolize({a:true, _: [__DIR__+"t/data/prototype_oblit.js"]});
		
		is('symbols[0].name', "Article", 'Oblit set to constructor prototype name is found.');
		is('symbols[0].memberof', "", 'The memberof of prototype oblit is correct.');
		is('symbols[0].methods[0].name', "getTitle", 'The nonstatic method name of prototype oblit is correct.');
		is('symbols[0].methods[0].isStatic', false, 'The isStatic of a nonstatic method of prototype oblit is correct.');
		is('symbols[0].methods[1].name', "getTitle", 'The static method name of prototype oblit is correct.');
		is('symbols[0].methods[1].isStatic', true, 'The isStatic of a static method of prototype oblit is correct.');
		is('symbols[1].alias', "Article#getTitle", 'The alias of non-static method of prototype oblit is correct.');
		is('symbols[1].isa', "FUNCTION", 'The isa of non-static method of prototype oblit is correct.');
		is('symbols[2].alias', "Article.getTitle", 'The alias of a static method of prototype oblit is correct.');
		is('symbols[1].isa', "FUNCTION", 'The isa of static method of prototype oblit is correct.');
	}
	,
	function() {
		symbolize({a:true, p:true, _: [__DIR__+"t/data/prototype_oblit_constructor.js"]});
		
		is('symbols[0].name', "Article", 'Oblit set to constructor prototype with inner constructor name is found.');
		is('symbols[0].methods[0].name', "init", 'The initializer method name of prototype oblit is correct.');
		is('symbols[0].properties[0].name', "pages", 'Property set by initializer method "this" is on the outer constructor.');
		is('symbols[1].name', "Title", 'Name of the inner constructor name is found.');
		is('symbols[1].memberof', "Article", 'The memberof of the inner constructor name is found.');
		is('symbols[1].isa', "CONSTRUCTOR", 'The isa of the inner constructor name is constructor.');
		is('symbols[1].properties[0].name', "title", 'A property set on the inner constructor "this"  is on the inner constructor.');
	}
	,
	function() {
		symbolize({a:true, p:true, _: [__DIR__+"t/data/inner.js"]});
		
		is('symbols[0].name', "Outer", 'Outer constructor prototype name is found.');
		is('symbols[0].methods.length', 1, 'Inner function doesnt appear as a method of the outer.');
		is('symbols[0].methods[0].alias', "Outer#open", 'Outer constructors methods arent affected by inner function.');
		is('symbols[1].alias', "Outer-Inner", 'Alias of inner function is found.');
		is('symbols[1].isa', "CONSTRUCTOR", 'isa of inner function constructor is found.');
		is('symbols[1].memberof', "Outer", 'The memberof of inner function is found.');
		is('symbols[1].name', "Inner", 'The name of inner function is found.');
		is('symbols[2].name', "name", 'A member of the inner function constructor, attached to "this" is found on inner.');
		is('symbols[2].memberof', "Outer-Inner", 'The memberof of an inner function member is found.');		
	}
	,
	function() {
		symbolize({a:true, _: [__DIR__+"t/data/prototype_nested.js"]});
		
		is('symbols[0].name', "Word", 'Base constructor name is found.');
		is('symbols[0].methods[0].name', "reverse", 'Base constructor method is found.');
		is('symbols[0].methods.length', 1, 'Base constructor has only one method.');
		is('symbols[0].memberof', "", 'Base constructor memberof is empty.');
		is('symbols[1].name', "reverse", 'Member of constructor prototype name is found.');
		is('symbols[1].memberof', "Word", 'Member of constructor prototype memberof is found.');
		is('symbols[1].methods[0].name', "utf8", 'Member of constructor prototype method name is found.');
		is('symbols[2].name', "utf8", 'Static nested member name is found.');
		is('symbols[2].memberof', "Word#reverse", 'Static nested member memberof is found.');
	}
	,
	function() {
		symbolize({a:true, _: [__DIR__+"t/data/namespace_nested.js"]});
		
		is('symbols[0].name', "ns1", 'Base namespace name is found.');
		is('symbols[0].memberof', "", 'Base namespace memberof is empty (its a constructor).');
		is('symbols[1].name', "ns2", 'Nested namespace name is found.');
		is('symbols[1].alias', "ns1.ns2", 'Nested namespace alias is found.');
		is('symbols[1].memberof', "ns1", 'Nested namespace memberof is found.');
		is('symbols[2].name', "Function1", 'Method of nested namespace name is found.');
		is('symbols[2].memberof', "ns1.ns2", 'Constructor of nested namespace memberof is found.');			
	}
	,
	function() {
		symbolize({a:true, p:true, _: [__DIR__+"t/data/functions_nested.js"]});
		
		is('symbols[0].name', "Zop", 'Any constructor name is found.');
		is('symbols[0].isa', "CONSTRUCTOR", 'It isa constructor.');
		is('symbols[0].methods[0].name', "zap", 'Its method name, set later, is in methods array.');
		is('symbols[1].name', "Foo", 'Containing constructor name is found.');
		is('symbols[1].methods[0].name', "methodOne", 'Its method name is found.');
		is('symbols[1].methods[1].name', "methodTwo", 'Its second method name is found.');
		is('symbols[2].alias', "Foo#methodOne", 'A methods alias is found.');
		is('symbols[2].isStatic', false, 'A methods is not static.');
		is('symbols[4].name', "Bar", 'A function set inside another function is found.');
		is('symbols[4].isa', "FUNCTION", 'It isa function.');
		is('symbols[6].name', "inner", 'An inner functions name is found.');
		is('symbols[6].memberof', "Foo", 'It is member of the outer function.');
		is('symbols[6].isInner', true, 'It is an inner function.');
		is('symbols[6].alias', "Foo-inner", 'The inner functions alias is found.');
	}
	,
	function() {
		symbolize({a:true, _: [__DIR__+"t/data/memberof_constructor.js"]});
		
		is('symbols[1].name', "Tangent", 'Constructor set on prototype using @member has correct name.');
		is('symbols[1].memberof', "Circle", 'Constructor set on prototype using @member has correct memberof.');
		is('symbols[1].alias', "Circle#Tangent", 'Constructor set on prototype using @member has correct alias.');
		is('symbols[1].isa', "CONSTRUCTOR", 'Constructor set on prototype using @member has correct isa.');
		is('symbols[1].isStatic', false, 'Constructor set on prototype using @member is not static.');
		is('symbols[2].name', "getDiameter", 'Method set on prototype using @member has correct name.');
		is('symbols[2].memberof', "Circle#Tangent", 'Method set on prototype using @member has correct memberof.');
		is('symbols[2].alias', "Circle#Tangent#getDiameter", 'Method set on prototype using @member has correct alias.');
		is('symbols[2].isa', "FUNCTION", 'Method set on prototype using @member has correct isa.');
		is('symbols[2].isStatic', false, 'Method set on prototype using @member is not static.');
	}
	,
	function() {
		symbolize({a:true, _: [__DIR__+"t/data/inherits.js"]});
//print(Dumper.dump(symbols));		
		is('symbols[0].name', "Layout", 'Constructor can be found.');
		is('symbols[0].methods[0].name', "init", 'Constructor method name can be found.');
		is('symbols[0].properties[0].name', "orientation", 'Constructor property name can be found.');
		is('symbols[4].methods[0].name', "reset", 'Second constructor method name can be found.');
		is('symbols[4].properties[0].name', "orientation", 'Second constructor inherited property name can be found in properties.');
		is('symbols[4].properties[0].memberof', "Layout", 'Second constructor inherited property memberof can be found.');
		is('symbols[6].methods[0].alias', "ThreeColumnPage#init", 'Third constructor method can be found even though method with same name is inherited.');
		is('symbols[6].methods[1].alias', "Page#reset", 'Inherited method can be found.');
		is('symbols[6].properties[0].alias', "Layout#orientation", 'Twice inherited method can be found.');
	
	}
	,
	function() {
		symbolize({a: true, _: [__DIR__+"t/data/augments.js", __DIR__+"t/data/augments2.js"]});
		
		is('symbols[4].augments[0]', "Layout", 'An augmented class can be found.');
		is('symbols[4].methods[0].alias', "Page#reset", 'Method of augmenter can be found.');
		is('symbols[4].methods[1].alias', "Layout#init", 'Method from augmented can be found.');
		is('symbols[4].properties[0].alias', "Layout#orientation", 'Property from augmented can be found.');
		is('symbols[4].methods.length', 3, 'Methods of augmented class are included in methods array.');
		
		is('symbols[6].augments[0]', "Page", 'The extends tag is a synonym for augments.');
		is('symbols[6].methods[0].alias', "ThreeColumnPage#init", 'Local method overrides augmented method of same name.');
		is('symbols[6].methods.length', 3, 'Local method count is right.');
		
		is('symbols[12].augments[0]', "ThreeColumnPage", 'Can augment across file boundaries.');
		is('symbols[12].augments.length', 2, 'Multiple augments are supported.');
		is('symbols[12].inherits[0]', "Junkmail#annoy", 'Inherited method with augments.');
		is('symbols[12].methods.length', 6, 'Methods of augmented class are included in methods array across files.');
		is('symbols[12].properties.length', 1, 'Properties of augmented class are included in properties array across files.');
	}
	,

	function() {
		symbolize({a:true, _: [__DIR__+"t/data/static_this.js"]});
		
		is('symbols[0].name', "box.holder", 'Static namespace name can be found.');
		is('symbols[1].name', "foo", 'Static namespace method name can be found.');
		is('symbols[1].isStatic', true, 'Static namespace method is static.');
		
		is('symbols[2].name', "counter", 'Instance namespace property name set on "this" can be found.');
		is('symbols[2].alias', "box.holder#counter", 'Instance namespace property alias set on "this" can be found.');
		is('symbols[2].memberof', "box.holder", 'Static namespace property memberof set on "this" can be found.');
	}
	,
	function() {
		symbolize({a:true, _: [__DIR__+"t/data/scope.js"]});

		is('symbols[0].name', "Person", 'Class defined in scope comment is found.');
		is('symbols[0].methods[0].name', "initialize", 'Scoped instance method name can be found.');
		is('symbols[0].methods[1].name', "say", 'Second instance method can be found.');
		is('symbols[0].methods[1].isStatic', false, 'Instance method is known to be not static.');
		
		is('symbols[0].methods[2].name', "sing", 'Instance method name from second scope comment can be found.');
		is('symbols[4].name', "getCount", 'Static method name from second scope comment can be found.');
		is('symbols[4].isStatic', true, 'Static method from second scope comment is known to be static.');
		
		is('symbols[5].name', "Unknown.isok", 'Static instance method from scope comment is kept.');
		is('symbols[6].name', "Global", 'Orphaned instance method from scope comment is discarded.');
	}
	,
	function() {
		symbolize({a:true, _: [__DIR__+"t/data/param_inline.js"]});
	
		is('symbols[0].params[0].type', "int", 'Inline param name is set.');
		is('symbols[0].params[0].desc', "The number of columns.", 'Inline param desc is set from comment.');
		is('symbols[1].params[0].name', "elName", 'Order of param documentation is not important.');
		is('symbols[1].params[0].isOptional', false, 'Default for param is to not be optional.');
		is('symbols[1].params[1].isOptional', true, 'Can mark a param as being optional.');
		is('symbols[1].params[1].type', "number, string", 'Type of inline param doc can have multiple values.');
		is('symbols[2].params[0].type', "", 'Type can be not defined for some params.');
		is('symbols[2].params[2].type', "int", 'Type can be defined inline for only some params.');
		is('symbols[4].params.length', 0, 'Doccomments inside function sig is ignored without a param.');
		is('symbols[5].params[2].type', "zoppler", 'Doccomments type overrides inline type for param with same name.');
	}
	,
	function() {
		symbolize({a: true, _: [__DIR__+"t/data/shared.js", __DIR__+"t/data/shared2.js"]});

		is('symbols[1].name', 'some', 'The name of a symbol in a shared section is found.');
		is('symbols[1].alias', 'Array#some', 'The alias of a symbol in a shared section is found.');
		is('symbols[1].desc', "Extension to builtin array.", 'A description can be shared.');
		is('symbols[2].desc', "Extension to builtin array.\nChange every element of an array.", 'A shared description is appended.');
		is('symbols[3].desc', "A first in, first out data structure.", 'A description is not shared when outside a shared section.');
		is('symbols[4].alias', "Queue.rewind", 'Second shared tag can be started.');
		is('symbols[5].alias', "Global#startOver", 'Shared tag doesnt cross over files.');
	
	}
];


//// run and print results
print(testrun(testCases));
