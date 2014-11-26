var router = require('express').Router();

var levels = require('../levels');

router.get('/', function (req, res) {
  res.redirect('/manual/test');
});
router.get('/:levelId', function (req, res) {
  var level = levels.get(req.params.levelId);
  if (!level) {
    res.status(404).render('error', { error: 'Invalid level ID' });
    return;
  }

  res.render('manual', {
    level: JSON.stringify(level)
  });
});

module.exports = router;