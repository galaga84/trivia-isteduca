// src/scenes/GameScene.js
import QUESTIONS from '../data/questions.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.totalTime = 10;
    this.elapsed = 0;
    this.timerRunning = false;

    this.score = 0;
    this.currentIndex = 0;

    // UI refs
    this.cardContainer = null;
    this.choiceButtons = [];
    this.progressText = null;

    // Timer integrado a la card (gradiente + track)
    this.timerTrack = null;
    this.timerGradImage = null;
    this.timerGradKey = 'timerGradTex';
    this.timerGradW = 0;
    this.timerGradH = 0;

    // Audio
    this.correctSfx = null;
    this.wrongSfx = null;
    this.gameMusic = null;

    // Score capsule
    this.scoreCapsule = null;
    this.scoreText = null;
    this.scoreGradKey = 'scoreGradTex';
    this.scoreCapW = 0;
    this.scoreCapH = 0;

    // Efectos hover/press
    this.HOVER_ALPHA = 0.92;
    this.PRESS_ALPHA = 0.85;
    this.NORMAL_ALPHA = 1.0;
    this.HOVER_DUR = 100;

    // Radios
    this.BTN_RADIUS = 40;
    this.CARD_RADIUS = 40;
  }

  init(data) {
    if (data?.restart) {
      this.score = 0;
      this.currentIndex = 0;
      this.sound.stopByKey('gameMusic');
    }
  }

  preload() {
    // FONDO EXCLUSIVO DE GAME
    this.load.image('game_bg', 'assets/images/background.png');

    // Audio
    this.load.audio('gameMusic', 'assets/audio/game.mp3');
    this.load.audio('correctSfx', 'assets/audio/correct.wav');
    this.load.audio('wrongSfx',   'assets/audio/wrong.wav');
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Fondo Game
    this.add.image(W * 0.5, H * 0.5, 'game_bg').setDisplaySize(W, H).setDepth(-1);

    // Silencia Intro si quedó sonando
    this.sound.removeAllListeners(Phaser.Sound.Events.UNLOCKED);
    this.sound.stopByKey('introMusic');
    const intro = this.sound.get('introMusic');
    if (intro?.isPlaying) intro.stop();

    // Música del juego (fade in)
    this.gameMusic = this.sound.add('gameMusic', { loop: true, volume: 0 });
    this.gameMusic.play();
    this.tweens.add({ targets: this.gameMusic, volume: 0.5, duration: 450 });

    // SFX
    this.correctSfx = this.sound.add('correctSfx', { volume: 0.7 });
    this.wrongSfx   = this.sound.add('wrongSfx',   { volume: 0.7 });

    if (this.currentIndex >= QUESTIONS.length) this.currentIndex = 0;
    this.showQuestion(this.currentIndex);
  }

  // ============ Layout por pregunta ============
  showQuestion(idx) {
    const { width: W, height: H } = this.scale;
    const qData = QUESTIONS[idx];

    // Limpieza
    this.cardContainer?.destroy(true); this.cardContainer = null;
    this.scoreCapsule?.destroy(true); this.scoreCapsule = null;
    this.choiceButtons.forEach(({ box }) => box?.destroy?.());
    this.choiceButtons = [];
    this.timerTrack?.destroy(); this.timerTrack = null;
    this.timerGradImage?.destroy(); this.timerGradImage = null;

    if (this.textures.exists(this.timerGradKey)) this.textures.remove(this.timerGradKey);
    if (this.textures.exists(this.scoreGradKey)) this.textures.remove(this.scoreGradKey);

    this.elapsed = 0;
    this.timerRunning = false;

    // ======== División 50/50 de pantalla ========
    const topHalfTop = 0;
    const topHalfH = H * 0.5;
    const bottomHalfTop = H * 0.5;
    const bottomHalfH = H * 0.5;

    // Mitad superior: cápsula y card centradas y distribuidas en Y
    const scoreCy = topHalfTop + topHalfH * (1 / 3);
    const cardCy  = topHalfTop + topHalfH * (2 / 3);

    // ======== Card (rect ángulo 40) ========
    const cardW = Math.min(W * 0.92, 900);
    const cardH = Math.min(topHalfH * 0.7, 420);

    // Animación: entra desde la izquierda
    const startX = -cardW;
    const targetX = W * 0.5;

    this.cardContainer = this.add.container(startX, cardCy).setDepth(10);

    // Sombra
    const cardShadow = this.add.graphics();
    cardShadow.fillStyle(0x000000, 0.18);
    cardShadow.fillRoundedRect(-cardW/2, -cardH/2 + 8, cardW, cardH, this.CARD_RADIUS);
    this.cardContainer.add(cardShadow);

    // Panel blanco
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0xffffff, 1);
    cardBg.fillRoundedRect(-cardW/2, -cardH/2, cardW, cardH, this.CARD_RADIUS);
    this.cardContainer.add(cardBg);

    // Pregunta
    const pad = 32;
    const qMaxWidth = cardW - pad * 2;
    const questionY = -cardH * 0.22;

    const questionText = this.add.text(0, questionY, qData.text, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '44px',
      color: '#0f0f13',
      wordWrap: { width: qMaxWidth, useAdvancedWrap: true },
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);
    this.cardContainer.add(questionText);

    // Contador X / N (esquina superior derecha de la card)
    const counterText = this.add.text(cardW / 2 - pad, -cardH / 2 + pad, `${idx + 1} / ${QUESTIONS.length}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '32px',
      color: '#6b7280'
    }).setOrigin(1, 0).setAlpha(0);
    this.cardContainer.add(counterText);
    this.progressText = counterText;

    // ----- Timer integrado en la base de la card -----
    const barH = 22;
    const trackW = cardW - pad * 2;
    const trackX = -cardW / 2 + pad;
    const trackY = cardH / 2 - pad - barH / 2;

    // Track gris debajo
    this.timerTrack = this.add.graphics();
    this.timerTrack.fillStyle(0xE5E7EB, 1);
    this.timerTrack.fillRoundedRect(trackX, trackY - barH/2, trackW, barH, 10);
    this.timerTrack.setAlpha(0);
    this.cardContainer.add(this.timerTrack);

    // Gradiente horizontal del timer (con bordes redondeados ya incluidos)
    this.createGradientTexture(this.timerGradKey, Math.floor(trackW), Math.floor(barH), '#4f0b7b', '#e0119d', 10);
    this.timerGradW = trackW; this.timerGradH = barH;

    this.timerGradImage = this.add.image(trackX, trackY, this.timerGradKey)
      .setOrigin(0, 0.5).setAlpha(0);
    this.cardContainer.add(this.timerGradImage);

    // ======== Score capsule centrada arriba (mitad superior) ========
    this.createScoreCapsule(W * 0.5, scoreCy);

    // ======== Alternativas (mitad inferior, centradas como grupo) ========
    const btnW = Math.min(W * 0.86, 780);
    const btnH = 96;
    const GAP = Math.min(124, bottomHalfH * 0.24);

    const groupHeight = 4 * btnH + 3 * GAP;
    const firstY = bottomHalfTop + (bottomHalfH - groupHeight) / 2 + btnH / 2;

    for (let i = 0; i < 4; i++) {
      const y = firstY + i * (btnH + GAP);
      const entry = this.createChoiceButton(W * 0.5, y, btnW, btnH, qData.choices[i]);
      entry.box.setDepth(20);
      entry.hit.on('pointerdown', () => this.onChoice(i));
      this.choiceButtons.push(entry);
    }

    // Animación de entrada
    this.tweens.add({
      targets: this.cardContainer,
      x: targetX,
      duration: 600,
      ease: 'Back.Out',
      onComplete: () => {
        this.tweens.add({
          targets: [
            this.scoreCapsule,
            questionText, counterText, this.timerTrack, this.timerGradImage,
            ...this.choiceButtons.map(c => c.box)
          ],
          alpha: 1,
          duration: 450,
          delay: 120,
          onComplete: () => { this.elapsed = 0; this.timerRunning = true; }
        });
      }
    });
  }

  // ============ Update ============
  update(_, delta) {
    if (!this.timerRunning || !this.timerGradImage) return;
    this.elapsed += delta / 1000;
    const t = Phaser.Math.Clamp(this.elapsed / this.totalTime, 0, 1);

    const remaining = Math.floor(this.timerGradW * (1 - t));
    this.timerGradImage.setCrop(0, 0, remaining, this.timerGradH);

    if (t >= 1) this.nextQuestion();
  }

  // ============ Interacción ============
  onChoice(index) {
    if (!this.timerRunning) return;

    const qData = QUESTIONS[this.currentIndex];
    const entry = this.choiceButtons[index];
    if (!entry) return;

    const isCorrect = index === qData.correctIndex;

    if (isCorrect) {
      this.timerRunning = false;
      this.correctSfx?.play();

      const secondsUsed = Math.min(this.totalTime, Math.max(0.001, this.elapsed));
      const points = Phaser.Math.Clamp(11 - Math.ceil(secondsUsed), 1, 10);
      this.score += points;

      // Actualiza cápsula con "Puntaje: N"
      this.scoreText.setText(`Puntaje: ${this.score}`);

      // +puntos AL LADO DERECHO DEL BOTÓN CORRECTO
      this.showPointsNearButton(entry, points);

      // Feedback visual: solo bordes (verde)
      this.showButtonBorder(entry, 0x2ecc71);

      // Bloquear taps duplicados hasta cambiar de pregunta
      this.choiceButtons.forEach(({ hit }) => hit.disableInteractive());
      this.time.delayedCall(480, () => this.nextQuestion());
    } else {
      this.wrongSfx?.play();
      this.cameras.main.shake(160, 0.01);

      // Feedback visual: solo bordes (rojo)
      this.showButtonBorder(entry, 0xe74c3c);
    }
  }

  nextQuestion() {
    this.timerRunning = false;
    this.currentIndex += 1;

    if (this.currentIndex >= QUESTIONS.length) {
      try {
        const stored = parseInt(localStorage.getItem('bestScore') || '0', 10);
        if (isFinite(stored)) {
          if (this.score > stored) localStorage.setItem('bestScore', String(this.score));
        } else {
          localStorage.setItem('bestScore', String(this.score));
        }
      } catch (_) {}

      this.time.delayedCall(220, () => {
        this.scene.start('GameOverScene', {
          score: this.score,
          totalQuestions: QUESTIONS.length,
          answered: this.currentIndex
        });
      });
      return;
    }

    this.time.delayedCall(140, () => this.showQuestion(this.currentIndex));
  }

  // ============ Score capsule ============
  createScoreCapsule(cx, cy) {
    this.scoreCapsule?.destroy(true);
    if (this.textures.exists(this.scoreGradKey)) this.textures.remove(this.scoreGradKey);

    this.scoreCapW = Math.max(220, Math.min(this.scale.width * 0.6, 460));
    this.scoreCapH = 64;

    this.scoreCapsule = this.add.container(cx, cy).setAlpha(0).setDepth(30);

    // Fondo gradiente con bordes redondeados ya dibujados
    this.createGradientTexture(this.scoreGradKey, this.scoreCapW, this.scoreCapH, '#4f0b7b', '#e0119d', this.BTN_RADIUS);
    const bg = this.add.image(0, 0, this.scoreGradKey).setOrigin(0.5);
    this.scoreCapsule.add(bg);

    // Texto "Puntaje: N"
    this.scoreText = this.add.text(0, 0, `Puntaje: ${this.score}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.scoreCapsule.add(this.scoreText);
  }

  // ============ Botón UI (container + HIT RECTANGLE) ============
  createChoiceButton(cx, cy, w, h, text) {
    const r = this.BTN_RADIUS;

    const box = this.add.container(cx, cy).setAlpha(0);
    box.setSize(w, h);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.14);
    shadow.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, r);
    box.add(shadow);

    const bg = this.add.graphics();
    this.drawButtonBG(bg, w, h, 0xffffff, 0xe5e7eb, 2, r);
    box.add(bg);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '30px',
      color: '#313537', // color de alternativas
      align: 'center',
      wordWrap: { width: w - 40, useAdvancedWrap: true }
    }).setOrigin(0.5);
    box.add(label);

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    box.add(hit);

    // Hover/Press (desktop)
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
    hit.on('pointerup', restoreAlpha);
    hit.on('pointerupoutside', restoreAlpha);

    return { box, bg, label, hit, border: null, shadow, w, h, r };
  }

  drawButtonBG(g, w, h, fill, stroke, lineW, radius) {
    g.clear();
    g.fillStyle(fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    g.lineStyle(lineW, stroke, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  }

  showButtonBorder(entry, color) {
    entry.border?.destroy?.();
    const g = this.add.graphics();
    g.lineStyle(6, color, 1);
    g.strokeRoundedRect(-entry.w / 2, -entry.h / 2, entry.w, entry.h, entry.r);
    g.setAlpha(0);
    entry.box.add(g);
    entry.border = g;

    this.tweens.add({ targets: g, alpha: 1, duration: 90, yoyo: true, hold: 140 });
  }

 showPointsNearButton(entry, points) {
    const { width: W } = this.scale;

    // Posición base: justo a la DERECHA del botón, centrado verticalmente
    let x = entry.box.x + entry.w / 2 + 18;
    const y = entry.box.y; // centro del botón

    const txt = this.add.text(x, y, `+${points}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '30px',
      color: '#2ecc71',      // mismo color que alternativas
      stroke: '#2ecc71',     // verde del borde correcto
      strokeThickness: 3
    })
      .setOrigin(0, 0.5)     // ancla a la izquierda, centrado en Y
      .setDepth(50)
      .setAlpha(0);

    // Pequeña animación de aparición centrada
    this.tweens.add({
      targets: txt,
      alpha: 1,
      y: y - 10,
      scale: 1,
      duration: 180,
      ease: 'Quad.Out',
      yoyo: true,
      hold: 240,
      onComplete: () => txt.destroy()
    });
  }

  // (Opcional, ya no se usa para la cápsula)
  showPointsGain(points) {
    const rightEdge = this.scoreCapsule.x + this.scoreCapW / 2;
    const y = this.scoreCapsule.y;
    const gain = this.add.text(rightEdge + 8, y, `+${points}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '30px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0, 0.5).setAlpha(0);

    this.tweens.add({
      targets: gain,
      alpha: 1,
      y: y - 16,
      duration: 180,
      ease: 'Quad.Out',
      yoyo: true,
      hold: 200,
      onComplete: () => gain.destroy()
    });
  }

  // ============ Gradiente con bordes redondeados (sin máscaras) ============
  createGradientTexture(key, w, h, leftColor, rightColor, radius = 0) {
    const tex = this.textures.createCanvas(key, Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)));
    const ctx = tex.getContext();

    const rr = Math.min(radius, w / 2, h / 2);
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    const x = 0, y = 0;
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();

    const grd = ctx.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, leftColor);
    grd.addColorStop(1, rightColor);
    ctx.fillStyle = grd;
    ctx.fill();

    tex.refresh();
  }
}

