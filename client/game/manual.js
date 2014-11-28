var MOVE_TIMEOUT = 600;

var mixIn = require('mout/object/mixIn');
var forEach = require('mout/collection/forEach');
var monkeyMusic = require('monkey-music');
var Scene = require('./Scene');
var tileMap = require('./tilemap.json');
var replay = require('./replay');
var GUI = require('./gui');
var Util = require('./Util');

var gameContainer = document.querySelector('#game-container');
var sceneWidth = Util.getMaxGameSize();
var sceneHeight = Util.getMaxGameSize();
var scene = new Scene({
  size: { x: sceneWidth, y: sceneHeight },
  backgroundColor: 0x83d135,
  el: gameContainer,
  tileMap: tileMap
});

var defaultPlayerTurns = {
  'Player One': {
    turn: {
      command: 'move',
      direction: '',
      team: 'Player One'
    },
    index: 0
  },
  'Player Two': {
    turn: {
      command: 'move',
      direction: '',
      team: 'Player Two'
    },
    index: 1
  }
};

var playerTurns = JSON.parse(JSON.stringify(defaultPlayerTurns));

var quickMove = {};
function parseState(state, playerId) {

  if (Object.keys(state.buffs || {}).indexOf('speedy') !== -1) {
    quickMove[playerId] = true;
    delete playerTurns[playerId].turn.direction;
  } else {
    delete quickMove[playerId];
    delete playerTurns[playerId].turn.directions;
  }
}

function resetPlayerCommands() {
  playerTurns = JSON.parse(JSON.stringify(defaultPlayerTurns));
}

function updatePlayerCommand(playerId, changes) {
  mixIn(playerTurns[playerId].turn, changes);
}

function move(playerId, direction) {
  if (quickMove[playerId]) {
    return { command: 'move', directions: [direction, direction] };
  } else {
    return { command: 'move', direction: direction };
  }
}

function use(index) {
  return { command: 'use', item: index };
}

document.addEventListener('keydown', function (e) {


  var key = e.which;
  switch (key) {
    case 87: updatePlayerCommand('Player One', move('Player One', 'up')); break;
    case 65: updatePlayerCommand('Player One', move('Player One', 'left')); break;
    case 83: updatePlayerCommand('Player One', move('Player One', 'down')); break;
    case 68: updatePlayerCommand('Player One', move('Player One', 'right')); break;
    case 69: updatePlayerCommand('Player One', use('banana')); break;
    case 81: updatePlayerCommand('Player One', use('trap')); break;

    case 73: updatePlayerCommand('Player Two', move('Player Two', 'up')); break;
    case 74: updatePlayerCommand('Player Two', move('Player Two', 'left')); break;
    case 75: updatePlayerCommand('Player Two', move('Player Two', 'down')); break;
    case 76: updatePlayerCommand('Player Two', move('Player Two', 'right')); break;
    case 79: updatePlayerCommand('Player Two', use('banana')); break;
    case 85: updatePlayerCommand('Player Two', use('trap')); break;

    default: break;
  }
});

function start (level) {
  scene.onReady(function () {
    scene.setLevelLayout(level.layout);

    var game = {};
    var teams = ['Player One', 'Player Two'];
    game.state = monkeyMusic.createGameState(teams, level);

    var rendererState = replay.getRendererState(game.state, teams);
    scene.parseLayout(rendererState.layout, rendererState.monkeyDetails);

    GUI.init({
      ids: teams
    });

    var states = [rendererState];
    var running = setInterval(function () {
      var rewindedReplay = replay.step(states[states.length - 1], game, teams, playerTurns);
      resetPlayerCommands();

      states = states.concat(rewindedReplay.rendererStates);
      var interpolations = rewindedReplay.interpolations;
      var rendererState = states[states.length - 1];

      scene.interpolate(interpolations[0], MOVE_TIMEOUT);
      scene.updateTraps(
        rendererState.armedTraps,
        rendererState.traps, teams);

      GUI.update(rendererState);

      forEach(rendererState.teams, parseState);

      if (monkeyMusic.isGameOver(game.state)) {
        clearInterval(running);
      }
    }, MOVE_TIMEOUT);

    gameContainer.classList.add('ready');
  });
}

exports.start = start;
