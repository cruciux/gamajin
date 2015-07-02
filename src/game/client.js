/**
 * Central starting point for the client code
 */

var config = require('../config');
var TimeSyncronisation = require('./modules/time_syncronisation');
var GameLoop = require('./modules/game_loop');
var UI = require('./modules/ui');
var ClientNetworking = require('./modules/client_networking');
var UnitManager = require('./modules/unit_manager');
var Input = require('./modules/input');
var UnitState = require('./modules/unit_state');
var infiniteNumber = require('./modules/infinite_number');
var physics = require('./modules/physics');

var unitManager = new UnitManager();

// Represents the local client
var client = {
	id: null,
	unit: null
};

// Kick-off the client networking to the server
var networking = new ClientNetworking({
    webSocketServerPort: config.webSocketServerPort,
	onMessage: function(type, data) {

		if (type === "init") { // immediately after connected
			client.id = data.id;
            timeSync.start();

		} else if (type === "time") { // for time syncronisation
			timeSync.receiveFromServer(data);

		} else if (type === "startGameLoop") { // start game
			gameLoop.start({
				startTime: data.time,
				startFrame: data.frame
			});

		} else if (type === "update") { // updated unit input/state

            var currentFrame = gameLoop.getCurrentFrame();

            // Update the relevant unit..
            var unit = unitManager.get(data.id);

            // Replace/set the state
            if (!(data.frame in unit.states)) {
                unit.states[data.frame] = new UnitState();
            }
            unit.states[data.frame].input = data.input;

            if (data.velocity !== null && data.position !== null) {
                unit.states[data.frame].velocity = data.velocity;
                unit.states[data.frame].position = data.position;
            }

            if (infiniteNumber.isFirstBeforeSecond(data.frame, currentFrame)) {
                physics.replayWorldSteps(data.frame, currentFrame, unitManager);
            }

            // Update the UI (maybe)
            // It could be the current frame is old, and we don't actually have a state for the old frame
            if (currentFrame in unit.states) {
                var position = unit.states[currentFrame].position;
                ui.setPosition(unit.id, position.x, position.y);
            }
                
        } else if (type === "createUnit") {

            // The server has told us to make a new unit
			var unit = unitManager.createFrom(data.id, data.frame, data.input, data.velocity, data.position);
			if (data.clientId === client.id) {
				client.unit = unit;
			}
            ui.createAvatar(unit.id, data.position);

            //console.log("told to create unit, we're on frame", gameLoop.getCurrentFrame(), "unit has state for frame", data.frame);

            // hack
            if (gameLoop.getCurrentFrame() != data.frame) {
                // If we don't have a state for the current frame, we're not going to be able to render... hmm (maybe we should just not render? lol)
                unit.states[gameLoop.getCurrentFrame()] = new UnitState({
                    input: data.input,
                    velocity: data.velocity,
                    position: data.position
                });
            }            

        } else if (type === "removeUnit") {

            var unit = unitManager.get(data.id);
            
            unitManager.remove(unit);
            ui.removeAvatar(unit.id);

		} else {
			console.log("unknown packet", type, data);
		}
	}
});

window.net = networking;

// Setup the time sync module
var timeSync = new TimeSyncronisation({
	onSendToServer: function(data) {
		networking.send('time', data);
	},
	onFinished: function() {
		console.log("initial sync complete", "server ahead by", timeSync.serverClockAheadByTime);
		networking.send('finishedSync');
	}
});

// Setup the simple UI
var ui = new UI();

// Setup the game loop. onStep will be called each frame
var gameLoop = new GameLoop({
	timeSync: timeSync,
	onStep: function(frame) {

		if (client.unit !== null) {
            // Capture input from the local unit
            var input = ui.getInput();
            client.unit.states[frame] = new UnitState({input: input});
            
            // Send input to server immediately
            networking.send("input", {
                frame: frame,
                input: input
            })
        }

        // Step the world physics
        physics.stepWorld(frame, unitManager);

        // Render the latest state
        unitManager.each(function(unit) {
            ui.setPosition(unit.id, unit.states[frame].position.x, unit.states[frame].position.y);
        });
        
	}
});
