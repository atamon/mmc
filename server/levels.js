var levelMap = {};
// var path = require('path');
// var fs = require('fs');

// TODO Load all from ../levels instead
levelMap.test = require('../levels/test.json');
levelMap.battle = require('../levels/battle.json');

var get = function (levelId) {
  return levelMap[levelId];
};

exports.get = get;
