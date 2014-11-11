var bodyParser = require('body-parser');
var secret = require('./secret');

var router = require('express').Router();

router.use('/', bodyParser.urlencoded());
router.get('/', function (req, res) {
  res.render('login');
});
router.post('/', function (req, res) {

  var teamName = req.body.teamName;
  var apiKey = req.body.apiKey;

  if (!apiKey || !teamName || secret.forTeam(teamName) !== apiKey) {
    // Invalid login
    res.render('login', {
      teamName: teamName,
      apiKey: apiKey,
      error: 'Team name and apiKey mismatch'
    });
  } else {
    // Look for req.session.validTeam whenever we need to
    // authenticate the client
    req.session.validTeam = true;
    res.redirect('/team/' + teamName);
  }
});

module.exports = router;