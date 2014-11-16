var bodyParser = require('body-parser');
var secret = require('../secret');
var db = require('../db');
var router = require('express').Router();

router.use('/', bodyParser.urlencoded());
router.get('/', function (req, res) {
  if (req.session.validTeam) {
    res.redirect('/team');
  } else {
    res.render('login');
  }
});
router.post('/', function (req, res) {

  var teamName = req.body.teamName;
  var apiKey = req.body.apiKey;

  validateLogin(teamName, apiKey, function (err, isValid) {
    if (err) {
      return res.status(500).render('error');
    }

    if (!isValid) {
      // Invalid login
      res.render('login', {
        teamName: teamName,
        apiKey: apiKey,
        error: 'The team name or API key is incorrect.'
      });
    } else {
      // Look for req.session.validTeam whenever we need to
      // authenticate the client
      req.session.validTeam = teamName;
      res.redirect('/team');
    }
  });
});

function validateLogin(teamName, apiKey, cb) {
  db.isTeamRegistered(teamName, function (err, isRegistered) {
    var isValid = isRegistered &&
      apiKey && teamName &&
      secret.forTeam(teamName) === apiKey;
    cb(err, isValid);
  });
}

module.exports = router;
