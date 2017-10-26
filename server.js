var express = require('express');
var app = express();
var morgan = require('morgan');
var glob = require('glob');
var server;
var host;

var assetPaths = {};

function assetPath(path) {
    return path.replace('./public', '/assets');
}

// Detect timestamped asset names.
(function () {
    var paths;
    var keys;
    var rxTimestamped = /\.T\d+\./;
    assetPaths.app = assetPath(glob.sync('./public/javascript/application*')[0]);

    assetPaths.workers = {};
    paths = glob.sync('./public/javascript/workers/*.T*');
    keys = paths.map(function (path) {
        return path.split('/').pop().split('.').shift();
    });
    keys.forEach(function (key, index) {
        assetPaths.workers[key] = assetPath(paths[index]);
    });

    assetPaths.demoImages = glob.sync('./public/media/demo_images/*.jpg').
        map(assetPath);

    if (process.env.NODE_ENV === 'production') {
        assetPaths.css = glob.sync('./public/css/*.T*.css').map(assetPath);
    } else {
        assetPaths.css = glob.sync('./public/css/*.css').map(assetPath)
            .filter(function (path) {
                return !rxTimestamped.test(path);
            });
    }
}());

if (process.env.NODE_ENV !== 'production') {
    console.log(assetPaths);
}

app.set('view engine', 'jade');

if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

app.get('/', function (req, res) {
    res.render('index', { assetPaths: assetPaths });
});

// Recommended in production to let Apache/nginx handle serving assets.
app.use('/assets', express.static(__dirname + '/public'));

// Handle 404s - this only gets called if none of the routes above send a
// response.
app.use(function (req, res) {
    res.status(400).send();
});

// Why 8377? Because S is decimal 83 in ASCII, and M is 77.
host = process.env.NODE_ENV === 'production' ? 'localhost' : '0.0.0.0';
server = app.listen(8377, host, function () {
    var host = server.address().address;
    var port = server.address().port;
    var env = process.env.NODE_ENV || 'development';

    console.log('App listening at http://%s:%s in %s env', host, port, env);
});
