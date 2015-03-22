function ClientNetworking(options) {
	var self = this;
	this.packetsToSend = [];
	this.connected = false;

	this.connection = new WebSocket('ws://localhost:9001');
	this.connection.onopen = function () {
		self.connected = true;
		options.onOpen();
		console.log("connected");

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
