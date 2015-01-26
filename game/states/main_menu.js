'use strict'

define([], function() {
  function Menu() {};

  Menu.prototype = {
    create: function() {
      this.game.stage.backgroundColor = 0x4488cc;
      // this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
      this.game.state.start('play');
    }
  };

  return Menu;
})