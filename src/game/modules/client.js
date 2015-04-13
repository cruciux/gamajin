/**
 * Represents a connected client to the server
 */

function Client(id, connection) {
	this.id = id;
	this.connection = connection;
	this.unit = null;
}
Client.prototype.send = function(type, data) {
    this.connection.send(JSON.stringify({
        type: type,
        data: data
    }));
}

module.exports = Client;
