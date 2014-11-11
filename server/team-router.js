var router = require('express').Router();

router.use('/', function (req, res, next) {
  if (!req.session.validTeam) {
    res.redirect('/login');
  } else {
    next();
  }
});
router.get('/:teamName', function (req, res) {
  res.render('team', {
    teamName: req.params.teamName
  });
});

module.exports = router;