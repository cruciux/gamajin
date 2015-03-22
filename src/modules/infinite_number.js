
var wrapOnNumber = 10000;

var correctNumber = function(number) {
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
		return correctNumber(number);
	},
	decrease: function(number, amount) {
		amount = (typeof amount === "undefined") ? 1 : amount;
		number -= amount;
		return correctNumber(number);
	},
	isFirstBeforeSecond: function(first, second) {
		if (Math.abs(first - second) < wrapOnNumber/2) {
			return first < second;
		}
		first = correctNumber(first - (wrapOnNumber/2));
		second = correctNumber(second - (wrapOnNumber/2));
		return first < second;
	},
	difference: function(numberA, numberB) {
		// note: order doesn't matter
	}
}
