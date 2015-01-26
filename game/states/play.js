'use strict'

define([], function() {
	function Play() {}

	function Fireball(game, position, direction, self){
		Phaser.Sprite.call(this, game, position.x, position.y, 'fireball');
		// SERVER SIDE UPDATED PROPERTIES
		this.direction = {x: direction.x, y: direction.y};
		this.position = {x: position.x, y: position.y};

		// GAME PROPERTIES
		game.physics.p2.enable(this);
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(0.20);
		this.body.setCircle(15);
		this.checkWorldBounds = true;
		this.outOfBoundsKill = true;

		if(self) {
			this.body.setCollisionGroup(playerFireGroup);
			this.body.collides([enemyGroup], checkCollision, this);
		} else {
			thisbody.setCollisionGroup(enemyFireGroup);
			this.body.collides([playerGroup], checkCollision, this);
		}

		this.speed = 200; //px/sec
		this.body.velocity.x = dx * speed;
		this.body.velocity.y = dy * speed;
	}

	Fireball.prototype = Object.create(Phaser.Sprite.prototype);
	Fireball.prototype.constructor = Fireball;
	Fireball.prototype.getInfo = function() {
		return {x: this.x, y: this.y, dx: this.dx, dy: this.dy};
	}

	function Player(game, position, direction, self){
		Phaser.Sprite.call(this, game, position.x, position.y, 'player');
		// SERVER SIDE UPDATED PROPERTIES
		this.direction = {x: direction.x, y: direction.y};
		this.position = {x: position.x, y: position.y};
		this.health = {current: 100, max: 100};

		// GAME PROPERTIES
		game.physics.p2.enable(this);
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(0.25);
		this.body.setCircle(30);

		// if(self) {
		// 	this.body.setCollisionGroup(playerGroup);
		// 	this.body.collides([enemyGroup], checkCollision, this);
		// 	this.body.collides([enemyFireGroup]);
		// } else {
		// 	this.body.setCollisionGroup(enemyGroup);
		// 	this.body.collides([game.playerGroup], checkCollision, this);
		// 	this.body.collides([playerFireGroup]);
		// }

		this.speed = 150;
		this.sp_mult = 1;
		this.cast_delay = 2000;
		this.casting = false;
		this.min_distance = 10;
	}

	Player.prototype = Object.create(Phaser.Sprite.prototype);
	Player.prototype.constructor = Player;
	Player.prototype.getInfo = function() {
		return {x: this.x, y: this.y, dx: this.dx, dy: this.dy};
	}

	Player.prototype.shootFire = function(direction) {
		this.fire = new Fireball(this.position, direction, true);
		this.fireballPool = this.game.add.group();
		this.fire.kill();
		this.game.add.existing(this.fire);
		
		if(this.lastFireShotAt == undefined) this.lastFireShot = 0;
		if(this.game.time.now - this.lastFireShotAt < this.cast_delay) return;

		if(this.fire == null || this.fire === undefined) return;
		this.fire.revive();
		this.fire.reset(this.x, this.y);

		socket.emit('fired', this.fire.getInfo());
		var rotation = this.game.math.angleBetween(this.x, this.y, direction.x, direction.y);
		 this.fire.body.velocity.x = Math.cos(rotation) * this.fire.speed;
        this.fire.body.velocity.y = Math.sin(rotation) * this.fire.speed; 
        this.casting = false;
	}

	Play.prototype.preload = function(){
		this.game.load.image('player', 'assets/player.png');
		this.game.load.image('fireball', 'assets/spell_fireball.png');
		this.game.load.image('stage', '/assets/stone_stage.png');
		this.game.load.image('lava', '/assets/lava_bg.png');
		this.game.load.image('healthbar', '/assets/health.png');
	}

	Play.prototype.create = function() {
		var socket = io(); var game = this.game; var player; var enemy; //declaring all global variables;

		game.physics.startSystem(Phaser.Physics.P2JS);
		game.world.setBounds(0, 0, game.width, game.height);
		game.physics.p2.setImpactEvents(true);

		var lava = game.add.sprite(0, 0, 'lava');
		var stage = game.add.sprite(144, 144, 'stage');

		var playerFireGroup = game.physics.p2.createCollisionGroup(playerFireGroup);
		var enemyFireGroup = game.physics.p2.createCollisionGroup(enemyFireGroup);
		var playerGroup = game.physics.p2.createCollisionGroup(playerGroup);
		var enemyGroup = game.physics.p2.createCollisionGroup(enemyGroup);

		socket.emit('new player'); //telling server that this player is being created

		socket.on('add player', function(res) {
			player = new Player(game, res.position, res.direction, true);
			game.add.existing(player);
			socket.emit('player added', {position: player.position, direction: player.direction});
		})

		// for new connection to show where current players are
		socket.on('current players', function(res) {
			enemy = new Player(game, res.position, res.direction, false);
			game.add.existing(enemy);
			socket.emit('current players locations', {position: player.position, direction: player.direction});
		})

		socket.on('current locations', function(res) {
			console.log(res);
			enemy = new Player(game, res.position, res.direction, false);
			game.add.existing(enemy);
		})
	}

	Play.prototype.update = function() {
		if(player !== undefined) { move(player); }
		if(enemy !== undefined) { move(enemy); }
		
		if(this.input.keyboard.isDown(32)) {
			player.casting = true;
			player.shootFire(this.game.input.activePointer);
		} 

		if(this.input.activePointer.isDown) {
			changeDirection();
		}
	}

	function move(unit) {
		var dx = unit.direction.x - unit.position.x;
		var dy = unit.direction.y - unit.position.y;
		var magnitude = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

		if(magnitude > unit.min_distance) {
			var rotation = game.math.angleBetween(unit.x, unit.y, unit.direction.x, unit.direction.y);
			unit.body.velocity.x = Math.cos(rotation) * unit.speed;
			unit.body.velocity.y = Math.sin(rotation) * unit.speed;
		} else {
			unit.body.velocity.x = 0;
			unit.body.velocity.y = 0;
		}
	}



















































	return Play;
})