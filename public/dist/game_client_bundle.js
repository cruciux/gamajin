(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Central starting point for the client code
 */

var TimeSyncronisation = require('./modules/time_syncronisation');
var GameLoop = require('./modules/game_loop');
var UI = require('./modules/ui');
var ClientNetworking = require('./modules/client_networking');
var UnitManager = require('./modules/unit_manager');
var Input = require('./modules/input');
var State = require('./modules/state');
var infiniteNumber = require('./modules/infinite_number');

var units = new UnitManager();

// Represents the local client
var client = {
	id: null,
	unit: null
};

// Kick-off the client networking to the server
var networking = new ClientNetworking({
	onMessage: function(type, data) {

		if (type === "init") { // immediately after connected
			client.id = data.id;
            timeSync.start();

		} else if (type === "time") { // for time syncronisation
			timeSync.receiveFromServer(data);

		} else if (type === "frame") { // start game
			gameLoop.start({
				startTime: data.time,
				startFrame: data.frame
			});

            // Tell the server to create us a unit
			networking.command("create unit");

		} else if (type === "update") { // updated unit input/state

            // Update the relevant unit..
            var unit = units.get(data.id);
            unit.setFrame(data.frame, new Input(data.input), new State(data.state));

            // Update the UI
            var state = unit.getLastReceivedState();
            ui.setPosition(unit.id, state.x, state.y);
 
        } else if (type === "createUnit") {

            // The server has told us to make a new unit
			var unit = units.createFrom({
				id: data.id,
				frame: data.frame,
				input: new Input(data.input),
				state: new State(data.state)
			});
			if (data.clientId === client.id) {
				client.unit = unit;
			}
            ui.createAvatar(unit.id);

        } else if (type === "removeUnit") {

            var unit = units.get(data.id);
            
            units.remove(unit);
            ui.removeAvatar(unit.id);

		} else {
			console.log("unknown packet", type, data);
		}
	}
});

// Setup the time sync module
var timeSync = new TimeSyncronisation({
	onSendToServer: function(data) {
		networking.send('time', data);
	},
	onFinished: function() {
		console.log("initial sync complete", "server ahead by", timeSync.serverClockAheadByTime);
		networking.send('frame');
	}
});

// Setup the simple UI
var ui = new UI();

// Setup the game loop. onStep will be called each frame
var gameLoop = new GameLoop({
	timeSync: timeSync,
	onStep: function(frame) {

		if (client.unit !== null) {

            var input = ui.getInput();
            var previousState = client.unit.getLastReceivedState();

            // Send the local input to the server
			networking.send('input', {
				frame: frame,
				input: input
			});
		}
	}
});

},{"./modules/client_networking":4,"./modules/game_loop":5,"./modules/infinite_number":6,"./modules/input":7,"./modules/state":8,"./modules/time_syncronisation":9,"./modules/ui":10,"./modules/unit_manager":12}],2:[function(require,module,exports){
module.exports = isNumber

/**
 * Determine if something is a non-infinite javascript number.
 * @param  {Number}  n A (potential) number to see if it is a number.
 * @return {Boolean}   True for non-infinite numbers, false for all else.
 */
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
},{}],3:[function(require,module,exports){
module.exports.numbers = numbers
module.exports.sum = sum
module.exports.mean = mean
module.exports.median = median
module.exports.mode = mode
module.exports.variance = variance
module.exports.stdev = stdev
module.exports.percentile = percentile

var isNumber = require("isnumber")

function numbers(vals) {
  var nums = []
  if (vals == null)
    return nums

  for (var i = 0; i < vals.length; i++) {
    if (isNumber(vals[i]))
      nums.push(+vals[i])
  }
  return nums
}

function nsort(vals) {
  return vals.sort(function (a, b) { return a - b })
}

function sum(vals) {
  vals = numbers(vals)
  var total = 0
  for (var i = 0; i < vals.length; i++) {
    total += vals[i]
  }
  return total
}

function mean(vals) {
  vals = numbers(vals)
  if (vals.length === 0) return NaN
  return (sum(vals) / vals.length)
}

function median(vals) {
  vals = numbers(vals)
  if (vals.length === 0) return NaN

  var half = (vals.length / 2) | 0

  vals = nsort(vals)
  if (vals.length % 2) {
    // Odd length, true middle element
    return vals[half]
  }
  else {
    // Even length, average middle two elements
    return (vals[half-1] + vals[half]) / 2.0
  }
}

// Returns the mode of a unimodal dataset -- NaN for multi-modal or empty datasets.
function mode(vals) {
  vals = numbers(vals)
  if (vals.length === 0) return NaN
  var mode = NaN
  var dist = {}
  vals.forEach(function (n) {
    var me = dist[n] || 0
    me++
    dist[n] = me
  })
  var rank = numbers(Object.keys(dist).sort(function (a, b) { return dist[b] - dist[a] }))
  mode = rank[0]
  if (dist[rank[1]] == dist[mode]) {
    // Multiple modes found, abort
    return NaN
  }
  return mode
}

// Variance = average squared deviation from mean
function variance(vals) {
  vals = numbers(vals)
  var avg = mean(vals)
  var diffs = []
  for (var i = 0; i < vals.length; i++) {
    diffs.push(Math.pow((vals[i] - avg), 2))
  }
  return mean(diffs)
}

// Standard Deviation = sqrt of variance
function stdev(vals) {
  return Math.sqrt(variance(vals))
}

function percentile(vals, ptile) {
  vals = numbers(vals)
  if (vals.length === 0 || ptile == null || ptile < 0) return NaN

  // Fudge anything over 100 to 1.0
  if (ptile > 1) ptile = 1
  vals = nsort(vals)
  var i = (vals.length * ptile) - 0.5
  if ((i | 0) === i) return vals[i]
  // interpolated percentile -- using Estimation method
  var int_part = i | 0
  var fract = i - int_part
  return (1 - fract) * vals[int_part] + fract * vals[int_part + 1]
}
},{"isnumber":2}],4:[function(require,module,exports){
/**
 * Deals with the networking on the client side, to connect to the game server
 */

function ClientNetworking(options) {
	var self = this;
	this.packetsToSend = [];
	this.connected = false;

	this.connection = new WebSocket('ws://localhost:9000');
	this.connection.onopen = function () {
		self.connected = true;
		options.onOpen();
		console.log("Connected");

		// Any packets to send?
		for (var i in self.packetsToSend) {
			self.connection.send(self.packetsToSend[i]);
		}
		self.packetsToSend = [];
	};
	this.connection.onclose = function() {
		self.connected = false;
		console.log("closed");
	}
	this.connection.onerror = function (error) {
		console.log('WebSocket Error ' + error);
	};
	this.connection.onmessage = function (e) {
		var packet = JSON.parse(e.data);
		options.onMessage(packet.type, packet.data);
	};
}

ClientNetworking.prototype.send = function(type, data) {
	data = typeof data === "undefined" ? {} : data;
	var packet = JSON.stringify({
		type: type,
		data: data
	});
	if (this.connected) {
		this.connection.send(packet);
	} else {
		this.packetsToSend.push(packet);
	}
}

ClientNetworking.prototype.command = function(command) {
	this.send("command", {
		c: command
	});
}

module.exports = ClientNetworking;

},{}],5:[function(require,module,exports){
/**
 * Implements the logic for a game loop that runs an exact number of times per second.
 *
 * The game loop is run on the client and server
 */

var infiniteNumber = require('./infinite_number');

function GameLoop(options) {
	this.frame = 0;
	this.fps = 10;
	this.stepTime = 1000 / this.fps;
	this.onStep = options.onStep;
	this.timeSync = options.timeSync;
    this.exit = false;
    this.lastFrame = {frame: this.frame, time: this.timeSync.getTime()};
};

GameLoop.prototype.getLastFrame = function() {
	return this.lastFrame;
};

GameLoop.prototype.stop = function() {
    this.exit = true;
};

GameLoop.prototype.start = function(options) {
	options = typeof options !== "undefined" ? options : {};

	var self = this;
	var now = null;
	var dt = 0;
	var last = this.timeSync.getTime();

	if (typeof options.startFrame !== "undefined") {
		// Calculate what frame we should start on, based on the given frame and time
		var skip = Math.floor((this.timeSync.getTime() - options.startTime) / this.stepTime);

		// How much is left over 
		dt = (this.timeSync.getTime() - options.startTime) % this.stepTime;
		this.frame = options.startFrame + skip;
	}

	var checkStep = function() {
		now = self.timeSync.getTime();
		dt = dt + now - last;
		while (dt > self.stepTime) {
			dt = dt - self.stepTime;
			self.frame = infiniteNumber.increase(self.frame);
			self.onStep(self.frame); 

			self.lastFrame.frame = self.frame;
			self.lastFrame.time = now;
		}
		last = now;
		setTimeout(function() {
			if (!self.exit) {
				checkStep(); 
			}
		}, self.stepTime / 4);
	};

	setTimeout(function() {
		checkStep();
	}, 1);
};

module.exports = GameLoop;

},{"./infinite_number":6}],6:[function(require,module,exports){
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
	}
}

},{}],7:[function(require,module,exports){
/**
 * Encapsulates the input generated from the client for a certain frame
 */

function Input(options) {
	this.horizontal = options.horizontal;
	this.vertical = options.vertical;
	this.estimate = false;
}

Input.prototype.isEstimate = function() {
	return this.estimate;
}

Input.prototype.createEstimateCopy = function() {
	var input = new Input(this);
	input.estimate = true;
	return input;
}

module.exports = Input;

},{}],8:[function(require,module,exports){
function State(options) {
	this.x = options.x || 0;
	this.y = options.y || 0;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
	this.estimate = false;
}
State.prototype.isEstimate = function() {
	return this.estimate;
}
State.prototype.copy = function() {
    var state = new State(this);
    return state;
}

module.exports = State;

},{}],9:[function(require,module,exports){
/**
 * Implements a time syncrosation protocol similar to NTP that can let the client
 * time rapidly move towards the server time. This is needed for accurate multiplayer
 * physics.
 *
 * This module doesn't do networking itself, instead it asks you to send packets
 * and has methods to receive packets. Meaning the user must implement networking.
 */

var stats = require("stats-lite");

function TimeSyncronisation(options) {
	options = typeof options === "undefined" ? {} : options;
	this.onSendToServer = (typeof options['onSendToServer'] === "undefined") ? null : options.onSendToServer;
	this.onFinished = (typeof options['onFinished'] === "undefined") ? null : options.onFinished;

	this.serverClockAheadByTime = 0;

	this.messages = [];
	
	this.inInitialPhase = false;
	this.numInitialMessages = 20;
	this.spaceBetweenInitialMessages = 10; // Good to set this to average latency

	this.spaceBetweenLaterMessages = 250;
	this.intervalId = null;
	this.maxPackets = 50;
}

TimeSyncronisation.prototype.getTime = function() {
	return new Date().getTime() + this.serverClockAheadByTime;
}

TimeSyncronisation.prototype.stop = function() {
	clearInterval(this.intervalId);
}

TimeSyncronisation.prototype.start = function() {
	if (this.onSendToServer === null) {
		throw "No call back function has been set on onSendToServer";
	}

	var self = this;

	// Initially we want to send out 20 messages to the server space 
	var id;
	for (id=0; id<this.numInitialMessages; id++) {
		(function(id) {
			setTimeout(function() {
				self.onSendToServer({
					id: id,
					clientTime: new Date().getTime()
				});
			}, id * self.spaceBetweenInitialMessages);
		})(id);
	}

	// Then send the messages every so often from now on
	setTimeout(function(){

		self.intervalId = setInterval(function() {
			self.onSendToServer({
				id: id,
				clientTime: new Date().getTime()
			});
			id++;
		}, self.spaceBetweenLaterMessages);
	}, (id+1) * self.spaceBetweenInitialMessages);

	return this;
}

TimeSyncronisation.prototype.receiveFromServer = function(data) {
	
	data.clientTime2 = new Date().getTime();
	data.latency = (data.clientTime2 - data.clientTime) / 2;
	this.messages.push(data);

	if (this.messages.length > this.maxPackets) {
		this.messages.shift();
	}

	if (data.id >= this.numInitialMessages - 1) {

		// Calculate the mean latency
		var latencies = [];
		for (var i in this.messages) {
			latencies.push(this.messages[i].latency);
		}

		var filteredLatencies = this.filterWithinOneStandardDeviation(latencies);

		// This is our best estimate for latency..
		var latency = stats.mean(filteredLatencies);

		var serverClockAheadByTimes = [];
		for (var i in this.messages) {
			serverClockAheadByTimes.push(this.messages[i].serverTime - this.messages[i].clientTime - latency);
		}

		var filteredserverClockAheadByTimes = this.filterWithinOneStandardDeviation(serverClockAheadByTimes);

		this.serverClockAheadByTime = stats.mean(filteredserverClockAheadByTimes);


		// Finally check this calculated offset fits logically with our latest packet
		// Only useful if we're dealing with super low latencies - damn VMs
		var adjustment = 0;
		
		var m = this.messages[this.messages.length - 1];

		if (m.clientTime + this.serverClockAheadByTime > m.serverTime) {
			var possibleAdjustment = m.serverTime - (m.clientTime + this.serverClockAheadByTime);
			if (possibleAdjustment < adjustment) {
				adjustment = possibleAdjustment;
			}
		}

		if (m.serverTime > m.clientTime2 + this.serverClockAheadByTime) {
			var possibleAdjustment = m.serverTime - (m.clientTime2 + this.serverClockAheadByTime);
			if (possibleAdjustment > adjustment) {
				adjustment = possibleAdjustment;
			}
		}
		this.serverClockAheadByTime = Math.round(this.serverClockAheadByTime + adjustment);

		if (data.id == this.numInitialMessages-1) {
			if (this.onFinished !== null) {
				this.onFinished();
			}
		}
	}

}

TimeSyncronisation.prototype.filterWithinOneStandardDeviation = function (items) {
	var mean = stats.mean(items);
	var stdev = stats.stdev(items);

	var filteredItems = [];
	for (var i=0; i<items.length; i++) {
		if (Math.abs(mean - items[i]) < stdev) {
			filteredItems.push(items[i]);
		}
	}
	if (filteredItems.length === 0) {
		return items;
	}
	return filteredItems;
}

TimeSyncronisation.prototype.receiveFromClient = function(data) {
	data.serverTime = new Date().getTime();
	return data;
}

module.exports = TimeSyncronisation;

},{"stats-lite":3}],10:[function(require,module,exports){
/**
 * A very basic HTML user interface for displaying the units, and capturing 
 * user input via the keyboard.
 */

var Input = require('./input');

function UI() {
	this.avatars = {};

	var self = this;
	this.keysDown = {};
	document.body.addEventListener("keydown", function(e) {
		self.keysDown[e.keyCode] = true;
		//console.log("down", e.keyCode);
	});
	document.body.addEventListener("keyup", function(e) {
		delete self.keysDown[e.keyCode];
	});
}

UI.prototype.createAvatar = function(id) {
	// Create a simple div to represent the unit and add to the dom
	var avatar = document.createElement("div");
	avatar.style.width = "10px";
	avatar.style.height = "10px";
	avatar.style.backgroundColor = "red";
	avatar.style.position = "absolute";
	avatar.style.left = "100px";
	avatar.style.top = "100px";
	document.body.appendChild(avatar);
	this.avatars[id] = avatar;
}

UI.prototype.removeAvatar = function(id) {
	// Delete from the DOM
	if (this.avatars[id].parentNode) {
		this.avatars[id].parentNode.removeChild(this.avatars[id]);
	}
	// Delete from the internal list
	delete this.avatars[id];
}

UI.prototype.setPosition = function(id, x, y) {
	this.avatars[id].style.left = x + "px";
	this.avatars[id].style.top = y + "px";
}

UI.prototype.getInput = function() {
	var input = new Input({
		horizontal: 0,
		vertical: 0
	});
	if (87 in this.keysDown) { // Up
		input.vertical -= 1;
	}
	if (83 in this.keysDown) { // Down
		input.vertical += 1;
	}
	if (68 in this.keysDown) { // Right
		input.horizontal += 1;
	}
	if (65 in this.keysDown) { // Left
		input.horizontal -= 1;
	}
	return input;
}

module.exports = UI;

},{"./input":7}],11:[function(require,module,exports){
/**
 * Represents a unit in the game. A unit is the physical being that a client controls.
 * In future, a client could control multiple units.
 */

function Unit(id) {
	this.id = id;
	this.inputs = {};
	this.states = {};

	this.lastReceivedInput = null;
	this.lastEstimatedInput = null;
}

Unit.prototype.setFrame = function(frame, input, state) {
	this.inputs[frame] = input;
	this.states[frame] = state;

	if (input.isEstimate()) {
		this.lastEstimatedInput = frame;
	} else {
		this.lastReceivedInput = frame;
	}
}

Unit.prototype.getInput = function(frame) {
	return this.inputs[frame];
}

Unit.prototype.getState = function(frame) {
	return this.states[frame];
}

Unit.prototype.getLastReceivedState = function() {
    return this.states[this.lastReceivedInput];
}

module.exports = Unit;

},{}],12:[function(require,module,exports){
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

},{"./input":7,"./state":8,"./unit":11}]},{},[1]);
