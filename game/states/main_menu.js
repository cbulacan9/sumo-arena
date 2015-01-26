'use strict'

define([], function() {
  function Menu() {};

  Menu.prototype = {
    preload: function() {
      
    }
    create: function() {
      this.game.stage.backgroundColor = 0x4488cc;
      this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
      this.enterKey.onDown.add(this.tweenPlayState, this);
    }
  };

  return Menu;
})