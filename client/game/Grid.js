var SpriteFactory = require('./SpriteFactory');

function Grid(options) {

  var buildSprite = options.buildSprite || SpriteFactory.build;

  var tiles = [];

  this.setTile = function (x, y, tile) {
    if (!tiles[y]) {
      tiles[y] = [];
    }

    if (tiles[y][x] && tiles[y][x].type === tile) {
      return tiles[y][x].sprite;
    }

    var sprite = buildSprite(tile, options);
    if (!sprite) {
      return this.clearTile(x, y);
    }

    // Position sprite so that it is located inside the tile
    sprite.position.x = x * options.tileWidth;
    sprite.position.y = y * options.tileHeight;

    tiles[y][x] = {
      type: tile,
      sprite: sprite
    };

    return sprite;
  };

  this.getTile = function (x, y) {
    return tiles[y] ? tiles[y][x] : undefined;
  };

  this.clearTile = function (x, y) {
    tiles[y][x] = { type: 'empty' };
  };

  this.getWidth = function () {
    return tiles[tiles.length - 1].length - 1;
  };

  this.getHeight = function () {
    return tiles.length - 1;
  };
}

module.exports = Grid;