// setup logging
var log = require('./log');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var exphbs  = require('express-handlebars');

// Serve statics and render handlebars
var hbs = exphbs.create({
  defaultLayout: 'main'
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(express.static('public'));

// Always set io instance before requiring users of the ./sockets module
require('./sockets').setIo(io);
var game = require('./game');

// Routes
app.use('/game', require('./game-router'));

// TODO This is merely meant as a curl endpoint atm.
// We should figure out how we want to expose this
app.use('/create', bodyParser());
app.post('/create', function (req, res) {
  var id = game.createGame(req.body);
  if (id !== undefined) {
    res.send({ message: 'Game successfully created', 'id': id });
  } else {
    res.send({ message: 'Failed to create game, options invalid' });
  }
});

// Kick-off!
exports.listen = function(port) {
  http.listen(port, function() {
    log.info('listening on *:%d', port);
  });
};
