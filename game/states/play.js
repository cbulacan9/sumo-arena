'use strict'

define([], function() {
	function Play() {}

	function Fireball(game, position, self, direction){
		Phaser.Sprite.call(this, game, position.x, position.y, 'fireball');
		// SERVER SIDE UPDATED PROPERTIES
		this.direction = {x: position.x, y: position.y};
		this.position = {x: position.x, y: position.y};

		// GAME PROPERTIES
		game.physics.p2.enable(this);
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(0.20);
		this.body.setCircle(15);
		this.checkWorldBounds = true;
		this.outOfBoundsKill = true;

		this.speed = 200; //px/sec
		this.body.velocity.x = direction.x * this.speed;
		this.body.velocity.y = direction.y * this.speed;
	}

	Fireball.prototype = Object.create(Phaser.Sprite.prototype);
	Fireball.prototype.constructor = Fireball;
	Fireball.prototype.getInfo = function() {
		return {x: this.x, y: this.y, dx: this.dx, dy: this.dy};
	}

	function Player(game, position, self, direction){
		Phaser.Sprite.call(this, game, position.x, position.y, 'player');
		// SERVER SIDE UPDATED PROPERTIES
		this.direction = {x: position.x, y: position.y};
		this.position = {x: position.x, y: position.y};
		this.health = {current: 100, max: 100};

		// GAME PROPERTIES
		game.physics.p2.enable(this);
		this.collideWorldBounds = true;
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(0.25);
		this.body.setCircle(30);

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

	Player.prototype.shootFire = function(direction, self) {
		this.fire = new Fireball(this.game, this.position, self, direction);
		this.fire.kill();
		this.game.add.existing(this.fire);
		
		if(this.lastFireShotAt == undefined) this.lastFireShot = 0;
		if(this.game.time.now - this.lasrtFireShotAt < this.cast_delay) return;

		if(this.fire == null || this.fire === undefined) return;
		this.fire.revive();
		this.fire.reset(this.x, this.y);

		var rotation = this.game.math.angleBetween(this.x, this.y, direction.x, direction.y);
		 this.fire.body.velocity.x = Math.cos(rotation) * this.fire.speed;
        this.fire.body.velocity.y = Math.sin(rotation) * this.fire.speed; 
        this.casting = false;
	}

	Player.prototype.update = function() {
		var dx = this.direction.x - this.position.x;
		var dy = this.direction.y - this.position.y;
		var magnitude = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

		if(magnitude > this.min_distance) {
			var rotation = this.game.math.angleBetween(this.position.x, this.position.y, this.direction.x, this.direction.y);
			this.body.velocity.x = Math.cos(rotation) * this.speed;
			this.body.velocity.y = Math.sin(rotation) * this.speed;
		} else {
			this.body.velocity.x = 0;
			this.body.velocity.y = 0;
		}
	}

	Player.prototype.changeDirection = function(direction) {
		this.direction.x = direction.x;
		this.direction.y = direction.y;
	}

	Play.prototype.preload = function(){
		this.game.load.image('player', 'assets/player.png');
		this.game.load.image('fireball', 'assets/spell_fireball.png');
		this.game.load.image('stage', '/assets/stone_stage.png');
		this.game.load.image('lava', '/assets/lava_bg.png');
		this.game.load.image('healthbar', '/assets/health.png');
	}

	Play.prototype.create = function() {
		console.log(this);
		var socket = io(), game = this.game, player, enemy, fire; //declaring all global variables;

		game.physics.startSystem(Phaser.Physics.P2JS);
		game.world.setBounds(0, 0, game.width, game.height);
		game.physics.p2.setImpactEvents(true);
		game.physics.p2.restitution = 1.0;

		var lava = game.add.sprite(0, 0, 'lava');
		var stage = game.add.sprite(144, 144, 'stage');

		var playerFires = game.physics.p2.createCollisionGroup();
		var enemyFires = game.physics.p2.createCollisionGroup();
		var playerGroup = game.physics.p2.createCollisionGroup();
		var enemyGroup = game.physics.p2.createCollisionGroup();

		socket.emit('new player'); //telling server that this player is being created

		socket.on('add player', function(res) {
			player = new Player(game, res.position, true);
			game.add.existing(player);
			socket.emit('player added', {position: player.position});
		})

		// for local to show where new players are
		socket.on('current players', function(res) {
			enemy = new Player(game, res.position, false); //new player is added to current map
			game.add.existing(enemy);
			socket.emit('current players locations', {position: player.position});
		})

		// for remote connections to show where currnet players are
		socket.on('current locations', function(res) {
			enemy = new Player(game, res.position, false); //current players added to remote user map
			game.add.existing(enemy);
		})

		socket.on('change directions', function(res) {
			enemy.direction.x = res.direction.x;
			enemy.direction.y = res.direction.y;
		})

		socket.on('fireball', function(res) {
			enemy.shootFire(res.direction, false);
		})

		socket.on('disconnected', function(res) {
			enemy.kill();
			enemy.destroy();
		})

		//GAME CONTROLS
		game.input.onDown.add(function(){
			var direction = {x: game.input.x, y: game.input.y}
			if(!player.casting) {
				player.changeDirection(direction);
				socket.emit('moving', {direction: direction});	
			} else {
				player.shootFire(direction, true);
				player.casting = false;
				socket.emit('firecast', {direction: direction});
			}
		}, this);

		game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(function(){
			player.casting = true;
		}, this);
	}

	Play.prototype.update = function() {
		var game = this.game;
	}

	



















































	return Play;
})