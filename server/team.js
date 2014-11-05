var router = require('express').Router();
var db = require('./db');

// Serve team page
router.get('/:teamName', function(req, res) {
  var team = req.params.team;
  db.getTeamCoins(team, function (err, nCoins) {
    res.render('team', {
      team: team,
      coins: nCoins
    });
  });
});

module.exports = router;