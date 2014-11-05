var Scene = require('./scene');
var Animator = require('./Animator');
var Grid = require('./Grid');
var SpriteFactory = require('./SpriteFactory');
var tileMap = require('../tilemap.json');
var PIXI = require('pixi.js');

// TODO Extract units somewhere else
var units = require('../level.json').units;
var unitAbbreviations = Object.keys(units);
var iActiveTile = 0;

var TILE_WIDTH = 64;
var TILE_HEIGHT = 64;
var SCENE_WIDTH = Math.min(window.innerWidth, window.innerHeight);
var SCENE_HEIGHT = Math.min(window.innerWidth, window.innerHeight);

// Do we load this somehow?
var layoutHeight = 12;
var layoutWidth = 12;
var levelLayout = [];
for (var i = 0; i < layoutHeight; i++) {
  var row = [];
  row.length = layoutWidth;
  levelLayout.push(row.join(' '));
}
// var levelLayout = [
//   "#   ",
//   "#-_ ",
//   "# # ",
//   "    "
// ];

var toUnitLayout = function toUnitLayout(levelLayout) {
  return levelLayout.map(function (row) {
    return row.split('').map(function (abbreviation) {
      return units[abbreviation] || 'empty';
    });
  });
};

var toLevelTile = function (event) {
  return {
    x: Math.max(Math.floor(event.originalEvent.offsetX / event.target.scale.x / TILE_WIDTH), 0),
    y: Math.max(Math.floor(event.originalEvent.offsetY / event.target.scale.y / TILE_HEIGHT), 0)
  };
};

var onLevelClick = function (event) {
  var parent = event.target;

  var targetTile = toLevelTile(event);
  var x = targetTile.x;
  var y = targetTile.y;

  if (x < 1 || y < 1 || x > levelLayout.length || y > levelLayout[0].length) {
    return;
  }

  var tile = grid.getTile(x, y);

  if (tile) {
    grid.clearTile(x, y);

    if (tile.sprite) {
      parent.removeChild(tile.sprite);
    }
  }

  var abbr = unitAbbreviations[iActiveTile];
  levelLayout[y - 1] = levelLayout[y - 1].substr(0, x - 1) +
                       abbr +
                       levelLayout[y - 1].substr(x, levelLayout[y - 1].length);
  persist();

  var newTile = getDecoratedTile(abbr);
  var newSprite = grid.setTile(x, y, newTile);
  if (!newSprite) return;
  parent.addChild(newSprite);
};

var getDecoratedTile = function (abbr) {
  var unit = units[abbr];
  return ['wall', 'empty'].indexOf(unit) !== -1 ? unit + '.' + abbr : unit;
};

var persist = function () {
  console.log(JSON.stringify(levelLayout, null, 2));
};

var drawOverlay = function () {
  var overlay = new PIXI.Graphics();
  overlay.beginFill(0x222222, 0.05);
  overlay.lineStyle(1, 0xCCCCCC33);
  for (var y = 1; y <= levelLayout.length; y++) {
    var row = levelLayout[y - 1];
    for (var x = 1; x <= row.length; x++) {
      overlay.drawRect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
    }
  }

  scene.addChild(overlay, true);
};

var hoverTile;
var setHoverSprite = function (tileType) {
  if (hoverTile.children.length > 0) {
    hoverTile.removeChildAt(0);
  }
  var sprite = SpriteFactory.build(tileType, 0, 0);
  if (sprite) {
    hoverTile.addChild(sprite);
  }
};

var drawHoverTile = function (e) {
  var x = e.global.x;
  var y = e.global.y;

  hoverTile.position.x = x;
  hoverTile.position.y = y;
};

var initHoverTile = function () {
  hoverTile = new PIXI.DisplayObjectContainer();
  hoverTile.scale.x = hoverTile.scale.y = 0.5;

  var abbr = unitAbbreviations[iActiveTile];
  var tileType = getDecoratedTile(abbr);
  setHoverSprite(tileType);

  scene.addChild(hoverTile, false);
};

document.addEventListener('keyup', function (e) {
  var key = e.which;

  if (key >= 49 && key <= 57) {
    iActiveTile = e.shiftKey ? key - 39 : key - 49;

    var abbr = unitAbbreviations[iActiveTile];
    var tileType = getDecoratedTile(abbr);
    setHoverSprite(tileType);

    return false;
  }
});

var grid = new Grid();
var scene = new Scene({
  size: { x: SCENE_WIDTH, y: SCENE_HEIGHT },
  backgroundColor: 0x83d135,
  el: document.getElementById('game-container'),
  tileMap: tileMap,
  levelLayout: levelLayout,
  grid: grid,
  onMouseClick: onLevelClick,
  onMouseMove: drawHoverTile
});


scene.onReady(function () {
  scene
    .parseLayout(toUnitLayout(levelLayout))
    .start();

  drawOverlay();
  initHoverTile();
});