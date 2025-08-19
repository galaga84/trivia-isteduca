import IntroScene from './scenes/IntroScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js'; // ⬅️ nuevo

const config = {
  type: Phaser.AUTO,
  width: 1080,
  height: 1920,
  backgroundColor: '#0f0f13',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [IntroScene, LeaderboardScene, GameScene, GameOverScene] // ⬅️ agrega aquí
};

new Phaser.Game(config);



