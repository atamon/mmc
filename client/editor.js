var Scene = require('./game/scene');
var Grid = require('./game/Grid');
var SpriteFactory = require('./game/SpriteFactory');
var tileMap = require('./game/tilemap.json');
var PIXI = require('pixi.js');

// TODO Extract units somewhere else
var units = require('../levels/test.json').units;
var unitAbbreviations = Object.keys(units);
var iActiveTile = 0;

var options = window.mmcEditorOptions;

var TILE_WIDTH = 64;
var TILE_HEIGHT = 64;
var SCENE_WIDTH = 512;
var SCENE_HEIGHT = 512;

// Do we load this somehow?
var layoutHeight = +options.height || 12;
var layoutWidth = +options.width || 12;
var levelLayout = [];
for (var i = 0; i < layoutHeight; i++) {
  var row = [];
  row.length = layoutWidth + 1;
  levelLayout.push(row.join(' '));
}

var toUnitLayout = function toUnitLayout(levelLayout) {
  return levelLayout.map(function (row) {
    return row.split('').map(function (abbreviation) {
      return units[abbreviation] || 'empty';
    });
  });
};

var toLevelTile = function (event) {
  return {
    x: Math.max(Math.floor(event.originalEvent.offsetX / event.target.scale.x / TILE_WIDTH  / scene.getResolution()), 0),
    y: Math.max(Math.floor(event.originalEvent.offsetY / event.target.scale.y / TILE_HEIGHT  / scene.getResolution()), 0)
  };
};

var onLevelClick = function (event) {
  var parent = event.target;

  var targetTile = toLevelTile(event);
  var x = targetTile.x;
  var y = targetTile.y;

  console.log(x, y, levelLayout.length, levelLayout[0].length);

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

  var newTile = getDecoratedTile(abbr);
  var newSprite = grid.setTile(x, y, newTile);
  if (!newSprite) return;
  parent.addChild(newSprite);
};

var getDecoratedTile = function (abbr) {
  var unit = units[abbr];
  return ['wall', 'empty'].indexOf(unit) !== -1 ? unit + '.' + abbr : unit;
};

var drawOverlay = function () {
  var overlay = new PIXI.Graphics();
  overlay.beginFill(0x222222, 0.15);
  for (var y = 1; y <= levelLayout.length; y++) {
    var row = levelLayout[y - 1];
    for (var x = 1; x <= row.length; x++) {
      overlay.drawRect(x * TILE_WIDTH + 10, y * TILE_HEIGHT + 10, TILE_WIDTH - 10, TILE_HEIGHT - 10);
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
  grid: grid,
  onMouseClick: onLevelClick,
  onMouseMove: drawHoverTile
});


scene.onReady(function () {
  scene
    .setLevelLayout(levelLayout)
    .parseLayout(toUnitLayout(levelLayout))
    .start();

  drawOverlay();
  initHoverTile();
});

window.stringify = function () {
  return JSON.stringify(levelLayout, null, 2);
};
window.parse = function (array) {
  levelLayout = array.slice(0);
  scene.setLevelLayout(levelLayout);
  scene.parseLayout(toUnitLayout(levelLayout), []);
};
