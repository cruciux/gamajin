var stats = require("stats-lite");

/**
 *	Provies time syncronisation between clients and the server
 *	
 *	Assume packets will arrive in order (tcp/websockets)
 **/

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


	this.fakeServerAheadBy = 0;
	/*
	var self = this;
	var a = setInterval(function() {
		self.fakeServerAheadBy += 1;

		if (self.fakeServerAheadBy > 400) {
			console.log("stop");
			clearInterval(a);
		}
	}, 100);
	*/
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

		//console.log(stats.mean(latencies), latency);

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
			//console.log("aaa", m.clientTime + this.serverClockAheadByTime, m.serverTime, m.clientTime2 + this.serverClockAheadByTime);
			//console.log("Adjusting serverClockAheadByTime by", adjustment);
		}

		if (m.serverTime > m.clientTime2 + this.serverClockAheadByTime) {
			var possibleAdjustment = m.serverTime - (m.clientTime2 + this.serverClockAheadByTime);
			if (possibleAdjustment > adjustment) {
				adjustment = possibleAdjustment;
			}
			//console.log("Adjusting serverClockAheadByTime by", adjustment);
			//console.log("bbb", m.clientTime + this.serverClockAheadByTime, m.serverTime, m.clientTime2 + this.serverClockAheadByTime);
		}
		this.serverClockAheadByTime = Math.round(this.serverClockAheadByTime + adjustment);

		if (data.id == this.numInitialMessages-1) {
			if (this.onFinished !== null) {
				this.onFinished();
			}
		}

		//console.log("Estimate server ahead by", Math.round(this.serverClockAheadByTime));	

		//console.log(m.clientTime + this.serverClockAheadByTime, m.serverTime, m.clientTime2 + this.serverClockAheadByTime);	

		//document.getElementById('client').innerHTML = new Date().getTime();
		//document.getElementById('server').innerHTML = new Date().getTime() + this.serverClockAheadByTime;
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
	data.serverTime = new Date().getTime() + this.fakeServerAheadBy;
	return data;
}

module.exports = TimeSyncronisation;
