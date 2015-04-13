# Gamajin

Gamajin is an early prototype of a top-down multiplayer game written in HTML5 that implements fast gameplay with smooth networked physics. Think of it as a top-down FPS that runs in a browser!

### Requirements

The server runs with nodejs and has been tested with v0.10.33. You need gulp build the assets and run the server:

```sh
$ npm install -g gulp
```

### Installation

After cloning, install npm and do an intial build of the assets with gulp:

```sh
$ npm install
$ gulp scripts
```

### Running the web and game servers

The servers can be run individually or together. To run both together (preferred for now), navigate to the root directory and run

```sh
$ node src/run-servers.js
```

This will start:

* a webserver on port 8000
* a websocket server for the game client on port 9000
* a websocket server for the backend admin panel on port 9001

### Player the 'game'

If you're running locally, navigate to http://localhost:9000 - you will gain control of a small red square. Use WSAD keys to move the unit around.

You should see other connected clients move around (if you open a few more tabs sadly..!)

![alt text](https://cloud.githubusercontent.com/assets/1318966/7122788/882b73f0-e215-11e4-89fe-9994d9a5a591.png "Screenshot of unit")

### Viewing the backend admin panel

Navigate to http://localhost:8000/backend.html to see some cool stats about all the connected clients and their units!

![alt text](https://cloud.githubusercontent.com/assets/1318966/7122803/9ffd88a6-e215-11e4-8aa1-5e4e341155b0.png "Screenshot of unit")

The frame numbers go up the right hand side in real time. The green blocks show the real received inputs from the client, and the black bars show estimated ones (due to the server not receiving packets for a while for some reason, such as lag)
