/**
 * Encapsulates the input generated from the client for a certain frame
 */

function Input(options) {
	this.horizontal = options.horizontal;
	this.vertical = options.vertical;
	this.estimate = false;
}

Input.prototype.isEstimate = function() {
	return this.estimate;
}

Input.prototype.createEstimateCopy = function() {
	var input = new Input(this);
	input.estimate = true;
	return input;
}

module.exports = Input;
