var GUI = require('./game/gui');
GUI.setStatus('offline');

var manualGame = require('./game/manual');

// Start level injected by server
manualGame.start(window.mmcLevel);