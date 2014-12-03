var teamTemplate = require('../templates/team.hbs');
var globalTemplate = require('../templates/global.hbs');
var colors = require('./colors').clear;

var container = document.getElementById('game-container'),
    panesLeft = document.querySelector('.panes-left'),
    panesRight = document.querySelector('.panes-right'),
    overlay = document.getElementById('game-overlay-content');

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function toHex(number) {
  return '#'+number.toString(16);
}

function init(opts) {
  // Loop number of panes
  opts.ids.forEach(function(id, index) {
    var el = document.getElementById(slugify(id)) || document.createElement('div');
    el.classList.add('team-pane');
    el.id = slugify(id);

    if(index % 2 === 0) {
      panesLeft.appendChild(el);
    }
    else {
      panesRight.appendChild(el);
    }
  });
}

function clearTeams() {
  var els = container.parentNode.querySelectorAll('.team-pane') || [];
  Array.prototype.forEach.call(els, function (el) {
    el.remove();
  });
}

function updateState(template, data, id) {
  var el = document.getElementById(slugify(id)),
      html = template(data);

  el.innerHTML = html;
}

function update(rendererState) {
  updateState(globalTemplate, rendererState, 'turns-left');
  Object.keys(rendererState.teams).forEach(function (teamName, index) {
    var teamData = rendererState.teams[teamName];
    teamData.teamName = teamName;
    teamData.color = toHex(colors[index]);
    updateState(teamTemplate, teamData, teamName);
  });
}

function setOverlay(text, isHidden) {
  overlay.innerHTML = text;
  overlay.classList.toggle('hidden', isHidden);
}

exports.init = init;
exports.update = update;
exports.clearTeams = clearTeams;
exports.setOverlay = setOverlay;