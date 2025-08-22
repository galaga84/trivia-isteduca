// src/scenes/BootScene.js
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // No cargamos nada aún: esperamos al primer tap (mejor para móvil)
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Fondo base (por si aún no hay imágenes)
    this.cameras.main.setBackgroundColor('#0f0f13');

    // Mensaje de inicio
    const title = this.add.text(W * 0.5, H * 0.45, 'Toca o haz click para comenzar', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

   

    // Capa interactiva a pantalla completa
    const hit = this.add.rectangle(W * 0.5, H * 0.5, W, H, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    const onFirstTap = async () => {
      hit.disableInteractive();

      // 1) Desbloquear audio (iOS / Android)
      try { this.sound.unlock(); } catch (_) {}

      // 2) Pequeño refresh de viewport por si el navegador no actualizó aún
      this.time.delayedCall(50, () => {
        try {
          const vw = Math.round(window.visualViewport?.width || window.innerWidth);
          const vh = Math.round(window.visualViewport?.height || window.innerHeight);
          this.scale.setParentSize(vw, vh);
          this.scale.refresh();
          this.game.renderer.resize(this.scale.width, this.scale.height);
        } catch (_) {}
      });

      // Indicador de carga (ligero)
      const loading = this.add.text(W * 0.5, H * 0.75, 'Cargando… 0%', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '24px',
        color: '#9ca3af'
      }).setOrigin(0.5);

      this.load.on('progress', (p) => {
        loading.setText(`Cargando… ${Math.round(p * 100)}%`);
      });
      this.load.on('loaderror', (file) => {
        console.warn('[Boot] Error cargando:', file?.src || file?.key);
      });

      // 3) Fase A — precarga mínima (solo lo necesario para mostrar Intro rápido)
      if (!this.textures.exists('intro_bg')) {
        this.load.image('intro_bg', 'assets/images/background-intro.png');
      }
      if (!this.textures.exists('logo')) {
        this.load.image('logo', 'assets/images/logo.png');
      }

      this.load.once('complete', () => {
        // Pasamos a IntroScene de inmediato (arranque “instantáneo”)
        this.scene.start('IntroScene');

        // 4) Fase B — cargas diferidas en segundo plano (no bloquean la Intro)
        // Música de la intro: usa .mp3 para máxima compatibilidad móvil
        if (!this.cache.audio.exists('introMusic')) {
          this.load.audio('introMusic', 'assets/audio/intro.mp3');
        }

        // (Opcional) Puedes añadir aquí más assets que quieras tener listos:
        // if (!this.cache.audio.exists('gameMusic')) {
        //   this.load.audio('gameMusic', 'assets/audio/game.mp3');
        // }
        // if (!this.cache.audio.exists('correctSfx')) {
        //   this.load.audio('correctSfx', 'assets/audio/correct.wav');
        // }
        // if (!this.cache.audio.exists('wrongSfx')) {
        //   this.load.audio('wrongSfx', 'assets/audio/wrong.wav');
        // }

        // Inicia la fase B sin bloquear la transición a Intro
        this.load.start();
      });

      // Seguridad: si algo raro pasa y no termina, forzamos avanzar
      this.time.delayedCall(4000, () => {
        if (this.scene.isActive('BootScene')) {
          console.warn('[Boot] Timeout: forzando pasar a IntroScene');
          this.scene.start('IntroScene');
        }
      });

      // ¡Arranca fase A!
      this.load.start();
    };

    hit.once('pointerup', onFirstTap);
  }
}

