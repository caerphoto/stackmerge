var express = require('express');
var app = express();
var morgan = require('morgan');
var glob = require('glob');
var server;
var builtJSPath;

// Detect what the current built JS file is called.
if (process.env.NODE_ENV === 'production') {
    builtJSPath = glob.sync('./public/javascript/application-*')[0];
    builtJSPath = builtJSPath.replace('public', 'assets');
}

app.set('view engine', 'jade');

if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

app.get('/', function (req, res) {
    res.render('index', { builtJSPath: builtJSPath });
});

// Recommended in production to let Apache/nginx handle serving assets.
app.use('/assets', express.static(__dirname + '/public'));

// Handle 404s - this only gets called if none of the routes above send a
// response.
app.use(function (req, res) {
    res.status(400).send();
});

// Why 8377? Because S is decimal 83 in ASCII, and M is 77.
server = app.listen(8377, '127.0.0.1', function () {
    var host = server.address().address;
    var port = server.address().port;
    var env = process.env.NODE_ENV || 'development';

    console.log('App listening at http://%s:%s in %s env', host, port, env);
});
