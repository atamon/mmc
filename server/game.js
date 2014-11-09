var TURN_TIME_LIMIT = 1000;
var PENDING_JOIN_TIMEOUT = 60000;

var monkeyMusic = require('monkey-music');
var forEach = require('mout/collection/forEach');

var levels = require('./levels');
var log = require('./log');
var sockets = require('./sockets');

var idCounter = 1;
var games = {};
var waitingTeams = {};

var validateTeamInGame = function (game, teamName) {
  return game.teams.indexOf(teamName) !== -1;
};

var tickGame = function (game) {
  var turn = game.turns[game.turns.length - 1];
  forEach(turn, function (team, teamName) {
    var direction = '';
    if (team.turn && team.turn.direction) {
      direction = team.turn.direction;
    }

    if (direction) {
      game.state = monkeyMusic.move(game.state, teamName, direction);
    }
  });

  forEach(turn, function (team, teamName) {
    if (team && team.cb) {
      team.cb(null, monkeyMusic.stateForPlayer(game.state, teamName));
    }
  });

  if (isGameOver(game)) {
    handleGameOver(game);
  } else {
    resetTimeouts(game);
  }
};

var isGameOver = function (game) {
  // TODO When monkeymusic is updated we can
  // just ask monkeyMusic.isGameOver(game.state)
  var state = monkeyMusic.stateForPlayer(game.state, game.teams[0]);
  return state.turns <= 0;
};

var handleGameOver = function (game) {
  forEach(game.timeout, clearTimeout);

  // This could probably be exchanged to something
  // that emits 'game over' events if we start to
  // add a bunch of calls in this method

  var replay = {
    turns: game.turns,
    teams: game.teams,
    level: game.level
  };

  sockets.sendReplayTo(game.id, replay);
  delete games[game.id];
};

var resetTimeouts = function (game) {
  // Reset timeouts for all teams
  game.teams.forEach(function (teamName) {
    clearTimeout(game.timeouts[teamName]);
    game.timeouts[teamName] = setTimeout(function () {
      var currentTurn = game.turns[game.turns.length - 1];
      currentTurn[teamName] = { turn: {} };

      // All teams have posted and/or been timed out
      if (game.teams.length === Object.keys(currentTurn).length) {
        tickGame(game);
        game.turns.push({});
      }
    }, TURN_TIME_LIMIT);
  });
};

/**
 * delivers a turn request
 * This does not mean that we executeTurn a turn in a game
 * We need two requests for this. So we just store the
 * options and its callback
 */
var executeTurn = function (turn, cb) {
  var gameId = turn.gameId;
  var teamName = turn.team;

  var game = games[gameId];
  if (!game) {
    return cb('Invalid game id');
  }

  if (!validateTeamInGame(game, teamName)) {
    return cb('Team not in game');
  }

  var currentTurn = game.turns[game.turns.length - 1];

  if (currentTurn[teamName]) {
     return cb('Your team has already posted a command this turn. ' +
      'Always wait for the server to respond with the next state before posting again');
  }

  log.info('saving turn for game ' + gameId + ', player ' + teamName);
  currentTurn[teamName] = {
    turn: turn,
    index: Object.keys(currentTurn).length,
    cb: cb
  };

  clearTimeout(game.timeouts[teamName]);
  game.timeouts[teamName] = undefined;

  if (Object.keys(currentTurn).length === game.teams.length) {
    tickGame(game);
    game.turns.push({});
  }
};

var createGame = function (options) {
  log.info('starting game', options);

  var id = idCounter++;
  log.info('game created with id', id);

  var game = games[id] = {};
  game.id = id;

  var level = levels.get(options.level);
  if (!level) {
    log.error('failed to create level from option', options.level);
    return false;
  }

  game.level = level;

  // Initialize the turns array with an empty turn
  game.turns = [{}];

  // Prepare for handling turn timeouts for each team
  game.timeouts = {};

  return id;
};

var joinGame = function (gameId, teamName, cb) {
  var game = games[gameId];
  var waitingTeam = waitingTeams[gameId];

  // TODO This assumes that we're only accepting two teams
  // per game. Which is boring.
  if (waitingTeam) {
    // Game ready
    game.teams = [waitingTeam.teamName, teamName];
    game.state = monkeyMusic.newGameState(game.teams, game.level);

    clearTimeout(waitingTeam.timeout);
    waitingTeam.cb(null, monkeyMusic.stateForPlayer(game.state, waitingTeam.teamName));

    cb(null, monkeyMusic.stateForPlayer(game.state, teamName));
  } else {
    // Wait for next player
    var timeout = setTimeout(function () {
      cb('Join request timed out. No other team joined in');
      delete waitingTeams[gameId];
    }, PENDING_JOIN_TIMEOUT);

    waitingTeams[gameId] = {
      teamName: teamName,
      cb: cb,
      timeout: timeout
    };
  }
};

var closeGame = function (gameId) {
  var game = games[gameId];
  if (!game) return;

  forEach(game.timeouts, clearTimeout);

  var lastTurn = game.turns[game.turns.length - 1];
  forEach(lastTurn, function (teamTurn) {
    if (teamTurn && typeof teamTurn.cb === 'function') {
      teamTurn.cb('Game prematurely closed');
    }
  });

  delete games[gameId];
};

var gameExists = function (gameId) {
  return !!games[gameId];
};

var getLevel = function (gameId) {
  return games[gameId] ? games[gameId].level : null;
};

var getTeams = function (gameId) {
  return games[gameId] ? games[gameId].teams : null;
};

exports.executeTurn = executeTurn;
exports.joinGame = joinGame;
exports.createGame = createGame;
exports.gameExists = gameExists;
exports.getLevel = getLevel;
exports.getTeams = getTeams;
exports.closeGame = closeGame;