/** @constructor */
function Circle() {
	this.size = function(r) {
		/** distance from center to circumference */
		this.radius = r;
	}
}

Circle.size = function(c, r) {
	c.size(r);
	/** Aproximatly 3.146 */
	this.pi = Math.PI;
}

var c = new Circle();

c.size(3);
print(c.radius);

Circle.size(c, 42);
print(c.radius);

print(Circle.pi);