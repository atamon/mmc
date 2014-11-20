var MOVE_TIMEOUT = 600;

var monkeyMusic = require('monkey-music');
var Scene = require('./Scene');
var tileMap = require('./tilemap.json');
var replay = require('./replay');
var GUI = require('./gui');

var teamColors = [
  // Red
  0xFF0000,
  // Blue
  0x0000CC,
  // Green
  0x00FF00
  // TODO Violet
];

var gameContainer = document.querySelector('#game-container');
var sceneWidth = getMaxGameSize();
var sceneHeight = getMaxGameSize();
var scene = new Scene({
  size: { x: sceneWidth, y: sceneHeight },
  backgroundColor: 0x83d135,
  el: gameContainer,
  tileMap: tileMap
});

function getMaxGameSize() {
  // Chrome will produce glitches if we don't make sure to
  // use a resolution that is a power of 2
  var windowSize = Math.min(window.innerWidth, window.innerHeight);
  return windowSize;
}

function getMonkeyDetails(state, teamNumber) {
  return {
    x: state.position[1],
    y: state.position[0],
    id: state.teamName,
    headgear: 'headphones',
    color: state.color !== undefined ?
      state.color : teamColors[teamNumber]
  };
}

var playerOneDirection = '', playerTwoDirection = '';
document.addEventListener('keydown', function (e) {

  var key = e.which;
  switch (key) {
    case 87: playerOneDirection = 'up';    break;
    case 65: playerOneDirection = 'left';  break;
    case 83: playerOneDirection = 'down';  break;
    case 68: playerOneDirection = 'right'; break;

    case 73: playerTwoDirection = 'up';    break;
    case 74: playerTwoDirection = 'left';  break;
    case 75: playerTwoDirection = 'down';  break;
    case 76: playerTwoDirection = 'right'; break;
    default:                               break;
  }
});

function start (level) {
  scene.onReady(function () {
    scene.setLevelLayout(level.layout);

    var game = {};
    var teams = ['Player One', 'Player Two'];
    game.state = monkeyMusic.createGameState(teams, level);

    var initialStates = [
      monkeyMusic.gameStateForTeam(game.state, teams[0]),
      monkeyMusic.gameStateForTeam(game.state, teams[1])
    ];
    initialStates[0].teamName = 'Player One';
    initialStates[1].teamName = 'Player Two';

    var initialPositions = initialStates.map(getMonkeyDetails);
    scene.parseLayout(initialStates[0].layout, initialPositions);

    GUI.init({
      id: 'teamName',
      ids: initialStates.map(function(data) { return data.teamName })
    });

    var states = [initialStates];
    var running = setInterval(function () {
      var rewindedReplay = replay.step(states[states.length - 1], game, teams, {
        'Player One': {
          turn: {
            command: 'move',
            direction: playerOneDirection,
            team: 'Player One'
          },
          index: 0
        },
        'Player Two': {
          turn: {
            command: 'move',
            direction: playerTwoDirection,
            team: 'Player Two'
          },
          index: 1
        }
      });


      states = states.concat(rewindedReplay.statesForPlayer);
      var interpolations = rewindedReplay.interpolations;

      scene.interpolate(interpolations[0], MOVE_TIMEOUT);
      GUI.update(states[states.length - 1]);

      if (monkeyMusic.isGameOver(game.state)) {
        clearInterval(running);
      }
    }, MOVE_TIMEOUT);

    gameContainer.classList.add('ready');
  });
}

exports.start = start;
