
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

exports.getAllVersus = function () {
  return require('monkey-music/levels').versus;
};
exports.getAllBosses = function () {
  return require('monkey-music/levels').boss;
};
exports.getAllDemo = function () {
  return require('monkey-music/levels').demo;
};

exports.getBoss = function (levelId) {
  return get('boss/' + levelId);
};
exports.getVersus = function (levelId) {
  return get('versus/' + levelId);
};
exports.getDemo = function (levelId) {
  return get('demo/' + levelId);
};

