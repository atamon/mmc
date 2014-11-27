var router = require('express').Router();
var secret = require('../secret');

router.use('/', function (req, res, next) {
  if (!req.session.validTeam) {
    res.redirect('/login');
  } else {
    next();
  }
});
router.get('/', function (req, res) {
  var teamName = req.session.validTeam;
    res.render('team', {
      view: 'team',
      teamName: teamName,
      apiKey: secret.forTeam(teamName)
    });
});

module.exports = router;
