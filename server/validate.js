var BAD_REQUEST = 400;
var secret = require('./secret');
var game = require('./game');
var log = require('./log');

var validateJoin = function (req, res) {
  return true;
};

var validateMove = function(req, res) {
  if (req.body.direction === undefined) {
    res.status(BAD_REQUEST).send({ message: 'missing direction' });
    return false;
  }
  switch (req.body.direction) {
    case 'left':
    case 'right':
    case 'up':
    case 'down':
    case '': // Until we get idle command
      break;
    default:
      res.status(BAD_REQUEST).send({ message: 'invalid direction: ' + req.body.direction });
      return false;
  }
  return true;
};

var commandValidations = {
  'move': validateMove,
  'join game': validateJoin
};

var validateRequest = function (req, res) {
  if (!req) return false;

  log.info('incoming request with body: ' + JSON.stringify(req.body));

  if (!req.body) {
    res.status(BAD_REQUEST).send({ message: 'missing or malformed JSON' });
    return false;
  } else if (!req.body.team) {
    res.status(BAD_REQUEST).send({ message: 'missing team' });
    return false;
  } else if (!req.body.apiKey) {
    res.status(BAD_REQUEST).send({ message: 'missing API key' });
    return false;
  } else if (req.body.apiKey !== secret.forTeam(req.body.team)) {
    var message = 'wrong API key: ' + req.body.apiKey +
                  ' for team: ' + req.body.team;
    res.status(BAD_REQUEST).send({ message: message });
    return false;
  } else if (!req.body.command) {
    res.status(BAD_REQUEST).send({ message: 'missing command' });
    return false;
  } else if (!commandValidations[req.body.command]) {
    res.status(BAD_REQUEST).send({ message: 'unknown command: ' + req.body.command });
    return false;
  } else if (!req.body.gameId || !game.gameExists(req.body.gameId)) {
    log.warn(req.body, 'rejected request with invalid game id: ');
    res.status(BAD_REQUEST).send({ message: 'invalid game id: ' + req.body.gameId });
    return false;
  } else {
    return commandValidations[req.body.command](req, res);
  }
};

exports.request = validateRequest;
