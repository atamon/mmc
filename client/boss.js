var io = require('socket.io-client');
var reqwest = require('reqwest');
var game = require('./game');

var socket = io.connect(location.origin);

socket.on('progress', game.updateProgress);


var createGameBtn = document.getElementById('start-game');
var gameIdLabel = document.querySelector('#game-id');

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
      socket.emit('game', body.gameId, game.displayLevel);
      gameIdLabel.innerHTML = body.gameId;
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
