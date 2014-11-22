// We wait a second for teams to post their turn
var TURN_TIME_LIMIT = 1000;
// We wait a minute for all players to join after the first one
var PENDING_JOIN_TIMEOUT = 60000;
// We wait 10 minutes until we kill games that nobody have joined
var PASSIVE_GAME_LIFE_LENGTH = 60000 * 10;

var monkeyMusic = require('monkey-music');
var forEach = require('mout/collection/forEach');
var compact = require('mout/array/compact');
var EventEmitter = require('events').EventEmitter;

var levels = require('./levels');
var log = require('./log');

var events = new EventEmitter();
var idCounter = 1;
var games = {};
var waitingTeams = {};

var validateTeamInGame = function (game, teamName) {
  return game.teams.indexOf(teamName) !== -1;
};

var tickGame = function (game) {
  var turn = game.turns[game.turns.length - 1];
  var commands = [];
  forEach(turn, function (team) {
    try {
      var cmd = monkeyMusic.parseCommand(game.state, team.turn);
      commands[team.index] = cmd;
    } catch (e) {
      team.message = e.message;
    }
  });

  commands = compact(commands);
  try {
    game.state = monkeyMusic.runCommands(game.state, commands);
  } catch (e) {
    log.error(e);

    closeGame(game.id);
    handleGameOver(game);
    return;
  }

  forEach(turn, function (team, teamName) {
    if (team && team.cb) {
      var sfp = monkeyMusic.gameStateForTeam(game.state, teamName);
      sfp.message = team.message;
      team.cb(null, sfp);
    }
  });

  if (monkeyMusic.isGameOver(game.state)) {
    handleGameOver(game);
  } else {
    resetTimeouts(game);
  }
};

var handleGameOver = function (game) {
  forEach(game.timeout, clearTimeout);

  var replay = {
    turns: game.turns,
    teams: game.teams,
    level: game.level
  };

  var scores = game.teams.map(function (teamName) {
    var sfp = monkeyMusic.gameStateForTeam(game.state, teamName);
    return {
      teamName: teamName,
      score: sfp.score
    };
  });

  var sortedScores = scores.sort(function (a, b) {
    return b.score - a.score;
  });

  var data = {
    replay: replay,
    scores: sortedScores,
    gameId: game.id,
    level: game.level
  };

  events.emit('gameover', data);
  events.emit('gameover:' + game.id, data);
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
  if (options.gameId !== undefined && games[options.gameId]) {
    log.error('failed to create game with existing id', options.gameId);
    return false;
  }

  var gameId = options.gameId;
  if (gameId === undefined) {
     gameId = idCounter++;
  }

  log.info('game created with id', gameId);

  var game = games[gameId] = {};
  game.id = gameId;

  var level = levels.get(options.level);
  if (!level) {
    log.error('failed to create level from option', options.level);
    return false;
  }

  // The level JSON, to be handed to monkeyMusic
  game.level = level;

  // Initialize the turns array with an empty turn
  game.turns = [{}];

  // Prepare for handling turn timeouts for each team
  game.timeouts = {};

  // We shall try to support large games as well
  game.numberOfTeams = options.numberOfTeams || 2;

  // Start accepting joining teams
  waitingTeams[gameId] = [];

  // Kill games that nobody has joined after X time
  game.passiveGameTimeout = setTimeout(function () {
    delete waitingTeams[gameId];
    delete games[gameId];
  }, PASSIVE_GAME_LIFE_LENGTH);

  return gameId;
};

var joinGame = function (gameId, teamName, cb) {
  var game = games[gameId];
  if (!game) {
    return cb('Invalid game id');
  }

  var waiting = waitingTeams[gameId];
  if (!waiting) {
    return cb('Game already running');
  }

  // Cancel passive game killer timeout
  clearTimeout(game.passiveGameTimeout);

  // Wait for remaining teams
  var timeout = setTimeout(function () {
    cb('Join request timed out. No other team joined in');

    // Deleting a non-existant key is alright,
    // so we do this the simple way
    delete waitingTeams[gameId];
  }, PENDING_JOIN_TIMEOUT);

  waiting.push({
    teamName: teamName,
    cb: cb,
    timeout: timeout
  });

  // Game ready
  if (waiting.length >= game.numberOfTeams) {
    game.teams = waiting.map(function (o) { return o.teamName; });
    game.state = monkeyMusic.createGameState(game.teams, game.level);

    // Serve first game state to all teams
    waiting.forEach(function (team) {
      clearTimeout(team.timeout);
      team.cb(null, monkeyMusic.gameStateForTeam(game.state, team.teamName));
    });

    // Delete the array of waiting teams to make sure we
    // don't let any more teams join
    delete waitingTeams[gameId];
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
exports.on = events.on.bind(events);