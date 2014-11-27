
var log = require('./log');
var get = function (levelId) {
  try {
    return require('monkey-music/levels/' + levelId + '.json');
  } catch (e) {
    log.error('Failed to require level ' + levelId);
    log.error(e);
    return false;
  }
};

exports.get = get;
