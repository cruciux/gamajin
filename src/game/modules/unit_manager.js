/**
 * Manages a collection of units, making it easy to add/remove and iterate over them
 */

var Unit = require('./unit');
var Input = require('./input');
var UnitState = require('./unit_state');

function UnitManager() {
	this.id = 1;
	this.units = {};
}

UnitManager.prototype.nextId = function() {
	return this.id++;
}

UnitManager.prototype.create = function(frame, position) {
	var unit = new Unit(this.nextId());

	unit.states[frame] = new UnitState({
		input: {x: 0, y: 0},
		velocity: {x: 0, y: 0},
		position: position,
	});

	this.units[unit.id] = unit;
	return unit;
}

UnitManager.prototype.createFrom = function(id, frame, input, velocity, position) {
	var unit = new Unit(id);

	unit.states[frame] = new UnitState({
		input: input,
		velocity: velocity,
		position: position,
	});

	this.units[unit.id] = unit;
	return unit;
}

UnitManager.prototype.get = function(id) {
	return this.units[id];
}

UnitManager.prototype.remove = function(unit) {
	delete this.units[unit.id];
}

UnitManager.prototype.each = function(callback) {
	for (var i in this.units) {
		if (this.units.hasOwnProperty(i)) {
			callback(this.units[i]);
		}
	}
}

UnitManager.prototype.all = function(callback) {
	var arr = [];
	for (var i in this.units) {
		if (this.units.hasOwnProperty(i)) {
			arr.push(this.units[i]);
		}
	}
	return arr;
}

module.exports = UnitManager;
