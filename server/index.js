// setup logging
var log = require('./log');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var exphbs  = require('express-handlebars');
var session = require('express-session');

var routes = require('./routes.js');

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
var settings = require('../settings.json');

// Authentication
app.use(session({ secret: settings.secret }));

// Routes
app.get('/schedule', function (req, res) { res.render('schedule'); });
app.get('/', function (req, res) { res.redirect('/login'); });
app.use('/login', routes.login);
app.use('/team', routes.teams);
app.use('/game', routes.games);
app.use('/boss', routes.bosses);
app.use('/replays', routes.replays);

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
