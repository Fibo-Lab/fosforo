// Pasillo virtual para jugar sin cámara: se mira girando el móvil (giroscopio) y se avanza caminando
// (acelerómetro) o con un botón. ascii.js lo dibuja con el mismo filtro que la cámara.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = (a) => ((a + 540) % 360) - 180;

  window.Corridor = function () {
    const canvas = document.createElement("canvas");
    const x = canvas.getContext("2d");
    const s = { z: 0, target: 0, heading: null, zero: null, drag: 0 };
    const LIMIT = 40;   // grados: más allá te sales del pasillo

    addEventListener("deviceorientation", (e) => {
      if (e.alpha == null) return;
      s.heading = e.alpha;
      if (s.zero == null) s.zero = e.alpha;
    });

    const api = { canvas };
    // Ángulo de giro: positivo hacia la izquierda (el alpha de la brújula crece al girar a la izquierda)
    api.yaw = () => (s.heading == null ? 0 : wrap(s.heading - s.zero)) + s.drag;
    api.outside = () => Math.abs(api.yaw()) > LIMIT;
    api.reset = () => { s.zero = s.heading; s.drag = 0; };
    api.look = (deg) => { s.drag = clamp(s.drag + deg, -70, 70); };
    // Un paso solo cuenta si miras por el pasillo: así no te estampas contra la pared
    api.step = () => { if (api.outside()) return false; s.target += 0.8; return true; };

    // Dibuja el pasillo en escala de grises; el filtro ASCII hace el resto
    api.draw = (W, H) => {
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      s.z += (s.target - s.z) * 0.08;
      const yaw = clamp(api.yaw(), -70, 70);
      const vx = W / 2 + (yaw / 45) * W * 0.7;     // girar a la izquierda lleva el fondo a la derecha
      const vy = H * 0.42;
      x.fillStyle = "#000"; x.fillRect(0, 0, W, H);

      const N = 14, frac = s.z % 1, base = Math.floor(s.z);
      const frame = (d) => {
        const k = 1 / Math.max(d, 0.25);
        const cx = vx + (W / 2 - vx) * Math.min(k, 1.6);
        const cy = vy + (H / 2 - vy) * Math.min(k, 1.6);
        const hw = W * 0.62 * k, hh = H * 0.55 * k;
        return { l: cx - hw, r: cx + hw, t: cy - hh, b: cy + hh, k };
      };
      const quad = (pts, g) => {
        x.fillStyle = `rgb(${g},${g},${g})`;
        x.beginPath(); x.moveTo(...pts[0]); for (const p of pts.slice(1)) x.lineTo(...p); x.closePath(); x.fill();
      };
      for (let i = N; i >= 1; i--) {
        const far = frame(i + 1 - frac), near = frame(i - frac);
        const fog = clamp(1.8 / (i - frac + 0.6), 0, 1);
        const odd = (base + i) % 2 === 0;
        const g = (v) => Math.round(v * fog);
        quad([[near.l, near.b], [near.r, near.b], [far.r, far.b], [far.l, far.b]], g(odd ? 170 : 130));   // suelo
        quad([[near.l, near.t], [near.r, near.t], [far.r, far.t], [far.l, far.t]], g(45));                // techo
        quad([[near.l, near.t], [far.l, far.t], [far.l, far.b], [near.l, near.b]], g(odd ? 95 : 70));      // pared izquierda
        quad([[near.r, near.t], [far.r, far.t], [far.r, far.b], [near.r, near.b]], g(odd ? 95 : 70));      // pared derecha
        if ((base + i) % 3 === 0) {                                                                         // una lámpara cada tres tramos
          const lw = (far.r - far.l) * 0.12, cx = (far.l + far.r) / 2;
          quad([[cx - lw, far.t], [cx + lw, far.t], [cx + lw * 1.3, near.t], [cx - lw * 1.3, near.t]], g(255));
        }
        // marco de cada tramo, para que se note el avance
        x.strokeStyle = `rgb(${g(220)},${g(220)},${g(220)})`;
        x.lineWidth = Math.max(1, near.k * 1.5);
        x.strokeRect(near.l, near.t, near.r - near.l, near.b - near.t);
      }
      const end = frame(N + 1 - frac);   // fondo del pasillo
      quad([[end.l, end.t], [end.r, end.t], [end.r, end.b], [end.l, end.b]], 15);
    };

    return api;
  };
})();
