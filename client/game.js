var io = require('socket.io-client');
var GUI = require('./game/gui');

var urlEncodedGameId = location.href.split('/').pop();
var gameId = decodeURIComponent(urlEncodedGameId);
var socket = io.connect(location.origin);

GUI.setStatus('offline');
socket.on('connect', GUI.setStatus.bind(null, 'ready'));
socket.on('error', GUI.setStatus.bind(null, 'offline', false));
socket.on('disconnect', GUI.setStatus.bind(null, 'offline', false));

var game = require('./game/index');


// The server provided us with a pre-defined replay play it!
if (window.monkeyMusicReplay !== undefined) {
  game.displayLevel({
    level: window.monkeyMusicReplay.level
  }, function () {
    game.displayReplay(window.monkeyMusicReplay.replay);
  });
} else {
  // We're waiting for a replay through the socket
  socket.on('connect', function () {
    socket.emit('game', gameId, game.displayLevel);
    socket.on('replay', game.displayReplay);
  });
}
