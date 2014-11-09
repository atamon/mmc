var MOVE_TIMEOUT = 600;

var monkeyMusic = require('monkey-music');
var Scene = require('./Scene');
var tileMap = require('./tilemap.json');
var GUI = require('./gui');
var replay = require('./replay');

var gameContainer = document.querySelector('#game-container');
var scene = null;

function getMaxGameSize() {
  // Chrome will produce glitches if we don't make sure to
  // use a resolution that is a power of 2
  var windowSize = Math.min(window.innerWidth, window.innerHeight);

  var power = Math.floor(Math.log(windowSize) / Math.LN2);
  return Math.pow(2, power);
}

function displayLevel(info) {
  var level = info.level;
  var teams = info.teams;

  var sceneWidth = getMaxGameSize();
  var sceneHeight = getMaxGameSize();
  console.log(sceneWidth, sceneHeight);

  scene = new Scene({
    size: { x: sceneWidth, y: sceneHeight },
    backgroundColor: 0x83d135,
    el: gameContainer,
    tileMap: tileMap,
    levelLayout: level.layout
  });

  var dummyGame = monkeyMusic.newGameState(teams, level);
  var dummyPlayerState = monkeyMusic.stateForPlayer(dummyGame, 'glenn');
  scene.onReady(function () {
    scene
      .parseLayout(dummyPlayerState.layout, [])
      .start();

    gameContainer.classList.add('ready');
  });
}

function getPlayerPosition(state) {
  return {
    x: state.position[1],
    y: state.position[0],
    id: state.teamName
  };
}

var runningGame = null;
function displayReplay(game) {
  if (runningGame) {
    throw new Error('This is still b0rken');
    // clearInterval(runningGame);
    // runningGame = null;
    // scene.restart();
  }

  GUI.setStatus('preparing');

  var rewindedReplay = replay.prepare(game.teams, game.turns, game.level);
  var statesForPlayer = rewindedReplay.statesForPlayer;
  var interpolations = rewindedReplay.interpolations;

  // Kick of with the first static layout
  var initialStates = statesForPlayer[0];
  var initialPositions = initialStates.map(getPlayerPosition);
  scene.parseLayout(initialStates[0].layout, initialPositions);

  GUI.setStatus('playing');

  var iTurn = 0;
  runningGame = setInterval(function () {
    var interpolation = interpolations[iTurn];

    // Interpolate moves until we've run out of them
    if (!interpolation) {
      // Stop looping
      clearInterval(runningGame);
      runningGame = null;

      // Clear the scene of any state it might have
      // This allows us to play another replay without
      // the rendering going bananas.
      // NOTE: We actually do like bananas in this contest
      // but let's leave some of them for the monkeys
      // scene.restart();
      // Parse the last layout so we still show how the game ended
      var finalStates = statesForPlayer[statesForPlayer.length - 1];
      var finalPositions = finalStates.map(getPlayerPosition);
      scene.parseLayout(finalStates[0].layout, finalPositions);

      // Update GUI
      GUI.setStatus(game.message || '', true);
      return;
    }

    scene.interpolate(interpolation, MOVE_TIMEOUT);
    iTurn++;
  }, MOVE_TIMEOUT);
}

exports.displayLevel = displayLevel;
exports.displayReplay = displayReplay;
