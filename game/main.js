//where we load and launch all our game states
'use strict'

define(['states/boot', 'states/main_menu', 'states/play'], function(Boot, Menu, Play) {

	function Game() {}

	Game.prototype = {
		start: function() {
			var game = new Phaser.Game(1024, 1024, Phaser.AUTO, 'gameDiv');
			game.state.add('boot', Boot)
			game.state.add('menu', Menu);
			game.state.add('play', Play);
			game.state.start('boot');
		}
	}

	return Game;
})