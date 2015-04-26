/**
 * Implements the logic for a game loop that runs an exact number of times per second.
 *
 * The game loop is run on the client and server
 */

var infiniteNumber = require('./infinite_number');

function GameLoop(options) {
	this.frame = 0;
	this.fps = 1;
	this.stepTime = 1000 / this.fps;
	this.onStep = options.onStep;
	this.timeSync = options.timeSync;
    this.exit = false;
    this.lastFrameData = {frame: this.frame, time: this.timeSync.getTime()};
};

GameLoop.prototype.getLastFrame = function() {
	return this.lastFrameData;
};

GameLoop.prototype.getCurrentFrame = function() {
	return this.lastFrameData.frame;
}

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

			self.lastFrameData.frame = self.frame;
			self.lastFrameData.time = now;
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
