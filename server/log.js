var bunyan = require('bunyan');
var fs = require('fs');

if (!fs.existsSync('log')) {
  fs.mkdirSync('log');
}

var log = bunyan.createLogger({
  name: 'challenge',
  src: true,
  streams: [{
    level: 'info',
    stream: process.stdout
  }, {
    level: 'info',
    path: 'log/challenge.log'
  }]
});

module.exports = log;
module.exports.silence = function () {
  log.info = function () {};
  log.error = function () {};
};
