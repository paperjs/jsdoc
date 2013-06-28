var Operator = {
	getOperator: function(symbol) {
		return {
			add: '+', subtract: '-', multiply: '*', divide: '/',
			equals: '==', modulo: '%'
		}[symbol.name.replace(/\^[0-9]$/,'')];
	}
};
