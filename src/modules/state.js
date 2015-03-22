function State(options) {
	this.x = options.x;
	this.y = options.y;
	this.estimate = false;
}
State.prototype.isEstimate = function() {
	return this.estimate;
}

module.exports = State;
