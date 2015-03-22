var State = require('./state');

module.exports = {
	nextUnitState: function(unit, previousState, input) {
		var state = new State({
            x: previousState.x + (100 * input.horizontal),
            y: previousState.y + (100 * input.vertical)
        });
        state.estimate = input.estimate;
		return state;
	}
}
