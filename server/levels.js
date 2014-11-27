
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

var getAllVersus = function () {
  return ['maze', 'Maze 1', 'Amaze ing', 'Amaze ing', 'Amaze ing', 'Amaze ing', 'Versus Two'];
};

exports.get = get;
exports.getAllVersus = getAllVersus;