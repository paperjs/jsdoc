var Person = Class.create(
    /**
      @name Person
      @constructor
      @lend Person.prototype
    */
    {
        initialize: function(name) {
            this.name = name;
        },
        say: function(message) {
            return this.name + ': ' + message;
        }
    }
);

/** @lend Person.prototype */
{
	sing: function(song) {
	}
}

/** @lend Person */
{
	getCount: function() {
	}
}

/** @lend Unknown */
{
	isok: function() {
	}
}

/** @scope Unknown.prototype */
{
	notok: function() {
	}
}