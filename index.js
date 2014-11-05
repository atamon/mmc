var settings = require('./settings.json');

var server = require('./server');

server.listen(settings.port);
