// src/scenes/InstructionsScene.js
export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super('InstructionsScene');

    // ▶ Cambia solo estos valores y todo se ajusta (card + botón)
    this.FONT_SIZE = 34;     // px
    this.LINE_SPACING = 12;  // px

    this.BTN_RADIUS = 40;
    this.CARD_RADIUS = 40;

    this.HOVER_ALPHA = 0.92;
    this.PRESS_ALPHA = 0.85;
    this.NORMAL_ALPHA = 1.0;
    this.HOVER_DUR = 100;
  }

  preload() {
    if (!this.textures.exists('intro_bg')) {
      this.load.image('intro_bg', 'assets/images/background-intro.png');
    }
    if (!this.textures.exists('logo')) {
      this.load.image('logo', 'assets/images/logo.png');
    }
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Fondo
    this.add.image(W * 0.5, H * 0.5, 'intro_bg').setDisplaySize(W, H).setDepth(-1);

    // Texto (edítalo a gusto)
    const bodyText =
`• Dispones de 20 segundos para responder cada pregunta.
• Mientras más rápido aciertes, ¡más puntos ganas! (de 10 a 1).
• Si te equivocas, perderás puntos. Cada error seguido resta un poco más (−5, −10, −15…).
• Puedes intentarlo de nuevo mientras el tiempo siga corriendo.
• Al final verás tu puntaje y tu mejor marca en este dispositivo.

👉 Concéntrate, diviértete y supera tu propio récord. ¡Éxito! 🎉`;

    // Parámetros de card
    const maxCardW = Math.min(W * 0.9, 900);
    const padX = 32;
    const padY = 28;

    // === 1) Medimos el texto con EXACTAMENTE el mismo estilo que usaremos ===
    const measureStyle = {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: `40px`,
      color: '#313537',
      align: 'left',
      wordWrap: { width: maxCardW - padX * 2, useAdvancedWrap: true },
      lineSpacing: this.LINE_SPACING
    };

    const temp = this.add.text(0, 0, bodyText, measureStyle)
      .setOrigin(0.5)
      .setVisible(false);

    let contentW = Math.ceil(temp.width);
    let contentH = Math.ceil(temp.height);

    // Dimensiones finales de la card según la medición
    let cardW = Math.max(360, Math.min(maxCardW, contentW + padX * 2));
    let cardH = Math.max(200, contentH + padY * 2);

    // Centro de la card
    const cardCX = W * 0.5;
    const cardCY = H * 0.5;

    // === 2) Dibujo de la card ===
    const cardContainer = this.add.container(cardCX, cardCY).setAlpha(0);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.14);
    shadow.fillRoundedRect(-cardW/2, -cardH/2 + 6, cardW, cardH, this.CARD_RADIUS);
    cardContainer.add(shadow);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0xffffff, 1);
    cardBg.lineStyle(2, 0xe5e7eb, 1);
    cardBg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, this.CARD_RADIUS);
    cardBg.strokeRoundedRect(-cardW/2, -cardH/2, cardW, cardH, this.CARD_RADIUS);
    cardContainer.add(cardBg);

    // === 3) Texto definitivo (mismo estilo que la medición) ===
    const body = this.add.text(0, 0, bodyText, measureStyle).setOrigin(0.5);
    cardContainer.add(body);

    // Limpio el medidor
    temp.destroy();

    // === 4) Botón "Iniciar" posicionado con respecto al tamaño REAL de la card ===
    const btnW = Math.min(W * 0.6, 520);
    const btnH = 96;
    const gapBelowCard = 26;

    const startBtn = this.createCapsuleButton(
      W * 0.5,
      cardCY + cardH / 2 + gapBelowCard + btnH / 2,
      btnW,
      btnH,
      'Iniciar',
      () => {
        const intro = this.sound.get('introMusic');
        if (intro?.isPlaying) {
          this.tweens.add({
            targets: intro, volume: 0, duration: 220,
            onComplete: () => { intro.stop(); this.scene.start('GameScene', { restart: true }); }
          });
        } else {
          this.scene.start('GameScene', { restart: true });
        }
      }
    );

    // Animaciones
    this.tweens.add({ targets: cardContainer, alpha: 1, duration: 280, ease: 'Quad.Out' });
    this.tweens.add({ targets: startBtn.box,  alpha: 1, duration: 280, ease: 'Quad.Out', delay: 80 });
  }

  // ---------- Botón cápsula ----------
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
      fontSize: '38px',
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
}

