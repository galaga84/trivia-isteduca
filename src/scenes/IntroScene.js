export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');

    // Estilo botones tipo “cápsula”
    this.BTN_RADIUS = 40;
    this.HOVER_ALPHA = 0.92;
    this.PRESS_ALPHA = 0.85;
    this.NORMAL_ALPHA = 1.0;
    this.HOVER_DUR = 100;

    this.introMusic = null;
  }

  preload() {
    // FONDO EXCLUSIVO DE INTRO
    // Coloca tu imagen en esta ruta:
    this.load.image('intro_bg', 'assets/images/background-intro.png');

    // Logo (tú lo agregas)
    this.load.image('logo', 'assets/images/logo.png');

    // Música de la pantalla inicial
    this.load.audio('introMusic', 'assets/audio/intro.wav');
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Fondo Intro
    this.add.image(W * 0.5, H * 0.5, 'intro_bg').setDisplaySize(W, H).setDepth(-1);

    // Logo centrado en el 50% superior
    const logo = this.add.image(W * 0.5, H * 0.25, 'logo').setOrigin(0.5);

    // Música (robusta para autoplay)
    this.introMusic = this.sound.add('introMusic', { loop: true, volume: 0.5 });
    const tryPlay = () => { if (!this.introMusic.isPlaying) this.introMusic.play(); };
    tryPlay();
    this.sound.once(Phaser.Sound.Events.UNLOCKED, tryPlay);

    // Botón “Iniciar” estilo cápsula (igual que en Game)
    const btnW = Math.min(W * 0.6, 520);
    const btnH = 100;
    const startY = H * 0.75;

    const startBtn = this.createCapsuleButton(W * 0.5, startY, btnW, btnH, 'Iniciar', () => {
      if (this.introMusic?.isPlaying) this.introMusic.stop();
      this.scene.start('GameScene', { restart: true });
    });

    // Fade de entrada
    this.tweens.add({
      targets: [logo, startBtn.box],
      alpha: 1,
      duration: 350,
      ease: 'Quad.Out'
    });
  }

  // ---------- Botón cápsula reutilizable ----------
  createCapsuleButton(cx, cy, w, h, labelText, onClick) {
    const box = this.add.container(cx, cy).setAlpha(0);
    box.setSize(w, h);

    // Sombra
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.14);
    shadow.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, this.BTN_RADIUS);
    box.add(shadow);

    // Fondo + borde
    const bg = this.add.graphics();
    this.drawButtonBG(bg, w, h, 0xffffff, 0xe5e7eb, 2, this.BTN_RADIUS);
    box.add(bg);

    // Texto
    const label = this.add.text(0, 0, labelText, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '42px',
      color: '#313537',
      align: 'center',
      wordWrap: { width: w - 40, useAdvancedWrap: true }
    }).setOrigin(0.5);
    box.add(label);

    // Hit area
    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    box.add(hit);

    // Hover/press (desktop)
    hit.on('pointerover', () => {
      this.tweens.add({ targets: bg, alpha: this.HOVER_ALPHA, duration: this.HOVER_DUR, ease: 'Linear' });
    });
    hit.on('pointerout', () => {
      this.tweens.add({ targets: bg, alpha: this.NORMAL_ALPHA, duration: this.HOVER_DUR, ease: 'Linear' });
    });
    hit.on('pointerdown', () => {
      this.tweens.add({ targets: bg, alpha: this.PRESS_ALPHA, duration: this.HOVER_DUR, ease: 'Linear' });
    });
    const restoreAlpha = () => {
      this.tweens.add({ targets: bg, alpha: this.NORMAL_ALPHA, duration: this.HOVER_DUR, ease: 'Linear' });
    };
    hit.on('pointerup', () => { restoreAlpha(); onClick?.(); });
    hit.on('pointerupoutside', restoreAlpha);

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










