load("app/frame/Dumper.js");
function symbolize(opt) {
	//jsdoc = null;
	symbols = null;
	jsdoc = new JSDOC.JsDoc(opt);
	symbols = jsdoc.symbolSet;
}


var testCases = [
	function() {
		symbolize({_: [SYS.pwd+"test/name.js"]});

		is('symbols.getSymbol("Response").name', "Response", 'Virtual class name is found.');
		is('symbols.getSymbol("Response#text").alias', "Response#text", 'Virtual method name is found.');
		is('symbols.getSymbol("Response#text").memberOf', "Response", 'Virtual method parent name is found.');
	}
	,
	function() {
		symbolize({a:true, p:true, _: [SYS.pwd+"test/prototype.js"]});

		is('symbols.getSymbol("Article").name', "Article", 'Function set to constructor prototype with inner constructor name is found.');
		is('symbols.getSymbol("Article").hasMethod("init")', true, 'The initializer method name of prototype function is correct.');
		is('symbols.getSymbol("Article").hasMember("counter")', true, 'A static property set in the prototype definition is found.');
		is('symbols.getSymbol("Article").hasMember("title")', true, 'An instance property set in the prototype is found.');
		is('symbols.getSymbol("Article#title").isStatic', false, 'An instance property has isStatic set to false.');
		is('symbols.getSymbol("Article.counter").name', "counter", 'A static property set in the initializer has the name set correctly.');
		is('symbols.getSymbol("Article.counter").memberOf', "Article", 'A static property set in the initializer has the memberOf set correctly.');
		is('symbols.getSymbol("Article.counter").isStatic', true, 'A static property set in the initializer has isStatic set to true.');
	}
	,
	function() {
		symbolize({a:true, _: [SYS.pwd+"test/prototype_oblit.js"]});
		
		is('symbols.getSymbol("Article").name', "Article", 'Oblit set to constructor prototype name is found.');
		is('typeof symbols.getSymbol("Article.prototype")', "undefined", 'The prototype oblit is not a symbol.');
		is('symbols.getSymbol("Article#getTitle").name', "getTitle", 'The nonstatic method name of prototype oblit is correct.');
		is('symbols.getSymbol("Article#getTitle").alias', "Article#getTitle", 'The alias of non-static method of prototype oblit is correct.');
		is('symbols.getSymbol("Article#getTitle").isStatic', false, 'The isStatic of a nonstatic method of prototype oblit is correct.');
		is('symbols.getSymbol("Article.getTitle").name', "getTitle", 'The static method name of prototype oblit is correct.');
		is('symbols.getSymbol("Article.getTitle").isStatic', true, 'The isStatic of a static method of prototype oblit is correct.');
		is('symbols.getSymbol("Article#getTitle").isa', "FUNCTION", 'The isa of non-static method of prototype oblit is correct.');
		is('symbols.getSymbol("Article.getTitle").alias', "Article.getTitle", 'The alias of a static method of prototype oblit is correct.');
		is('symbols.getSymbol("Article.getTitle").isa', "FUNCTION", 'The isa of static method of prototype oblit is correct.');
	}
	,
	function() {
		symbolize({a:true, p:true, _: [SYS.pwd+"test/prototype_oblit_constructor.js"]});
		
		is('symbols.getSymbol("Article").name', "Article", 'Oblit set to constructor prototype with inner constructor name is found.');
		is('symbols.getSymbol("Article#init").name', "init", 'The initializer method name of prototype oblit is correct.');
		is('symbols.getSymbol("Article").hasMember("pages")', true, 'Property set by initializer method "this" is on the outer constructor.');
		is('symbols.getSymbol("Article#Title").name', "Title", 'Name of the inner constructor name is found.');
		is('symbols.getSymbol("Article#Title").memberOf', "Article", 'The memberOf of the inner constructor name is found.');
		is('symbols.getSymbol("Article#Title").isa', "CONSTRUCTOR", 'The isa of the inner constructor name is constructor.');
		is('symbols.getSymbol("Article#Title").hasMember("title")', true, 'A property set on the inner constructor "this"  is on the inner constructor.');
	}
	,
	function() {
		symbolize({a:true, p:true, _: [SYS.pwd+"test/inner.js"]});
		
		is('symbols.getSymbol("Outer").name', "Outer", 'Outer constructor prototype name is found.');
		is('symbols.getSymbol("Outer").methods.length', 1, 'Inner function doesnt appear as a method of the outer.');
		is('symbols.getSymbol("Outer").hasMethod("open")', true, 'Outer constructors methods arent affected by inner function.');
		is('symbols.getSymbol("Outer-Inner").alias', "Outer-Inner", 'Alias of inner function is found.');
		is('symbols.getSymbol("Outer-Inner").isa', "CONSTRUCTOR", 'isa of inner function constructor is found.');
		is('symbols.getSymbol("Outer-Inner").memberOf', "Outer", 'The memberOf of inner function is found.');
		is('symbols.getSymbol("Outer-Inner").name', "Inner", 'The name of inner function is found.');
		is('symbols.getSymbol("Outer-Inner#name").name', "name", 'A member of the inner function constructor, attached to "this" is found on inner.');
		is('symbols.getSymbol("Outer-Inner#name").memberOf', "Outer-Inner", 'The memberOf of an inner function member is found.');		
	}
	,
	function() {
		symbolize({a:true, _: [SYS.pwd+"test/prototype_nested.js"]});
		
		is('symbols.getSymbol("Word").name', "Word", 'Base constructor name is found.');
		is('symbols.getSymbol("Word").hasMethod("reverse")', true, 'Base constructor method is found.');
		is('symbols.getSymbol("Word").methods.length', 1, 'Base constructor has only one method.');
		is('symbols.getSymbol("Word").memberOf', "", 'Base constructor memberOf is empty.');
		is('symbols.getSymbol("Word#reverse").name', "reverse", 'Member of constructor prototype name is found.');
		is('symbols.getSymbol("Word#reverse").memberOf', "Word", 'Member of constructor prototype memberOf is found.');
		is('symbols.getSymbol("Word#reverse.utf8").name', "utf8", 'Member of constructor prototype method name is found.');
		is('symbols.getSymbol("Word#reverse.utf8").memberOf', "Word#reverse", 'Static nested member memberOf is found.');
	}
	,
	function() {
		symbolize({a:true, _: [SYS.pwd+"test/namespace_nested.js"]});
		
		is('symbols.getSymbol("ns1").name', "ns1", 'Base namespace name is found.');
		is('symbols.getSymbol("ns1").memberOf', "", 'Base namespace memberOf is empty (its a constructor).');
		is('symbols.getSymbol("ns1.ns2").name', "ns2", 'Nested namespace name is found.');
 		is('symbols.getSymbol("ns1.ns2").alias', "ns1.ns2", 'Nested namespace alias is found.');
 		is('symbols.getSymbol("ns1.ns2").memberOf', "ns1", 'Nested namespace memberOf is found.');
 		is('symbols.getSymbol("ns1.ns2.Function1").name', "Function1", 'Method of nested namespace name is found.');
 		is('symbols.getSymbol("ns1.ns2.Function1").memberOf', "ns1.ns2", 'Constructor of nested namespace memberOf is found.');			
	}
	,
	function() {
		symbolize({a:true, p:true, _: [SYS.pwd+"test/functions_nested.js"]});
		
		is('symbols.getSymbol("Zop").name', "Zop", 'Any constructor name is found.');
		is('symbols.getSymbol("Zop").isa', "CONSTRUCTOR", 'It isa constructor.');
		is('symbols.getSymbol("Zop").hasMethod("zap")', true, 'Its method name, set later, is in methods array.');
		is('symbols.getSymbol("Foo").name', "Foo", 'The containing constructor name is found.');
		is('symbols.getSymbol("Foo").hasMethod("methodOne")', true, 'Its method name is found.');
		is('symbols.getSymbol("Foo").hasMethod("methodTwo")', true, 'Its second method name is found.');
		is('symbols.getSymbol("Foo#methodOne").alias', "Foo#methodOne", 'A methods alias is found.');
		is('symbols.getSymbol("Foo#methodOne").isStatic', false, 'A methods is not static.');
		is('symbols.getSymbol("Bar").name', "Bar", 'A global function declared inside another function is found.');
		is('symbols.getSymbol("Bar").isa', "FUNCTION", 'It isa function.');
		is('symbols.getSymbol("Bar").memberOf', "", 'It is global.');
		is('symbols.getSymbol("Foo-inner").name', "inner", 'An inner functions name is found.');
		is('symbols.getSymbol("Foo-inner").memberOf', "Foo", 'It is member of the outer function.');
		is('symbols.getSymbol("Foo-inner").isInner', true, 'It is an inner function.');
	}
	,
	function() {
		symbolize({a:true, _: [SYS.pwd+"test/memberof_constructor.js"]});
		
		is('symbols.getSymbol("Circle#Tangent").name', "Tangent", 'Constructor set on prototype using @member has correct name.');
 		is('symbols.getSymbol("Circle#Tangent").memberOf', "Circle", 'Constructor set on prototype using @member has correct memberOf.');
 		is('symbols.getSymbol("Circle#Tangent").alias', "Circle#Tangent", 'Constructor set on prototype using @member has correct alias.');
 		is('symbols.getSymbol("Circle#Tangent").isa', "CONSTRUCTOR", 'Constructor set on prototype using @member has correct isa.');
		is('symbols.getSymbol("Circle#Tangent").isStatic', false, 'Constructor set on prototype using @member is not static.');
		is('symbols.getSymbol("Circle#Tangent#getDiameter").name', "getDiameter", 'Method set on prototype using @member has correct name.');
		is('symbols.getSymbol("Circle#Tangent#getDiameter").memberOf', "Circle#Tangent", 'Method set on prototype using @member has correct memberOf.');
		is('symbols.getSymbol("Circle#Tangent#getDiameter").alias', "Circle#Tangent#getDiameter", 'Method set on prototype using @member has correct alias.');
		is('symbols.getSymbol("Circle#Tangent#getDiameter").isa', "FUNCTION", 'Method set on prototype using @member has correct isa.');
		is('symbols.getSymbol("Circle#Tangent#getDiameter").isStatic', false, 'Method set on prototype using @member is not static.');
	}
	,
	function() {
		symbolize({a:true, _: [SYS.pwd+"test/memberof.js"]});
		
		is('symbols.getSymbol("pack.install").alias', "pack.install", 'Using @memberOf sets alias, when parent name is in memberOf tag.');
		is('symbols.getSymbol("pack.install.overwrite").name', "install.overwrite", 'Using @memberOf sets name, even if the name is dotted.');
		is('symbols.getSymbol("pack.install.overwrite").memberOf', "pack", 'Using @memberOf sets memberOf.');
 		is('symbols.getSymbol("pack.install.overwrite").isStatic', true, 'Using @memberOf with value not ending in octothorp sets isStatic to true.');
	}
/*	,
	function() {
		symbolize({a:true, p:true, _: [SYS.pwd+"test/borrows.js"]});
//print(Dumper.dump(symbols));
		is('symbols[1].name', "Layout", 'Constructor can be found.');
		is('symbols[1].methods[0].name', "init", 'Constructor method name can be found.');
		is('symbols[1].properties[0].name', "orientation", 'Constructor property name can be found.');
		
		is('symbols[6].methods[0].name', "reset", 'Second constructor method name can be found.');
		is('symbols[6].properties[0].name', "orientation", 'Second constructor borrowed property name can be found in properties.');
		is('symbols[6].properties[0].memberOf', "Page", 'Second constructor borrowed property memberOf can be found.');
		is('symbols[6].methods[1].name', "myGetInnerElements", 'Can borrow an inner function, add it as a static function.');

		is('symbols[8].methods[0].alias', "ThreeColumnPage#init", 'Third constructor method can be found even though method with same name is borrowed.');
		is('symbols[8].methods[1].alias', "ThreeColumnPage#reset", 'Borrowed method can be found.');
		is('symbols[8].properties[0].alias', "ThreeColumnPage#orientation", 'Twice borrowed method can be found.');
	
	}
	,
	function() {
		symbolize({a: true, _: [SYS.pwd+"test/augments.js", SYS.pwd+"test/augments2.js"]});
		
		is('symbols[5].augments[0]', "Layout", 'An augmented class can be found.');
		is('symbols[5].methods[0].alias', "Page#reset", 'Method of augmenter can be found.');
		is('symbols[5].methods[1].alias', "Layout#init", 'Method from augmented can be found.');
		is('symbols[5].properties[0].alias', "Layout#orientation", 'Property from augmented can be found.');
		is('symbols[5].methods.length', 3, 'Methods of augmented class are included in methods array.');
		
		is('symbols[7].augments[0]', "Page", 'The extends tag is a synonym for augments.');
		is('symbols[7].methods[0].alias', "ThreeColumnPage#init", 'Local method overrides augmented method of same name.');
		is('symbols[7].methods.length', 3, 'Local method count is right.');
		
		is('symbols[13].augments[0]', "ThreeColumnPage", 'Can augment across file boundaries.');
		is('symbols[13].augments.length', 2, 'Multiple augments are supported.');
		is('symbols[13].inherits[0].alias', "Junkmail#annoy", 'Inherited method with augments.');
		is('symbols[13].methods.length', 6, 'Methods of augmented class are included in methods array across files.');
		is('symbols[13].properties.length', 1, 'Properties of augmented class are included in properties array across files.');
	}
	,
/*	
	function() {
		symbolize({a:true, _: [SYS.pwd+"test/static_this.js"]});
		
		is('symbols[2].name', "box.holder", 'Static namespace name can be found.');
		is('symbols[3].name', "foo", 'Static namespace method name can be found.');
		is('symbols[3].isStatic', true, 'Static namespace method is static.');
		
		is('symbols[4].name', "counter", 'Instance namespace property name set on "this" can be found.');
		is('symbols[4].alias', "box.holder.counter", 'Instance namespace property alias set on "this" can be found.');
		is('symbols[4].memberOf', "box.holder", 'Static namespace property memberOf set on "this" can be found.');
	}
	,

	function() {
		symbolize({a:true, p: true, _: [SYS.pwd+"test/lend.js"]});
//print(Dumper.dump(symbols));
		is('symbols[1].name', "Person", 'Class defined in lend comment is found.');
		is('symbols[1].methods[0].name', "initialize", 'Lent instance method name can be found.');
		is('symbols[1].methods[1].name', "say", 'Second instance method can be found.');
		is('symbols[1].methods[1].isStatic', false, 'Instance method is known to be not static.');
		
		is('symbols[1].methods[2].name', "sing", 'Instance method name from second lend comment can be found.');
		is('symbols[5].name', "getCount", 'Static method name from second lend comment can be found.');
		is('symbols[5].isStatic', true, 'Static method from second lend comment is known to be static.');
		
		is('symbols[6].name', "Unknown.isok", 'Static instance method from lend comment is kept.');
		is('symbols[0].name', "_global_", 'Orphaned instance method from lend comment is discarded.');
	}
	,
	function() {
		symbolize({a:true, _: [SYS.pwd+"test/param_inline.js"]});
	
		is('symbols[0].params[0].type', "int", 'Inline param name is set.');
		is('symbols[0].params[0].desc', "The number of columns.", 'Inline param desc is set from comment.');
		is('symbols[1].params[0].name', "id", 'User defined param documentation takes precedence over parser defined.');
		is('symbols[1].params[0].isOptional', true, 'Default for param is to not be optional.');
		is('symbols[1].params[1].isOptional', false, 'Can mark a param as being optional.');
		is('symbols[1].params[1].type', "number|string", 'Type of inline param doc can have multiple values.');
		is('symbols[2].params[0].type', "", 'Type can be not defined for some params.');
		is('symbols[2].params[2].type', "int", 'Type can be defined inline for only some params.');
		is('symbols[4].params.length', 0, 'Docomments inside function sig is ignored without a param.');
		is('symbols[5].params[2].type', "zoppler", 'Doc comment type overrides inline type for param with same name.');
	}
	,
	function() {
		symbolize({a: true, _: [SYS.pwd+"test/shared.js", SYS.pwd+"test/shared2.js"]});

		is('symbols[1].name', 'some', 'The name of a symbol in a shared section is found.');
		is('symbols[1].alias', 'Array#some', 'The alias of a symbol in a shared section is found.');
		is('symbols[1].desc', "Extension to builtin array.", 'A description can be shared.');
		is('symbols[2].desc', "Extension to builtin array.\nChange every element of an array.", 'A shared description is appended.');
		is('symbols[3].desc', "A first in, first out data structure.", 'A description is not shared when outside a shared section.');
		is('symbols[4].alias', "Queue.rewind", 'Second shared tag can be started.');
		is('symbols[5].alias', "_global_.startOver", 'Shared tag doesnt cross over files.');
	}
	,
	function() {
		symbolize({a: true, _: [SYS.pwd+"test/config.js"]});
		is('symbols[0].params[0].name', 'person', 'The name of a param is found.');
		is('symbols[0].params[1].name', 'person.name', 'The name of a param set with a dot name is found.');
		is('symbols[0].params[2].name', 'person.age', 'The name of a param set with a dot name is found.');
		is('symbols[0].params[4].name', 'connection', 'The name of a param after config is found.');
		
		is('symbols[1].params[0].name', 'persons', 'Another name of a param is found.');
		is('symbols[1].params[1].name', 'persons.Father', 'The name of a param+config is found.');
		is('symbols[1].params[2].name', 'persons.Mother', 'The name of a second param+config is found.');
		is('symbols[1].params[3].name', 'persons.Children', 'The name of a third param+config is found.');
			
	}
	,
	function() {
		symbolize({a:true, p:true, _: [SYS.pwd+"test/ignore.js"]});
		is('symbols.length', 1, 'Only the global object is documented when a parent is ignored.');
	}
	,
	function() {
		symbolize({a:true, p:true, _: [SYS.pwd+"test/functions_anon.js"]});
		is('symbols[2].name', 'a.b', 'In anonymous constructor this is found to be the container object.');
		is('symbols[3].name', 'a.f', 'In anonymous constructor this can have a method.');
		is('symbols[4].name', 'a.c', 'In anonymous constructor method this is found to be the container object.');
		is('symbols[6].name', 'g', 'In anonymous function executed inline this is the global.');
		is('symbols[8].name', 'bar2.p', 'In named constructor executed inline this is the container object.');
		is('symbols[10].name', 'module.pub', 'In parenthesized anonymous function executed inline function scoped variables arent documented.');

	}
	,
	function() {
		symbolize({a:true, p:true, _: [SYS.pwd+"test/oblit_anon.js"]});
		is('symbols[1].name', 'opt', 'Anonymous object properties are assigned to $anonymous.');
		is('symbols[3].name', 'opt.conf.keep', 'Anonymous object properties are assigned to $anonymous.');
		is('symbols[4].name', 'opt.conf.base', 'Anonymous object properties are assigned to $anonymous.');
		
	}
*/
];
//print(Dumper.dump(symbols));	

//// run and print results
print(testrun(testCases));
