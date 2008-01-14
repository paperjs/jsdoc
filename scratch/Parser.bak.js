new Namespace(
	"JSDOC.Parser", 
	
	function() {
		var _ = JSDOC.Parser =
		function() {
		}
		
		_.parse = function(/*TextStream*/ ts, /*String*/ srcfile) {
			_.symbols = [];
			
			JSDOC.DocComment.shared = "";
			JSDOC.Symbol.srcfile = (srcfile || "");
			
			while(ts.next()) {
				if (_.findDocComment(ts)) continue;
				if (_.findFunction(ts)) continue;
				if (_.findVariable(ts)) continue;
			}

			return _.symbols;
		}
		
		_.findDocComment = function(ts) {
			if (ts.look().is("JSDOC")) {
				var rawComment = ts.look().data;
				var docComment = new JSDOC.DocComment(rawComment);

				if (docComment.meta) {
					if (docComment.meta == "@+") JSDOC.DocComment.shared = docComment.src;
					if (docComment.meta == "@-") JSDOC.DocComment.shared = "";
					delete ts.tokens[ts.cursor];
					return true;
				}
				else if (docComment.getTag("overview").length > 0) {
					_.symbols.push(new JSDOC.Symbol("", [], "FILE", docComment));
					delete ts.tokens[ts.cursor];
					return true;
				}
				else if (docComment.getTag("name").length > 0) {
					var name = docComment.getTag("name")[0].desc;
					if (name) {
						_.symbols.push(new JSDOC.Symbol(name, [], "VIRTUAL", docComment));
						delete ts.tokens[ts.cursor];
						return true;
					}
				}
				else if (docComment.getTag("scope").length > 0) {
					var scopes = docComment.getTag("scope");
					var block = null;
					for (var i = 0, l = scopes.length; i < l; i++) {
						var scope = scopes[i].desc;
						if (block == null) block = new JSDOC.TokenStream(ts.balance("LEFT_CURLY"));
						var stream = copy(block);
						if (scope) {
							scope = scope.replace(/\.prototype(\.|$)/g, "/");
							_.onObLiteral(scope, stream);
						}
					}
					return true;
				}
			}
			return false;
		}
		
		_.findFunction = function(ts, nspace) {
			if (ts.look().is("NAME")) {
				var name = ts.look().data.replace(/\.prototype\.?/g, "/");
							
				var doc = "";
				var isa = null;
				var body = "";
				var paramTokens = [];
				var params = [];
				
				// like function foo()
				if (ts.look(-1).is("FUNCTION")) {
					if (nspace) name = nspace+name;
					isa = "FUNCTION";
					
					if (ts.look(-2).is("JSDOC")) {
						doc = ts.look(-2).data;
					}
					paramTokens = ts.balance("LEFT_PAREN");
					body = ts.balance("LEFT_CURLY");
				}
				
				// like var foo = function() or var foo = new function()
				else if (
					(ts.look(1).is("ASSIGN") && ts.look(2).is("FUNCTION"))
					||
					(ts.look(1).is("ASSIGN") && ts.look(2).is("NEW") && ts.look(3).is("FUNCTION"))
				) {
					isa = (ts.look(2).is("NEW"))? "OBJECT" : "FUNCTION";
					
					if (ts.look(-1).is("JSDOC")) {
						doc = ts.look(-1).data;
					}
					else if (ts.look(-1).is("VAR") && ts.look(-2).is("JSDOC")) {
						doc = ts.look(-2).data;
					}
					paramTokens = ts.balance("LEFT_PAREN");
					body = ts.balance("LEFT_CURLY");
					
					// like foo = function(n) {return n}(42)
					if (ts.look(1).is("LEFT_PAREN") ) {
						isa = "OBJECT";
						ts.balance("LEFT_PAREN");
					}
					
					if (isa == "OBJECT") {
						if (doc) { // we only keep these if they're documented
							var docComment = new JSDOC.DocComment(doc);
							if (!/\/$/.test(name)) { // assigning to prototype of already existing symbol
								_.symbols.push(new JSDOC.Symbol(name, [], isa, docComment));
							}
						}
						_.onFnBody(name, new JSDOC.TokenStream(body));
						return true;
					}
				}
				
				if (isa && name) {
					if (isa == "FUNCTION") {
						for (var i = 0; i < paramTokens.length; i++) {
							if (paramTokens[i].is("NAME"))
								params.push(paramTokens[i].data);
						}
					}
					
					var docComment = new JSDOC.DocComment(doc);
					_.symbols.push(new JSDOC.Symbol(name, params, isa, docComment));
					
					if (body) {
print("~~ _.onFnBody("+name+")");
						_.onFnBody(name, new JSDOC.TokenStream(body));
					}
					return true;
				}
			}
			return false;
		}
		
		_.findVariable = function(ts) {
			if (ts.look().is("NAME") && ts.look(1).is("ASSIGN")) {
				// like var foo = 1
				var name = ts.look().data;
				isa = "OBJECT";
				
				var doc;
				if (ts.look(-1).is("JSDOC")) doc = ts.look(-1).data;
				else if (ts.look(-1).is("VAR") && ts.look(-2).is("JSDOC")) doc = ts.look(-2).data;
				name = name.replace(/\.prototype\.?/, "/");
				
				if (doc) { // we only keep these if they're documented
					var docComment = new JSDOC.DocComment(doc);
					
					if (!/\/$/.test(name)) { // assigning to prototype of already existing symbol
						_.symbols.push(new JSDOC.Symbol(name, [], isa, docComment));
					}
					if (/@class\b/i.test(doc)) {
						name = name +"/";
					}
				}
				
				// like foo = {
				if (ts.look(2).is("LEFT_CURLY")) {
					_.onObLiteral(name, new JSDOC.TokenStream(ts.balance("LEFT_CURLY")));
				}
				return true;
			}
			return false;
		}
		
		_.onObLiteral = function(nspace, ts) {
			while (ts.next()) {
				if (_.findDocComment(ts)) {
				
				}
				else if (ts.look().is("NAME") && ts.look(1).is("COLON")) {
					var name = nspace+((nspace.charAt(nspace.length-1)=="/")?"":".")+ts.look().data;
					
					// like foo: function
					if (ts.look(2).is("FUNCTION")) {
						var isa = "FUNCTION";
						var doc = "";
						
						if (ts.look(-1).is("JSDOC")) doc = ts.look(-1).data;
						
						var paramTokens = ts.balance("LEFT_PAREN");
						var params = [];
						for (var i = 0; i < paramTokens.length; i++) {
							if (paramTokens[i].is("NAME"))
								params.push(paramTokens[i].data);
						}
						
						var body = ts.balance("LEFT_CURLY");
						
						// like foo: function(n) {return n}(42)
						if (ts.look(1).is("LEFT_PAREN")) {
							isa = "OBJECT";
							
							ts.balance("LEFT_PAREN");
						}
						var docComment = new JSDOC.DocComment(doc);
						_.symbols.push(new JSDOC.Symbol(name, params, isa, docComment));
						
						// find methods in the body of this function
						_.onFnBody(name, new JSDOC.TokenStream(body));
					}
					// like foo: {...}
					else if (ts.look(2).is("LEFT_CURLY")) { // another nested object literal
						if (ts.look(-1).is("JSDOC")) {
							var isa = "OBJECT";
							var doc = ts.look(-1).data;
							var docComment = new JSDOC.DocComment(doc);
							
							_.symbols.push(new JSDOC.Symbol(name, [], isa, docComment));
						}
						
						_.onObLiteral(name, new JSDOC.TokenStream(ts.balance("LEFT_CURLY"))); // recursive
					}
					else { // like foo: 1, or foo: "one"
						if (ts.look(-1).is("JSDOC")) { // we only grab these if they are documented
							var isa = "OBJECT";
							var doc = ts.look(-1).data;
							var docComment = new JSDOC.DocComment(doc);
							
							_.symbols.push(new JSDOC.Symbol(name, [], isa, docComment));
						}
						
						while (!ts.look().is("COMMA")) { // skip to end of RH value ignoring things like bar({blah, blah})
							if (ts.look().is("LEFT_PAREN")) ts.balance("LEFT_PAREN");
							else if (ts.look().is("LEFT_CURLY")) ts.balance("LEFT_CURLY");
							else if (!ts.next()) break;
						}
					}
				}
			}
		}
		
		_.onFnBody = function(nspace, fs) {
			while (fs.look()) {
				if (_.findDocComment(fs)) {
				
				}
				else if (fs.look().is("NAME") && fs.look(1).is("ASSIGN")) {
					var name = fs.look().data.replace(/\.prototype(\.|$)/g, "/");
					
					// like this.foo =
					if (/^this[.\/]/.test(name)) {
						// like this.foo = function
						if (fs.look(2).is("FUNCTION")) {
							var isa = "FUNCTION";
							var doc = (fs.look(-1).is("JSDOC"))? fs.look(-1).data : "";
							name = name.replace(/^this[.\/]/, (nspace+"/").replace("//", "/"))
							
							var paramTokens = fs.balance("LEFT_PAREN");
							var params = [];
							for (var i = 0; i < paramTokens.length; i++) {
								if (paramTokens[i].is("NAME")) params.push(paramTokens[i].data);
							}
							
							body = fs.balance("LEFT_CURLY");
		
							// like this.foo = function(n) {return n}(42)
							if (fs.look(1).is("LEFT_PAREN")) { // false alarm, it's not really a named function definition
								isa = "OBJECT";
								fs.balance("LEFT_PAREN");
								if (doc) { // we only grab these if they are documented
									var docComment = new JSDOC.DocComment(doc);
							
									_.symbols.push(
										new JSDOC.Symbol(name, [], isa, docComment)
									);
								}
								break;
							}
		
							var docComment = new JSDOC.DocComment(doc);
							_.symbols.push(
								new JSDOC.Symbol(name, params, isa, docComment)
							);
							
							if (body) {
								_.onFnBody(name, new JSDOC.TokenStream(body)); // recursive
							}
						}
						else {
							var isa = "OBJECT";
							var doc = (fs.look(-1).is("JSDOC"))? fs.look(-1).data : "";
							name = name.replace(/^this\./, (nspace+"/").replace("//", "/"))
								
							if (doc) {
								var docComment = new JSDOC.DocComment(doc);
								_.symbols.push(
									new JSDOC.Symbol(name, [], isa, docComment)
								);
							}
								
							// like this.foo = { ... }
							if (fs.look(2).is("LEFT_CURLY")) {
								var literal = fs.balance("LEFT_CURLY");
								_.onObLiteral(name, new JSDOC.TokenStream(literal));
							}
						}
					}
					// like <thisfunction>.prototype.foo =
					else if (name.indexOf(nspace+".prototype.") == 0) {
						_.findFunction(fs);
					}
				}
				else if (_.findFunction(fs, nspace+"~")) {
					// look for inner functions
				}
				if (!fs.next()) break;
			}
		}		
	}
);