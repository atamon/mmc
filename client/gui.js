var messages = require('./messages');
var statusEl = document.getElementById('game-status');
var modalEl = document.getElementById('game-modal');

function setStatus(key, keyIsMessage) {
  if (key.split('\n').length > 1) {
    modalEl.innerHTML = key;
    modalEl.classList.remove('hidden');
  } else {
    statusEl.innerHTML = keyIsMessage ? key : messages[key];
    statusEl.classList.toggle('red', key === 'offline');

    modalEl.classList.add('hidden');
  }

}

exports.setStatus = setStatus;