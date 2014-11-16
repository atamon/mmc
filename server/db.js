var cradle = require('cradle');
var connection = new(cradle.Connection)('http://localhost');
var teams = connection.database('teams');
var replays = connection.database('replays');

var bosses = require('../bosses.json');

var getTeamCoins = function (teamName, cb) {
  teams.get(teamName, function (err, doc) {
    if (err) return cb(err);

    cb(null, doc.coins || 0);
  });
};

var udpateTeamCoins = function (amount, teamName, cb) {
  getTeamCoins(teamName, function (err, nCoins) {
    if (err) return cb(err);

    teams.merge(teamName, { coins: nCoins + amount }, function (err, doc) {
      if (err) return cb(err);
      cb(null, doc.coins);
    });
  });
};

var isTeamRegistered = function (teamName, cb) {
  teams.get(teamName, function (err, doc) {
    if (err && err.error === 'not_found') {
      err = null;
    }
    cb(err, !!doc);
  });
};

var getCompletedChallenges = function(teamName, cb) {
  teams.get(teamName, function (err, doc) {
    if (err) return cb(err);

    cb(null, doc.challenges || []);
  });
};

var setChallengeCompleted = function (teamName, bossId, cb) {
  var reward = bosses[bossId].reward || 0;

  getCompletedChallenges(teamName, function (err, completed) {
    if (err) return cb(err);

    if (completed.indexOf(bossId) !== -1) {
      return cb(null, false);
    }

    completed.push(bossId);
    teams.merge(teamName, { challenges: completed }, function (err, doc) {
      if (err) return cb(err);

      var challenges = doc.challenges;
      udpateTeamCoins(reward, teamName, function (err, nCoins) {
        if (err) return cb(err);

        cb(null, {
          coins: nCoins,
          challanges: challenges
        });
      });
    });
  });
};

var saveReplay = function (gameId, results, cb) {
  replays.save(results, function (err, doc) {
    cb(err, !!doc);
  });
};

var getAllReplays = function (cb) {
  replays.all({ include_docs: true }, function (err, rows) {
    if (err) return cb(err);

    var replays = rows.map(function (row) {
      delete row._id;
      delete row._rev;
      return row;
    });
    cb(null, replays);
  });
};

exports.getTeamCoins = getTeamCoins;
exports.isTeamRegistered = isTeamRegistered;
exports.getCompletedChallenges = getCompletedChallenges;
exports.setChallengeCompleted = setChallengeCompleted;
exports.saveReplay = saveReplay;
exports.getAllReplays = getAllReplays;