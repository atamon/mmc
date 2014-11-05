var PIXI = require('pixi.js');
var tileMap = require('../tilemap.json');
var isArray = require('mout/lang/isArray');

var TILE_WIDTH = 64;
var TILE_HEIGHT = 64;

var makeTexture = function (textureInfo) {
  var baseTexture = PIXI.BaseTexture.fromImage(textureInfo.image);
  var frame = new PIXI.Rectangle(
    textureInfo.x,
    textureInfo.y,
    TILE_WIDTH / textureInfo.scale,
    TILE_HEIGHT / textureInfo.scale);
  return new PIXI.Texture(baseTexture, frame);
};

var textureFromTile = function (tile) {
  var textureInfo = tileMap[tile];
  if (!textureInfo) return;

  if (isArray(textureInfo)) {
    // MovieClips expect an array of textures
    return textureInfo.map(makeTexture);
  } else {
    // Single sprites expect a single texture
    return makeTexture(textureInfo);
  }
};

var spriteFromTexture = function (texture, tile, x, y) {
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

  sprite.position.x = x * TILE_WIDTH;
  sprite.position.y = y * TILE_HEIGHT;

  // Rescale to support different texture sizes
  // For starters at least when graphic resources is
  // scarce.
  var scale = tileMap[tile].scale;
  if (scale) {
    sprite.scale.x = scale;
    sprite.scale.y = scale;
  }

  return sprite;
};

var build = function (tile, x, y) {
  var texture = textureFromTile(tile);
  if (!texture) return;
  var sprite = spriteFromTexture(texture, tile, x, y);
  return sprite;
};

exports.build = build;