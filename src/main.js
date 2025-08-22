import BootScene from './scenes/BootScene.js';
import IntroScene from './scenes/IntroScene.js';
import InstructionsScene from './scenes/InstructionsScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1080,
  height: 1920,
  backgroundColor: '#0f0f13',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, IntroScene, InstructionsScene, LeaderboardScene, GameScene, GameOverScene]
};

new Phaser.Game(config);












