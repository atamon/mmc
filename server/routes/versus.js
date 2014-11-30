var router = require('express').Router();

var game = require('../game.js');
var levels = require('../levels');
var db = require('../db');
var log = require('../log');

function handleGameOver(results) {
  var scores = results.scores;

  // Only record scores for 1 vs 1 games
  if (scores.length !== 2) {
    return;
  }
  // Only record scores for games without
  // versus hack bots in them
  var versusHackInGame = false;
  scores.forEach(function (team) {
    if (/_2$/.test(team.teamName)) {
      versusHackInGame = true;
    }
  });
  if (versusHackInGame) {
    return;
  }

  // Decide whether we had a winner or not
  var winner = null;
  if (scores[0].score > scores[1].score) {
    winner = scores[0].teamName;
  }

  scores.forEach(function (team) {
    db.updatePlayedGames(team.teamName, team.teamName === winner, function (err) {
      if (err) {
        log.error(err);
      }
    });
  });
}


router.use('/', function (req, res, next) {
  if (!req.session.validTeam) {
    res.redirect('/login');
  } else {
    next();
  }
});

router.get('/levels', function (req, res) {

  res.render('create-games', {
    view: 'team',
    levels: levels.getAllVersus()
  });
});

router.get('/new/:levelId', function(req, res) {
  var gameId = game.createGame({
    level: 'versus/' + req.params.levelId,
    open: true
  });

  // If we lack a gameId we render an error page.
  // Something's off if we do.
  if (gameId) {
    game.on('gameover:' + gameId, handleGameOver);
    res.redirect('/game/'+gameId);
  } else {
    res.status(500).render('error');
  }
});

module.exports = router;