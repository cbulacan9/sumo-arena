'use strict'

define([], function() {
  function Menu() {};

  Menu.prototype.preload = function() {
    this.game.load.image('menu', 'assets/menu.png');
  }
  
  Menu.prototype.create = function() {
    var lava = this.game.add.sprite(0, 0, 'menu');
    this.game.stage.backgroundColor = 0xFFFFFF;
    this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);

    this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(function(){
      this.game.state.start('play');
    }, this);
  }

  return Menu;
})