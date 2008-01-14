/**
  @name Person
  @constructor
*/
var Person = Class.create(
    /**  @scope Person.prototype */
    {
        initialize: function(name) {
        	/** the name of the person. */
            this.name = name;
        },
        say: function(message) {
            return this.name + ': ' + message;
        }
    }
);

Person.add(
    /** @scope Person.prototype */
    {
        sing: function(song) {
        }
    }
);

Person.counter = function() {
}

String.prototype.wordCount = function(){
}

/** the x */
var x = 1;

function foo() {
}

String.encoding = function() {
}