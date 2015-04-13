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
