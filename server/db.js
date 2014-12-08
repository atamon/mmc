var cradle = require('cradle');
var connection = new(cradle.Connection)('http://localhost');
var teams = connection.database('teams');
var replays = connection.database('replays');

var bosses = require('../bosses.json');
var unrankedTeams = require('../unranked-teams.json');

replays.save('_design/list', {
  all: {
    map: function (doc) {
      if (doc.gameId) emit(doc.gameId, doc);
    }
  }
});

var getTeamKey = function (teamName, key, cb) {
  teams.get(teamName, function (err, doc) {
    if (err) return cb(err);
    if (!doc) return cb('Invalid team ' + teamName);

    var value = doc[key] || null;
    cb(null, value);
  });
};

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
  replays.view('list/all', function (err, rows) {
    if (err) return cb(err);
    cb(null, rows);
  });
};

var getReplay = function (replayId, cb) {
  replays.get(replayId, cb);
};

var updatePlayedGames = function (teamName, isWinner, cb) {

  getTeamKey(teamName, 'gameStats', function (err, gameStats) {
    if (err) return cb(err);

    if (!gameStats) {
      gameStats = {
        numberOfGames: 0,
        wins: 0
      };
    }

    gameStats.numberOfGames += 1;

    if (isWinner) {
      gameStats.wins += 1;
    }

    teams.merge(teamName, { gameStats: gameStats }, cb);
  });
};

// Helper for getRanking
var rankTeamRows = function (rows) {
  var rankedTeams = rows.reduce(function (rankedTeams, row) {
    var team = row.doc;
    if (unrankedTeams.indexOf(team.teamName) === -1) {
      var gameStats = team.gameStats || { wins: 0, numberOfGames: 0 };
      var ratio = 0;
      if (gameStats.numberOfGames > 0) {
        ratio = gameStats.wins / gameStats.numberOfGames;
      }
      rankedTeams.push({
        teamName: team.teamName,
        wins: gameStats.wins,
        numberOfGames: gameStats.numberOfGames,
        ratio: ratio
      });
    }

    return rankedTeams;
  }, []);

  return rankedTeams.sort(function (a, b) {
    if (b.ratio - a.ratio === 0) {
      return b.numberOfGames - a.numberOfGames;
    }

    return b.ratio - a.ratio;
  });
};

var getRanking = function (cb) {
  teams.all({ include_docs: true }, function (err, rows) {
    if (err) return cb(err);

    var rankedTeams = rankTeamRows(rows);
    cb(null, rankedTeams);
  });
};

exports.getTeamCoins = getTeamCoins;
exports.isTeamRegistered = isTeamRegistered;
exports.getCompletedChallenges = getCompletedChallenges;
exports.setChallengeCompleted = setChallengeCompleted;
exports.saveReplay = saveReplay;
exports.getAllReplays = getAllReplays;
exports.getReplay = getReplay;
exports.updateTeamCoins = updateTeamCoins;
exports.updatePlayedGames = updatePlayedGames;
exports.getRanking = getRanking;