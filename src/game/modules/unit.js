/**
 * Represents a unit in the game. A unit is the physical being that a client controls.
 * In future, a client could control multiple units.
 */

function Unit(id) {
	this.id = id;
	this.inputs = {};
	this.states = {};

	this.lastReceivedInput = null;
	this.lastEstimatedInput = null;
}

Unit.prototype.setFrame = function(frame, input, state) {
	this.inputs[frame] = input;
	this.states[frame] = state;

	if (input.isEstimate()) {
		this.lastEstimatedInput = frame;
	} else {
		this.lastReceivedInput = frame;
	}
}

Unit.prototype.getInput = function(frame) {
	return this.inputs[frame];
}

Unit.prototype.getState = function(frame) {
	return this.states[frame];
}

Unit.prototype.getLastReceivedState = function() {
    return this.states[this.lastReceivedInput];
}

module.exports = Unit;
