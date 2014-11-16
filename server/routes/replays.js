var router = require('express').Router();
var game = require('../game');
var db = require('../db');
var log = require('../log');

game.on('gameover', function (results) {
  var gameId = results.gameId;
  db.saveReplay(gameId, results, function (err, success) {
    if (err) {
      log.error(err);
    }

    if (!success) {
      log.error('Failed to save replay for game ' + gameId);
    } else {
      // TODO Push new replays to sockets?
    }
  });
});

router.get('/', function (req, res) {
  db.getAllReplays(function (err, replays) {
    if (err) {
      log.error(err);
      res.status(500).render('error');
    } else {
      res.render('replay-list', { replays: replays });
    }
  });
});

router.get('/:replayId', function (req, res) {
  db.getReplay(req.params.replayId, function (err, replay) {
    if (err) {
      log.error(err);
      res.status(500).render('error');
      return;
    }

    res.render('game', {
      replay: replay
    });
  });
});

module.exports = router;
