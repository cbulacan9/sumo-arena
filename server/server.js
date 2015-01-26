var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http)

spawns = [{x: 180, y: 180}, {x: 180, y: 600}, {x: 600, y: 180}, {x: 600, y: 600}]

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/../game'));

app.get('/', function(request, response) {
  response.sendFile('/game/index.html', {root: __dirname});
});

http.listen(app.get('port'), function() {
	console.log('listening on: ' + app.get('port'));
});