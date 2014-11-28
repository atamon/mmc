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

function routeManual (levelType, req, res) {
  var level = levels.get(levelType + '/' + req.params.levelId);
  if (!level) {
    res.status(404).render('error', { error: 'Invalid level ID' });
    return;
  }

  res.render('manual', {
    level: JSON.stringify(level)
  });
}

router.get('/boss/:levelId', routeManual.bind(null, 'boss'));
router.get('/demo/:levelId', routeManual.bind(null, 'demo'));
router.get('/versus/:levelId', routeManual.bind(null, 'versus'));

module.exports = router;