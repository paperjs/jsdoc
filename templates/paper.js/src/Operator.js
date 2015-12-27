var Operator = {
	getMethod: function(symbol) {
		return symbol.name.replace(/\^[0-9]$/,'');
	},

	getOperator: function(symbol) {
		return {
			add: '+', subtract: '-', multiply: '*', divide: '/',
			equals: '==', modulo: '%'
		}[Operator.getMethod(symbol)];
	}
};
