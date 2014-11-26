
var log = require('./log');
var get = function (levelId) {
  try {
    return require('monkey-music/levels/' + levelId + '.json');
  } catch (e) {
    log.error('Failed to find level ' + levelId);
    return false;
  }
};

exports.get = get;
