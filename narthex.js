// Motor del móvil de Narthex: versiones de NarthexOS, niveles de reparación, efectos y sonido.
// Lo usan la intro (index.html) y el laboratorio (lab.html). Script clásico, sin módulos.
(function () {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  const TIERS = ["roto", "compatible", "refurbished", "original", "mejorado"];
  const DESC = {
    screen: ["Grietas, colores corridos, bandas y píxeles muertos.",
             "Panel «compatible»: sin grietas, pero tinte raro, bandas y luz que se escapa por las esquinas.",
             "Refurbished: algo amarillenta, un píxel muerto.",
             "Original de Hefesto: limpia.",
             "Mejorada: más contraste y color que de fábrica."],
    batt: ["El porcentaje miente, avisos constantes y apagones.",
           "Se vacía deprisa y avisa a menudo.",
           "Normal, con algún salto raro.",
           "Normal.",
           "Batería de Hades: no baja nunca."],
    spk: ["Distorsión, ruido, cortes y pitidos sueltos.",
          "Suena a lata.",
          "Algo apagado.",
          "Limpio.",
          "Con graves de más. Hefesto no lo aprobaría."],
  };

  // ---------- paletas y pixel art ----------
  // v0.3 son los 4 verdes de una pantalla LCD antigua; v1, una paleta de 16 colores
  const PAL = {
    roto: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
    fuego: ["#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
            "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa"],
  };
  const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const PAL_RGB = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.map(rgb)]));
  function nearest(pal, r, g, b) {
    let best = pal[0], bd = Infinity;
    for (const c of pal) { const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < bd) { bd = d; best = c; } }
    return best;
  }
  // Lleva cada píxel al color de paleta más cercano: bordes duros, sin suavizado
  function quantize(ctx, w, h, pal) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) { d[i + 3] = 0; continue; }
      const c = nearest(pal, d[i], d[i + 1], d[i + 2]);
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  function pixelIcon(os, glyph, color, state) {
    const N = os === "roto" ? 16 : 32;
    const c = document.createElement("canvas");
    c.width = c.height = N;
    const x = c.getContext("2d");
    const font = (px) => `bold ${px}px "DejaVu Sans Mono", monospace`;
    x.textAlign = "center"; x.textBaseline = "middle";
    const size = (a, b, c3) => [0, a, b, c3][Math.min(3, glyph.length)];
    if (os === "roto") {
      const [d0, d1, d2, d3] = PAL.roto;
      const dim = state === "error";
      x.fillStyle = d0; x.fillRect(0, 0, 16, 16);
      x.fillStyle = dim ? d1 : state === "live" ? d3 : d2; x.fillRect(1, 1, 14, 14);
      x.fillStyle = dim ? d2 : d3; x.fillRect(1, 1, 14, 1); x.fillRect(1, 1, 1, 14);
      x.fillStyle = dim ? d0 : d1; x.fillRect(1, 14, 14, 1); x.fillRect(14, 1, 1, 14);
      x.fillStyle = d0; x.font = font(size(11, 8, 6)); x.fillText(glyph, 8, 8.5);
      quantize(x, N, N, PAL_RGB.roto);
    } else {
      x.fillStyle = "#000"; x.beginPath(); x.roundRect(1, 2, 30, 30, 6); x.fill();       // sombra
      x.fillStyle = color; x.beginPath(); x.roundRect(0, 0, 30, 30, 6); x.fill();
      x.fillStyle = "rgba(255,241,232,.35)"; x.fillRect(4, 2, 22, 3);                    // brillo
      x.font = font(size(18, 14, 10));
      x.fillStyle = "#000"; x.fillText(glyph, 16, 17);
      x.fillStyle = "#fff1e8"; x.fillText(glyph, 15, 16);
      quantize(x, N, N, PAL_RGB.fuego);
    }
    return c;
  }

  // Fondo de escritorio pintado a baja resolución con tramado, y ampliado sin suavizar
  function drawWall(c, os) {
    if (os === "eter" || !c.clientWidth) return;
    const W = os === "roto" ? 90 : 180;
    const H = Math.round(W * c.clientHeight / c.clientWidth);
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    const img = x.createImageData(W, H), d = img.data;
    const ramp = os === "roto"
      ? [0, 1, 1, 2].map(i => PAL_RGB.roto[i])
      : ["#000000", "#1d2b53", "#7e2553", "#ab5236", "#ff004d", "#ffa300", "#ffec27"].map(rgb);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const u = i / W, v = j / H;
      let t;
      if (os === "roto") {
        t = 0.55 * Math.exp(-((u - 0.3) ** 2 + (v - 0.08) ** 2) * 6) + 0.12 * (1 - v);   // reflejo arriba
      } else {
        const flick = 0.12 * Math.sin(u * 23 + v * 9) + 0.08 * Math.sin(u * 51 - v * 17);
        t = Math.max(0, (v - 0.45) / 0.55) ** 1.6 + flick * v;                              // brasas desde abajo
      }
      const k = Math.max(0, Math.min(ramp.length - 1, Math.floor(t * (ramp.length - 1) + BAYER[j % 4][i % 4] / 16)));
      const col = ramp[k], o = (j * W + i) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    x.fillStyle = os === "roto" ? PAL.roto[2] : PAL.fuego[9];
    for (let n = 0; n < (os === "roto" ? 14 : 26); n++) x.fillRect((Math.random() * W) | 0, (Math.random() * H * 0.6) | 0, 1, 1);
  }

  // ---------- audio: todo sintetizado, sin archivos ----------
  let ac = null, input, shaper, lp, hp, bass, master, noiseBuf;
  let volume = 0.4, muted = false, speakerTier = 0;
  const SPK = [
    { dist: 400, hp: 700, lp: 2600, bass: 0, hiss: 0.09, cuts: true },
    { dist: 120, hp: 450, lp: 4200, bass: 0, hiss: 0.04, cuts: false },
    { dist: 25, hp: 180, lp: 8000, bass: 0, hiss: 0.012, cuts: false },
    { dist: 0, hp: 40, lp: 18000, bass: 0, hiss: 0, cuts: false },
    { dist: 0, hp: 30, lp: 20000, bass: 9, hiss: 0, cuts: false },
  ];
  function distCurve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = k ? ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x)) : x; }
    return c;
  }
  function audio() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      input = ac.createGain();
      shaper = ac.createWaveShaper();
      hp = ac.createBiquadFilter(); hp.type = "highpass";
      lp = ac.createBiquadFilter(); lp.type = "lowpass";
      bass = ac.createBiquadFilter(); bass.type = "lowshelf"; bass.frequency.value = 180;
      master = ac.createGain();
      input.connect(shaper).connect(hp).connect(lp).connect(bass).connect(master).connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      applySpeaker(); applyVolume();
    }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  // El altavoz cambia la cadena por la que pasa todo el sonido
  function applySpeaker() {
    if (!ac) return;
    const s = SPK[speakerTier];
    shaper.curve = distCurve(s.dist);
    hp.frequency.value = s.hp; lp.frequency.value = s.lp; bass.gain.value = s.bass;
  }
  function applyVolume() { if (ac) master.gain.value = muted ? 0 : volume; }

  const env = (g, t0, a, peak, d, t1) => {
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.setValueAtTime(peak, Math.max(t0 + a, t1 - d));
    g.gain.linearRampToValueAtTime(0, t1);
  };
  function osc(type, f, t0, t1, peak = 0.3) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    env(g, t0, 0.01, peak, 0.03, t1);
    o.connect(g).connect(input); o.start(t0); o.stop(t1 + 0.05);
    return o;
  }
  function noise(t0, t1, peak, filterType, freq, q = 1) {
    const n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    n.buffer = noiseBuf; n.loop = true;
    f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    env(g, t0, 0.005, peak, 0.01, t1);
    n.connect(f).connect(g).connect(input); n.start(t0, rand(0, 1.5)); n.stop(t1 + 0.05);
  }
  // Defectos del altavoz que acompañan a cualquier sonido: siseo y cortes
  function speakerFlaws(t0, dur) {
    const s = SPK[speakerTier];
    if (s.hiss) noise(t0, t0 + dur, s.hiss, "highpass", 3000);
    if (s.cuts) {
      for (let i = 0; i < 2; i++) {
        const tc = t0 + rand(0.1, Math.max(0.15, dur - 0.1));
        input.gain.setValueAtTime(1, tc); input.gain.setValueAtTime(0.05, tc + 0.01);
        input.gain.setValueAtTime(1, tc + 0.08);
      }
    }
  }

  const SOUNDS = {
    pitido(t) { osc("sine", 1000, t, t + 0.25, 0.35); return 0.25; },
    ok(t) { osc("square", 660, t, t + 0.09, 0.15); osc("square", 990, t + 0.1, t + 0.22, 0.15); return 0.22; },
    error(t) { osc("square", 220, t, t + 0.12, 0.18); osc("square", 160, t + 0.13, t + 0.3, 0.18); return 0.3; },
    alarma(t) {
      for (let i = 0; i < 8; i++) osc("square", i % 2 ? 660 : 880, t + i * 0.25, t + i * 0.25 + 0.22, 0.18);
      return 2;
    },
    sirena(t) {
      const o = osc("sawtooth", 700, t, t + 3, 0.16);
      for (let i = 0; i < 5; i++) {
        o.frequency.linearRampToValueAtTime(1300, t + i * 0.6 + 0.3);
        o.frequency.linearRampToValueAtTime(700, t + i * 0.6 + 0.6);
      }
      return 3;
    },
    pedo(t) {
      const dur = rand(0.5, 0.9);
      const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(rand(95, 120), t);
      o.frequency.exponentialRampToValueAtTime(rand(45, 60), t + dur);
      const lfo = ac.createOscillator(), lg = ac.createGain();   // el temblor
      lfo.frequency.value = rand(22, 34); lg.gain.value = 25;
      lfo.connect(lg).connect(o.frequency);
      f.type = "lowpass"; f.frequency.value = 420; f.Q.value = 4;
      env(g, t, 0.02, 0.5, 0.12, t + dur);
      o.connect(f).connect(g).connect(input);
      o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
      noise(t, t + dur, 0.12, "bandpass", 180, 2);
      return dur;
    },
    risa(t) {
      // «ja ja ja»: pulsos de voz con dos formantes de la vocal «a», cada vez más graves
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t0 = t + i * 0.19, t1 = t0 + 0.12;
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(330 - i * 18, t0);
        o.frequency.linearRampToValueAtTime(290 - i * 18, t1);
        env(g, t0, 0.015, 0.35, 0.05, t1);
        for (const [fq, q] of [[800, 6], [1250, 8]]) {
          const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = fq; f.Q.value = q;
          o.connect(f).connect(g);
        }
        g.connect(input);
        o.start(t0); o.stop(t1 + 0.02);
        noise(t0, t0 + 0.04, 0.08, "bandpass", 2500, 1);   // la «j»
      }
      return n * 0.19;
    },
    aplauso(t) {
      const dur = 2.6;
      for (let i = 0; i < 260; i++) {
        const tc = t + dur * (1 - Math.sqrt(1 - Math.random()));   // más palmas al principio
        noise(tc, tc + rand(0.008, 0.02), rand(0.1, 0.35), "bandpass", rand(900, 2200), 1.2);
      }
      return dur;
    },
  };
  function play(name) {
    audio();
    const t = ac.currentTime + 0.03;
    const dur = SOUNDS[name](t);
    speakerFlaws(t, dur);
    return dur;
  }
  function beepGlitch() {
    if (!ac) return;
    const t = ac.currentTime + 0.02;
    osc("square", rand(1800, 3200), t, t + rand(0.04, 0.12), 0.12);   // pitido suelto
  }
  // El navegador solo deja sonar después de un toque: se arranca el audio en el primero
  addEventListener("pointerdown", () => audio(), { once: true });

  // ---------- el móvil ----------
  const CRACKS = `<svg class="ph-cracks" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">
    <g fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.1">
      <polyline vector-effect="non-scaling-stroke" points="72,58 60,40 55,22 48,0"/>
      <polyline vector-effect="non-scaling-stroke" points="72,58 88,44 100,40"/>
      <polyline vector-effect="non-scaling-stroke" points="72,58 81,80 86,104 100,118"/>
      <polyline vector-effect="non-scaling-stroke" points="72,58 58,70 40,76 22,92 0,98"/>
      <polyline vector-effect="non-scaling-stroke" points="72,58 66,92 70,130 62,160 66,200"/>
      <polyline vector-effect="non-scaling-stroke" points="72,58 92,62 100,70"/>
      <polyline vector-effect="non-scaling-stroke" points="60,40 46,46 30,40"/>
      <polyline vector-effect="non-scaling-stroke" points="81,80 70,86 66,92"/>
      <polyline vector-effect="non-scaling-stroke" points="40,76 44,90 38,108"/>
      <polygon vector-effect="non-scaling-stroke" points="70,54 75,55 74,61 69,60" fill="rgba(255,255,255,.25)"/>
    </g></svg>`;

  // Aberración cromática: separa rojo y azul en horizontal
  function ensureFilter() {
    if (document.getElementById("ph-chroma")) return;
    const d = document.createElement("div");
    d.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <filter id="ph-chroma" color-interpolation-filters="sRGB" x="-5%" y="0" width="110%" height="100%">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
        <feOffset in="r" id="ph-chroma-r" dx="0" dy="0" result="r2"/>
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
        <feOffset in="b" id="ph-chroma-b" dx="0" dy="0" result="b2"/>
        <feBlend in="r2" in2="g" mode="screen" result="rg"/>
        <feBlend in="rg" in2="b2" mode="screen"/>
      </filter></svg>`;
    document.body.prepend(d.firstElementChild);
  }

  const WARNINGS = [
    "<b>Batería defectuosa.</b> Quedan 3%. O 80%. No lo sabemos.",
    "<b>Batería:</b> temperatura 61 °C. No la uses de almohada.",
    "<b>Batería hinchada.</b> Es la única cosa de este teléfono que ha crecido.",
    "<b>Aviso:</b> esta batería no es original. Nada de esto es original.",
  ];

  // root: el aparato. opts.desk: dónde va el escritorio (fondo, barra de estado, iconos);
  // si no se da, se crea uno a pantalla completa que también recibe los filtros de pantalla.
  window.Phone = function (root, opts = {}) {
    ensureFilter();
    root.classList.add("phone-screen");
    root.dataset.os = opts.os || "roto";
    let desk = opts.desk;
    if (!desk) {
      desk = document.createElement("div");
      desk.className = "ph-content";
      root.prepend(desk);
    }
    desk.classList.add("ph-desk");
    desk.insertAdjacentHTML("afterbegin", `<canvas class="ph-wall"></canvas>
      <div class="ph-home">
        <div class="status"><span class="ph-clock"></span><span class="ph-mid"></span>
          <span><button class="ph-snd" aria-label="sonido">♪</button> <span class="ph-batt"></span></span></div>
        <div class="win"><div class="win-title"><span class="win-btn">-</span><span class="ph-title">NarthexOS</span><span class="win-btn">v</span></div>
          <div class="ph-icons"></div></div>
        <div class="ph-extra"></div>
      </div>`);
    root.insertAdjacentHTML("beforeend", `<div class="ph-layer ph-lcd"></div><div class="ph-layer ph-bleed"></div>
      <div class="ph-layer ph-bands"></div><div class="ph-layer ph-dead"></div>${CRACKS}
      <div class="ph-layer ph-alarm"></div>
      <div class="ph-ad" hidden><button class="ph-ad-close" aria-label="cerrar anuncio">cerrar</button>
        <h2>CONSERVAS MOMIA</h2><p>Duran más que tú.</p><p style="font-size:16px">Una marca de Heliópolis</p></div>
      <div class="ph-toast" hidden></div><div class="ph-layer ph-blackout"></div>`);
    const q = (s) => root.querySelector(s);

    const dead = Array.from({ length: 6 }, (_, i) => {
      const p = document.createElement("i");
      p.style.left = rand(5, 95) + "%"; p.style.top = rand(5, 95) + "%";
      p.style.background = i % 3 === 0 ? "#fff" : i % 3 === 1 ? "#0f0" : "#000";
      q(".ph-dead").appendChild(p);
      return p;
    });

    const api = {
      root, desk, extra: q(".ph-extra"),
      tier: { screen: 0, batt: 0, spk: 0 },
      battery: 63,
      auto: true,          // fallos automáticos según el estado
      icons: [],
    };

    api.on = (yes = true) => { root.classList.toggle("ph-on", yes); applyScreen(); };

    function applyScreen() {
      const t = api.tier.screen, on = root.classList.contains("ph-on");
      const shift = on ? [3, 2, 1, 0, 0][t] : 0;
      document.getElementById("ph-chroma-r").setAttribute("dx", shift);
      document.getElementById("ph-chroma-b").setAttribute("dx", -shift);
      const color = on ? ["hue-rotate(28deg) saturate(1.7) contrast(1.15)",
        "hue-rotate(-14deg) saturate(1.35) contrast(.95) brightness(1.05)",
        "sepia(.22) saturate(.85)", "", "contrast(1.08) saturate(1.2)"][t] : "";
      const f = ((shift ? "url(#ph-chroma) " : "") + color).trim();
      root.style.setProperty("--ph-filter", f || "none");
      q(".ph-cracks").style.opacity = t === 0 ? 1 : 0;
      q(".ph-bands").style.opacity = [0.9, 0.5, 0, 0, 0][t];
      q(".ph-bleed").style.opacity = [0.6, 1, 0.5, 0, 0][t];
      const nDead = [6, 3, 1, 0, 0][t];
      dead.forEach((p, i) => { p.hidden = i >= nDead; });
    }

    api.setTier = (key, v) => {
      api.tier[key] = v;
      if (key === "screen") applyScreen();
      if (key === "spk") { speakerTier = v; applySpeaker(); }
      if (key === "batt") renderBattery();
    };

    api.setOS = (os) => {
      root.dataset.os = os;
      api.renderIcons(api.icons);
      drawWall(q(".ph-wall"), os);
    };

    // icons: [{name, glyph, color, state: "error" | "live" | "ok", badge, onClick}]
    api.renderIcons = (icons) => {
      api.icons = icons;
      const box = q(".ph-icons"), os = root.dataset.os;
      box.innerHTML = "";
      for (const ic of icons) {
        const b = document.createElement("button");
        b.className = "ph-icon " + (ic.state || "ok") + (ic.badge === "nuevo" ? " new" : "");
        const tile = document.createElement("div");
        tile.className = "tile";
        if (os === "eter") tile.textContent = ic.glyph; else tile.appendChild(pixelIcon(os, ic.glyph, ic.color, ic.state));
        const label = document.createElement("span");
        label.textContent = ic.name;
        b.append(tile, label);
        const badge = ic.badge || (ic.state === "error" ? "!" : "");
        if (badge) { const s = document.createElement("span"); s.className = "badge"; s.textContent = badge; b.appendChild(s); }
        if (ic.onClick) b.onclick = () => ic.onClick(ic);
        box.appendChild(b);
      }
    };

    api.setStatus = (mid) => { q(".ph-mid").textContent = mid; };
    api.setTitle = (t) => { q(".ph-title").textContent = t; };

    // ---------- avisos y efectos ----------
    let toastTimer = 0;
    api.toast = (html, ms = 3000, good = false) => {
      const t = q(".ph-toast");
      t.innerHTML = html; t.hidden = false; t.classList.toggle("good", good);
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { t.hidden = true; }, ms);
    };
    api.warn = () => api.toast(WARNINGS[(Math.random() * WARNINGS.length) | 0]);

    let lastGlitch = 0;
    api.glitch = async () => {      // un único salto de imagen, no un parpadeo repetido
      const now = performance.now();
      if (now - lastGlitch < 1500) return;
      lastGlitch = now;
      desk.style.transform = "translate(9px, -3px) skewX(-5deg)";
      await sleep(160);
      desk.style.transform = "";
    };
    api.blackout = async () => {
      const bo = q(".ph-blackout");
      bo.textContent = "";
      bo.classList.add("on");
      await sleep(1400);
      bo.textContent = "NarthexOS";
      await sleep(1300);
      bo.textContent = "";
      bo.classList.remove("on");
    };
    api.alarm = async (dur = 3) => {
      q(".ph-alarm").classList.add("on");
      await sleep(dur * 1000);
      q(".ph-alarm").classList.remove("on");
    };
    api.play = (name) => {
      const dur = play(name);
      if (name === "alarma") api.alarm(dur);
      if (name === "sirena") q(".ph-ad").hidden = false;
      return dur;
    };
    q(".ph-ad-close").onclick = () => { q(".ph-ad").hidden = true; };

    api.setVolume = (v) => { volume = v; applyVolume(); };
    api.setMute = (m) => { muted = m; applyVolume(); q(".ph-snd").textContent = m ? "×" : "♪"; };
    q(".ph-snd").onclick = (e) => { e.stopPropagation(); api.setMute(!muted); };

    function renderBattery() {
      const b = q(".ph-batt");
      if (api.tier.batt === 4) { b.textContent = "∞"; b.classList.remove("low"); return; }
      const shown = api.tier.batt === 0 ? [3, 1, 47, 12, 88, 0][(Math.random() * 6) | 0] : Math.round(api.battery);
      b.textContent = shown + "%";
      b.classList.toggle("low", shown <= 15);
    }
    function renderClock() {
      const d = new Date();
      q(".ph-clock").textContent = api.tier.batt === 0 ? "??:??" :
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    // Fallos automáticos según el estado de cada pieza
    setInterval(() => {
      const b = api.tier.batt;
      api.battery -= [0, 0.35, 0.05, 0.02, 0][b];
      if (api.battery < 1) api.battery = 100;
      if (b === 2 && Math.random() < 0.03) api.battery = Math.max(1, api.battery - rand(5, 15));
      renderBattery(); renderClock();
      if (!api.auto || !root.classList.contains("ph-on") || document.hidden) return;
      const r = Math.random;
      if (r() < [0.1, 0.04, 0.012, 0, 0][api.tier.screen]) api.glitch();
      if (r() < [0.04, 0.02, 0, 0, 0][b]) api.warn();
      if (r() < [0.012, 0, 0, 0, 0][b]) api.blackout();
      if (r() < [0.06, 0.02, 0, 0, 0][api.tier.spk]) beepGlitch();
    }, 1000);

    addEventListener("resize", () => drawWall(q(".ph-wall"), root.dataset.os));
    api.redrawWall = () => drawWall(q(".ph-wall"), root.dataset.os);
    applyScreen(); renderBattery(); renderClock();
    api.setMute(false);
    requestAnimationFrame(api.redrawWall);
    return api;
  };

  window.Phone.TIERS = TIERS;
  window.Phone.DESC = DESC;
})();
