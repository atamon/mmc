var compact = require('mout/array/compact');
var SpriteFactory = require('./SpriteFactory');
var PIXI = require('pixi.js');

function Animator(options) {

  var tileWidth = options.tileWidth;
  var tileHeight = options.tileHeight;
  var tileOptions = {
    tileWidth: tileWidth,
    tileHeight: tileHeight
  };

  var onGoingBubbleRemovals = [];
  var onGoingEffects = [];

  var effects = {
    fade: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration / 2;

      var to = options.to;

      var fadeIn = function (timeSinceLastFrame) {
        if (timeLeft <= 0) {
          sprite.alpha = 1;
          return undefined;
        }

        var t = timeSinceLastFrame / effectDuration;
        sprite.alpha += t;

        timeLeft -= timeSinceLastFrame;
        return fadeIn;
      };

      var fadeOut = function (timeSinceLastFrame) {
        if (timeLeft <= 0) {
          timeLeft += effectDuration / 2;
          sprite.alpha = 0;

          sprite.position.x = (to.x + 1) * tileWidth;
          sprite.position.y = (to.y + 1) * tileHeight;
          return fadeIn;
        }

        var t = timeSinceLastFrame / effectDuration;
        sprite.alpha -= t;

        timeLeft -= timeSinceLastFrame;
        return fadeOut;
      };

      return fadeOut;
    },

    tween: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration;

      var from = options.from;
      var to = options.to;

      var tween = function (timeSinceLastFrame) {
        if (timeLeft <= 0) {
          sprite.position.x = (to.x + 1) * tileWidth;
          sprite.position.y = (to.y + 1) * tileHeight;
          return undefined;
        }

        var t = timeSinceLastFrame / effectDuration;
        sprite.position.x -= (t * (from.x - to.x)) * tileWidth;
        sprite.position.y -= (t * (from.y - to.y)) * tileHeight;

        timeLeft -= timeSinceLastFrame;
        return tween;
      };

      return tween;
    },

    explode: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration;
      var delayLeft = turnDuration * options.delayTurns;

      var explosionSprite = SpriteFactory.build('explosion', {
        tileWidth: tileWidth,
        tileHeight: tileHeight
      });

      // Make em big!
      explosionSprite.scale.x += explosionSprite.scale.x;
      explosionSprite.scale.y += explosionSprite.scale.y;
      explosionSprite.anchor.x = 0.25;
      explosionSprite.anchor.y = 0.25;

      // Pause animation
      explosionSprite.loop = false;
      explosionSprite.stop();

      var insert = function (timeSinceLastFrame) {
        delayLeft -= timeSinceLastFrame;

        if (delayLeft <= 0) {
          // Play animation
          explosionSprite.play();
          sprite.addChild(explosionSprite);

          return remove;
        }

        return insert;
      };

      var remove = function (timeSinceLastFrame) {
        timeLeft -= timeSinceLastFrame;

        if (timeLeft <= 0) {
          sprite.removeChild(explosionSprite);
          return undefined;
        }

        return remove;
      };

      return insert;
    },

    darken: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration;
      var delayLeft = turnDuration * options.delayTurns;

      var oldHeadgearTint = options.fromColor || 0xFFFFFF;

      var darken = function (timeSinceLastFrame) {
        delayLeft -= timeSinceLastFrame;

        if (delayLeft <= 0) {
          // Stop monkey animation
          sprite.tint = 0x444444;

          // Stop headgear as well
          if (sprite.children[0]) {
            sprite.children[0].tint = 0x444444;
          }

          return resume;
        }

        return darken;
      };

      var resume = function (timeSinceLastFrame) {
        timeLeft -= timeSinceLastFrame;

        if (timeLeft <= 0) {
          sprite.tint = 0xFFFFFF;

          // Start headgear as well
          if (sprite.children[0]) {
            sprite.children[0].tint = oldHeadgearTint;
          }
          return undefined;
        }

        return resume;
      };

      return darken;
    },

    hit: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration;

      var blendMode = PIXI.blendModes.NORMAL;
      sprite.blendMode = PIXI.blendModes.ADD;

      var flash = function (timeSinceLastFrame) {
        timeLeft -= timeSinceLastFrame;

        if (timeLeft <= 0) {
          sprite.blendMode = blendMode;
          sprite.tint = 0xFFFFFF;
          return undefined;
        }

        sprite.tint += 0x333333 * (Math.random() > 0.5 ? 1 : -1);

        return flash;
      };

      return flash;
    },

    sparkle: function (sprite, turnDuration, options) {
      var effectDuration = turnDuration * options.nTurns;
      var timeLeft = effectDuration;

      var sparkle = function (timeSinceLastFrame) {
        timeLeft -= timeSinceLastFrame;

        if (timeLeft <= 0) {
          sprite.tint = 0xFFFFFF;
          return undefined;
        }

        sprite.tint += 0x111111 * Math.random();

        return sparkle;
      };

      return sparkle;
    }
  };

  var animateBubbleRemoval = function (timeSinceLastFrame, removal) {
    removal.timeLeft -= timeSinceLastFrame;
    var sprite = removal.sprite;

    if (removal.timeLeft <= 0) {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite);
      }
      return null;
    }

    sprite.scale.x -= (timeSinceLastFrame / removal.duration) * removal.origScale;
    sprite.scale.y -= (timeSinceLastFrame / removal.duration) * removal.origScale;

    return removal;
  };

  this.addRemoval = function (removal) {
    onGoingBubbleRemovals.push(removal);
  };

  this.update = function (timeSinceLastFrame) {

    var remainingEffects = onGoingEffects.map(function (handler) {
      return handler(timeSinceLastFrame);
    });
    onGoingEffects = compact(remainingEffects);

    var remainingRemovals = onGoingBubbleRemovals.map(
      animateBubbleRemoval.bind(null, timeSinceLastFrame));
    onGoingBubbleRemovals = compact(remainingRemovals);
  };

  var addEffect = this.addEffect = function (sprite, turnDuration, effect) {
    if (!effects[effect.type]) {
      return console.error('Tried to add missing effect ' + effect.type, effect);
    }

    var handler = effects[effect.type].apply(this, arguments);
    onGoingEffects.push(handler);
  };
}

module.exports = Animator;