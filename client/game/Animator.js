var compact = require('mout/array/compact');

function Animator(options) {

  var tileWidth = options.tileWidth;
  var tileHeight = options.tileHeight;

  var onGoingInterpolations = [];
  var onGoingBubbleRemovals = [];

  var animateInterpolation = function (timeSinceLastFrame, interpolation) {
    interpolation.timeLeft -= timeSinceLastFrame;
    var sprite = interpolation.sprite;
    var lastPos = interpolation.from;
    var goalPos = interpolation.to;

    // The interpolation is finished, scrap it
    if (interpolation.timeLeft <= 0) {
      sprite.position.x = (goalPos.x + 1) * tileWidth;
      sprite.position.y = (goalPos.y + 1) * tileHeight;
      return null;
    }


    var t = timeSinceLastFrame / interpolation.duration;
    sprite.position.x -= (t * (lastPos.x - goalPos.x)) * tileWidth;
    sprite.position.y -= (t * (lastPos.y - goalPos.y)) * tileHeight;

    return interpolation;
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

    var remainingInterpolations = onGoingInterpolations.map(
      animateInterpolation.bind(null, timeSinceLastFrame));
    onGoingInterpolations = compact(remainingInterpolations);

    var remainingRemovals = onGoingBubbleRemovals.map(
      animateBubbleRemoval.bind(null, timeSinceLastFrame));
    onGoingBubbleRemovals = compact(remainingRemovals);
  };

  this.clear = function () {
    onGoingInterpolations.length = 0;
    onGoingBubbleRemovals.length = 0;
  };
}

module.exports = Animator;