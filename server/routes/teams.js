var router = require('express').Router();
var db = require('../db');
var log = require('../log');

var bosses = require('../../bosses.json');

router.use('/', function (req, res, next) {
  if (!req.session.validTeam) {
    res.redirect('/login');
  } else {
    next();
  }
});
router.get('/', function (req, res) {
  var teamName = req.session.validTeam;
  db.getTeamCoins(teamName, function (err, nCoins) {
    if (err) {
      log.error(err);
      res.render('error');
      return;
    }
    db.getCompletedChallenges(teamName, function (err, challenges) {
      if (err) {
        log.error(err);
        res.render('error');
        return;
      }

      res.render('team', {
        teamName: teamName,
        bosses: bosses,
        coins: nCoins,
        challenges: challenges
      });
    });
  });
});

module.exports = router;
