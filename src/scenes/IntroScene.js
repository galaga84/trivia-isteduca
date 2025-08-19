// src/scenes/IntroScene.js
export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');

    this.BTN_RADIUS = 40;
    this.HOVER_ALPHA = 0.92;
    this.PRESS_ALPHA = 0.85;
    this.NORMAL_ALPHA = 1.0;
    this.HOVER_DUR = 100;

    this.introMusic = null;
  }

  preload() {
    this.load.image('intro_bg', 'assets/images/background-intro.png');
    this.load.image('logo', 'assets/images/logo.png');

    if (!this.cache.audio.exists('introMusic')) {
      this.load.audio('introMusic', 'assets/audio/intro.wav');
    }
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Apaga cualquier música previa con fade
    const stopWithFade = (key) => {
      const snd = this.sound.get(key);
      if (snd && snd.isPlaying) {
        this.tweens.add({ targets: snd, volume: 0, duration: 300, onComplete: () => snd.stop() });
      } else {
        this.sound.stopByKey(key);
      }
    };
    stopWithFade('gameMusic');
    stopWithFade('gameOverMusic');

    // Fondo
    this.add.image(W * 0.5, H * 0.5, 'intro_bg').setDisplaySize(W, H).setDepth(-1);

    // Logo
    const logo = this.add.image(W * 0.5, H * 0.25, 'logo').setOrigin(0.5);

    // Música intro (fade-in)
    this.introMusic = this.sound.get('introMusic') || this.sound.add('introMusic', { loop: true, volume: 0 });
    const tryPlay = () => {
      if (!this.introMusic.isPlaying) {
        this.introMusic.play();
        this.tweens.add({ targets: this.introMusic, volume: 0.5, duration: 400 });
      }
    };
    tryPlay();
    this.sound.once(Phaser.Sound.Events.UNLOCKED, tryPlay);

    // Botón “Iniciar”
    const btnW = Math.min(W * 0.6, 520);
    const btnH = 100;
    const startY = H * 0.70;

    const startBtn = this.createCapsuleButton(W * 0.5, startY, btnW, btnH, 'Iniciar', () => {
      if (this.introMusic?.isPlaying) {
        this.tweens.add({
          targets: this.introMusic, volume: 0, duration: 250,
          onComplete: () => { this.introMusic.stop(); this.scene.start('GameScene', { restart: true }); }
        });
      } else {
        this.scene.start('GameScene', { restart: true });
      }
    });

    // Botón “Revisar Ranking”
    const rankBtn = this.createCapsuleButton(W * 0.5, startY + btnH + 28, btnW, btnH, 'Revisar Ranking', () => {
      // Dejamos la música de intro sonando
      this.scene.start('LeaderboardScene');
    });

    // Fade de entrada
    this.tweens.add({
      targets: [logo, startBtn.box, rankBtn.box],
      alpha: 1, duration: 350, ease: 'Quad.Out'
    });

    this.events.once('shutdown', () => {
      // No apagamos la introMusic aquí para que pueda seguir en la pantalla de Ranking
    });
  }

  // ---------- Botón cápsula reutilizable ----------
  createCapsuleButton(cx, cy, w, h, labelText, onClick) {
    const box = this.add.container(cx, cy).setAlpha(0);
    box.setSize(w, h);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.14);
    shadow.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, this.BTN_RADIUS);
    box.add(shadow);

    const bg = this.add.graphics();
    this.drawButtonBG(bg, w, h, 0xffffff, 0xe5e7eb, 2, this.BTN_RADIUS);
    box.add(bg);

    const label = this.add.text(0, 0, labelText, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '42px',
      color: '#313537',
      align: 'center',
      wordWrap: { width: w - 40, useAdvancedWrap: true }
    }).setOrigin(0.5);
    box.add(label);

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    box.add(hit);

    hit.on('pointerover', () => this.tweens.add({ targets: bg, alpha: this.HOVER_ALPHA, duration: this.HOVER_DUR }));
    hit.on('pointerout',  () => this.tweens.add({ targets: bg, alpha: this.NORMAL_ALPHA, duration: this.HOVER_DUR }));
    hit.on('pointerdown', () => this.tweens.add({ targets: bg, alpha: this.PRESS_ALPHA, duration: this.HOVER_DUR }));
    const restore = () => this.tweens.add({ targets: bg, alpha: this.NORMAL_ALPHA, duration: this.HOVER_DUR });
    hit.on('pointerup',       () => { restore(); onClick?.(); });
    hit.on('pointerupoutside', restore);

    return { box, bg, label, hit, w, h };
  }

  drawButtonBG(g, w, h, fill, stroke, lineW, radius) {
    g.clear();
    g.fillStyle(fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    g.lineStyle(lineW, stroke, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  }

  scaleToFit(sprite, maxW, maxH) {
    const scaleX = maxW / sprite.width;
    const scaleY = maxH / sprite.height;
    const scale = Math.min(scaleX, scaleY);
    sprite.setScale(scale);
    return scale;
  }
}











