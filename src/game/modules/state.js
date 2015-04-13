function State(options) {
	this.x = options.x || 0;
	this.y = options.y || 0;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
	this.estimate = false;
}
State.prototype.isEstimate = function() {
	return this.estimate;
}
State.prototype.copy = function() {
    var state = new State(this);
    return state;
}

module.exports = State;
