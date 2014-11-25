var monkeyMusic = require('monkey-music');
var forEach = require('mout/collection/forEach');
var compact = require('mout/array/compact');
var map = require('mout/collection/map');
var teamColors = require('./colors');
var bosses = require('./../../bosses.json');

function unitIsPickable(unit) {
  var pickables = ['song', 'album', 'playlist', 'banana', 'trap'];
  return pickables.indexOf(unit) !== -1;
}

function getRendererState(state, teams) {
  var rendererState = monkeyMusic.gameStateForRenderer(state);
  rendererState.monkeyDetails = map(rendererState.teams, function getMonkeyDetails(state, teamNumber) {
    // Load special boss-headgear for bosses, if they have one
    var headgear = 'headphones';
    if (bosses[state.teamName] !== undefined &&
        bosses[state.teamName].headgear !== undefined) {

      headgear = bosses[state.teamName].headgear;
    }

    return {
      x: state.position[1],
      y: state.position[0],
      id: teams[teamNumber],
      headgear: headgear,
      color: state.color !== undefined ?
        state.color : teamColors[teamNumber]
    };
  });
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
    unitIsPickable(tile) &&
    ['empty', 'monkey'].indexOf(nextTile) !== -1;
}

function wasUpdated(tile, nextTile) {
  return tile !== nextTile &&
    // Pickable tiles are removed separately
    ['open-door', 'closed-door'].indexOf(nextTile) !== -1;
}

function traverseLayouts(first, second, cb) {
  first.forEach(function (row, y) {
    row.forEach(function (tile, x) {
      cb(x, y, tile, second[y][x]);
    });
  });
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

function hintToEffects(effects, renderingState, h) {
  switch (h.hint) {
    case 'move-team':
      effects.push({
        type: 'tween',
        nTurns: 1,
        id: h.team,
        from: { x: h.from[1], y: h.from[0] },
        to: { x: h.to[1], y: h.to[0] },
      });
      break;
    case 'enter-tunnel':
      effects.push({
        type: 'tween',
        nTurns: 0.4,
        id: h.team,
        from: { x: h.from[1], y: h.from[0] },
        to: { x: h.enter[1], y: h.enter[0] }
      });
      effects.push({
        type: 'fade',
        nTurns: 1,
        id: h.team,
        to: { x: h.exit[1], y: h.exit[0] }
      });
      break;
  }
}

function getInterpolations(rendererStates) {
  var interpolations = [];
  for (var i = 0; i < rendererStates.length - 1; i++) {
    var currentState = rendererStates[i];
    var nextState = rendererStates[i + 1];

    var updates = [], removes = [];
    traverseLayouts(currentState.baseLayout, nextState.baseLayout, function (x, y, tile, nextTile) {
      if (wasUpdated(tile, nextTile)) {
        updates.push({ x: x, y: y, tile: nextTile });
      }
    });
    traverseLayouts(currentState.layout, nextState.layout, function (x, y, tile, nextTile) {
      if (wasRemoved(tile, nextTile)) {
        removes.push({ x: x, y: y });
      }
    });

    var effects = [];
    nextState.renderingHints.forEach(hintToEffects.bind(null, effects, nextState));
    console.log(effects);
    interpolations.push({
      effects: effects,
      removed: removes,
      updated: updates
    });
  }

  return interpolations;
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
