/**
 * Represents a unit in the game. A unit is the physical being that a client controls.
 * In future, a client could control multiple units.
 */


var infiniteNumber = require('./infinite_number');
var physics = require('./physics');

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

/**
 * Sets estimate inputs and frames
 * Exclusive fromFrom, inclusive toFrame
 */
Unit.prototype.setEstimatedInputAndState = function(fromFrom, toFrame, input) {
	var frame = fromFrom;
	while (frame !== toFrame) {		
 		frame = infiniteNumber.increase(frame);
		var estimatedInput = input.createEstimateCopy();
		var previousState = this.getState(infiniteNumber.decrease(frame));
		var state = physics.nextUnitState(this, previousState, estimatedInput);
		this.setFrame(frame, estimatedInput, state);
	}
}

module.exports = Unit;
