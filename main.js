var TimeSyncronisation = require('./modules/time_syncronisation');



// For testing, define a laggy router...

function LaggyRouter(client, server) {
	this.latency = {min: 0, max: 0};
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
			client.receiveFromServer(packet.data);
		}
	}
	if (this.packetsToServer.length > 0) {
		if (new Date().getTime() >= this.packetsToServer[0].sendAfter) {
			var packet = this.packetsToServer.shift();
			var data = server.receiveFromClient(packet.data);
			this.sendToClient(data);
		}
	}
}
LaggyRouter.prototype.getRandomLatency = function() {

	var latency = Math.floor(Math.random()*(this.latency.max-this.latency.min+1)+this.latency.min);

	// Occasionally add some TCP resends in..
	if (Math.random() < 0.05) {
		latency *= 10;
	}

	return latency;
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


var server = new TimeSyncronisation();

var client = new TimeSyncronisation({
	onSendToServer: function(data) {
		router.sendToServer(data);
	},
	onFinished: function() {
		console.log("All done hopefully");

		console.log("Server time", new Date().getTime());
		console.log("Client time", client.getServerTime());


		process.exit();
	}
});


var router = new LaggyRouter(client, server);

client.start();

