var io = require('socket.io-client');
var settings = require('../client-settings.json');
var GUI = require('./gui');

var url = settings.host;

var urlEncodedGameId = location.href.split('/').pop();
var gameId = decodeURIComponent(urlEncodedGameId);
var socket = io.connect(url);

GUI.setStatus('offline');
socket.on('connect', GUI.setStatus.bind(null, 'ready'));
socket.on('error', GUI.setStatus.bind(null, 'offline', false));
socket.on('disconnect', GUI.setStatus.bind(null, 'offline', false));

var game = require('./game/index');

socket.on('connect', function () {
  socket.emit('game', gameId, game.displayLevel);
  socket.on('replay', game.displayReplay);
});
