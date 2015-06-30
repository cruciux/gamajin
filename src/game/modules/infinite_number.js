/**
 * Implements logic for a number that wraps round, e.g. 0,1,2..98,99,0,1
 *
 * Primarily used for the number attached to each frame
 */

var wrapOnNumber = 10000;

var boundNumber = function(number) {
	if (number < 0) {
		number = wrapOnNumber + number;
	} else if (number >= wrapOnNumber) {
		number = number - wrapOnNumber;
	}
	return number;
}

module.exports = {
	increase: function(number, amount) {
		amount = (typeof amount === "undefined") ? 1 : amount;
		number += amount;
		return boundNumber(number);
	},
	decrease: function(number, amount) {
		amount = (typeof amount === "undefined") ? 1 : amount;
		number -= amount;
		return boundNumber(number);
	},
	isFirstBeforeSecond: function(first, second) {
		if (Math.abs(first - second) < wrapOnNumber/2) {
			return first < second;
		}
		first = boundNumber(first - (wrapOnNumber/2));
		second = boundNumber(second - (wrapOnNumber/2));
		return first < second;
	},
	difference: function(numberA, numberB) {
		// note: order doesn't matter
	},
	loopInclusively: function(from, to, callback) {
		var current = parseInt(from);
		var end = parseInt(to);
		while (this.isFirstBeforeSecond(current,end) || current === end) {
			callback(current);
			current = this.increase(current);
		}
	}
}
