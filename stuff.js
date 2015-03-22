/**
	Alter the speed that the request packets are sent out so that its just above the latency.
	No use doing it less as they'll get grouped.
**/
function Client(sendToServerCallback) {
	this.sendToServerCallback = sendToServerCallback;
	this.times = 200;
	this.packets = [];
	this.fakeTimeOffset = 0;
	this.phase = 1;
	this.timeOffset = 0;
}
Client.prototype.getTime = function() {
	return new Date().getTime() + this.fakeTimeOffset + this.timeOffset;
}
Client.prototype.startSync = function(finishedCallback) {
	this.finishedCallback = finishedCallback;
	var self = this;
	for (var i=0; i<this.times; i++) {

		(function(i) {
			
			setTimeout(function() {

				//console.log("client: sent", i);

				self.sendToServerCallback({
					id: i,
					phase: 1,
					client: self.getTime()
				});
			},i * 60);
		})(i);

	}
}
Client.prototype.startPerfection = function() {

	var self = this;
	for (var i=0; i<this.times; i++) {

		(function(i) {
			
			setTimeout(function() {

				console.log("client: sent", i);

				self.sendToServerCallback({
					id: i,
					phase: 2,
					client: self.getTime()
				});
			},i * 60);
		})(i);

	}	
}
Client.prototype.receiveSyncData = function(data) {
	//console.log("client: received response with id", data.id);

	// Store the packet
	data.client2 = this.getTime();
	this.packets.push(data);


	if (this.packets.length > 3) {

		var totalLatency = 0;

		for (var i in this.packets) {
			totalLatency += (this.packets[i].client2 - this.packets[i].client) / 2; 
		}
		var averageLatency = totalLatency / this.packets.length;

		//console.log("average latency", averageLatency);

		// So how does our time relate to the servers?

		var diffs = [];
		for (var i in this.packets) {
			diffs.push(  this.packets[i].client - (this.packets[i].server - averageLatency)  );
		}

		//var third = Math.round(diffs.length / 3);
		//diffs = diffs.sort().splice(third, third);

		var averageDiff = Math.round(diffs.reduce(function(a, b) {
			return a + b;
		}, 0) / diffs.length);

		console.log("average diff", averageDiff);

	}


	/*
	if (this.phase == 1) {
		data.client2 = this.getTime();
		this.packets.push(data);

		if (data.id == this.times -1) {

			var totalLatency = 0;

			for (var i in this.packets) {
				totalLatency += (this.packets[i].client2 - this.packets[i].client) / 2; 
			}
			var averageLatency = totalLatency / this.packets.length;

			console.log("average latency", averageLatency);

			// So how does our time relate to the servers?

			var diffs = [];
			for (var i in this.packets) {
				diffs.push(  this.packets[i].client - (this.packets[i].server - averageLatency)  );
			}
			var averageDiff = Math.round(diffs.reduce(function(a, b) {
				return a + b;
			}, 0) / diffs.length);

			console.log("average diff", averageDiff);

			this.timeOffset = -averageDiff;

			console.log(this.getTime());
			console.log(new Date().getTime());

			this.phase = 2;
			this.startPerfection();
		}
	} else {

		if (data.id == this.times -1) {
			console.log("finished..");
			this.finishedCallback();
		}
	}*/

	// 
}

function Server(sendToClientCallback) {
	this.sendToClientCallback = sendToClientCallback;
}
Server.prototype.receiveSyncData = function(data) {
	//console.log("server: got request with id", data.id);

	var now = new Date().getTime();

	if (data.phase == 1) {
		// Just timestamp it..
		data.server = now;
	} else {

		// Compare the time, should be BEFORE us, not after

		console.log(now, data.client);

		if (now < data.client) {
			console.log("ISSUE!!");
		}

	}

	this.sendToClientCallback(data);
}



// Start a test...

function LaggyRouter(client, server) {
	this.latency = {min: 5, max: 200};
	this.client = client;
	this.server = server;

	this.packetsToClient = [];
	this.packetsToServer = [];

	var self = this;

	setInterval(function() {
		// Check if need to send packets
		self.update();
	},1);
}
LaggyRouter.prototype.update = function() {
	if (this.packetsToClient.length > 0) {

		if (new Date().getTime() >= this.packetsToClient[0].sendAfter) {
			var packet = this.packetsToClient.shift();
			client.receiveSyncData(packet.data);
		}
	}
	if (this.packetsToServer.length > 0) {
		if (new Date().getTime() >= this.packetsToServer[0].sendAfter) {
			var packet = this.packetsToServer.shift();
			server.receiveSyncData(packet.data);
		}
	}
}
LaggyRouter.prototype.getRandomLatency = function() {
	return Math.floor(Math.random()*(this.latency.max-this.latency.min+1)+this.latency.min);
}
LaggyRouter.prototype.sendToClient = function(data) {
	this.packetsToClient.push({
		data: data, 
		sendAfter: new Date().getTime() + this.getRandomLatency()
	});
}
LaggyRouter.prototype.sendToServer = function(data) {
	this.packetsToServer.push({
		data: data, 
		sendAfter: new Date().getTime() + this.getRandomLatency()
	});
}



var client = new Client(function(data) {
	// Client wants to send a packet to the server..
	router.sendToServer(data);
});
//client.fakeTimeOffset = -1000; // 1 second in the past..

var server = new Server(function(data) {
	// Server wants to send a packet to the client..
	router.sendToClient(data);
});

var router = new LaggyRouter(client, server);

client.startSync(function() {
	// Finished?
	process.exit()
});


