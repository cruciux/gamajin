/**
 * Central starting point for the server code
 */

var config = require('../config');
var TimeSyncronisation = require('./modules/time_syncronisation');
var WebSocketServer = require('ws').Server;
var GameLoop = require('./modules/game_loop');
var UnitManager = require('./modules/unit_manager');
var Input = require('./modules/input');
var ClientManager = require('./modules/client_manager');
var UnitState = require('./modules/unit_state');
var infiniteNumber = require('./modules/infinite_number');
var physics = require('./modules/physics');

var timeSync = new TimeSyncronisation();
var unitManager = new UnitManager();
var clients = new ClientManager();

var gameWss = new WebSocketServer({port: config.webSocketServerPort});
gameWss.on('connection', function(connection) {

    var client = clients.create(connection);
    var frame = gameLoop.getCurrentFrame();

    client.send('init', {
        id: client.id
    });

    // Tell the newly connected client about all the existing units in the game
    unitManager.each(function(unit) {

        client.send('createUnit', {
            id: unit.id,
            clientId: client.id,
            frame: frame,
            input: unit.states[frame].input,
            velocity: unit.states[frame].velocity,
            position: unit.states[frame].position,
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
            var currentFrame = gameLoop.getCurrentFrame();

            // Check we have a state setup for this frame
            if (!(frame in client.unit.states)) { 
                client.unit.states[frame] = new UnitState();
            }        

            client.unit.states[frame].input = data.input;

            var packet = {
                id: client.unit.id,
                frame: frame,
                input: data.input,
                velocity: null,
                position: null
            };

            // If this is an input for a past frame replay all physics from this point up to now
            if (infiniteNumber.isFirstBeforeSecond(frame, currentFrame) || frame == currentFrame) {
                physics.replayWorldSteps(frame, currentFrame, unitManager);

                packet.velocity = client.unit.states[frame].velocity;
                packet.position = client.unit.states[frame].position;
            }

            // Tell all clients about this new input and the velocity/position for that frame
            clients.send('update', packet);

        } else if (packet.type === 'command') {
            var command = packet.data.c;
            if (command === "create unit") {
                if (client.unit === null) {
                    var frame = gameLoop.getLastFrame().frame;
                    var unit = unitManager.create(frame, {x: 200, y: 200});
                    client.unit = unit;

                    // Tell all clients to create this
                    clients.send('createUnit', {
                        id: unit.id,
                        clientId: client.id,
                        frame: frame,
                        input: unit.states[frame].input,
                        velocity: unit.states[frame].velocity,
                        position: unit.states[frame].position
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
        if (client.unit !== null) {
            unitManager.remove(client.unit);
            clients.send('removeUnit', {
                id: client.unit.id
            });
        }
    	console.log("client connection closed");
        
    });
});

var gameLoop = new GameLoop({
    timeSync: timeSync,
    onStep: function(frame) {

        // Step the world physics
        physics.stepWorld(frame, unitManager);



        /*
        // Send data to any admin clients
        var data = JSON.stringify({
            fps: gameLoop.fps,
            frame: frame,
            units: units.all()
        });
        for (var i in adminConnections) {
            adminConnections[i].send(data);
        }
        */

    }
});
gameLoop.start();

// Websocket connections for admin clients
var adminId = 0;
var adminConnections = {};
var adminWss = new WebSocketServer({port: 9011});
adminWss.on('connection', function(connection) {
    adminId++;
    console.log("added", adminId);
    adminConnections[adminId] = connection;
    connection.on('close', (function(adminId) { return function() {
        console.log("removed", adminId);
        delete adminConnections[adminId];
    }})(adminId));
});
