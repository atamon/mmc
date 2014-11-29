var router = require('express').Router();
var request = require('request');
var bodyParser = require('body-parser');
var deepClone = require('mout/lang/deepClone');
var levels = require('../levels');
var settings = require('../../settings.json');

var log = require('../log');
var bosses = require('../../bosses.json');
var game = require('../game');
var db = require('../db');

function handleGameOver(challengedBoss, results) {
  var gameId = results.gameId;
  var scores = results.scores;

  // Just make 100% sure that we actually had two or more teams here
  console.assert(scores.length > 1, gameId, results);

  if (scores[0].score !== scores[1].score) {
    var winner = scores[0];

    if (winner.teamName !== challengedBoss) {
      log.info(winner.teamName + ' beat boss ' + challengedBoss +
        '['+ winner.score + ' - ' + scores[1].score + ']');

      db.setChallengeCompleted(winner.teamName, challengedBoss, function (err, result) {
        if (err) log.error(err);

        if (!result) {
          // Team already completed this challenge. Ignore
          return;
        }

        // result 'coins', 'challenges'
        // TODO Update ranking, bossgrid, coins through sockets
      });
    }
 }
}

// Require login so we can get teamName from there
router.use('/', function (req, res, next) {
  if (!req.session.validTeam) {
    res.redirect('/login');
  } else {
    next();
  }
});

// Serve boss list
router.get('/', function (req, res) {
  var teamName = req.session.validTeam;

  db.getCompletedChallenges(teamName, function (err, completed) {
    if (err) {
      log.error(err);
      res.status(500).render('error');
      return;
    }

    var myBosses = deepClone(bosses);
    completed.forEach(function (bossId) {
      if (myBosses[bossId]) {
        myBosses[bossId].completed = true;
      }
    });

    res.render('bosses', {
      view: 'team',
      bosses: myBosses
    });
  });
});

// // Serve boss page
router.get('/:bossId', function (req, res) {
  var boss = bosses[req.params.bossId];
  if (!boss) {
    return res.status(404).render('error', { error: 'Invalid boss ID'});
  }
  var levelId = boss.level;
  var level = levels.getBoss(levelId);

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
  var bossId = req.body.bossId;
  // Look up level and AI for this boss
  var boss = bosses[bossId];
  if (!boss) {
    log.error('Failed to find boss with id ' + bossId);
    res.status(404).send({ message: 'Invalid boss ID' });
    return;
  }

  var levelId = boss.level;
  var botId = boss.bot;
  var args = boss.arguments || '';

  var gameId = game.createGame({
    level: 'boss/' + levelId
  });

  // Request AI from http://localhost:BOSS_PORT
  var options = {
    url: settings.botHost + ':' + settings.botPort,
    form: {
      botId: botId,
      gameId: gameId,
      teamName: bossId,
      arguments: args
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

    game.on('gameover:' + gameId, handleGameOver.bind(null, bossId));

    res.send(200, { gameId: gameId });
  });
});

module.exports = router;
