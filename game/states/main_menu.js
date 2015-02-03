'use strict'

define([], function() {
  function Menu() {};

  Menu.prototype.preload = function() {
    this.game.load.image('menu', 'assets/menu.png');
  }
  
  Menu.prototype.create = function() {
    var game = this.game;
    var menu = this.game.add.sprite(0, 0, 'menu');
    game.stage.backgroundColor = 0xFFFFFF;

    game.input.onDown.add(function(){
      game.state.start('play');
    }, this);
  }

  return Menu;
})