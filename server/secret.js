var crypto = require('crypto');

var settings = require('../settings.json');

exports.forTeam = function(teamName) {
  var shasum = crypto.createHash('sha1');
  shasum.update(settings.secret);
  shasum.update(teamName);
  return shasum.digest('base64');
};
