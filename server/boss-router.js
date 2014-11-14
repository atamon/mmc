var router = require('express').Router();
var request = require('request');
var bodyParser = require('body-parser');
var levels = require('./levels');
var settings = require('../settings.json');

var log = require('./log');
var bosses = require('../bosses.json');
var game = require('./game');
var db = require('./db');

function handleGameOver(gameId, bossId) {
  game.on('gameover:' + gameId, function (results) {
    var scores = results.scores;

    // Just make 100% sure that we actually had two or more teams here
    console.assert(scores.length > 1, gameId, results);

    if (scores[0].score > scores[1].score) {
      var winner = scores[0];

      if (winner.teamName !== bossId) {
        log.info(winner.teamName + ' beat boss ' + bossId +
          '['+ winner.score + ' - ' + scores[1].score + ']');

        // Team won! Make sure that it's registered
        db.isTeamRegistered(winner.teamName, function (err, isRegistered) {
          if (err) return log.error(err);

          if (!isRegistered) {
            return log.info('Unregistered team completed boss ' + bossId);
          }

          db.setChallengeCompleted(winner.teamName, bossId, function (err, result) {
            if (err) log.error(err);

            if (!result) {
              // Team already completed this challenge. Ignore
              return;
            }

            // result 'coins', 'challenges'
            // TODO Update ranking, bossgrid, coins through sockets
          });
        });
      }
    }
  });
}

// Require login so we can get teamName from there
router.use('/', function (req, res, next) {
  if (!req.session.validTeam) {
    res.redirect('/login');
  } else {
    next();
  }
});

// // Serve boss page
router.get('/:bossId', function (req, res) {
  var level = levels.get(bosses[req.params.bossId].level);

  // Look up level and AI for this boss
  // Render boss page
  res.render('boss', {
    level: level,
    teams: [req.session.validTeam, req.params.bossId]
  });
});


// Handle team vs boss AI
router.use('/start', bodyParser.urlencoded());
router.post('/start', function (req, res) {
  // Look up level and AI for this boss
  var levelId = bosses[req.body.bossId].level;
  var botId = bosses[req.body.bossId].bot;

  var gameId = game.createGame({
    level: levelId
  });

  // Request AI from http://localhost:BOSS_PORT
  var options = {
    url: 'http://localhost:' + settings.botPort,
    form: {
      botId: botId,
      gameId: gameId
    },
    json: true
  };

  // The bot server is a separate processs due to handling of sub processes
  // making heavy computations. Let's crash only parts of our system at a time :-)
  request.post(options, function (err, botRes, body) {
    if (err) {
      log.error(err);
      game.closeGame(gameId);
      return res.send(400);
    }
    if (botRes.statusCode !== 200) {
      game.closeGame(gameId);
      return res.send(botRes.statusCode, body);
    }

    handleGameOver(gameId);

    res.send(200, { gameId: gameId });
  });
});

module.exports = router;