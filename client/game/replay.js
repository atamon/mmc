var monkeyMusic = require('monkey-music');
var forEach = require('mout/collection/forEach');
var compact = require('mout/array/compact');

/**
 * @param  {Object} userPos Position object with x and y key-value pairs
 * @param  {Object} targetPos Position object with x and y key-value pairs
 * @return {String} Returns the direction from user to target
 */
function calculateDirection(userPos, targetPos) {
  if (userPos.y !== targetPos.y) {
    if (userPos.y > targetPos.y) return 'up';
    else return 'down';
  }

  if (userPos.x !== targetPos.x) {
    if (userPos.x > targetPos.x) return 'left';
    else return 'right';
  }

  return '';
}

function wasRemoved(tile, nextTile) {
  return tile !== nextTile &&
    ['song', 'album', 'playlist'].indexOf(tile) !== -1 &&
    ['empty', 'monkey'].indexOf(nextTile) !== -1;
}

function findRemoved(first, second) {
  var removes = [];
  first.forEach(function (row, y) {
    row.forEach(function (tile, x) {
      var nextTile = second[y][x];
      // If music was picked up
      if (wasRemoved(tile, nextTile)) {
        removes.push({ x: x, y: y });
      }
    });
  });

  return removes;
}

function prepare(teams, turns, level) {
  var gameState = monkeyMusic.createGameState(teams, level);

  var initial = [teams.map(function (teamName) {
    var sfp = monkeyMusic.gameStateForTeam(gameState, teamName);
    // We do this to get simpler interpolations
    sfp.teamName = teamName;
    return sfp;
  })];

  var statesForPlayer = initial.concat(turns.map(function processTurn(globalTurn) {
    var commands = [];
    forEach(globalTurn, function (team) {
      try {
        var cmd = monkeyMusic.parseCommand(team.turn);
        commands[team.index] = cmd;
      } catch (e) {
        console.warn(e);
      }
    });

    commands = compact(commands);
    gameState = monkeyMusic.runCommands(gameState, commands);

    return teams.map(function (teamName) {
      var sfp = monkeyMusic.gameStateForTeam(gameState, teamName);
      // We do this to get simpler interpolations
      sfp.teamName = teamName;
      return sfp;
    });
  }));

  var interpolations = [];
  for (var i = 0; i < statesForPlayer.length - 1; i++) {
    var currentStates = statesForPlayer[i];
    var nextStates = statesForPlayer[i + 1];

    var monkeys = currentStates.map(function (first, index) {
      var second = nextStates[index];
      var firstPos = { x: first.position[1], y: first.position[0] };
      var secondPos = { x: second.position[1], y: second.position[0] };

      console.assert(first.teamName === second.teamName, first, second);

      return {
        from: firstPos,
        to: secondPos,
        direction: calculateDirection(firstPos, secondPos),
        id: first.teamName
      };
    });

    interpolations.push({
      monkeys: monkeys,
      // Assume that layouts look the same for all teams during the same turn
      removed: findRemoved(currentStates[0].layout, nextStates[0].layout)
    });
  }

  return {
    statesForPlayer: statesForPlayer,
    interpolations: interpolations
  };
}

exports.prepare = prepare;