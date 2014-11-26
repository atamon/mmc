var io = require('socket.io-client');
var reqwest = require('reqwest');
var GUI = require('./game/gui');

var socket = io.connect(location.origin);

GUI.setStatus('offline');
socket.on('connect', GUI.setStatus.bind(null, 'ready'));
socket.on('error', GUI.setStatus.bind(null, 'offline', false));
socket.on('disconnect', GUI.setStatus.bind(null, 'offline', false));

var game = require('./game');

var createGameBtn = document.getElementById('start-game');
var currentGameDisplay = document.getElementById('game-id');

createGameBtn.addEventListener('click', createGame);

function createGame() {
  createGameBtn.setAttribute('disabled', 'disabled');
  var url = location.href.split('/');
  var data = {
    bossId: decodeURIComponent(url.pop())
  };
  reqwest({
    url: location.origin + '/boss/start',
    method: 'POST',
    data: data,
    success: function (body) {
      currentGameDisplay.innerHTML = body.gameId;
      socket.emit('game', body.gameId, game.displayLevel);
    }
  });

  return false;
}

socket.on('connect', function () {
  socket.on('replay', function (replay) {
    // Once a replay is sent to us, we let the team create a new game
    // We shan't force people to wait for a boring/failed game to end
    createGameBtn.removeAttribute('disabled');

    game.displayReplay(replay);
  });
});
socket.on('disconnect', function () {
  socket.off('replay', game.displayReplay);
});

createGame();
