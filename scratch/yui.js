
YAHOO.myNamespace = function() {
    var myPrivateVariable;
    
	/** @scope YAHOO.myNamespace */
    return {
        myFirstFunction: function() { return myPrivateVariable; },
        mySecondFunction: function() {}
    }
}();

var hisOrHerPrivateVariable = YAHOO.myNamespace.myFirstFunction();
YAHOO.myNamespace.mySecondFunction();