var router = require('express').Router();
var levels = require('../levels');
var settings = require('../../settings.json');

router.use('/', function (req, res, next) {
  if (req.session.validTeam !== settings.adminUser) {
    return res.status(403).render('error', { error: 'No no no no!' });
  } else {
    next();
  }
});

router.get('/', function (req, res) {
  res.redirect('/manual/test');
});
router.get('/:levelId', function (req, res) {
  var level = levels.get('boss/' + req.params.levelId);
  if (!level) {
    res.status(404).render('error', { error: 'Invalid level ID' });
    return;
  }

  res.render('manual', {
    level: JSON.stringify(level)
  });
});

module.exports = router;