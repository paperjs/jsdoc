/** @constructor */
framework.Action = function() {
	/** the index of the action */
	this._index = [];
	
	this.passTo = function(obj) {
		obj.actOn(this);
	}
	
	this._debug = function() {
		new _Debugger(this).report();
	}
	
	this.execute = function() {
		this._index.push(action);
	}
}

/** @constructor */
function _Debugger(out){}
_Debugger.dump = function (){
	function innerF(){}
}

send_alert = function (){
}
