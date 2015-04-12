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

    connection.send(JSON.stringify({
        type: 'init',
        data: {
            id: client.id
        }
    }));

    connection.on('message', function(message) {
    	var packet = JSON.parse(message);
        var type = packet.type;
        var data = packet.data;

        if (type === 'time') {
        	var data = timeSync.receiveFromClient(packet.data);
        	connection.send(JSON.stringify({
        		type: 'time',
        		data: data
        	}));
        } else if (type === 'frame') {
            //console.log("send frame");
            connection.send(JSON.stringify({
                type: 'frame',
                data: {
                    time: gameLoop.getLastFrame().time,
                    frame: gameLoop.getLastFrame().frame
                }
            }));
        } else if (type === 'input') {

            var frame = data.frame;
            var input = new Input(data.input);

            console.log("Got input from unit on frame", frame);

            //console.log("Input come in for frame", frame, "the last received frame is ",client.unit.lastReceivedInput, "and game is on frame", gameLoop.getLastFrame().frame);

            var previousState = client.unit.getState(infiniteNumber.decrease(frame));

            /*
            if (!previousState) {
                console.log(frame, client.unit);
                process.exit();
            }
            */

            var state = physics.nextUnitState(client.unit, previousState, input);

            client.unit.setFrame(frame, input, state);

            // Tell clients about this
            connection.send(JSON.stringify({
                type: 'update',
                data: {
                    id: client.unit.id,
                    frame: frame,
                    input: input,
                    state: state
                }
            }));

            console.log(frame, input, state);

            // Do we need to estimate some steps to bring the unit up to our current time?
            while (frame < gameLoop.getLastFrame().frame) {
                frame = infiniteNumber.increase(frame);

                var estimatedInput = input.createEstimateCopy();
                var previousState = client.unit.getState(infiniteNumber.decrease(frame));
                var state = physics.nextUnitState(client.unit, previousState, estimatedInput);

                client.unit.setFrame(frame, estimatedInput, state);
            }


            

        } else if (packet.type === 'command') {
            var command = packet.data.c;
            if (command === "create unit") {
                if (client.unit === null) {
                    var unit = units.create(gameLoop.getLastFrame().frame);
                    client.unit = unit;

                    connection.send(JSON.stringify({
                        type: 'createUnit',
                        data: {
                            id: unit.id,
                            clientId: client.id,
                            frame: gameLoop.getLastFrame().frame,
                            input: unit.getInput(gameLoop.getLastFrame().frame),
                            state: unit.getState(gameLoop.getLastFrame().frame)
                        }
                    }));
                }
            }

        } else {
            console.log("unknown packet", packet.type, packet.data);
        }
    });
    connection.on('close', function() {
        clients.remove(client);
        units.remove(client.unit);
    	console.log("client connection closed");
    });
});

var gameLoop = new GameLoop({
    timeSync: timeSync,
    onStep: function(frame) {
        var previousFrame = infiniteNumber.decrease(frame);

        //console.log("Server is on frame", frame);

        units.each(function(unit) {

            //console.log("Unit last has a frame", unit.lastReceivedInput);

            // See if we have a real input (and thus state) for this frame
            if (unit.lastReceivedInput < frame) {

                //console.log("Creating an estimated input and state for them");

                // Create an estimate from the previous input
                var input = unit.getInput(previousFrame).createEstimateCopy();

                // Do the physics
                var state = physics.nextUnitState(unit, unit.getState(previousFrame), input);

                // Save
                unit.setFrame(frame, input, state);

                //console.log(frame, input, state);

                //console.log("here");
            }

            // We have a state for this frame now
            //var pos = unit.getState(frame);
            //console.log(pos);



        });

        // Send data..
        var data = JSON.stringify({
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

//console.log("Started", gameLoop.getLastFrame().frame);
