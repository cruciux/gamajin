/**
 * Manages connected clients to the server
 */

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

ClientManager.prototype.send = function(type, data) {
	var packet = JSON.stringify({
        type: type,
        data: data
    });
    this.each(function(client) {

        if (client.canReceive(type)) {
    	   client.connection.send(packet);
        }
    });
}

module.exports = ClientManager;
