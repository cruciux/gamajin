/**
 * Manages a collection of units, making it easy to add/remove and iterate over them
 */

var Unit = require('./unit');
var Input = require('./input');
var State = require('./state');

function UnitManager() {
	this.id = 1;
	this.units = {};
}

UnitManager.prototype.create = function(frame) {
	var unit = new Unit(this.id);

	// Create the initial input/state
	unit.setFrame(frame, new Input({horizontal:0, vertical:0}), new State({x:200, y:200}));

	this.units[unit.id] = unit;
	this.id++;
	return unit;
}

UnitManager.prototype.createFrom = function(options) {
	var unit = new Unit(options.id);

	// Create the initial input/state for the current frame
	unit.setFrame(options.frame, options.input, options.state);

	this.units[unit.id] = unit;
	this.id++;
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
