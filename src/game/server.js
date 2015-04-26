/**
 * Central starting point for the server code
 */

var TimeSyncronisation = require('./modules/time_syncronisation');
var WebSocketServer = require('ws').Server;
var GameLoop = require('./modules/game_loop');
var UnitManager = require('./modules/unit_manager');
var Input = require('./modules/input');
var ClientManager = require('./modules/client_manager');
var infiniteNumber = require('./modules/infinite_number');
var physics = require('./modules/physics');

var timeSync = new TimeSyncronisation();
var units = new UnitManager();
var clients = new ClientManager();


var gameWss = new WebSocketServer({port: 9000});
gameWss.on('connection', function(connection) {

    var client = clients.create(connection);

    client.send('init', {
        id: client.id
    });

    // Tell the newly connected client about all the existing units in the game
    units.each(function(unit) {
        client.send('createUnit', {
            id: unit.id,
            clientId: client.id,
            frame: gameLoop.getLastFrame().frame,
            input: unit.getInput(gameLoop.getLastFrame().frame),
            state: unit.getState(gameLoop.getLastFrame().frame)
        });
    });


    connection.on('message', function(message) {
    	var packet = JSON.parse(message);
        var type = packet.type;
        var data = packet.data;

        if (type === 'time') {
        	var data = timeSync.receiveFromClient(packet.data);
            client.send('time', data);

        } else if (type === 'frame') {
            client.send('frame', {
                time: gameLoop.getLastFrame().time,
                frame: gameLoop.getLastFrame().frame
            });

        } else if (type === 'input') {

            var frame = data.frame;
            var input = new Input(data.input);

            var previousState = client.unit.getState(infiniteNumber.decrease(frame));
            var state = physics.nextUnitState(client.unit, previousState, input);

            client.unit.setFrame(frame, input, state);

            // Tell all clients about this new input
            clients.send('update', {
                id: client.unit.id,
                frame: frame,
                input: input,
                state: state
            });

            if (infiniteNumber.isFirstBeforeSecond(frame, gameLoop.getCurrentFrame())) {
                client.unit.setEstimatedInputAndState(frame, gameLoop.getCurrentFrame(), input);
            }

        } else if (packet.type === 'command') {
            var command = packet.data.c;
            if (command === "create unit") {
                if (client.unit === null) {
                    var unit = units.create(gameLoop.getLastFrame().frame);
                    client.unit = unit;

                    // Tell all clients to create this
                    clients.send('createUnit', {
                        id: unit.id,
                        clientId: client.id,
                        frame: gameLoop.getLastFrame().frame,
                        input: unit.getInput(gameLoop.getLastFrame().frame),
                        state: unit.getState(gameLoop.getLastFrame().frame)
                    });

                }
            }
        } else {
            console.log("unknown packet", packet.type, packet.data);
        }
    });
    connection.on('close', function() {
        // If the client disconnects, remove their unit and cleanup
        clients.remove(client);
        units.remove(client.unit);
    	console.log("client connection closed");
        clients.send('removeUnit', {
            id: client.unit.id
        });
    });
});

var gameLoop = new GameLoop({
    timeSync: timeSync,
    onStep: function(frame) {
        var previousFrame = infiniteNumber.decrease(frame);

        units.each(function(unit) {

            // See if we have a real input (and thus state) for this frame
            if (unit.lastReceivedInput < frame) {

                // Create an estimate from the previous input
                var input = unit.getInput(previousFrame).createEstimateCopy();

                // Do the physics
                var state = physics.nextUnitState(unit, unit.getState(previousFrame), input);

                // Save
                unit.setFrame(frame, input, state);
            }
        });

        // Send data to any admin clients
        var data = JSON.stringify({
            fps: gameLoop.fps,
            frame: frame,
            units: units.all()
        });
        for (var i in adminConnections) {
            adminConnections[i].send(data);
        }

    }
});
gameLoop.start();


// Websocket connections for admin clients
var adminId = 0;
var adminConnections = {};
var adminWss = new WebSocketServer({port: 9001});
adminWss.on('connection', function(connection) {
    adminId++;
    console.log("added", adminId);
    adminConnections[adminId] = connection;
    connection.on('close', (function(adminId) { return function() {
        console.log("removed", adminId);
        delete adminConnections[adminId];
    }})(adminId));
});

