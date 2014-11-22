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

var updateTeamCoins = function (amount, teamName, cb) {
  getTeamCoins(teamName, function (err, nCoins) {
    if (err) return cb(err);

    var updatedCoins = nCoins + amount;
    teams.merge(teamName, { coins: updatedCoins }, function (err, res) {
      if (err || ! res.ok) return cb(err || 'Database failure');

      cb(null, updatedCoins);
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

    cb(null, doc.challenges);
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
    teams.merge(teamName, { challenges: completed }, function (err, res) {
      if (err || ! res.ok) return cb(err || 'Database failure');

      updateTeamCoins(reward, teamName, function (err, nCoins) {
        if (err) return cb(err);

        cb(null, {
          coins: nCoins,
          challenges: completed
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

    cb(null, rows.map(function (row) { return row; }));
  });
};

var getReplay = function (replayId, cb) {
  replays.get(replayId, cb);
};

exports.getTeamCoins = getTeamCoins;
exports.isTeamRegistered = isTeamRegistered;
exports.getCompletedChallenges = getCompletedChallenges;
exports.setChallengeCompleted = setChallengeCompleted;
exports.saveReplay = saveReplay;
exports.getAllReplays = getAllReplays;
exports.getReplay = getReplay;
exports.updateTeamCoins = updateTeamCoins;