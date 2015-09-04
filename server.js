var express = require('express');
var app = express();
var morgan = require('morgan');
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });
var server;

app.set('view engine', 'jade');
app.use(morgan('dev'));

app.get('/', function (req, res) {
    console.log('Rendering index view');
    res.render('index');
});

app.post('/upload', upload.array('images'), function (req, res) {
    var files = req.files.map(function (file) {
        return {
            name: file.originalname,
            src: file.path
        };
    });

    res.status(200).send(files);
});

app.use('/uploads', express.static(__dirname + '/uploads'));

app.use('/assets', express.static(__dirname + '/public'));

// Handle 404s - this only gets called if none of the routes above send a
// response.
app.use(function (req, res) {
    res.status(400).send();
});

server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
