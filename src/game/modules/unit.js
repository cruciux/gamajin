/**
 * Represents a unit in the game. A unit is the physical being that a client controls.
 * In future, a client could control multiple units.
 */

function Unit(id) {
	this.id = id;
	this.states = {};
}

module.exports = Unit;
