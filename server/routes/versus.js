var router = require('express').Router();

var game = require('../game.js');
var levels = require('../levels');


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
    level: req.params.levelId,
    open: true
  });

  // If we lack a gameId we render an error page.
  // Something's off if we do.
  if (gameId) {
    res.redirect('/game/'+gameId);
  } else {
    res.status(500).render('error');
  }
});

router.get('/open-games', function (req, res) {
  var games = game.getAllOpen();
  res.render('open-games', {
    view: 'team',
    games: games
  });
});

module.exports = router;