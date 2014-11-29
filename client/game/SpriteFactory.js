var PIXI = require('pixi.js');
var tileMap = require('./tilemap.json');
var isArray = require('mout/lang/isArray');

var makeTexture = function (tileWidth, tileHeight, textureInfo) {
  var baseTexture = PIXI.BaseTexture.fromImage(textureInfo.image);
  var frame = new PIXI.Rectangle(
    textureInfo.x,
    textureInfo.y,
    tileWidth / textureInfo.scale,
    tileHeight / textureInfo.scale);
  return new PIXI.Texture(baseTexture, frame);
};

var textureFromTile = function (tileWidth, tileHeight, textureInfo) {
  if (isArray(textureInfo)) {
    // MovieClips expect an array of textures
    return textureInfo.map(makeTexture.bind(null, tileWidth, tileHeight));
  } else {
    // Single sprites expect a single texture
    return makeTexture(tileWidth, tileHeight, textureInfo);
  }
};

var spriteFromTexture = function (texture, scale) {
  var sprite;
  if (isArray(texture)) {
    // Series of textures that make up an animation
    sprite = new PIXI.MovieClip(texture);

    // This animationSpeed is hard-coded for the monkey as it is the only
    // animating sprite that we're using atm
    sprite.animationSpeed = 0.12;
    sprite.play();
  } else {
    // Single texture makes up a single sprite
    sprite = new PIXI.Sprite(texture);
  }

  // Rescale to support different texture sizes
  // For starters at least when graphic resources is
  // scarce.
  sprite.scale.x = scale || 1;
  sprite.scale.y = scale || 1;

  return sprite;
};

var build = function (tile, options) {
  var tileInfo = tileMap[tile];
  if (!tileInfo) return;
  var texture = textureFromTile(options.tileWidth, options.tileHeight, tileInfo);
  // Animating sprites are scaled by their first image's scale
  var scale = tileInfo.length > 1 ? tileInfo[0].scale : tileInfo.scale;
  var sprite = spriteFromTexture(texture, scale);
  return sprite;
};

var buildMonkey = function (options) {
  var monkeySprite = build('monkey', options);
  monkeySprite.gotoAndPlay(0);

  if (monkeySprite.children.length > 1) {
    // Assume this means that we got back a cached
    // monkey. So it already has a headgear.
    return monkeySprite;
  }

  var headgearSprite = build(options.headgear, options);
  headgearSprite.tint = options.color;
  monkeySprite.addChild(headgearSprite);


  // Monkeypatch a graphical object onto it
  var graphics = new PIXI.Graphics();
  graphics.beginFill(options.color);
  // graphics.beginFill(1, 0xCCCCCC, 0.8);
  graphics.drawCircle(options.tileWidth / 2, -(options.tileHeight / 6), options.tileHeight / 5);
  graphics.endFill();
  monkeySprite.addChild(graphics);


  return monkeySprite;
};

exports.build = build;
exports.buildMonkey = buildMonkey;