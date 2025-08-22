// src/main.js
import IntroScene from './scenes/IntroScene.js';
import InstructionsScene from './scenes/InstructionsScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,             // usa window.Phaser (UMD)
  parent: 'app',
  width: 1080,
  height: 1920,
  backgroundColor: '#0f0f13',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    IntroScene,          // arranque seguro
    InstructionsScene,
    LeaderboardScene,
    GameScene,
    GameOverScene
  ]
};

const game = new Phaser.Game(config);

// --- Fix de viewport para móvil (evita quedar “tamaño landscape” al volver a portrait) ---
function fixViewport() {
  const vw = Math.round(window.visualViewport?.width || window.innerWidth);
  const vh = Math.round(window.visualViewport?.height || window.innerHeight);
  game.scale.setParentSize(vw, vh);
  game.scale.refresh();
  game.renderer.resize(game.scale.width, game.scale.height);
}
const scheduleFix = () => setTimeout(fixViewport, 60);
window.addEventListener('resize', scheduleFix);
window.addEventListener('orientationchange', scheduleFix);
document.addEventListener('visibilitychange', scheduleFix);
scheduleFix();










