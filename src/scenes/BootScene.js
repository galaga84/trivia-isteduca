// src/scenes/BootScene.js
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Nada aún: esperamos el tap antes de cargar (mejor para autoplay y viewport en móvil)
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Fondo sólido por si aún no hay imágenes
    this.cameras.main.setBackgroundColor('#0f0f13');

    // Mensaje “tap to start”
    const msg = this.add.text(W * 0.5, H * 0.5, 'Toca o haz click para comenzar', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Overlay interactivo a pantalla completa
    const hit = this.add.rectangle(W * 0.5, H * 0.5, W, H, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    const tapStart = async () => {
      hit.disableInteractive();

      // 1) Desbloquear audio si está bloqueado (iOS/Android)
      try { this.sound.unlock(); } catch (_) {}

      // 2) Pequeño delay y refresh de viewport para móviles
      this.time.delayedCall(50, () => {
        try {
          const vw = Math.round(window.visualViewport?.width || window.innerWidth);
          const vh = Math.round(window.visualViewport?.height || window.innerHeight);
          this.scale.setParentSize(vw, vh);
          this.scale.refresh();
          this.game.renderer.resize(this.scale.width, this.scale.height);
        } catch (_) {}
      });

      // 3) Comenzar a precargar lo esencial (intro)
      const loading = this.add.text(W * 0.5, H * 0.5 + 80, 'Cargando… 0%', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '26px',
        color: '#cccccc'
      }).setOrigin(0.5);

      this.load.on('progress', (p) => {
        loading.setText(`Cargando… ${Math.round(p * 100)}%`);
      });

      this.load.on('loaderror', (file) => {
        console.warn('[Boot] Error cargando:', file?.src || file?.key);
      });

      this.load.once('complete', () => {
        // Pequeña espera para asegurar layout estable
        this.time.delayedCall(50, () => {
          this.scene.start('IntroScene');
        });
      });

      // Precarga crítica para Intro/Instructions (ajusta rutas si difieren)
      if (!this.textures.exists('intro_bg')) {
        this.load.image('intro_bg', 'assets/images/background-intro.png');
      }
      if (!this.textures.exists('logo')) {
        this.load.image('logo', 'assets/images/logo.png');
      }
      if (!this.cache.audio.exists('introMusic')) {
        this.load.audio('introMusic', 'assets/audio/intro.wav');
      }

      this.load.start();
    };

    hit.once('pointerup', tapStart);
  }
}
