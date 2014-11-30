var router = require('express').Router();
var secret = require('../secret');
var clone = require('mout/lang/clone');

var db = require('../db');
var log = require('../log');

function prepareRanking(ranking, ownTeam) {
  return ranking.map(function (team) {
    var formatted = clone(team);
    if (team.teamName !== ownTeam) {
      formatted.teamName = Math.random().toString(36).substring(7);
      formatted.obfuscated = true;
    }
    formatted.ratio = formatted.ratio.toFixed(2);

    return formatted;
  });
}

router.use('/', function (req, res, next) {
  if (!req.session.validTeam) {
    res.redirect('/login');
  } else {
    next();
  }
});
router.get('/', function (req, res) {
  var teamName = req.session.validTeam;

  db.getRanking(function (err, ranking) {
    // Let's continue but not render the ranking
    if (err) log.error(err);

    res.render('team', {
      view: 'team',
      teamName: teamName,
      apiKey: secret.forTeam(teamName),
      ranking: prepareRanking(ranking, teamName)
    });
  });
});

module.exports = router;
