/**
 * Represents a connected client to the server
 */

var allowedTypesBeforeSync = {
    'init': true,
    'time': true
};

function Client(id, connection) {
	this.id = id;
	this.connection = connection;
	this.unit = null;

    this.finishedSyncingTime = false;
    this.ready = false;
}
Client.prototype.canReceive = function(type) {
    if (!this.finishedSyncingTime && !(type in allowedTypesBeforeSync)) {
        return false;
    } else {
        return true;
    }
}
Client.prototype.send = function(type, data) {
    if (!this.canReceive(type)) {
        return;
    }

    this.connection.send(JSON.stringify({
        type: type,
        data: data
    }));
}

module.exports = Client;
