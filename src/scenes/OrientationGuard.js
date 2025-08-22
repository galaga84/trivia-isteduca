// src/scenes/OrientationGuard.js
export default class OrientationGuard extends Phaser.Scene {
  constructor() {
    super('OrientationGuard');

    // Ajustes
    this.MOBILE_SHORT_EDGE_MAX = 900; // px; si el lado corto es <= a esto y es touch, lo tratamos como móvil
    this.ENFORCE_ON_DESKTOP = false;  // déjalo en false para NO bloquear en escritorio

    this.overlay = null;
    this.bg = null;
    this.msg = null;
    this._pausedScenes = new Set();

    this.GAME_SCENES = [
      'IntroScene',
      'InstructionsScene',
      'LeaderboardScene',
      'GameScene',
      'GameOverScene'
    ];
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Overlay
    this.overlay = this.add.container(W * 0.5, H * 0.5).setDepth(9999).setVisible(false);
    this.bg = this.add.rectangle(0, 0, W, H, 0x0f0f13, 0.92).setOrigin(0.5);
    this.msg = this.add.text(0, 0, 'Por favor usa el juego en orientación vertical', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '36px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: Math.min(720, W * 0.9), useAdvancedWrap: true }
    }).setOrigin(0.5);

    this.overlay.add([this.bg, this.msg]);
    this.bg.removeInteractive();
    this.bg.on('pointerdown', () => this._debouncedUpdate());

    // Listeners
    this.scale.on('resize', ({ width, height }) => { this._layout(width, height); this._debouncedUpdate(); });
    this.scale.on('orientationchange', () => this._debouncedUpdate());
    this.game.events.on(Phaser.Core.Events.VISIBLE, () => this._debouncedUpdate());
    this.game.events.on(Phaser.Core.Events.HIDDEN, () => this._debouncedUpdate());

    this._debouncedUpdate();
  }

  // ---------- Layout ----------
  _layout(W, H) {
    this.overlay.setPosition(W * 0.5, H * 0.5);
    this.bg.setSize(W, H).setPosition(0, 0);
    this.msg.setWordWrapWidth(Math.min(720, W * 0.9), true);
  }

  // ---------- Detecciones ----------
  _isLandscape() {
    // Combina varios métodos; si cualquiera dice "landscape", lo tratamos como tal
    const byPhaser = this.scale.orientation === Phaser.Scale.LANDSCAPE;
    const bySize = window.innerWidth > window.innerHeight;
    const byMQ = window.matchMedia ? window.matchMedia('(orientation: landscape)').matches : false;
    return byPhaser || bySize || byMQ;
  }

  _isMobileLike() {
    const ua = navigator.userAgent || '';
    const isTouch = (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
    const shortEdge = Math.min(window.innerWidth || 0, window.innerHeight || 0) || Math.min(this.scale.width, this.scale.height);
    const isSmall = shortEdge <= this.MOBILE_SHORT_EDGE_MAX;
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    return (isTouch && isSmall) || isMobileUA;
  }

  _shouldEnforce() {
    if (this.ENFORCE_ON_DESKTOP) return true;
    return this._isMobileLike(); // solo móviles
  }

  _debouncedUpdate() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this._updateOverlay(), 60);
  }

  // ---------- Mostrar/Ocultar ----------
  _updateOverlay() {
    // Si NO debemos aplicar en este dispositivo (desktop), oculta y sal
    if (!this._shouldEnforce()) {
      this._hideOverlay();
      return;
    }

    // En móviles: bloquear landscape
    if (this._isLandscape()) {
      this._showOverlay();
    } else {
      this._hideOverlay();
    }
  }

  _showOverlay() {
    if (!this.overlay.visible) {
      this.overlay.setVisible(true);
      this.bg.setInteractive({ useHandCursor: true });
      this.scene.bringToTop();

      // Pausar escenas activas
      this._pausedScenes.clear();
      for (const key of this.GAME_SCENES) {
        const sys = this.scene.get(key)?.sys;
        if (sys && sys.isActive() && !sys.isPaused()) {
          this.scene.pause(key);
          this._pausedScenes.add(key);
        }
      }
      // Pausar audio
      this.sound.pauseAll();
    }
  }

  _hideOverlay() {
    if (this.overlay.visible) {
      this.overlay.setVisible(false);
      this.bg.removeInteractive();

      // Reanudar escenas que pausamos
      for (const key of this._pausedScenes) {
        const sys = this.scene.get(key)?.sys;
        if (sys && sys.isPaused()) this.scene.resume(key);
      }
      this._pausedScenes.clear();

      // Reanudar audio
      this.sound.resumeAll();
    }
  }
}

