/** 
 * Implements the unit and weapon physics for the game in a single place
 */

var UnitState = require('./unit_state');
var infiniteNumber = require('./infinite_number');

var acceleration = 0.3; 
var friction = 0.9;

module.exports = {

    stepWorld: function(frame, unitManager, replaying) {

        replaying = replaying || false;

        //console.log("stepWorld frame", frame);

        var previousFrame = infiniteNumber.decrease(frame);

        unitManager.each(function(unit) {

            // If we have no previous state then just skip
            if (!(previousFrame in unit.states)) {
                return;
            }

            // We know we have a previous state now.
            var previousState = unit.states[previousFrame];

            if (!(frame in unit.states)) {
                unit.states[frame] = new UnitState();
            }
            var state = unit.states[frame];

            if (state.input.x === null || state.input.y === null) {
                state.input.x = previousState.input.x !== null ? previousState.input.x : 0;
                state.input.y = previousState.input.y !== null ? previousState.input.y : 0;
            }

            // Apply the physics
            // Calculate the velocity
            state.velocity.x = previousState.velocity.x + (acceleration * state.input.x);
            state.velocity.y = previousState.velocity.y + (acceleration * state.input.y);

            state.velocity.x *= friction;
            state.velocity.y *= friction;

            // Do some rounding, not very fast..
            state.velocity.x = parseFloat(state.velocity.x.toFixed(2));
            state.velocity.y = parseFloat(state.velocity.y.toFixed(2));

            if (Math.abs(state.velocity.x) < 0.1) {
                state.velocity.x = 0;
            }
            if (Math.abs(state.velocity.y) < 0.1) {
                state.velocity.y = 0;
            }

            // Update the position with the velocity
            state.position.x = previousState.position.x + state.velocity.x;
            state.position.y = previousState.position.y + state.velocity.y;

            state.position.x = parseFloat(state.position.x.toFixed(2));
            state.position.y = parseFloat(state.position.y.toFixed(2));

            unit.states[frame] = state;

        });
    },
    replayWorldSteps: function(fromFrame, toFrame, unitManager) {
        //console.log("replay steps from", fromFrame, "to", toFrame);
        var self = this;
        infiniteNumber.loopInclusively(fromFrame, toFrame, function(frame) {
            self.stepWorld(frame, unitManager, true);
        })
    }
}
