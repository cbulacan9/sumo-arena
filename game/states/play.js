'use strict'

define([], function() {
	function Play() {}

	function Fireball(position, direction, self){
		Phaser.Sprite.call(this, game, position.x, position.y, 'fireball');
		// SERVER SIDE UPDATED PROPERTIES
		this.dx = direction.x;
		this.dy = direction.y;
		this.x = position.x;
		this.y = position.y;

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

	function Player(position, direction, self){
		
	}

	return Play;
})