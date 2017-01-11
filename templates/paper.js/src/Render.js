var Render = new function() {
	var templatesDir = (JSDOC.opt.t || SYS.pwd + '../templates/jsdoc/')
			+ 'templates/';
	var templates = {
		_class: 'class.tmpl',
		method: 'method.tmpl',
		methods: 'methods.tmpl',
		property: 'property.tmpl',
		parameters: 'parameters.tmpl',
		parameter: 'parameter.tmpl',
		operators: 'operators.tmpl',
		operator: 'operator.tmpl',
		returns: 'returns.tmpl',
		'return': 'return.tmpl',
		seeAlso: 'seeAlso.tmpl',
		example: 'example.tmpl',
		constructor: 'constructor.tmpl',
		html: 'html.tmpl',
		index: 'index.tmpl',
		main: 'main.tmpl',
		aside: 'aside.tmpl'
	};
	var Extensions = Packages.org.pegdown.Extensions;
    var pegDown = new Packages.org.pegdown.PegDownProcessor(
    		Extensions.SMARTS | Extensions.QUOTES | Extensions.AUTOLINKS |
    		Extensions.TABLES | Extensions.FENCED_CODE_BLOCKS |
    		Extensions.STRIKETHROUGH,
    		// Timeout:
    		10000);
	var lineBreak = java.lang.System.getProperty('line.separator');

	publish.classes = [];
	for (var i in templates) {
		templates[i] = new JSDOC.JsPlate(templatesDir + templates[i]);
	}

	var processInlineTags = function(str, param) {
		if (!param)
			param = {};

		// {@link ...} -> html links
		str = str.replace(/\{@link\s+([^}]+)?\}/g,
			function(match, symbolName) {
				return new Link(true).toSymbol(symbolName
					// Remove spaces in function call signature
					.replace(/\s+/g, '')
					// Handle aliases when there's more than one version
					.replace(/[\^]/g, '-'));
			}
		);
		// {@code ...} -> code blocks
		str = str.replace(/\{@code\s+([^}]+)\}/g,
			function(match, code1, code2) {
				return '<tt>' + (code1 || code2) + '</tt>';
			}
		);

		// {@true ...} -> true if.. false otherwise..
		str = str.replace(/\{@true\s+([^}]+)\}/g,
			function(match, text) {
				return '<tt>true</tt> ' + text + ', <tt>false</tt> otherwise';
			}
		);

        // {@values ...} -> list of code values
        str = str.replace(/\{@values\s+([^}]+)\}/g,
            function(match, text) {
            	return Render.values(text);
            }
        );

        str = pegDown.markdownToHtml(str) + '';

        // Replace ellipsis
        str = str.replace(/\.\.\./g,
            function() {
                return '\u2026';
            }
        );

		if (param.stripParagraphs) {
			str = str.replace(/<\/?p>/g, '');
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
				return !/\./.test($.name) // hide config params in signature
						&& !/^_/.test($.name); // hide params that start with an _
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

	var renderOptions = function(symbol, tag, title) {
				var options = symbol.comment.getTag(tag);
				if (options.length) {
					var list = ['<ul class="member-list">'];
					if (title)
						list.push('<h4>' + title + ':</h4>');
					for (var i = 0, l = options.length; i < l; i++) {
						list.push('<li>' + options[i].desc.replace(
							// Match `[optionalName=defaultValue]` as well as `name`
							// (?:\{([\w|\[\]]*)\}): Match type specifier, including
							// '|' for multiple values and '[]' for arrays.
							/^(?:\[([^=\]]+)\=([^\]]+)\]|([\w.]+))\s*(?:\{([\w|\[\]]*)\})?\s*([\u0000-\uffff]*)$/,
							function(match, optionalName, defaultValue, name, type,
									text) {
								text = text && text.trim();
								if (text) {
									text = ' &mdash; ' + processInlineTags(text, {
												stripParagraphs: true
											});
								}
								if (defaultValue) {
									defaultValue = ' &mdash;&nbsp;default: <tt>'
											+ processInlineTags(defaultValue, {
												stripParagraphs: true
											})
											+ '</tt>';
								}
								return '<tt>' + (optionalName || name) + ': '
										+ new Link(true).toSymbol(type)
										+ '</tt>' + text + (defaultValue || '');
							}
						) + '</li>');
					}
					list.push('</ul>');
					return list.join('\n');
				}
				return '';
			}
	var paperScriptId = 0;
	return {
		_class: function(symbol, version) {
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
			var constructors = symbol.getConstructors();
			var param = {
				name: symbol.alias,
				description: processInlineTags(symbol.classDesc),
				symbol: symbol,
				constructors: constructors,
				properties: symbol.getProperties(),
				staticProperties: symbol.getStaticProperties(),
				methods: symbol.getOwnMethods(),
				staticMethods: symbol.getStaticMethods(),
				showConstructors: (!(/(Event|Style)/).test(symbol.alias)
						&& !symbol.isNamespace && !symbol.ignore
						&& constructors.length),
				inheritedClasses: inherited,
				classExamples: Render.examples(symbol.classExample),
				version: version
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
				signature: makeSignature(symbol.params),
				description: processInlineTags(symbol.desc)
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
				symbol: symbol,
				id: symbol.getId(),
				name: name,
				signature: makeSignature(symbol.params),
				description: processInlineTags(symbol.desc)
			};
			publish.curClass.index[param.id] = {
				title: param.name,
				text: param.description
			};
			return templates.method.process(param);
		},
		methods: function(methods) {
			return templates.methods.process({
				symbols: methods
			});
		},
		property: function(symbol) {
			var name = symbol.name.replace(/\^\d+$/, '');
			if (symbol.isStatic)
				name = symbol.memberOf + '.' + name;
			var param = {
				symbol: symbol,
				id: symbol.getId(),
				name: name,
				description: processInlineTags(symbol.desc)
			};
			publish.curClass.index[param.id] = {
				title: param.name,
				text: param.description
			};
			return templates.property.process(param);
		},
		parameters: function(symbol) {
			// Remove parameters that start with an underscore:
			var params = symbol.params.filter(
				function($) {
					return $.name.indexOf('_') != 0
				}
			);

			return templates.parameters.process({params: params});
		},
		parameter: function(symbol) {
			return templates.parameter.process({
				name: symbol.name,
				description: processInlineTags(symbol.desc, {
					stripParagraphs: true
				}),
				typeLink: new Link(true).toSymbol(symbol.type),
				symbol: symbol,
				defaultValue: symbol.defaultValue ?
						processInlineTags(symbol.defaultValue, {
							stripParagraphs: true
						}) : null
			});
		},
		options: function(symbol) {
			return renderOptions(symbol, 'option', 'Options');
		},
		results: function(symbol) {
			return renderOptions(symbol, 'result');
		},
		operators: function(symbols) {
			var operatorCount = 0;
			var title = [];
			for (var i = 0, l = symbols.length; i < l; i++) {
				var type = symbols[i].params[0].type;
				type = type.charAt(0).toLowerCase() + type.slice(1);
				title.push('<tt><b>' + Operator.getOperator(symbols[i]) + '</b>'
						+ type + '</tt>');
			}

			return templates.operators.process({
				id: symbols[0].name.toLowerCase().replace(/\^[0-9]$/, ''),
				title: title.join(', '),
				operators: symbols
			});
		},
		operator: function(symbol) {
			return templates.operator.process({
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
		seeAlso: function(symbol) {
			return templates.seeAlso.process(symbol);
		},
		values: function(text) {
            return text.split(',').map(function(str) {
                str = str.trim();
                return str === '...' ? '&hellip;' : "<tt>" + str + "</tt>";
            }).join(', ');
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
			var out = '<ul class="reference-classes">';

			load(JSDOC.opt.t + 'sidebar.js');
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
			for (var i in sidebar) {
				if (i != '_global_') {
					out += '<li' + (first ? ' class="first">' : '>\n');
					out += '<h2>' + i + '</h2>\n';
					out += '<ul>\n';
				}
				out += parseClassNames(sidebar[i]);
				if (i != '_global_') {
					out += '</ul>\n';
				}
				first = false;
			}

			return out + '</ul>';
		},
		index: function(param) {
			return templates.index.process(param);
		},
		main: function(param) {
			return templates.main.process(param);
		},
		aside: function(param) {
			return templates.aside.process(param);
		}
	};
};
