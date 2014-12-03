function getMaxGameSize() {
  var guiHeight = 0;
  var windowSize = Math.min(window.innerWidth, window.innerHeight - guiHeight);
  return windowSize;
}

exports.getMaxGameSize = getMaxGameSize;