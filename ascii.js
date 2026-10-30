// Filtro ASCII de la code_cam: vídeo (o fondo demo) -> rejilla de caracteres en un canvas.
// Script clásico (sin módulos) para que funcione también abriendo el HTML desde file://.
(function () {
  const FONT = '"DejaVu Sans Mono", Menlo, Consolas, "Courier New", monospace';

  window.AsciiCam = function (canvas, video) {
    const ctx = canvas.getContext("2d");
    const small = document.createElement("canvas");
    const sctx = small.getContext("2d", { willReadFrequently: true });

    const cam = {
      cellPx: 11,               // alto de celda en px CSS
      ramp: " .:-=+*#%@",       // de oscuro a claro
      mirror: false,
      demo: false,
      fg: "#39ff6a",
      bg: "#000",
      // overlay(grid, t) -> [{r, c, ch, color}]: caracteres que tapan la cámara
      overlay: null,
      // última rejilla dibujada, en px CSS: {cols, rows, cw, ch, offX, offY}
      grid: null,
    };

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      return dpr;
    }

    // Fondo sintético si no hay cámara: una habitación vaga con suelo
    function drawDemo(t, w, h) {
      const g = sctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#222"); g.addColorStop(0.45, "#888"); g.addColorStop(0.5, "#444"); g.addColorStop(1, "#bbb");
      sctx.fillStyle = g; sctx.fillRect(0, 0, w, h);
      const l = sctx.createRadialGradient(
        w * (0.5 + 0.25 * Math.sin(t / 2100)), h * 0.25, 1, w * 0.5, h * 0.25, w * 0.7);
      l.addColorStop(0, "rgba(255,255,255,.9)"); l.addColorStop(1, "rgba(255,255,255,0)");
      sctx.fillStyle = l; sctx.fillRect(0, 0, w, h);
      sctx.fillStyle = "#333";
      sctx.fillRect(w * 0.08, h * 0.18, w * 0.22, h * 0.3);   // una puerta
      sctx.fillRect(w * 0.62, h * 0.32, w * 0.3, h * 0.16);   // un mueble
    }

    // Vídeo recortado tipo "cover" en el canvas pequeño
    function drawCover(w, h) {
      const vw = video && video.videoWidth, vh = video && video.videoHeight;
      if (!vw) return false;
      const scale = Math.max(w / vw, h / vh);
      const dw = vw * scale, dh = vh * scale;
      sctx.save();
      if (cam.mirror) { sctx.translate(w, 0); sctx.scale(-1, 1); }
      sctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
      sctx.restore();
      return true;
    }

    cam.render = function (t) {
      const dpr = fit();
      const ch = cam.cellPx * dpr;
      ctx.font = `${ch}px ${FONT}`;
      const cw = ctx.measureText("M").width;
      const cols = Math.max(8, Math.floor(canvas.width / cw));
      const rows = Math.max(8, Math.floor(canvas.height / ch));
      if (small.width !== cols || small.height !== rows) { small.width = cols; small.height = rows; }

      if (cam.demo || !drawCover(cols, rows)) drawDemo(t, cols, rows);
      const px = sctx.getImageData(0, 0, cols, rows).data;

      // Niveles automáticos: estira el contraste entre los percentiles 2 y 98
      const n = cols * rows;
      const lum = new Float32Array(n);
      const hist = new Uint32Array(256);
      for (let i = 0, j = 0; j < n; i += 4, j++) {
        const y = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
        lum[j] = y; hist[y]++;
      }
      let lo = 0, hi = 255, acc = 0;
      for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.02) { lo = v; break; } }
      acc = 0;
      for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.02) { hi = v; break; } }
      const range = Math.max(24, hi - lo);

      const offX = (canvas.width - cols * cw) / 2;
      const offY = (canvas.height - rows * ch) / 2;
      cam.grid = { cols, rows, cw: cw / dpr, ch: ch / dpr, offX: offX / dpr, offY: offY / dpr };

      const cells = cam.overlay ? cam.overlay(cam.grid, t) : [];
      const mask = new Uint8Array(n);
      for (const o of cells) if (o.r >= 0 && o.r < rows && o.c >= 0 && o.c < cols) mask[o.r * cols + o.c] = 1;

      const ramp = cam.ramp, rl = ramp.length - 1;
      ctx.fillStyle = cam.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textBaseline = "top";
      ctx.fillStyle = cam.fg;
      for (let r = 0; r < rows; r++) {
        let line = "";
        for (let c = 0; c < cols; c++) {
          const k = r * cols + c;
          if (mask[k]) { line += " "; continue; }
          let v = (lum[k] - lo) / range;
          v = v < 0 ? 0 : v > 1 ? 1 : v;
          line += ramp[Math.round(v * rl)];
        }
        ctx.fillText(line, offX, offY + r * ch);
      }
      for (const o of cells) {
        if (o.r < 0 || o.r >= rows || o.c < 0 || o.c >= cols) continue;
        ctx.fillStyle = o.color || "#fff";
        ctx.fillText(o.ch, offX + o.c * cw, offY + o.r * ch);
      }
    };

    return cam;
  };
})();
