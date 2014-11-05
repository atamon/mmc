var cradle = require('cradle');
var db = new(cradle.Connection)('http://localhost').database('challenge');

var getTeamCoins = function (teamName, cb) {
  // TODO
  cb(3);
};

exports.getTeamCoins = getTeamCoins;