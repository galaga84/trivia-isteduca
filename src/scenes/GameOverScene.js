// src/scenes/GameOverScene.js
import {
  submitScore,
  fetchTopScores,
  fetchRankAndTotal,
} from "../net/leaderboard.js";

const TOP_LIMIT = 15;

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");

    this.finalScore = 0;
    this.bestScore = 0;
    this.totalQuestions = 0;
    this.answered = 0;

    // UI
    this.panel = null;
    this.listContainer = null;
    this.loadingText = null;

    // Labels superiores
    this.line1 = null;   // Tu puntaje
    this.line2 = null;   // Tu mejor puntaje
    this.linePos = null; // Tu posición: #X de Y
    this.line3 = null;   // Preguntas respondidas

    // Estilo
    this.RADIUS = 32;
    this.BUTTON_W = 260;
    this.BUTTON_H = 72;

    // Audio
    this.gameOverMusic = null;

    // Modal
    this.modalOverlay = null;
    this.modalDom = null;

    // Layout leaderboard / auto-resize
    this.panelW = 0;
    this.panelBG = null;
    this.panelShadow = null;
    this.panelTopLocal = 0;
    this.currentPanelH = 0;
    this.retryButton = null;
    this.backButton  = null;   // nuevo botón
    this.lastListHeight = 0;
  }

  init(data) {
    this.finalScore = Number(data?.score || 0);
    this.totalQuestions = Number(data?.totalQuestions || 0);
    this.answered = Number(data?.answered || 0);

    // Best score local
    try {
      const stored = parseInt(localStorage.getItem("bestScore") || "0", 10);
      this.bestScore = Number.isFinite(stored) ? stored : 0;
      if (this.finalScore > this.bestScore) {
        this.bestScore = this.finalScore;
        localStorage.setItem("bestScore", String(this.bestScore));
      }
    } catch (_) {
      this.bestScore = Math.max(this.bestScore, this.finalScore);
    }
  }

  preload() {
    if (!this.textures.exists("game_bg")) {
      this.load.image("game_bg", "assets/images/background.png");
    }
    if (!this.cache.audio.exists("gameOverMusic")) {
      this.load.audio("gameOverMusic", "assets/audio/gameover.mp3");
    }
  }

  async create() {
    const { width: W, height: H } = this.scale;

    // Asegura DOM por encima del canvas y con eventos activos
    if (this.game.domContainer) {
      this.game.domContainer.style.zIndex = "10";
      this.game.domContainer.style.pointerEvents = "auto";
    }
    if (this.game.canvas) {
      this.game.canvas.style.zIndex = "0";
    }

    // --- Audio: apagar música del juego con fade, encender música de GameOver (una sola vez) ---
    const prev = this.sound.get("gameMusic");
    if (prev && prev.isPlaying) {
      this.tweens.add({ targets: prev, volume: 0, duration: 400, onComplete: () => prev.stop() });
    } else {
      this.sound.stopByKey("gameMusic");
    }
    this.sound.stopByKey("introMusic");

    if (this.gameOverMusic?.isPlaying) this.gameOverMusic.stop();
    this.gameOverMusic = this.sound.get("gameOverMusic") || this.sound.add("gameOverMusic", {
      loop: false,
      volume: 0
    });
    this.gameOverMusic.play();
    this.tweens.add({ targets: this.gameOverMusic, volume: 0.5, duration: 450 });

    // Fondo
    this.add.image(W * 0.5, H * 0.5, "game_bg").setDisplaySize(W, H).setDepth(-1);

    // Título
    this.add.text(W * 0.5, H * 0.1, "¡Juego terminado!", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "54px",
      fontStyle: "bold",
      color: "#0f0f13",
    }).setOrigin(0.5);

    // Panel central (dimensiones iniciales; luego auto-resize)
    const panelW = Math.min(W * 0.9, 900);
    const panelH = Math.min(H * 0.9, 1040);
    this.panelW = panelW;

    this.panel = this.add.container(W * 0.5, H * 0.5);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.14);
    shadow.fillRoundedRect(-panelW / 2, -panelH / 2 + 8, panelW, panelH, this.RADIUS);

    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, this.RADIUS);

    this.panel.add(shadow);
    this.panel.add(g);

    // Guardar refs para auto-resize
    this.panelShadow = shadow;
    this.panelBG = g;
    this.panelTopLocal = -panelH / 2;
    this.currentPanelH = panelH;

    // Puntajes
    const textPad = 24;
    this.line1 = this.add.text(0, -panelH / 2 + textPad + 8, `Tu puntaje: ${this.finalScore}`, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "40px",
      color: "#111827",
    }).setOrigin(0.5, 0);

    this.line2 = this.add.text(0, this.line1.y + this.line1.height + 6, `Tu mejor puntaje: ${this.bestScore}`, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "28px",
      color: "#6b7280",
    }).setOrigin(0.5, 0);

    // Posición (debajo de mejor puntaje)
    this.linePos = this.add.text(0, this.line2.y + this.line2.height + 4, `Tu posición: …`, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "24px",
      color: "#6b7280",
    }).setOrigin(0.5, 0);

    this.line3 = this.add.text(0, this.linePos.y + this.linePos.height + 6,
      `Preguntas respondidas: ${this.answered} / ${this.totalQuestions}`, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "22px",
      color: "#6b7280",
    }).setOrigin(0.5, 0);

    this.panel.add(this.line1);
    this.panel.add(this.line2);
    this.panel.add(this.linePos);
    this.panel.add(this.line3);

    // Separador
    const sep = this.add.graphics();
    sep.lineStyle(2, 0xE5E7EB, 1);
    const sepY = this.line3.y + this.line3.height + 16;
    sep.beginPath();
    sep.moveTo(-panelW / 2 + 28, sepY);
    sep.lineTo(panelW / 2 - 28, sepY);
    sep.strokePath();
    this.panel.add(sep);

    // Encabezado del ranking (Top 15)
    const rankTitle = this.add.text(-panelW / 2 + 28, sepY + 16, `Top ${TOP_LIMIT} en línea`, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#0f0f13",
    }).setOrigin(0, 0);
    this.panel.add(rankTitle);

    // Contenedor de lista
    this.listContainer = this.add.container(-panelW / 2 + 28, rankTitle.y + rankTitle.height + 10);
    this.panel.add(this.listContainer);

    // Placeholder de carga
    this.loadingText = this.add.text(0, 0, "Cargando ranking…", {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "22px",
      color: "#6b7280",
    }).setOrigin(0, 0);
    this.listContainer.add(this.loadingText);

    // --- Botones (dos) debajo del panel; se recolocan tras auto-resize ---
    const btnY = Math.min(H * 0.92, this.panel.y + panelH / 2 + 80);

    const GAP = 30; // espacio entre botones
    const totalW = this.BUTTON_W * 2 + GAP;
    const leftX  = W * 0.5 - totalW / 2 + this.BUTTON_W / 2;
    const rightX = W * 0.5 + totalW / 2 - this.BUTTON_W / 2;

    // Reintentar (izquierda)
    this.retryButton = this.createUIButton(leftX, btnY, "Reintentar", () => {
      if (this.gameOverMusic?.isPlaying) {
        this.tweens.add({
          targets: this.gameOverMusic,
          volume: 0,
          duration: 250,
          onComplete: () => this.gameOverMusic.stop()
        });
      } else {
        this.sound.stopByKey("gameOverMusic");
      }
      this.scene.start("GameScene", { restart: true });
    });

    // Volver al inicio (derecha)
    this.backButton = this.createUIButton(rightX, btnY, "Volver al inicio", () => {
      if (this.gameOverMusic?.isPlaying) {
        this.tweens.add({
          targets: this.gameOverMusic,
          volume: 0,
          duration: 250,
          onComplete: () => this.gameOverMusic.stop()
        });
      } else {
        this.sound.stopByKey("gameOverMusic");
      }
      this.scene.start("IntroScene");
    });

    // === Modal obligatorio (Nombre/Empresa) ===
    const identity = await this.forceIdentityModal(); // { name, company }

    // Enviar puntaje
    let inserted = null;
    try {
      inserted = await submitScore(identity.name, this.finalScore, identity.company);
    } catch (_) { /* no bloquear */ }

    // Posición global
    if (inserted?.created_at) {
      try {
        const { rank, total } = await fetchRankAndTotal(inserted.score, inserted.created_at);
        this.linePos.setText(`Tu posición: #${rank} de ${total}`);
      } catch (_) {
        this.linePos.setText(`Tu posición: —`);
      }
    } else {
      this.linePos.setText(`Tu posición: —`);
    }

    // Cargar Top 15 y renderizar
    try {
      const top = await fetchTopScores(TOP_LIMIT);
      this.renderLeaderboard(top);
    } catch (e) {
      this.loadingText?.setText("No se pudo cargar el ranking.");
    }

    // Limpieza al salir
    this.events.once("shutdown", () => {
      this.modalDom?.destroy?.();
      this.modalOverlay?.destroy?.();
      if (this.gameOverMusic?.isPlaying) this.gameOverMusic.stop();
    });
  }

  // ----- Modal OBLIGATORIO (inputs contenidos + empresa máx 30) -----
  async forceIdentityModal() {
    let name = "", company = "";
    try {
      name = (localStorage.getItem("playerName") || "").trim();
      company = (localStorage.getItem("playerCompany") || "").trim();
    } catch (_) {}

    const { width: W, height: H } = this.scale;
    const safe = s => (s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

    const html = `
      <div id="modal-root" style="
        width: 420px; max-width: 92vw;
        font-family: Arial, Helvetica, sans-serif;
        background:#ffffff; color:#111827;
        border-radius:16px; padding:20px;
        box-shadow:0 10px 30px rgba(0,0,0,0.25);
        pointer-events:auto; box-sizing:border-box; overflow:hidden;
      ">
        <div style="font-size:22px; font-weight:700; margin-bottom:6px;">Registra tus datos</div>
        <div style="font-size:13px; color:#6b7280; margin-bottom:12px;">
          Debes ingresar tu <b>Nombre</b> (máx 20) y <b>Empresa</b> (máx 20) para guardar tu puntaje.
        </div>

        <label style="display:block; font-size:14px; margin:6px 0 4px;">Nombre *</label>
        <input id="name" type="text" maxlength="20" value="${safe(name)}"
               style="display:block; width:100%; max-width:100%; font-size:16px; padding:10px 12px;
                      border-radius:10px; border:1px solid #e5e7eb; outline:none; box-sizing:border-box;" />

        <label style="display:block; font-size:14px; margin:12px 0 4px;">Empresa *</label>
        <input id="company" type="text" maxlength="20" value="${safe(company)}"
               style="display:block; width:100%; max-width:100%; font-size:16px; padding:10px 12px;
                      border-radius:10px; border:1px solid #e5e7eb; outline:none; box-sizing:border-box;" />

        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px;">
          <button id="save" style="padding:10px 16px; border-radius:10px; border:none; background:#7c3aed; color:#fff; cursor:pointer;">Guardar</button>
        </div>

        <div id="error" style="display:none; color:#e11d48; font-size:13px; margin-top:10px;">
          Revisa los campos: Nombre (máx 20) y Empresa (máx 20).
        </div>
      </div>
    `;

    const usePhaserDom = !!this.game.domContainer && !!this.add.dom;

    return await new Promise((resolve) => {
      const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55)
        .setDepth(1000).setInteractive();

      let modalDiv = null;
      this.modalDom = null;

      const close = (result) => {
        this.tweens.add({ targets: [overlay], alpha: 0, duration: 120, onComplete: () => overlay?.destroy?.() });
        if (usePhaserDom && this.modalDom) {
          this.tweens.add({
            targets: [this.modalDom],
            alpha: 0,
            duration: 120,
            onComplete: () => { this.modalDom?.destroy?.(); resolve(result); }
          });
        } else {
          if (modalDiv) modalDiv.remove();
          resolve(result);
        }
      };

      const saveHandler = (getVals, showErr) => {
        if (saveHandler._busy) return;
        const { n, c } = getVals();
        const ok = n.length >= 3 && n.length <= 20 && c.length >= 2 && c.length <= 20;
        if (!ok) { showErr(true); this.cameras.main.shake(90, 0.003); return; }
        saveHandler._busy = true;
        try { localStorage.setItem("playerName", n); localStorage.setItem("playerCompany", c); } catch (_) {}
        close({ name: n, company: c });
      };

      if (usePhaserDom) {
        this.modalDom = this.add.dom(W / 2, H / 2).createFromHTML(html).setDepth(1001);
        if (this.modalDom.node) this.modalDom.node.style.pointerEvents = "auto";

        const root = this.modalDom.node;
        const $ = (sel) => root.querySelector(sel.startsWith("#") ? sel : ("#" + sel));
        const nameInput = $("name");
        const companyInput = $("company");
        const errorEl = $("error");
        const btnSave = $("save");

        const getVals = () => ({ n: String(nameInput.value || "").trim(), c: String(companyInput.value || "").trim() });
        const showErr = (v) => { errorEl.style.display = v ? "block" : "none"; };

        const onClick = (e) => { e.preventDefault(); saveHandler(getVals, showErr); };
        const onTouch = (e) => { e.preventDefault(); saveHandler(getVals, showErr); };
        btnSave.addEventListener("click", onClick, { passive: false });
        btnSave.addEventListener("touchend", onTouch, { passive: false });

        root.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); saveHandler(getVals, showErr); }
        });
        root.addEventListener("input", () => {
          const { n, c } = getVals();
          showErr(!(n.length >= 3 && n.length <= 20 && c.length >= 2 && c.length <= 20));
        });

        setTimeout(() => nameInput?.focus?.(), 0);
      } else {
        modalDiv = document.createElement("div");
        Object.assign(modalDiv.style, {
          position: "fixed", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: "1001", pointerEvents: "auto"
        });
        modalDiv.innerHTML = html;
        document.body.appendChild(modalDiv);

        const root = modalDiv;
        const $ = (sel) => root.querySelector(sel.startsWith("#") ? sel : ("#" + sel));
        const nameInput = $("name");
        const companyInput = $("company");
        const errorEl = $("error");
        const btnSave = $("save");

        const getVals = () => ({ n: String(nameInput.value || "").trim(), c: String(companyInput.value || "").trim() });
        const showErr = (v) => { errorEl.style.display = v ? "block" : "none"; };

        const onClick = (e) => { e.preventDefault(); saveHandler(getVals, showErr); };
        const onTouch = (e) => { e.preventDefault(); saveHandler(getVals, showErr); };
        btnSave.addEventListener("click", onClick, { passive: false });
        btnSave.addEventListener("touchend", onTouch, { passive: false });

        root.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); saveHandler(getVals, showErr); }
        });
        root.addEventListener("input", () => {
          const { n, c } = getVals();
          showErr(!(n.length >= 3 && n.length <= 25 && c.length >= 2 && c.length <= 30));
        });

        setTimeout(() => nameInput?.focus?.(), 0);
      }
    });
  }

  // Leaderboard en columnas (Arial 30px) + auto-resize del panel
  // Reemplaza TODO el método por este
renderLeaderboard(rows) {
  if (!this.listContainer) return;

  // Limpiar placeholder / render previo
  this.listContainer.removeAll(true);

  const listW = this.panelW - 56; // padding 28 por lado
  const colRank = 0;
  const colName = 40;

  // 🔧 Más ancho para Empresa
  const RIGHT_MARGIN = 46;                 // margen antes de la columna Puntaje
  const colEmpresa = Math.floor(listW * 0.50);  // antes 0.55 → ahora 0.50 (más ancho empresa)
  const colScore = listW;                  // derecha (origin 1)

  const lineH = 40; // para fuente 30px

  // Header
  const hRank = this.add.text(colRank, 0, "#", {
    fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", color: "#374151"
  }).setOrigin(0, 0);
  const hName = this.add.text(colName, 0, "Nombre", {
    fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", color: "#374151"
  }).setOrigin(0, 0);
  const hEmp = this.add.text(colEmpresa, 0, "Empresa", {
    fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", color: "#374151"
  }).setOrigin(0, 0);
  const hScore = this.add.text(colScore, 0, "Puntaje", {
    fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", color: "#374151"
  }).setOrigin(1, 0);
  [hRank, hName, hEmp, hScore].forEach(t => this.listContainer.add(t));

  const data = Array.isArray(rows) ? rows : [];
  data.forEach((r, i) => {
    const y = (i + 1) * lineH;
    const color = (i === 0) ? "#111827" : "#4b5563";

    const txRank = this.add.text(colRank, y, String(i + 1), {
      fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", color
    }).setOrigin(0, 0);

    // Nombre (se reduce un poco su ancho porque Empresa crece)
    const txName = this.add.text(colName, y, (r?.name ?? "Anónimo"), {
      fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", color,
      wordWrap: { width: colEmpresa - colName - 10, useAdvancedWrap: true }
    }).setOrigin(0, 0);

    // Empresa con más ancho y menor margen derecho
    const txEmp = this.add.text(colEmpresa, y, (r?.empresa ?? ""), {
      fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", color,
      wordWrap: { width: Math.max(40, colScore - colEmpresa - RIGHT_MARGIN), useAdvancedWrap: true }
    }).setOrigin(0, 0);

    const txScore = this.add.text(colScore, y, String(r?.score ?? 0), {
      fontFamily: "Arial, Helvetica, sans-serif", fontSize: "30px", color
    }).setOrigin(1, 0);

    [txRank, txName, txEmp, txScore].forEach(t => this.listContainer.add(t));
  });

  // Altura medida del listado (header + filas, o vacío)
  if (data.length === 0) {
    const empty = this.add.text(colName, hName.height + 8, "Aún no hay puntajes en línea.", {
      fontFamily: "Arial, Helvetica, sans-serif", fontSize: "26px", color: "#6b7280"
    }).setOrigin(0, 0);
    this.listContainer.add(empty);
    this.lastListHeight = 40 + 8 + 26;
  } else {
    this.lastListHeight = (data.length + 1) * lineH;
  }

  // Ajustar card al contenido (padding inferior agradable)
  this.resizeCardToContent(28);
}


  // Redibuja el fondo y recoloca botones según altura real del contenido
  resizeCardToContent(extraBottomPad = 28) {
    if (!this.panelBG || !this.panelShadow || !this.listContainer) return;

    const contentBottomLocalY = this.listContainer.y + (this.lastListHeight || 0) + extraBottomPad;
    const newH = Math.max(Math.ceil(contentBottomLocalY - this.panelTopLocal), 360);

    if (Math.abs(newH - this.currentPanelH) < 2) return;
    this.currentPanelH = newH;

    // Redibujar fondo y sombra con el NUEVO alto, manteniendo el top fijo
    this.panelBG.clear();
    this.panelBG.fillStyle(0xffffff, 1);
    this.panelBG.fillRoundedRect(-this.panelW / 2, this.panelTopLocal, this.panelW, this.currentPanelH, this.RADIUS);

    this.panelShadow.clear();
    this.panelShadow.fillStyle(0x000000, 0.14);
    this.panelShadow.fillRoundedRect(-this.panelW / 2, this.panelTopLocal + 8, this.panelW, this.currentPanelH, this.RADIUS);

    // Recolocar los dos botones debajo del panel
    const H = this.scale.height;
    const panelBottomWorldY = this.panel.y + this.panelTopLocal + this.currentPanelH;
    const btnY = Math.min(H * 0.92, panelBottomWorldY + 80);
    this.retryButton?.setY(btnY);
    this.backButton?.setY(btnY);
  }

  createUIButton(cx, cy, label, onClick) {
    const container = this.add.container(cx, cy).setSize(this.BUTTON_W, this.BUTTON_H);

    const sh = this.add.graphics();
    sh.fillStyle(0x000000, 0.12);
    sh.fillRoundedRect(-this.BUTTON_W / 2, -this.BUTTON_H / 2 + 6, this.BUTTON_W, this.BUTTON_H, this.RADIUS);

    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(-this.BUTTON_W / 2, -this.BUTTON_H / 2, this.BUTTON_W, this.BUTTON_H, this.RADIUS);
    g.lineStyle(2, 0xe5e7eb, 1);
    g.strokeRoundedRect(-this.BUTTON_W / 2, -this.BUTTON_H / 2, this.BUTTON_W, this.BUTTON_H, this.RADIUS);

    const txt = this.add.text(0, 0, label, {
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "28px",
      color: "#111827",
    }).setOrigin(0.5);

    const hit = this.add.rectangle(0, 0, this.BUTTON_W, this.BUTTON_H, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true });

    // Hover/press
    hit.on("pointerover", () => this.tweens.add({ targets: g, alpha: 0.92, duration: 80 }));
    hit.on("pointerout",  () => this.tweens.add({ targets: g, alpha: 1.0, duration: 80 }));
    hit.on("pointerdown", () => this.tweens.add({ targets: g, alpha: 0.85, duration: 60 }));
    const restore = () => this.tweens.add({ targets: g, alpha: 1.0, duration: 80 });
    hit.on("pointerup", () => { restore(); onClick && onClick(); });
    hit.on("pointerupoutside", restore);

    container.add(sh);
    container.add(g);
    container.add(txt);
    container.add(hit);
    return container;
  }
}
