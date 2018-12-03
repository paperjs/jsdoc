JSDOC.Symbol.prototype.getId = function() {
	var id = this.isConstructor
			? [this.alias.replace(/([#].+$|[\^][0-9])/g, '').toLowerCase()
					.replace(/[.]/, '-')]
			: [this.name.toLowerCase().replace(/[\^][0-9]/g, '')];
	if (this.params) {
		for (var i = 0, l = this.params.length; i < l; i++) {
			var param = this.params[i];
			// Filter out optional and hidden parameters
			if (!param.isOptional && !/^_/.test(param.name))
				id.push(param.name);
		}
	}
	return id.join('-');
};

JSDOC.Symbol.prototype.getOwnMethods = function(param) {
	if (!param)
		param = {};
	return this.methods.filter(function($) {
		return $.memberOf == this.alias  && !$.isNamespace && !$.isDeprecated
				&& (param.operators ? $.isOperator : !$.isOperator)
				&& (param.constructors ? $.isConstructor : !$.isConstructor)
				&& (param.statics ? $.isStatic : !$.isStatic);
	}, this);
};

JSDOC.Symbol.prototype.getOperators = function() {
	return this.getOwnMethods({
		operators: true
	});
};

JSDOC.Symbol.prototype.getStaticMethods = function() {
	return this.getOwnMethods({
		statics: true
	});
};

JSDOC.Symbol.prototype.getConstructors = function() {
	// Filter the construktor-like methods
	var ctors = this.getOwnMethods({
		constructors: true
	});
	// Add 'static'-constructors, such as Path.Line
	ctors = ctors.concat(this.getOwnMethods({
		constructors: true,
		statics: true
	}));
	// Now add the main constructor which is also the class, but only if it is
	// documented. It can also be used to only host the class that then has
	// constructor-like methods, as returned above.
	if (this.desc.length)
		ctors.unshift(this);
	return ctors;
};

JSDOC.Symbol.prototype.getProperties = function(param) {
	if (!param)
		param = {};
	return this.properties.filter(function($) {
		return $.memberOf == this.alias && !$.isNamespace && !$.isConstructor
				&& (param.statics ? $.isStatic : !$.isStatic)
				&& !$.isDeprecated;
	}, this);
};

JSDOC.Symbol.prototype.getStaticProperties = function() {
	return this.getProperties({
		statics: true
	});
};

JSDOC.Symbol.prototype.getInheritedClasses = function() {
	var inheritedClasses = {};
	var addInherited = function(symbol) {
		// Skip deprecated properties and methods.
		if (symbol.memberOf != this.alias && !symbol.isDeprecated) {
			var _class = inheritedClasses[symbol.memberOf];
			if (!_class) {
				_class = inheritedClasses[symbol.memberOf] = {
					className: symbol.memberOf,
					properties: [],
					methods: []
				};
			}
			_class[symbol.isa == "OBJECT" ? 'properties' : 'methods'].push(symbol);
		}
	};
	this.properties.map(addInherited, this);
	this.methods.map(addInherited, this);
	return inheritedClasses;
};