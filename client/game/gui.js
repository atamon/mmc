var messages = require('./messages');
var template = require('../templates/team.hbs');
var forEach = require('mout/collection/forEach');

var statusEl = document.getElementById('game-status'),
    modalEl = document.getElementById('game-modal'),
    container = document.getElementById('game-container');

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

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function init(opts) {
  // Loop number of panes
  opts.ids.forEach(function(id, index) {
    var el = document.getElementById(slugify(id)) || document.createElement('div');
    el.classList.add('team-pane');
    el.id = slugify(id);

    if(index % 2 === 0) {
      container.parentNode.insertBefore(el, container);
    }
    else {
      container.parentNode.appendChild(el);
    }
  })
}

function update(states) {
  forEach(states, function(data, id) {
    data.teamName = id;
    var el = document.getElementById(slugify(id)),
        html = template(data);

    el.innerHTML = html;
  })
}

exports.init = init;
exports.update = update;
exports.setStatus = setStatus;
