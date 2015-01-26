var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

var index = 0;
def_pos = [{x: 300, y: 300}, {x: 300, y: 800}, {x: 800, y: 300}, {x: 800, y: 800}];

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
	var player = new Player({position: def_pos[index%4]});
	
	socket.on('new player', function(res) {
		socket.emit('add player', {position: player.position});
	})

	socket.on('player added', function(res) {
		socket.broadcast.emit('current players', res);
	})

	socket.on('current players locations', function(res) {
		socket.broadcast.emit('current locations', res);
	})

	socket.on('moving', function(res) {
		socket.broadcast.emit('change directions', res);
	})

	socket.on('firecast', function(res) {
		socket.broadcast.emit('fireball', res);
	})

	socket.on('enemyHit', function(res) {
		socket.broadcast.emit('enemy hit', res);
	})

	socket.on('playerHit', function(res) {
		socket.broadcast.emit('player hit', res);
	})





	socket.on('disconnect', function(res) {
		socket.broadcast.emit('disconnected', res);
		console.log('player disconnected!');
	})
})






































