var express = require('express');
var app = express();
var server;

app.set('view engine', 'jade');

app.get('/', function (req, res) {
    res.render('index');
});

server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
