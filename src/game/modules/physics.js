var State = require('./state');

module.exports = {
	nextUnitState: function(unit, previousState, input) {
		var state = new State({
            x: previousState.x + (10 * input.horizontal),
            y: previousState.y + (10 * input.vertical)
        });
        state.estimate = input.estimate;
		return state;
	}
}
