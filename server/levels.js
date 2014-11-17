var levelMap = {};
var path = require('path');
var fs = require('fs');

var files = fs.readdirSync(path.resolve(__dirname + '/../levels/'));

files.forEach(function (fileName) {
  if (/(\.json)$/gi.test(fileName)) {
    var filePath = path.resolve(__dirname + '/../levels/' + fileName);
    var string = fs.readFileSync(filePath, 'utf-8');
    levelMap[fileName.replace('.json', '')] = JSON.parse(string);
  }
});

var get = function (levelId) {
  return levelMap[levelId];
};

exports.get = get;
