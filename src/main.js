import IntroScene from './scenes/IntroScene.js';
import InstructionsScene from './scenes/InstructionsScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';
import OrientationGuard from './scenes/OrientationGuard.js';

const config = {
  type: Phaser.AUTO,
  width: 1080,
  height: 1920,
  backgroundColor: '#0f0f13',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [
    IntroScene,          // 👈 arranca primero
    InstructionsScene,
    LeaderboardScene,
    GameScene,
    GameOverScene,
    OrientationGuard     // 👈 ya no es la primera
  ]
};

new Phaser.Game(config);






