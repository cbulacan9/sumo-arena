'use strict'

define([], function() {
	function Play() {}

	function Fireball(game, position, self, direction){
		Phaser.Sprite.call(this, game, position.x, position.y, 'fireball');
		// SERVER SIDE UPDATED PROPERTIES
		this.origin = {x: position.x, y: position.y};
		this.direction = {x: position.x, y: position.y};
		this.self = self;

		// GAME PROPERTIES
		game.physics.p2.enable(this);
		this.anchor.setTo(0.5, 0.5);
		this.scale.setTo(0.20);
		this.body.setCircle(15);
		this.checkWorldBounds = true;
		this.outOfBoundsKill = true;

		this.damage = 10;
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
		var player = this;
		Phaser.Sprite.call(player, game, position.x, position.y, 'player');
		// SERVER SIDE UPDATED PROPERTIES
		player.direction = {x: position.x, y: position.y};
		player.position = {x: position.x, y: position.y};
		player.health = {current: 100, max: 100};
		player.self = self;

		// GAME PROPERTIES
		game.physics.p2.enable(player);
		player.anchor.setTo(0.5, 0.5);
		player.scale.setTo(0.25);
		player.body.setCircle(30);

		player.checkWorldBounds = true;
		player.outOfBoundsKill = true;

		player.speed = 150;
		player.sp_mult = 1;
		player.cast_delay = 2000;
		player.casting = false;
		player.min_distance = 10;
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

        return this.fire;
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

		if(this.x < 256) {this.health.current--};
		if(this.x > 768) {this.health.current--};
		if(this.y < 256) {this.health.current--};
		if(this.y > 768) {this.health.current--};

		if(this.health.current <= 0) {
			this.kill();
			this.destroy();
		};

		console.log(this.health.current);

	}

	Player.prototype.changeDirection = function(direction) {
		this.direction.x = direction.x;
		this.direction.y = direction.y;
	}

	Play.prototype.preload = function(){
		this.game.load.image('player', 'assets/player2.png');
		this.game.load.image('fireball', 'assets/spell_fireball.png');
		this.game.load.image('stage', '/assets/stone_stage.png');
		this.game.load.image('lava', '/assets/lava_bg.png');
		this.game.load.image('healthbar', '/assets/health.png');
	}

	Play.prototype.create = function() {
		console.log(this);
		var socket = io(), game = this.game, player, enemy, fire; //declaring all global variables;

		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.setImpactEvents(true);
		game.physics.p2.restitution = 1.0;

		var lava = game.add.sprite(0, 0, 'lava');
		var stage = game.add.sprite(256, 256, 'stage');

		var playerFire = game.physics.p2.createCollisionGroup();
		var enemyFire = game.physics.p2.createCollisionGroup();
		var playerGroup = game.physics.p2.createCollisionGroup();
		var enemyGroup = game.physics.p2.createCollisionGroup();

		socket.emit('new player'); //telling server that this player is being created

		socket.on('add player', function(res) {
			player = new Player(game, res.position, true);
			game.add.existing(player);
			player.body.setCollisionGroup(playerGroup);
			player.body.collides([enemyGroup, enemyFire])
			socket.emit('player added', {position: player.position});
		})

		// for local to show where new players are
		socket.on('current players', function(res) {
			enemy = new Player(game, res.position, false); //new player is added to current map
			game.add.existing(enemy);
			enemy.body.setCollisionGroup(enemyGroup);
			enemy.body.collides([playerGroup, playerFire])
			socket.emit('current players locations', {position: player.position});
		})

		// for remote connections to show where currnet players are
		socket.on('current locations', function(res) {
			enemy = new Player(game, res.position, false); //current players added to remote user map
			game.add.existing(enemy);
			enemy.body.setCollisionGroup(enemyGroup);
			enemy.body.collides([playerGroup, playerFire])
		})

		socket.on('change directions', function(res) {
			enemy.direction.x = res.direction.x;
			enemy.direction.y = res.direction.y;
		})

		socket.on('fireball', function(res) {
			fire = enemy.shootFire(res.direction, false);
			fire.body.setCollisionGroup(enemyFire);
			fire.body.collides([playerGroup, playerFire], function(A, B){

				if(A.sprite.key == 'fireball' && B.sprite.key == 'fireball'){
					A.sprite.kill();
					B.sprite.kill();
					socket.emit('fireballhit')
				} else if(!A.sprite.self){
					var cdirection = {x: res.direction.x  - A.sprite.origin.x, y: res.direction.y - A.sprite.origin.y};
					var magnitude = Math.sqrt(Math.pow(cdirection.x, 2)+Math.pow(cdirection.y, 2));
					var normal = {x: cdirection.x / magnitude, y: cdirection.y / magnitude};

					B.sprite.health.current -= A.sprite.damage;

					// FIREBALL COLLISION
					console.log(res, A.sprite.origin, 'top')
					
					B.sprite.direction.x = normal.x * A.sprite.speed;
					B.sprite.direction.y = normal.y * A.sprite.speed;

					socket.emit('playerHit', {damage: A.sprite.damage, direction: cdirection});
					A.sprite.kill();
				}
				console.log(A.sprite.key, B.sprite.key, 'top');
			}, this)
		})

		socket.on('player hit', function(res) {
			console.log('enemy was hit! -- Damage: ' + res.damage)
			console.log('health: ' + enemy.health.current);
		})

		socket.on('enemy hit', function(res) {
			console.log('you were hit! -- Damage: ' + res.damage);
			console.log('health: ' + player.health.current);
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
				fire = player.shootFire(direction, true);
				fire.body.setCollisionGroup(playerFire);
				fire.body.collides([enemyGroup, enemyFire], function(A, B){
					if(A.sprite.key == 'fireball' && B.sprite.key == 'fireball'){
						A.sprite.kill();
						B.sprite.kill();
						socket.emit('fireballhit')
					} else if(A.sprite.self){
						var cdirection = {x: game.input.x  - A.sprite.origin.x, y: game.input.y - A.sprite.origin.y};
						var magnitude = Math.sqrt(Math.pow(cdirection.x, 2)+Math.pow(cdirection.y, 2));
						var normal = {x: cdirection.x / magnitude, y: cdirection.y / magnitude};

						B.sprite.health.current -= A.sprite.damage;

						// FIREBALL COLLISION
						console.log(B.sprite.health.current);
						B.sprite.direction.x = normal.x * A.sprite.speed;
						B.sprite.direction.y = normal.y * A.sprite.speed;
						
						socket.emit('enemyHit', {damage: A.sprite.damage, direction: direction});
						A.sprite.kill();
					}
				})
				player.casting = false;
				socket.emit('firecast', {direction: direction});
			}
		}, this);
		
		if(game.device.desktop) {
			game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(function(){
				player.casting = true;
			}, this);
		}

		if(!game.device.desktop) {
			game.input.doubleTapRate.add(function() {
				player.casting = true;
			}, this);    
		}

	}

	Play.prototype.update = function() {
		var game = this.game;
	}

	Play.prototype.render = function() {
		this.game.debug.text('Fullstack Arena', 32, 32);
	}
	
	return Play;
})