/** 
 * Implements the unit and weapon physics for the game in a single place
 */

var State = require('./state');

var acceleration = 3; 
var friction = 0.9;

module.exports = {

    /** 
     * Allows us to move from one unit frame to another
     */
	nextUnitState: function(unit, previousState, input) {

        // Create a new state (based on previous one)
        var state = previousState.copy();
        state.estimate = input.estimate;

        // Update the velocity with the inputs
        state.vx += (acceleration * input.horizontal);
        state.vy += (acceleration * input.vertical);

        // Apply friction
        state.vx *= friction;
        state.vy *= friction;

        // Do some rounding, not very fast..
        state.vx = parseFloat(state.vx.toFixed(2));
        state.vy = parseFloat(state.vy.toFixed(2));

        if (Math.abs(state.vx) < 0.1) {
            state.vx = 0;
        }
        if (Math.abs(state.vy) < 0.1) {
            state.vy = 0;
        }

        // Update the position with the velocity
        state.x += state.vx;
        state.y += state.vy;


        state.x = parseFloat(state.x.toFixed(2));
        state.y = parseFloat(state.y.toFixed(2));

		return state;
	}
}
