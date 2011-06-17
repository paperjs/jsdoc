var Render = new function() {
	var templatesDir = (JSDOC.opt.t || SYS.pwd + '../templates/jsdoc/')
			+ 'templates/';
	var templates = {
		_class: 'class.tmpl',
		method: 'method.tmpl',
		property: 'property.tmpl',
		parameters: 'parameters.tmpl',
		parameter: 'parameter.tmpl',
		operators: 'operators.tmpl',
		returns: 'returns.tmpl',
		'return': 'return.tmpl',
		seeAlsos: 'seeAlsos.tmpl',
		example: 'example.tmpl',
		constructor: 'constructor.tmpl',
		html: 'html.tmpl',
		index: 'index.tmpl',
		packages: 'packages.tmpl',
		operator: 'operator.tmpl'
	};
	publish.classes = [];
	for (var i in templates) {
		templates[i] = new JSDOC.JsPlate(templatesDir + templates[i]);
	}

	var processInlineTags = function(str, param) {
		if (!param)
			param = {};
		// <code>..</code> -> <pre>..</pre>
		str = str.replace(/<(\/)*(code)>/g, '<$1pre>');

		// <pre> -> <pre class="code">
		str = str.replace(/<pre>/g, '<pre class="code">');

		// {@link ...} -> html links
		str = str.replace(/\{@link ([^} ]+) ?\}/gi,
			function(match, symbolName) {
				return new Link(true).toSymbol(symbolName.replace(/[\^]/g, '-'));
			}
		);
		// {@code ...} -> code blocks
		str = str.replace(/\{@code[\s]([^}]+)\}/gi,
			function(match, code) {
				return '<tt>' + code + '</tt>';
			}
		);

		// {@true ...} -> true if.. false otherwise..
		str = str.replace(/\{@true[\s]([^}]+)\}/gi,
			function(match, text) {
				return '<tt>true</tt> ' + text + ', <tt>false</tt> otherwise';
			}
		);

		var lineBreak = java.lang.System.getProperty('line.separator');

		// Convert any type of lineBreak to the one we're using now:
		str = str.replace(/(\r\n|\n|\r)/g, function(match, lineBreak) {
			return lineBreak;
		});

		// Replace inline <code></code> with <tt></tt>
		str = str.replace(/<code>[ \t]*([^\n\r]*?)[ \t]*<\/code>/g, function(match, content) {
			return '<tt>' + content + '</tt>';
		});

		// Put code and pre tags on the same line as the content, as white-space: pre is set:
		str = str.replace(/(<(?:code|pre)>)\s*([\u0000-\uffff]*?)\s*(<\/(?:code|pre)>)/g, function(match, open, content, close) {
			// Filter out the first white space at the beginning of each line, since
			// that stems from the space after the * in the comment and replace <code>
			// with <pre>, to fix a IE problem where lighter.js does not receive
			// linebreaks from code tags weven when white-space: pre is set.
			return '<pre>' + content.replace(/(\r\n|\n|\r) /mg, function(match, lineBreak) {
				return lineBreak;
			}) + '</pre>';
		});
		// Empty lines -> Paragraphs
		if (!param.stripParagraphs) {
			if (param.wrapInParagraphs === undefined || param.wrapInParagraphs)
				str = '<p>' + str.trim() + '</p>';
			str = str.trim().replace(/(\r\n|\n|\r)\s*(\r\n|\n|\r)/g, function(match, lineBreak) {
				return '</p>' + lineBreak + '<p>';
			});
			// Automatically put </p><p> at the end of sentences with line breaks.
			// Match following </p> and <p> tags and swallow them. This happens when
			// the original content contains these.
			str = str.trim().replace(/([.:?!;])\s*(\r\n|\n|\r)(\s*)(<\/p>|<p>|)/g, function(match, before, lineBreak, whiteSpace, after) {
				// Include following whiteSpace as well, since for code blocks they are relevant (e.g. indentation on new line)
				return before + '</p>' + lineBreak + whiteSpace + '<p>';
			});
			// Filter out <p> tags within and around <code> and <pre> blocks again
			str = str.replace(/((?:<p>\s*|)<(?:code|pre)[^>]*>[\u0000-\uffff]*<\/(?:code|pre)>(?:\s*<\/p>|))/g, function(match, code) {
				return Utils.stripTags(code, 'p');
			});
			// Filter out empty paragraphs
			str = str.replace(/<p><\/p>/g, '');
		}

		return str;
	};

	 /** Build output for displaying function parameters. */
	var makeSignature = function(params) {
		if (!params) return '()';
		var postString = '';
		var first = true;
		params = params.filter(
			function($) {
				return $.name.indexOf('.') == -1; // don't show config params in signature
			}
		);
		var signature = '';
		var postSignature = '';
		for (var i = 0, l = params.length; i < l; i++) {
			var param = params[i];
			if (param.isOptional) {
				signature += '[';
				postSignature += ']';
			}
			if (i > 0)
				signature += ', ';
			signature += param.name;
		}
		return '(' + signature + postSignature + ')';
	};
	var paperScriptId = 0;
	return {
		_class: function(symbol) {
			// Reset PaperScript id to 0 for each class, so they count up on a
			// per file basis, and changes won't affect the whole docs files.
			// Useful when checking into version control systems.
			paperScriptId = 0;
			// Reverse the inherited classes hash, so inheritance appears in the
			// right order, from closest to furthest away (base)
			var inherited = symbol.getInheritedClasses();
			var list = [];
			for (var i in inherited)
				list.push([i, inherited[i]]);
			inherited = {};
			for (var i = list.length - 1; i >= 0; i--) {
				var entry = list[i];
				inherited[entry[0]] = entry[1];
			}
			
			var inheritedClasses = {};
			var param = {
				name: symbol.alias,
				description: processInlineTags(symbol.classDesc),
				symbol: symbol,
				constructors: symbol.getConstructors(),
				properties: symbol.getProperties(),
				staticProperties: symbol.getStaticProperties(),
				methods: symbol.getOwnMethods(),
				staticMethods: symbol.getStaticMethods(),
				showConstructors: (!(/(Event|Style)/).test(symbol.alias)
						&& !symbol.isNamespace && !symbol.ignore
						&& symbol.desc.length),
				inheritedClasses: inherited,
				classExamples: Render.examples(symbol.classExample)
			};
			param.inheritedLinks = [];
			for (var i in param.inheritedClasses) {
				param.inheritedLinks.push('<b>' + new Link(true).toSymbol(i) + '</b>');
			}
			param.inheritedLinks = param.inheritedLinks.join(', ');
			// Add the grouped operators to param:
			var operators = symbol.getOperators();
			if (operators.length) {
				param.operators = {};
				for (var i = 0, l = operators.length; i < l; i++) {
					var operator = operators[i];
					var name = operator.name.replace(/\^[0-9]$/, '');
					if (!param.operators[name])
						param.operators[name] = [];
					param.operators[name].push(operator);
				}
			}
			var name = param.name == '_global_' && publish.conf.globalName
					|| param.name;
			publish.curClass = {
				name: name,
				index: {
					'class': {
						title: name,
						text: param.description
					}
				}
			};
			publish.classes.push(publish.curClass);
			return templates._class.process(param);
		},
		constructor: function(symbol) {
			var param = {
				symbol: symbol,
				id: symbol.getId(),
				name: symbol.alias.replace(/(#|\^).+$/, ''),
				description: processInlineTags(symbol.desc),
				signature: makeSignature(symbol.params),
				parameters: Render.parameters(symbol),
				returns: Render.returns(symbol),
				examples: Render.examples(symbol.example),
				seeAlsos: Render.seeAlsos(symbol)
			};
			if (symbol.returns.length == 0) {
				var type = symbol.memberOf ? symbol.memberOf : symbol.alias;
				symbol.returns = [{type: type, desc: ''}];
			}
			publish.curClass.index[param.id] = {
				title: param.name,
				text: param.description
			};
			return templates.constructor.process(param);
		},
		method: function(symbol) {
			var name = symbol.name.replace(/\^\d+$/, '');
			if (symbol.isStatic)
				name = symbol.memberOf + '.' + name;
			var param = {
				name: name,
				id: symbol.getId(),
				signature: makeSignature(symbol.params),
				description: processInlineTags(symbol.desc),
				symbol: symbol
			};
			publish.curClass.index[param.id] = {
				title: param.name,
				text: param.description
			};
			return templates.method.process(param);
		},
		property: function(symbol) {
			var name = symbol.name.replace(/\^\d+$/, '');
			if (symbol.isStatic)
				name = symbol.memberOf + '.' + name;
			var param = {
				name: name,
				id: symbol.getId(),
				description: processInlineTags(symbol.desc),
				symbol: symbol
			};
			publish.curClass.index[param.id] = {
				title: param.name,
				text: param.description
			};
			return templates.property.process(param);
		},
		parameters: function(symbol) {
			return templates.parameters.process(symbol);
		},
		parameter: function(symbol) {
			return templates.parameter.process({
				name: symbol.name,
				description: processInlineTags(symbol.desc,
						{stripParagraphs: true}),
				typeLink: new Link(true).toSymbol(symbol.type),
				symbol: symbol,
				defaultValue: symbol.defaultValue ?
						processInlineTags(symbol.defaultValue, {
							stripParagraphs: true
						}) : null
			});
		},
		operators: function(symbols) {
			var operatorCount = 0;
			var title = [];
			for (var i = 0, l = symbols.length; i < l; i++) {
				var type = symbols[i].params[0].type;
				type = type.charAt(0).toUpperCase() + type.slice(1);
				title.push('<tt><b>' + Operator.getOperator(symbols[i]) + '</b> ' + type + '</tt>');
			}
			
			return templates.operators.process({
				id: symbols[0].name.toLowerCase().replace(/\^[0-9]$/, ''),
				title: title.join(', '),
				operators: symbols
			});
		},
		operator: function(symbol, id) {
			var type = symbol.params[0].type;
			return templates.operator.process({
				id: id,
				name: Operator.getOperator(symbol),
				type: type.charAt(0).toUpperCase() + type.slice(1),
				description: processInlineTags(symbol.desc),
				symbol: symbol
			});
		},
		returns: function(symbol) {
			return templates.returns.process(symbol);
		},
		'return': function(symbol) {
			return templates['return'].process({
				name: symbol.name,
				description: processInlineTags(symbol.desc,
						{stripParagraphs: true}),
				typeLink: new Link(true).toSymbol(symbol.type),
				symbol: symbol
			});
		},
		seeAlsos: function(symbol) {
			return templates.seeAlsos.process(symbol);
		},
		examples: function(examples) {
			var out = [];
			for (var i = 0, l = examples.length; i < l; i++) {
				var example = examples[i].toString();
				
				// Parse {@paperscript} inline tags
				var paperScript = null;
				example = example.replace(/\{@paperscript[\s]*([^}]+)*\}/,
					function(tag, content) {
						paperScript = {
							width: 520,
							height: 100,
							split: 'true',
							id: paperScriptId++
						};
						var pairs = tag.match(/[\S]+=[^\s}]+/g);
						if (pairs) {
							for (var i = 0, l = pairs.length; i < l; i++) {
								var pair = pairs[i].split('=');
								paperScript[pair[0]] = pair[1];
							}
						}
						paperScript.mode = paperScript.split == 'true' ? 'split'
								: paperScript.source == 'true' ? 'source' : null;
						return '';
					}
				).trim();

				var lines = example.split('\n'),
					description = [];
				// The description is the first commented lines:
				while (/^[\/]{2}/.test(lines[0])) {
					description.push(lines.shift().replace('// ', ''));
				}
				
				out.push(Render.example({
					description: description.join(' ').trim(),
					code: lines.join('\n').trim(),
					paperScript: paperScript
				}));
			}
			return out.join('\n');
		},
		example: function(param) {
			return templates.example.process(param);
		},
		html: function(content) {
			return templates.html.process(content);
		},
		classes: function() {
			// TODO: Use a template instead?
			var renderMode = publish.conf.renderMode;
			var out = '<ul class="package-classes">';

			load(JSDOC.opt.t + 'classLayout.js');
			function parseClassNames(classNames) {
				var out = '';
				for (var i = 0, l = classNames.length; i < l; i++) {
					if (typeof classNames[i] == 'string') {
						var name = classNames[i];
						out += (name == 'ruler') ? getRuler() : getLink(name);
					} else {
						for (var j in classNames[i]) {
							out += getHeading(j);
							out += parseClassNames(classNames[i][j]);
						}
					}
				}
				return out;
			}

			function getLink(name) {
				var link = name;
				if (name.indexOf(':') > 0) {
					var names = name.split(':');
					name = names[0];
					link = names[1];
				}
				return '<li>' + new Link(false).toSymbol(link) + '</li>\n';
			}

			function getRuler() {
				return '<li><hr /></li>\n';
			}

			function getHeading(title) {
				return '<li><h3>' + title + '</h3></li>\n';
			}

			var first = true;
			for (var i in classLayout) {
				if (i != '_global_') {
					out += '<li' + (first ? ' class="first">' : '>\n');
					out += '<h2>' + i + '</h2>\n';
					out += '<ul>\n';
				} 
				out += parseClassNames(classLayout[i]);
				if (i != '_global_') {
					out += '</ul>\n';
				}
				first = false;
			}

			return out + '</ul>';
		},
		index: function(html) {
			return templates.index.process(html);
		},
		packages: function() {
			return templates.packages.process(publish.classes);
		}
	};
};