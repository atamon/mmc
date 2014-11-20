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
  return windowSize;
}

function displayLevel(info, cb) {
  if (!info || !info.level) {
    throw new Error('Missing level info, failed to display it');
  }

  // Don't mess with a running game. This is
  // only for displaying a static scene anyways
  if (runningGame) return;

  var level = info.level;
  var dummyState = monkeyMusic.createGameState(['glenn'], level);
  var dummyPlayerState = replay.getRendererState(dummyState, []);
  scene.onReady(function () {
    scene
      .setLevelLayout(level.layout)
      .parseLayout(dummyPlayerState.baseLayout, []);

    gameContainer.classList.add('ready');

    // Allow for callbacks
    if (cb && typeof cb === 'function') {
      cb();
    }
  });
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
  var rendererStates = rewindedReplay.rendererStates;
  var interpolations = rewindedReplay.interpolations;

  // Kick of with the first static layout
  var initialState = rendererStates[0];
  scene.parseLayout(initialState.layout, initialState.monkeyDetails);
  GUI.init({
    id: 'teamName',
    ids: initialState.teams.map(function(data) { return data.teamName; })
  });

  GUI.setStatus('playing');

  var iTurn = 0;
  runningGame = setInterval(function () {
    var interpolation = interpolations[iTurn];
    var teamStates = rendererStates[iTurn].teams;
    GUI.update(teamStates);

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
