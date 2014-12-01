var router = require('express').Router();
var game = require('../game');
var db = require('../db');
var log = require('../log');
var settings = require('../../settings.json');

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

router.use('/', function (req, res, next) {
  if (req.session.validTeam !== settings.adminUser) {
    return res.status(403).render('error', { error: 'Nah aah!' });
  } else {
    next();
  }
});

router.get('/', function (req, res) {
  db.getAllReplays(function (err, replays) {
    if (err) {
      log.error(err);
      res.status(500).render('error');
    } else {
      res.render('replay-list', { replays: replays, view: 'team' });
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

    res.render('versus', {
      replay: JSON.stringify(replay)
    });
  });
});

module.exports = router;
