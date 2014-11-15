var express = require('express');
var app = express();
var http = require('http').Server(app);
var child_process = require('child_process');
var path = require('path');
var bodyParser = require('body-parser');

var log = require('../server/log');
var secret = require('../server/secret');
var settings = require('../settings.json');

var amountRunningBots = 0;

app.use(bodyParser());
app.post('/', function (req, res) {
  if (!req.body.botId || !req.body.gameId) {
    return res.status(400).send({ 'message': 'Missing botId or gameId' });
  }

  runBot(req.body.teamName, req.body.botId, req.body.gameId);
  log.info('Bot %s started. Currently running %i number of bots.', req.body.botId, amountRunningBots);

  res.status(200).end();
});

function runBot(teamName, botId, gameId) {

  var botPath = path.resolve(__dirname + '/run-' + botId);
  var args = [teamName, secret.forTeam(teamName), gameId];
  var botProcess = child_process.spawn(botPath, args, { stdio: 'inherit' });

  botProcess.on('exit', function (code, signal) {
    amountRunningBots--;
    if (code === null) {
      // Something failed :(
      log.error('Bot failed with singal %s', signal);
    } else {
      log.info('Bot %s successfully exited.', botId);
    }
  });

  amountRunningBots++;
  return botProcess;
}

http.listen(settings.botPort, function () {
  log.info('bot server listening on localhost:%d', settings.botPort);
});
