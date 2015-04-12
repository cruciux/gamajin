var Client = require('./client');

function ClientManager() {
	this.id = 1;
	this.clients = {};
}
ClientManager.prototype.create = function(connection) {
	var client = new Client(this.id, connection);
	this.clients[client.id] = client;
	this.id++;
	return client;
}
ClientManager.prototype.remove = function(client) {
	delete this.clients[client.id];
}
ClientManager.prototype.each = function(callback) {
	for (var i in this.clients) {
		if (this.clients.hasOwnProperty(i)) {
			callback(this.clients[i]);
		}
	}
}


module.exports = ClientManager;