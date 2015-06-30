/**
 * Simple web server for now
 */

var config = require('../config');
var express = require('express');
var app = express();

app.use(express.static('./public'));

var server = app.listen(config.webServerPort, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Web server listening at http://%s:%s', host, port);
});
