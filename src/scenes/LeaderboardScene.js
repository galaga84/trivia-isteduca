// src/scenes/LeaderboardScene.js
import { fetchScoresPage } from "../net/leaderboard.js";

const PAGE_SIZE = 25;

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('LeaderboardScene');

    // estilo botones tipo cápsula (igual que Intro/GameOver)
    this.RADIUS = 40;
    this.HOVER_ALPHA = 0.92;
    this.PRESS_ALPHA = 0.85;
    this.NORMAL_ALPHA = 1.0;
    this.HOVER_DUR = 100;

    // estado
    this.page = 1;
    this.total = 0;
    this.totalPages = 1;

    // refs UI
    this.card = null;
    this.cardBG = null;
    this.cardShadow = null;
    this.titleText = null;
    this.pageInfoText = null;
    this.headerContainer = null;
    this.listContainer = null;
    this.loadingText = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.backBtn = null;

    // layout
    this.cardW = 0;
    this.cardH = 0;
    this.padX = 20;      // padding lateral dentro de la card
    this.listWidth = 0;

    // columnas
    this.colRankX = 0;
    this.colNameX = 40;
    this.colEmpresaX = 0;
    this.colScoreX = 0;

    // ancho calculado de columnas
    this.nameColW = 0;
    this.empresaColW = 0;
    this.rankColW = 50;   // fijo aprox
    this.scoreColW = 120; // fijo aprox (3–4 dígitos)

    // alturas de línea
    this.lineH = 40; // coherente con fontSize 30px
  }

  preload() {
    if (!this.textures.exists('intro_bg')) {
      this.load.image('intro_bg', 'assets/images/background-intro.png');
    }
    if (!this.textures.exists('game_bg')) {
      this.load.image('game_bg', 'assets/images/background.png');
    }
  }

  async create() {
    const { width: W, height: H } = this.scale;

    // Fondo
    const bgKey = this.textures.exists('intro_bg') ? 'intro_bg' : 'game_bg';
    this.add.image(W * 0.5, H * 0.5, bgKey).setDisplaySize(W, H).setDepth(-1);

    // Card al 60% de alto y 95% de ancho (inicial, luego se autoajusta)
    this.cardW = Math.floor(W * 0.95);
    this.cardH = Math.floor(H * 0.6);
    this.listWidth = this.cardW - this.padX * 2;

    this.card = this.add.container(W * 0.5, H * 0.5);

    // Sombra
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.14);
    shadow.fillRoundedRect(-this.cardW / 2, -this.cardH / 2 + 8, this.cardW, this.cardH, this.RADIUS);
    this.card.add(shadow);
    this.cardShadow = shadow;

    // Fondo
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH, this.RADIUS);
    this.card.add(g);
    this.cardBG = g;

    // Título
    this.titleText = this.add.text(0, -this.cardH / 2 + 18, 'Ranking', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#0f0f13',
    }).setOrigin(0.5, 0);
    this.card.add(this.titleText);

    // Info de página (arriba derecha)
    this.pageInfoText = this.add.text(this.cardW / 2 - this.padX, -this.cardH / 2 + 26, 'Página 1/1 · Total 0', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '20px',
      color: '#6b7280',
    }).setOrigin(1, 0);
    this.card.add(this.pageInfoText);

    // Header columnas
    this.headerContainer = this.add.container(-this.cardW / 2 + this.padX, -this.cardH / 2 + 70);
    this.card.add(this.headerContainer);

    // Lista
    this.listContainer = this.add.container(-this.cardW / 2 + this.padX, -this.cardH / 2 + 110);
    this.card.add(this.listContainer);

    // Placeholder “cargando…”
    this.loadingText = this.add.text(0, 0, 'Cargando…', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '22px',
      color: '#6b7280',
    }).setOrigin(0, 0);
    this.listContainer.add(this.loadingText);

    // Controles de paginación (dentro de la card, parte baja)
    const controlsY = this.cardH / 2 - 62;

    this.prevBtn = this.createCapsuleButton(
      this.card.x - this.cardW / 2 + this.padX + 130,
      this.card.y + controlsY,
      260, 72, 'Anterior',
      () => this.goPage(this.page - 1)
    );

    this.nextBtn = this.createCapsuleButton(
      this.card.x + this.cardW / 2 - this.padX - 130,
      this.card.y + controlsY,
      260, 72, 'Siguiente',
      () => this.goPage(this.page + 1)
    );

    // Botón Volver (debajo de la card)
    this.backBtn = this.createCapsuleButton(
      W * 0.5,
      Math.min(H * 0.92, this.card.y + this.cardH / 2 + 80),
      260, 72, 'Volver',
      () => this.scene.start('IntroScene')
    );

    // Calcular columnas (intenta encajar 20 y 20 caracteres a 30px)
    this.computeColumns();

    // Autoajuste inicial (0 filas mientras carga)
    this.autoResizeCard(0);

    // Cargar primera página
    await this.fetchAndRenderPage(1);

    // (Opcional) Reajustar si cambia el tamaño del canvas
    this.scale.on('resize', this.onResize, this);
  }

  // ---------- Autoajuste de la card ----------
  autoResizeCard(rowCount) {
    const { width: W, height: H } = this.scale;

    // Altura del contenido de la lista
    const listContentH = Math.max(1, rowCount) * this.lineH + 10; // +10 por el spacer

    // Bloques fijos (ajusta si cambias tipografías o márgenes)
    const TOP_BLOCK    = 110;  // desde borde superior hasta inicio de lista (TITLE+HEADER+gaps)
    const CONTROLS_PAD = 130;  // espacio para botones de paginación dentro de la card
    const EXTRA_PAD    = 20;   // respiración inferior

    const desiredH = TOP_BLOCK + listContentH + CONTROLS_PAD + EXTRA_PAD;

    // Limita para no salir de pantalla
    this.cardH = Phaser.Math.Clamp(Math.floor(desiredH), 280, Math.floor(H * 0.9));
    this.listWidth = this.cardW - this.padX * 2;

    // Redibuja fondo + sombra con el nuevo alto
    this.cardShadow.clear();
    this.cardShadow.fillStyle(0x000000, 0.14);
    this.cardShadow.fillRoundedRect(-this.cardW / 2, -this.cardH / 2 + 8, this.cardW, this.cardH, this.RADIUS);

    this.cardBG.clear();
    this.cardBG.fillStyle(0xffffff, 1);
    this.cardBG.fillRoundedRect(-this.cardW / 2, -this.cardH / 2, this.cardW, this.cardH, this.RADIUS);

    // Reposiciona elementos dependientes del alto
    this.titleText.setY(-this.cardH / 2 + 18);
    this.pageInfoText.setPosition(this.cardW / 2 - this.padX, -this.cardH / 2 + 26);
    this.headerContainer.setPosition(-this.cardW / 2 + this.padX, -this.cardH / 2 + 70);
    this.listContainer.setPosition(-this.cardW / 2 + this.padX, -this.cardH / 2 + 110);

    // Reubica botones de paginación dentro de la card
    const controlsY = this.cardH / 2 - 62;
    this.prevBtn.setPosition(this.card.x - this.cardW / 2 + this.padX + 130, this.card.y + controlsY);
    this.nextBtn.setPosition(this.card.x + this.cardW / 2 - this.padX - 130, this.card.y + controlsY);

    // Botón "Volver" bajo la card
    this.backBtn.setPosition(W * 0.5, Math.min(H * 0.92, this.card.y + this.cardH / 2 + 80));

    // Si cambió el ancho útil, recomputa columnas
    this.computeColumns();
  }

  onResize() {
    // Recalcula usando el recuento aproximado de la página actual
    const lastCount = Math.max(
      0,
      Math.min(PAGE_SIZE, this.total - (this.page - 1) * PAGE_SIZE)
    );
    this.autoResizeCard(lastCount);
  }
  // -------------------------------------------

  // --- Cálculo de columnas dinámico para 20/20 caracteres en 30px ---
  computeColumns() {
    const FONT = 30;
    const padBetween = 20;

    // medimos el ancho de 20 'M' (peor caso) para ambas columnas
    const tmp20a = this.add.text(0, -9999, 'M'.repeat(20), {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: `${FONT}px`, color: '#000'
    }).setVisible(false);
    const tmp20b = this.add.text(0, -9999, 'M'.repeat(20), {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: `${FONT}px`, color: '#000'
    }).setVisible(false);

    const desiredName = tmp20a.width + 6;  // Nombre máx 20
    const desiredEmp  = tmp20b.width + 6;  // Empresa máx 20

    tmp20a.destroy();
    tmp20b.destroy();

    const availableForNameEmp =
      this.listWidth - (this.rankColW + this.scoreColW + padBetween * 2 + this.colNameX);

    let nameW = desiredName;
    let empW  = desiredEmp;

    if (nameW + empW > availableForNameEmp) {
      const scale = availableForNameEmp / (nameW + empW);
      nameW *= scale;
      empW  *= scale;
    }

    this.nameColW    = Math.floor(nameW);
    this.empresaColW = Math.floor(empW);

    this.colRankX    = 0;
    this.colNameX    = this.colRankX + this.rankColW;
    this.colEmpresaX = this.colNameX + this.nameColW + padBetween;
    this.colScoreX   = this.listWidth; // derecha (origin 1)
  }

  async goPage(target) {
    const clamped = Math.max(1, Math.min(target, this.totalPages || 1));
    if (clamped === this.page) return;
    await this.fetchAndRenderPage(clamped);
  }

  async fetchAndRenderPage(page) {
    // Loading
    this.listContainer.removeAll(true);
    this.loadingText = this.add.text(0, 0, 'Cargando…', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '22px',
      color: '#6b7280',
    }).setOrigin(0, 0);
    this.listContainer.add(this.loadingText);

    try {
      const { rows, total } = await fetchScoresPage(page, PAGE_SIZE);
      this.page = page;
      this.total = total || 0;
      this.totalPages = Math.max(1, Math.ceil((this.total) / PAGE_SIZE));

      // === Autoajusta la card según cantidad de filas de esta página ===
      this.autoResizeCard(Array.isArray(rows) ? rows.length : 0);

      // Render
      this.renderHeader();
      this.renderPage(rows);

      // Page info
      this.pageInfoText.setText(`Página ${this.page}/${this.totalPages} · Total ${this.total}`);

      // Enable/disable
      this.setButtonEnabled(this.prevBtn, this.page > 1);
      this.setButtonEnabled(this.nextBtn, this.page < this.totalPages);
    } catch (e) {
      this.listContainer.removeAll(true);
      const err = this.add.text(0, 0, 'No se pudo cargar el ranking.', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '22px',
        color: '#e11d48',
      }).setOrigin(0, 0);
      this.listContainer.add(err);
    }
  }

  renderHeader() {
    this.headerContainer.removeAll(true);

    const hRank = this.add.text(this.colRankX, 0, '#', {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '30px', color: '#374151'
    }).setOrigin(0, 0);

    const hName = this.add.text(this.colNameX, 0, 'Nombre', {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '30px', color: '#374151'
    }).setOrigin(0, 0);

    const hEmp = this.add.text(this.colEmpresaX, 0, 'Empresa', {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '30px', color: '#374151'
    }).setOrigin(0, 0);

    const hScore = this.add.text(this.colScoreX, 0, 'Puntaje', {
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '30px', color: '#374151'
    }).setOrigin(1, 0);

    [hRank, hName, hEmp, hScore].forEach(t => this.headerContainer.add(t));
  }

  renderPage(rows) {
    this.listContainer.removeAll(true);

    const data = Array.isArray(rows) ? rows : [];

    // (espaciador)
    const spacer = this.add.text(0, 0, ' ', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '2px'
    }).setOrigin(0, 0);
    this.listContainer.add(spacer);

    data.forEach((r, i) => {
      const y = (i + 1) * this.lineH;
      const color = '#4b5563';
      const rankGlobal = (this.page - 1) * PAGE_SIZE + (i + 1);

      const txRank = this.add.text(this.colRankX, y, String(rankGlobal), {
        fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '30px', color
      }).setOrigin(0, 0);

      const txName = this.add.text(this.colNameX, y, (r?.name ?? 'Anónimo'), {
        fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '30px', color,
        wordWrap: { width: this.nameColW, useAdvancedWrap: true }
      }).setOrigin(0, 0);

      const txEmp = this.add.text(this.colEmpresaX, y, (r?.empresa ?? ''), {
        fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '30px', color,
        wordWrap: { width: this.empresaColW, useAdvancedWrap: true }
      }).setOrigin(0, 0);

      const txScore = this.add.text(this.colScoreX, y, String(r?.score ?? 0), {
        fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '30px', color
      }).setOrigin(1, 0);

      [txRank, txName, txEmp, txScore].forEach(t => this.listContainer.add(t));
    });

    if (data.length === 0) {
      const empty = this.add.text(0, 0, 'No hay resultados en esta página.', {
        fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '22px', color: '#6b7280'
      }).setOrigin(0, 0);
      this.listContainer.add(empty);
    }
  }

  // ---- Botones (cápsula) con estilo consistente ----
  createCapsuleButton(cx, cy, w, h, labelText, onClick) {
    const box = this.add.container(cx, cy);
    box.setSize(w, h);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.14);
    shadow.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, this.RADIUS);
    box.add(shadow);

    const bg = this.add.graphics();
    this.drawButtonBG(bg, w, h, 0xffffff, 0xe5e7eb, 2, this.RADIUS); // estado normal (con borde)
    box.add(bg);

    const label = this.add.text(0, 0, labelText, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '28px',
      color: '#111827',
      align: 'center'
    }).setOrigin(0.5);
    box.add(label);

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });
    box.add(hit);

    // Guarda refs y medidas en el propio contenedor para usarlas en setInteractiveState
    box._bg = bg;
    box._label = label;
    box._hit = hit;
    box._w = w;
    box._h = h;
    box._radius = this.RADIUS;
    box.disabled = false;

    // Interacciones (se anulan si está disabled)
    hit.on('pointerover', () => {
      if (box.disabled) return;
      this.tweens.add({ targets: bg, alpha: this.HOVER_ALPHA, duration: this.HOVER_DUR });
    });
    hit.on('pointerout',  () => {
      if (box.disabled) return;
      this.tweens.add({ targets: bg, alpha: this.NORMAL_ALPHA, duration: this.HOVER_DUR });
    });
    hit.on('pointerdown', () => {
      if (box.disabled) return;
      this.tweens.add({ targets: bg, alpha: this.PRESS_ALPHA, duration: this.HOVER_DUR });
    });
    const restore = () => {
      if (box.disabled) return;
      this.tweens.add({ targets: bg, alpha: this.NORMAL_ALPHA, duration: this.HOVER_DUR });
    };
    hit.on('pointerup', () => { restore(); if (!box.disabled) onClick?.(); });
    hit.on('pointerupoutside', restore);

    // Habilitar/deshabilitar sin “línea blanca”
    box.setInteractiveState = (enabled) => {
      box.disabled = !enabled;

      if (enabled) {
        // Restaurar estilo normal (con borde), alfa completa y texto fuerte
        this.drawButtonBG(bg, w, h, 0xffffff, 0xe5e7eb, 2, this.RADIUS);
        bg.setAlpha(1);
        label.setColor('#111827').setAlpha(1);
        hit.setInteractive({ useHandCursor: true });
      } else {
        // Fondo gris UNIFORME sin stroke (adiós a artefactos)
        bg.clear();
        bg.fillStyle(0xCCCCCC, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, this.RADIUS);
        bg.setAlpha(1);

        // Texto atenuado y sin interacción
        label.setColor('#6B7280').setAlpha(1);
        hit.disableInteractive();
      }
    };

    return box;
  }

  setButtonEnabled(btn, enabled) {
    if (!btn) return;
    btn.setInteractiveState?.(!!enabled);
  }

  drawButtonBG(g, w, h, fill, stroke, lineW, radius) {
    g.clear();
    g.fillStyle(fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    g.lineStyle(lineW, stroke, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  }
}
