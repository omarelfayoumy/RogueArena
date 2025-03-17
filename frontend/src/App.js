import React, { useEffect } from "react";
import Phaser from "phaser";
import BattleArena from "./Game";

const App = () => {
  useEffect(() => {
    new Phaser.Game({
      type: Phaser.AUTO,
      // Full-screen game size:
      width: window.innerWidth,
      height: window.innerHeight,
      scene: [BattleArena],
      parent: "game-container",
      physics: {
        default: "arcade",
        arcade: {
          debug: false,
        },
      },
    });
  }, []);

  return <div id="game-container"></div>;
};

export default App;
