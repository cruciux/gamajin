var TimeSyncronisation = require('./modules/time_syncronisation');
var GameLoop = require('./modules/game_loop');
var UI = require('./modules/ui');
var ClientNetworking = require('./modules/client_networking');
var UnitManager = require('./modules/unit_manager');
var Input = require('./modules/input');
var State = require('./modules/state');
var infiniteNumber = require('./modules/infinite_number');

var units = new UnitManager();

var client = {
	id: null,
	unit: null
};

var networking = new ClientNetworking({
	onOpen: function() {},
	onMessage: function(type, data) {

		if (type === "init") { // immediately after connected
			client.id = data.id;
            timeSync.start();

		} else if (type === "time") { // for time syncronisation
			timeSync.receiveFromServer(data);

		} else if (type === "frame") { // start game

            console.log("start game!", data);

			gameLoop.start({
				startTime: data.time,
				startFrame: data.frame
			});

			networking.command("create unit");

		} else if (type === "update") { // updated unit input/state



        } else if (type === "createUnit") {

			var unit = units.createFrom({
				id: data.id,
				frame: data.frame,
				input: new Input(data.input),
				state: new State(data.state)
			});
			if (data.clientId === client.id) {
				client.unit = unit;
			}

		} else {
			console.log("unknown packet", type, data);
		}
	}
});

var timeSync = new TimeSyncronisation({
	onSendToServer: function(data) {
		networking.send('time', data);
	},
	onFinished: function() {
		console.log("initial sync complete", "server ahead by", timeSync.serverClockAheadByTime);
		networking.send('frame');
	}
});

var ui = new UI();

var gameLoop = new GameLoop({
	timeSync: timeSync,
	onStep: function(frame) {

        console.log("Client is on frame", frame);

		if (client.unit !== null) {

            console.log(client.unit);
            gameLoop.stop();

            var input = ui.getInput();

            /*
                We might not have an input/state for the previous frame if we've only just started sending updates
                for this unit. The server allows us to skip forward, but never back.

                Just get the last received one
            */

            var previousState = client.unit.getLastReceivedState();

            // Create an estimated state
            //var previousState = client.unit.getState(infiniteNumber.decrease(frame));

			// Networking
			networking.send('input', {
				frame: frame,
				input: input
			});

		}

		/*
		// Input
		var input = ui.getInput();
		input.frame = frame;

		// Networking
		networking.send('input', input);

		// Physics
		unit.x += 10 * input.horizontal;
		unit.y += 10 * input.vertical;

		// Render (update the UI)
		ui.setPosition(unit.x,unit.y);
		*/
	}
});





// Export the networking to the window temporarily
window.net = networking;






