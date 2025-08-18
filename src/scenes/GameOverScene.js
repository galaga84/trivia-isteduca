export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
    this.BTN_RADIUS = 40;
    this.HOVER_ALPHA = 0.92;
    this.PRESS_ALPHA = 0.85;
    this.NORMAL_ALPHA = 1.0;
    this.HOVER_DUR = 100;
    this.CARD_RADIUS = 40;
  }

  preload() {
    // Fondo exclusivo de Game Over
    this.load.image('gameover_bg', 'assets/images/background-over.png');
    // Logo en la mitad superior
    this.load.image('logo', 'assets/images/logo.png');
    // Música de Game Over (una sola vez)
    this.load.audio('gameoverMusic', 'assets/audio/gameover_music.mp3');
  }

  create(data) {
    const { width: W, height: H } = this.scale;

    // Fondo Game Over
    this.add.image(W * 0.5, H * 0.5, 'gameover_bg').setDisplaySize(W, H).setDepth(-1);

    // Asegurar que la música previa no siga
    this.sound.stopByKey('gameMusic');
    this.sound.stopByKey('introMusic');

    // Logo centrado en X y centro del top-half
    this.add.image(W * 0.5, H * 0.25, 'logo').setOrigin(0.5);

    // Música de Game Over (no loop)
    const gom = this.sound.add('gameoverMusic', { loop: false, volume: 0.5 });
    gom.play();

    const score = data?.score ?? 0;

    // ================== CARD CENTRADO (estilo del juego) ==================
    const cardW = Math.min(W * 0.9, 900);
    const cardH = 360;
    const card = this.add.container(W * 0.5, H * 0.5);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.18);
    shadow.fillRoundedRect(-cardW / 2, -cardH / 2 + 8, cardW, cardH, this.CARD_RADIUS);
    card.add(shadow);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, this.CARD_RADIUS);
    card.add(bg);

    const title = this.add.text(0, -30, 'Se acabó el juego', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '60px',
      color: '#0f0f13',
      align: 'center'
    }).setOrigin(0.5);
    card.add(title);

    const scoreLbl = this.add.text(0, 40, `Tu puntaje: ${score}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '44px',
      color: '#313537',
      align: 'center'
    }).setOrigin(0.5);
    card.add(scoreLbl);

    // ================== BOTONES (como en Inicio) ==================
    const btnW = Math.min(W * 0.6, 520);
    const btnH = 100;

    // Reintentar (debajo del card)
    const retryY = H * 0.5 + cardH / 2 + 80;
    const retry = this.createCapsuleButton(W * 0.5, retryY, btnW, btnH, 'Reintentar', () => {
      gom.stop();
      this.scene.start('GameScene', { restart: true });
    });

    // Volver al inicio (más abajo)
    const backY = retryY + 140;
    const back = this.createCapsuleButton(W * 0.5, backY, btnW, btnH, 'Volver al inicio', () => {
      gom.stop();
      this.scene.start('IntroScene');
    });

    this.tweens.add({ targets: [card, retry.box, back.box], alpha: 1, duration: 380, ease: 'Quad.Out' });
  }

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

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    box.add(hit);

    hit.on('pointerover', () => { this.tweens.add({ targets: bg, alpha: this.HOVER_ALPHA, duration: this.HOVER_DUR }); });
    hit.on('pointerout',  () => { this.tweens.add({ targets: bg, alpha: this.NORMAL_ALPHA, duration: this.HOVER_DUR }); });
    hit.on('pointerdown', () => { this.tweens.add({ targets: bg, alpha: this.PRESS_ALPHA, duration: this.HOVER_DUR }); });
    const restore = () => { this.tweens.add({ targets: bg, alpha: this.NORMAL_ALPHA, duration: this.HOVER_DUR }); };
    hit.on('pointerup', () => { restore(); onClick?.(); });
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
}