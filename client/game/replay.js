var monkeyMusic = require('monkey-music');
var forEach = require('mout/collection/forEach');
var compact = require('mout/array/compact');
var teamColors = require('./colors');
var bosses = require('./../../bosses.json');

function getRendererState(state, teams) {
  var rendererState = monkeyMusic.gameStateForRenderer(state);
  rendererState.teams = teams.map(function (teamName) {
    var sfp = monkeyMusic.gameStateForTeam(state, teamName);
    // We do this to get simpler interpolations
    sfp.teamName = teamName;
    return sfp;
  });
  rendererState.monkeyDetails = rendererState.teams.map(getMonkeyDetails);
  return rendererState;
}

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

function getFutureStates(game, turns, teams) {
  return turns.map(function processTurn(globalTurn) {
    var commands = [];
    forEach(globalTurn, function (team) {
      try {
        var cmd = monkeyMusic.parseCommand(game.state, team.turn);
        commands[team.index] = cmd;
      } catch (e) {
        console.warn(e);
      }
    });

    commands = compact(commands);
    game.state = monkeyMusic.runCommands(game.state, commands);

    return getRendererState(game.state, teams);
  });
}

function getInterpolations(statesForPlayer) {
  var interpolations = [];
  for (var i = 0; i < statesForPlayer.length - 1; i++) {
    var currentState = statesForPlayer[i];
    var nextState = statesForPlayer[i + 1];

    interpolations.push({
      monkeys: getMonkeyEvents(currentState, nextState),
      // Assume that layouts look the same for all teams during the same turn
      removed: findRemoved(currentState.layout, nextState.layout)
    });
  }

  return interpolations;
}

function getMonkeyDetails(state, teamNumber) {
  // Load special boss-headgear for bosses, if they have one
  var headgear = 'headphones';
  if (bosses[state.teamName] !== undefined &&
      bosses[state.teamName].headgear !== undefined) {

    headgear = bosses[state.teamName].headgear;
  }

  return {
    x: state.position[1],
    y: state.position[0],
    id: state.teamName,
    headgear: headgear,
    color: state.color !== undefined ?
      state.color : teamColors[teamNumber]
  };
}

function getMonkeyEvents(first, second) {
  return first.teams.map(function (firstTeamState, teamIndex) {
    var secondTeamState = second.teams[teamIndex];
    var firstPos = { x: firstTeamState.position[1], y: firstTeamState.position[0] };
    var secondPos = { x: secondTeamState.position[1], y: secondTeamState.position[0] };
    var effects = [];

    console.assert(firstTeamState.teamName === secondTeamState.teamName, firstTeamState, secondTeamState);

    // The monkey just went through a tunnel
    var monkeyOnTunnel = second.baseLayout[secondPos.y][secondPos.x] === 'tunnel';
    var monkeyHasBeenOnTunnel = first.baseLayout[firstPos.y][firstPos.x] === 'tunnel';
    if (monkeyOnTunnel && !monkeyHasBeenOnTunnel) {
      // TODO With animation hints we can know which tunnel
      // the monkey entered and fade into it
      effects.push({
        type: 'fade',
        from: firstPos,
        to: secondPos,
        nTurns: 1 // nTurns not real ms duration
      });
    } else {
      effects.push({
        type: 'tween',
        nTurns: 1,
        from: firstPos,
        to: secondPos,
        direction: calculateDirection(firstPos, secondPos),
      });
    }

    return {
      id: firstTeamState.teamName,
      effects: effects
    };
  });
}

function prepare(teams, turns, level) {
  var game = {};
  game.state = monkeyMusic.createGameState(teams, level);

  var initial = getRendererState(game.state, teams);

  // Get states
  var rendererStates = getFutureStates(game, turns, teams);
  // Prepend first state
  rendererStates.unshift(initial);

  // Get interpolations
  var interpolations = getInterpolations(rendererStates);

  return {
    rendererStates: rendererStates,
    interpolations: interpolations
  };
}

function step(currentStates, game, teams, turn) {
  // Get states
  var rendererStates = [currentStates].concat(getFutureStates(game, [turn], teams));

  // Get interpolations
  var interpolations = getInterpolations(rendererStates);

  return {
    rendererStates: rendererStates,
    interpolations: interpolations
  };
}

exports.prepare = prepare;
exports.step = step;
exports.getRendererState = getRendererState;