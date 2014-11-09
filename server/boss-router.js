var router = require('express').Router();
var request = require('request');
var bodyParser = require('body-parser');
var levels = require('./levels');
var settings = require('../settings.json');

var log = require('./log');
var bosses = require('../bosses.json');
var game = require('./game');

// // Serve boss page
router.get('/:teamName/:bossId', function (req, res) {
  // TODO Make real lookup of level for this boss
  var level = levels.get(bosses[req.params.bossId].level);

  // Look up level and AI for this boss
  // Render boss page
  res.render('boss', {
    level: level,
    teams: [req.params.teamName, req.params.bossId]
  });
});


// Handle team vs boss AI
router.use('/start', bodyParser.urlencoded());
router.post('/start', function (req, res) {
  // Look up level and AI for this boss
  console.log(req.body);
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

    res.send(200, { gameId: gameId });
  });
});

module.exports = router;