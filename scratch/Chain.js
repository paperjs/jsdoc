function ChainNode(object, link) {
	this.value = object;
	this.link = link;
}

function Chain() {
	this.nodes = [];
	this.cursor = -1;
}

Chain.prototype.push = function(o, link) {
	if (this.nodes.length > 0 && link) this.nodes[this.nodes.length-1].link = link;
	this.nodes.push(new ChainNode(o));
}

Chain.prototype.unshift = function(o, link) {
	this.nodes.unshift(new ChainNode(o, link));
	this.cursor++;
}

Chain.prototype.get = function() {
	if (this.cursor < 0 || this.cursor > this.nodes.length-1) return null;
	return this.nodes[this.cursor];
}

Chain.prototype.first = function() {
	this.cursor = 0;
	return this.get();
}

Chain.prototype.last = function() {
	this.cursor = this.nodes.length-1;
	return this.get();
}

Chain.prototype.next = function() {
	this.cursor++;
	return this.get();
}

Chain.prototype.prev = function() {
	this.cursor--;
	return this.get();
}

Chain.prototype.toString = function() {
	var string = "";
	for (var i = 0, l = this.nodes.length; i < l; i++) {
		string += this.nodes[i].value.toString();
		if (this.nodes[i].link) string += " -("+this.nodes[i].link+")-> "
	}
	return string;
}

/*
var lin = new Chain();
lin.push("Port");
lin.push("Les", "son");
lin.push("Dawn", "daughter");
lin.unshift("Purdie", "son");

print(lin);

for (var node = lin.last(); node !== null; node = lin.prev()) {
	print(node.value);
}

for (var node = lin.first(); node !== null; node = lin.next()) {
	print(node.value);
}
*/