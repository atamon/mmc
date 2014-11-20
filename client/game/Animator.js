var compact = require('mout/array/compact');

function Animator(options) {

  var tileWidth = options.tileWidth;
  var tileHeight = options.tileHeight;

  var onGoingInterpolations = [];
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

  this.addInterpolation = function (interpolation) {
    onGoingInterpolations.push(interpolation);
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