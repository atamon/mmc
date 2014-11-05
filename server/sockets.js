var io = null;

var log = require('./log');
var game = require('./game');

function handleConnection(socket) {
  socket.on('game', function (gameId, cb) {
    log.info('a team has joined: %s', gameId);
    socket.join(gameId);

    cb({
      level: game.getLevel(gameId),
      teams: game.getTeams(gameId)
    });
  });
}

exports.sendReplayTo = function (game, replay) {
  log.info('sending replay to game %s', game);
  io.to(game).emit('replay', replay);
};

exports.setIo = function (instance) {
  if (io) {
    return;
  }
  io = instance;
  io.on('connection', handleConnection);
};
