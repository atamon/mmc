var BAD_REQUEST = 400;

var router = require('express').Router();
var bodyParser = require('body-parser');

var validate = require('./validate.js');
var game = require('./game.js');
var sockets = require('./sockets');

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
    return res.send(404);
  }

  res.render('game');
});

router.post('/', function (req, res) {
  // As gameId is provided here, we need to be able to
  // manually set up a new game,
  // the new game should have two team names and a level before
  // we can make any use of it here
  if (!validate.request(req, res)) return;

  // After this point we don't need the apiKey
  // So we remove it so that we do not accidentally send it somewhere
  // Like to a client that is watching the replay (which does not require authentication)
  delete req.body.apiKey;

  // Join game is a special server-only command that
  // the game engine knows nothing about, so let's handle
  // it separately
  if (req.body.command === 'join game') {
    game.joinGame(req.body.gameId, req.body.team, function (err, stateForPlayer) {
      if (err) return res.status(BAD_REQUEST).send({ message: err });

      res.send(stateForPlayer);
    });
  } else {
    // Execute the command requested
    game.executeTurn(req.body, function (err, stateForPlayer) {
      if (err) return res.status(BAD_REQUEST).send({ message: err });

      res.send(stateForPlayer);
    });
  }
});

module.exports = router;