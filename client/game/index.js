var MOVE_TIMEOUT = 600;
var GAME_RESTART_TIMEOUT = MOVE_TIMEOUT + 10;

var monkeyMusic = require('monkey-music');
var Scene = require('./Scene');
var tileMap = require('./tilemap.json');
var GUI = require('./gui');
var replay = require('./replay');

var gameContainer = document.querySelector('#game-container');
var sceneWidth = getMaxGameSize();
var sceneHeight = getMaxGameSize();
var scene = new Scene({
  size: { x: sceneWidth, y: sceneHeight },
  backgroundColor: 0x83d135,
  el: gameContainer,
  tileMap: tileMap
});

var runningGame = null;

function getMaxGameSize() {
  // Chrome will produce glitches if we don't make sure to
  // use a resolution that is a power of 2
  var windowSize = Math.min(window.innerWidth, window.innerHeight);

  var power = Math.floor(Math.log(windowSize) / Math.LN2);
  return Math.pow(2, power);
}

function displayLevel(info) {
  if (!info || !info.level) {
    throw new Error('Missing level info, failed to display it');
  }

  // Don't mess with a running game. This is
  // only for displaying a static scene anyways
  if (runningGame) return;

  var level = info.level;
  var dummyGame = monkeyMusic.newGameState([], level);
  var dummyPlayerState = monkeyMusic.stateForPlayer(dummyGame, 'glenn');
  scene.onReady(function () {
    scene
      .setLevelLayout(level.layout)
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

function displayReplay(game) {
  if (runningGame) {
    clearInterval(runningGame);
    runningGame = null;

    GUI.setStatus('Loading new game', true);
    return setTimeout(function () {
      // By faking a reloading time we can
      // wait for the animations to finish
      // and therefore reduce flickering in
      // the scene when restarting during a
      // playing game.
      displayReplay(game);
    }, GAME_RESTART_TIMEOUT);
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

      // Update GUI
      GUI.setStatus('Game Over', true);
      return;
    }

    scene.interpolate(interpolation, MOVE_TIMEOUT);
    iTurn++;
  }, MOVE_TIMEOUT);
}

exports.displayLevel = displayLevel;
exports.displayReplay = displayReplay;
