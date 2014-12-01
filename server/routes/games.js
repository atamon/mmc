var BAD_REQUEST = 400;

var router = require('express').Router();
var bodyParser = require('body-parser');

var validate = require('../validate.js');
var game = require('../game.js');
var levels = require('../levels');
var sockets = require('../sockets');
var db = require('../db');
var log = require('../log');

game.on('gameover', function (results) {
  sockets.sendReplayTo(results.gameId, results.replay);
});

// Parse POST body
router.use('/', bodyParser.json());

// Handle invalid JSON sent through curl for example
router.use('/', function (err, req, res, next) {
  if (!err) return next();
  res.send(400, { message: err.message || 'Invalid request' });
});

router.get('/:gameId', function (req, res) {
  if (!game.gameExists(req.params.gameId)) {
    return res.status(500).render('error', { error: 'Sorry, no game here!' });
  }

  res.render('versus', {
    gameId: req.params.gameId
  });
});

router.post('/', function (req, res) {
  if (!validate.request(req, res)) return;

  // After this point we don't need the apiKey
  // So we remove it so that we do not accidentally send it somewhere
  // Like to a client that is watching the replay (which does not require authentication)
  delete req.body.apiKey;

  var responseHandler = function (err, stateForPlayer) {
    if (err) return res.status(BAD_REQUEST).send({ message: err });

    res.send(stateForPlayer);
  };

  var teamName = (req.body.team || '').replace(/_2$/, '');
  db.isTeamRegistered(teamName, function (err, isRegistered) {
    if (err) {
      log.error(err);
      res.status(500).render('error');
      return;
    }

    if (!isRegistered) {
      res.status(400).send({ message: 'Invalid team name ' + req.body.team });
      return;
    }

    if (/_2$/.test(req.body.team) && !game.isTeamInGame(req.body.gameId, teamName)) {
      return responseHandler('Versus hack teams are only allowed in games against ' +
                             'your real team. Join with that team first.');
    }


    // Join game is a special server-only command that
    // the game engine knows nothing about, so let's handle
    // it separately
    if (req.body.command === 'join game') {
      game.joinGame(req.body.gameId, req.body.team, responseHandler);
    } else {
      // Execute the command requested
      game.executeTurn(req.body, responseHandler);
    }
  });
});

module.exports = router;
