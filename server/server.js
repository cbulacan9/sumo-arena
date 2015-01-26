var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

var index = 0;
def_pos = [{x: 180, y: 180}, {x: 180, y: 600}, {x: 600, y: 180}, {x: 600, y: 600}];
def_dir = {x: 0, y: 0};

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/../game'));

app.get('/', function(request, response) {
  response.sendFile('/game/index.html', {root: __dirname});
});

http.listen(app.get('port'), function() {
	console.log('listening on: ' + app.get('port'));
});

mongoose.connect('mongodb://localhost/game', function(err) {
	if(err) {
		console.log(err);
	} else {
		console.log('Connected to mongodb');
	}
});

var playerSchema = mongoose.Schema({
	position: {x: Number, y: Number},
	direction: {x: Number, y: Number},
	health: {current: Number, max: Number},
	created: {type: Date, default: Date.now}
});

var fireballSchema = mongoose.Schema({
	position: {x: Number, y: Number},
	direction: {x: Number, y: Number},
	created: {type: Date, default: Date.now}
})

var Player = mongoose.model('Player', playerSchema);
var Fireball = mongoose.model('Fireball', fireballSchema);

io.on('connection', function(socket) {
	console.log('New Connection!');
	index++;
	var player = new Player({position: def_pos[index%4], direction: def_dir});
	
	socket.on('new player', function(res) {
		socket.emit('add player', {position: player.position, direction: player.direction});
	})

	socket.on('disconnect', function(res) {
		console.log('Socket disconnect!');
	})
})
