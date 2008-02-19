var Person = Class.create(
    /**
      @name Person
      @constructor
      @lends Person.prototype
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

/** @lends Person.prototype */
{
	sing: function(song) {
	}
}

/** @lends Person */
{
	getCount: function() {
	}
}

/** @lends Unknown */
{
	isok: function() {
	}
}

/** @scope Unknown.prototype */
{
	notok: function() {
	}
}