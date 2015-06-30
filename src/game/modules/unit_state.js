/**
 * Encapsulates the state of a unit at a certain frame
 */

function UnitState(options) {
    options = options || {};
    this.input = options.input || {x: null, y: null};
    this.velocity = options.velocity || {x: null, y: null};
    this.position = options.position || {x: null, y: null};

}

module.exports = UnitState;
