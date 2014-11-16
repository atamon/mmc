var PIXI = require('pixi.js');
var Animator = require('./Animator');
var Grid = require('./Grid');
var forEach = require('mout/collection/forEach');
var unique = require('mout/array/unique');

PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;
var TILE_WIDTH = 64;
var TILE_HEIGHT = 64;

var Scene = function (options) {
  var stage = new PIXI.Stage(options.backgroundColor || 0x83d135);
  var renderer = new PIXI.autoDetectRenderer(options.size.x, options.size.y);

  var grid = options.grid || new Grid();
  var animator = options.animator || new Animator({ tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT });

  var element = options.el;
  var tileMap = options.tileMap;

  var assets = [];
  forEach(tileMap, function (tile) {
    if (tile && tile.image) {
      assets.push(tile.image);
    }
  });
  assets = unique(assets);

  var loader = new PIXI.AssetLoader(assets);
  loader.load();

  var levelNode = new PIXI.DisplayObjectContainer();
  levelNode.interactive = true;
  levelNode.mouseup = options.onMouseClick;
  levelNode.mousemove = options.onMouseMove;
  stage.addChild(levelNode);
  var monkeyNode = new PIXI.DisplayObjectContainer();
  stage.addChild(monkeyNode);

  element.appendChild(renderer.view);

  var tsFrame = new Date().valueOf();
  var animate = function () {
    var tsNewFrame = new Date().valueOf();
    var timeSinceLastFrame = tsNewFrame - tsFrame;
    tsFrame = tsNewFrame;

    animator.update(timeSinceLastFrame);
    renderer.render(stage);
  };

  var levelLayout = null;
  var decorateLayout = function (layout) {
    if (!levelLayout) {
      throw new Error('Missing levelLayout, failed to decorate level');
    }

    return layout.map(function (row, y) {
      return row.map(function (tile, x) {
        // Decoration works in the way that we append '.<actual tile>'
        // from level.layout
        // We decorate two cases, walls and empties
        // This means that we're screwed if walls and empties
        // start to move around. But that should not happen (tm)
        // so we might be safe anyways.

        if (tile === 'wall' || tile === 'empty') {
          var decoration = levelLayout[y][x];
          tile += '.' + decoration;
        }

        return tile;
      });
    });
  };

  var monkeys = {};
  var addSprite = function (x, y, tile, positions) {
    var sprite = grid.setTile(x, y, tile);
    if (!sprite) return;

    // We handle monkeys differently as they are moved
    // around the screen and may be covered by other
    // tiles.
    if (tile !== 'monkey') {
      levelNode.addChild(sprite);
    } else {
      monkeyNode.addChild(sprite);

      // Reset positions for the monkey so that we can
      // reuse everything between games rematches
      sprite.position.x = x * TILE_WIDTH;
      sprite.position.y = y * TILE_HEIGHT;

      var id = '';
      for (var i = 0; i < positions.length; i++) {
        var position = positions[i];
        if (position.x + 1 === x && position.y + 1 === y) {
          id = position.id;
          break;
        }
      }

      if (id !== '') {
        // Cache monkey tiles by teamName
        monkeys[id] = sprite;
      }
    }

  };

  var hasOutline = false;
  var addOutline = function (width, height) {

    // Left side + right side
    for (var i = 1; i < height + 1; i++) {
      addSprite(0, i, 'left-side');
      addSprite(width + 1, i, 'right-side');
    }
    // Upper side + lower side
    for (var y = 1; y < width + 1; y++) {
      addSprite(y, 0, 'upper-side');
      addSprite(y, height + 1, 'lower-side');
    }

    // Corners
    addSprite(0, 0, 'corner-upper-left');
    addSprite(0, height + 1, 'corner-lower-left');
    addSprite(width + 1, 0, 'corner-upper-right');
    addSprite(width + 1, height + 1, 'corner-lower-right');

    hasOutline = true;
  };

  var autoScale = function (node) {
    node.scale.x = options.size.x / (TILE_WIDTH * (grid.getWidth() + 1));
    node.scale.y = options.size.y / (TILE_HEIGHT * (grid.getHeight() + 1));
  };

  this.addChild = function (node, doScale) {
    stage.addChild(node);
    if (doScale === true) autoScale(node);

    return this;
  };

  this.parseLayout = function (layout, positions) {
    var decoratedLayout = decorateLayout(layout);
    for (var y = 0; y < decoratedLayout.length; y++) {
      var row = decoratedLayout[y];
      for (var x = 0; x < row.length; x++) {
        var tile = row[x];
        // Add 1 to x and y so that we can manually insert
        // outlining tiles for decorations
        addSprite(x + 1, y + 1, tile, positions);
      }
    }

    return this;
  };

  this.interpolate = function (interpolation, duration) {
    interpolation.monkeys.forEach(function (monkey) {
      var sprite = monkeys[monkey.id];

      animator.addInterpolation({
        sprite: sprite,
        from: monkey.from,
        to: monkey.to,
        timeLeft: duration,
        duration: duration
      });
    });

    interpolation.removed.forEach(function (position) {
      var tile = grid.getTile(position.x + 1, position.y + 1);
      var sprite = tile.sprite;
      grid.clearTile(position.x + 1, position.y + 1);

      animator.addRemoval({
        sprite: sprite,
        timeLeft: duration / 2,
        duration: duration / 2,
        origScale: sprite.scale.x
      });
    });

    return this;
  };

  this.setLevelLayout = function (layout) {
    levelLayout = layout;
    return this;
  };

  this.start = function () {
    if (!hasOutline) {
      addOutline(grid.getWidth(), grid.getHeight());
    }

    autoScale(levelNode, true);
    autoScale(monkeyNode, true);

    levelNode.hitArea =
      new PIXI.Rectangle(0, 0, TILE_WIDTH * (grid.getWidth() + 1), TILE_HEIGHT * (grid.getHeight() + 1));

    return this;
  };

  this.onReady = function (fn) {
    // Firefox is lightning fast on handling 304's
    // so we need to check if the loader is already finished
    // and if so instantly fire the callback
    if (loader.loadCount === 0) {
      fn();
    } else {
      loader.onComplete = fn;
    }
  };

  var runAnimation = function () {
    requestAnimationFrame(runAnimation);
    animate();
  };

  runAnimation();
};


module.exports = Scene;
