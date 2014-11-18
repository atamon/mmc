var PIXI = require('pixi.js');
var Animator = require('./Animator');
var Grid = require('./Grid');
var SpriteFactory = require('./SpriteFactory');
var forEach = require('mout/collection/forEach');
var unique = require('mout/array/unique');


PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;

var Scene = function (options) {
  var element = options.el;
  var tileMap = options.tileMap;

  var stage = new PIXI.Stage(options.backgroundColor || 0x83d135);

  var scale = 1;
  var resolution = window.devicePixelRatio;
  var sceneWidth = options.size.x / resolution;
  var sceneHeight = options.size.y / resolution;
  var renderer = new PIXI.autoDetectRenderer(sceneWidth, sceneHeight, {
    resolution: resolution
  });

  element.style.height = (sceneHeight * resolution) + 'px';
  element.style.width = (sceneWidth * resolution) + 'px';

  var tileWidth = 64;
  var tileHeight = 64;

  var tileOptions = { tileWidth: tileWidth, tileHeight: tileHeight };
  var grid = options.grid || new Grid(tileOptions);
  var animator = options.animator || new Animator(tileOptions);

  var assets = [];
  forEach(tileMap, function (tile) {
    if (tile && tile.image) {
      // TODO Look for arrays as well (for moving sprites)
      assets.push(tile.image);
    }
  });
  assets = unique(assets);

  var loader = new PIXI.AssetLoader(assets);
  loader.load();

  var levelNode = new PIXI.DisplayObjectContainer();
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
  var addMonkey = function (x, y, monkeyPositions) {
    var id = '', color = 0xFFFFFF, headgear = '';
    for (var i = 0; i < monkeyPositions.length; i++) {
      var position = monkeyPositions[i];
      if (position.x + 1 === x && position.y + 1 === y) {
        id = position.id;
        color = position.color;
        headgear = position.headgear;
        break;
      }
    }

    if (id !== '') {
      var sprite = SpriteFactory.buildMonkey({
        id: id,
        color: color,
        headgear: headgear,
        tileHeight: tileOptions.tileHeight,
        tileWidth: tileOptions.tileWidth
      });
      monkeyNode.addChild(sprite);
      // Reset positions for the monkey so that we can
      // reuse everything between games rematches
      sprite.position.x = x * tileWidth;
      sprite.position.y = y * tileHeight;

      // Cache monkey tiles by teamName
      monkeys[id] = sprite;
    } else {
      console.warn('Failed to locate monkey at ' + x + ',' + y);
    }
  };

  var addSprite = function (x, y, tile, monkeyPositions) {
    if (tile === 'monkey') {
      // We handle monkeys differently as they are moved
      // around the screen and may be covered by other
      // tiles.
      addMonkey(x, y, monkeyPositions);
    } else {
      var sprite = grid.setTile(x, y, tile);
      if (!sprite) return;
      levelNode.addChild(sprite);
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

  this.rescale = function () {
    scale = sceneWidth / (tileWidth * (grid.getWidth() + 1));

    var canvasScale = Math.max(0.2, scale);
    renderer.resize(sceneWidth / canvasScale, sceneHeight / canvasScale);

    if (canvasScale !== scale) {
      var nodeScale = scale / canvasScale;
      stage.children.forEach(function (child) {
        child.scale.x = child.scale.y = nodeScale;
      });
    }
  };

  this.getResolution = function () {
    return resolution;
  };

  this.getScale = function () {
    return scale;
  };

  this.getTileWidth = function () {
    return tileWidth;
  };

  this.getTileHeight = function () {
    return tileHeight;
  };

  this.addChild = function (node) {
    stage.addChild(node);
    return this;
  };

  this.addChildToLevel = function (node) {
    levelNode.addChild(node);
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

    if (!hasOutline) {
      addOutline(grid.getWidth(), grid.getHeight());
    }

    this.rescale();

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
