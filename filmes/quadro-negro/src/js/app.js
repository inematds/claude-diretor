// Compositor (adaptado do demo chalkboard do lemo-opuscar, MIT): parede, lousas, giz, apagador (vários),
// luz, passe WebGL2 (blur de câmera, vinheta, grade) e legenda palavra a palavra. window.render(t) depende só de t.
import { clamp } from '/core/lib.js';
import { bake, drawStroke } from './chalk.js';
import { installDeposit, grainTile } from './r2d.js';
import { Post } from './post.js';
import { loadSvgFont } from './hand.js';
import { bakeWall, bakeSlate, WALL, PW, BH } from './stage.js';
import { drawFront } from './props.js';

const Q = new URLSearchParams(location.search), W = innerWidth, H = innerHeight;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
await loadSvgFont('fonts/EMSDelight.svg');
await loadSvgFont('fonts/EMSCasualHand.svg', 'child');
installDeposit();

const { build } = await import('./film.js');
const F = build(W, H, window.TIEMPOS);
for (const s of F.S) bake(s, s.o.R || 2);
window.DUR = F.DUR; window.EV = F.EV;

const WALLI = bakeWall();
const FR = bakeSlate(PW, BH, 71, true), FL = bakeSlate(PW, BH, 81, true);
const TILE = grainTile();
const post = new Post(cv, W, H);
const main = new OffscreenCanvas(W, H), mx = main.getContext('2d');
const la = new OffscreenCanvas(W, H), lx = la.getContext('2d');
const PAT = mx.createPattern(TILE, 'repeat');
const KS = W / 1920;
const view = c0 => { const c = { ...c0, s: c0.s * KS }; return { ...c, m: [c.s, 0, 0, c.s, W / 2 - c.cx * c.s, H / 2 - c.cy * c.s], toScreen: (x, y) => [W / 2 + (x - c.cx) * c.s, H / 2 + (y - c.cy) * c.s], W, H }; };

// caminho parcial do apagador k em t
function wipePath(w, t) {
  const P = w.path, n = Math.max(2, Math.round(P.length * clamp((t - w.t0) / (w.t1 - w.t0))));
  const p = new Path2D(); P.slice(0, n).forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y));
  return p;
}

function frame(t) {
  const c = F.camAt(t), v = view(c);
  mx.setTransform(1, 0, 0, 1, 0, 0); mx.globalCompositeOperation = 'source-over'; mx.globalAlpha = 1; mx.filter = 'none';
  mx.fillStyle = '#000'; mx.fillRect(0, 0, W, H);
  mx.setTransform(...v.m); mx.imageSmoothingQuality = 'high';
  mx.drawImage(WALLI.cv, WALL[0], WALL[1], WALL[2], WALL[3]);
  mx.drawImage(FR.cv, PW - FR.m, 0, FR.cv.width, BH);
  mx.drawImage(FL.cv, -FL.m, 0, FL.cv.width, BH);
  // névoa fina que cada apagador deixa
  for (const w of F.wipes) {
    if (t <= w.t0) continue;
    const a = .03 * (1 - clamp((t - w.t1 - 2) / 4) * .5);
    mx.save(); mx.filter = `blur(${Math.max(1, 12 * v.s)}px)`; mx.strokeStyle = `rgba(160,176,168,${a})`; mx.lineCap = 'round'; mx.lineJoin = 'round';
    mx.lineWidth = w.w * .9; mx.stroke(wipePath(w, t)); mx.restore();
  }
  // giz que não está sendo apagado agora
  for (const s of F.S) {
    if (t <= s.t0) continue;
    if (s.wipe != null) { const w = F.wipes[s.wipe]; if (t >= w.t0) continue; }
    drawStroke(mx, s, t);
  }
  // giz sendo apagado: camada própria, recortada pela faixa do apagador
  for (let k = 0; k < F.wipes.length; k++) {
    const w = F.wipes[k]; if (t < w.t0 || t > w.t1 + .06) continue;
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, W, H); lx.globalCompositeOperation = 'source-over'; lx.filter = 'none';
    lx.setTransform(...v.m);
    for (const s of F.S) if (s.wipe === k && t > s.t0) drawStroke(lx, s, t);
    lx.globalCompositeOperation = 'destination-out'; lx.filter = `blur(${Math.max(1, 16 * v.s)}px)`; lx.lineCap = 'round'; lx.lineJoin = 'round';
    lx.lineWidth = w.w; lx.strokeStyle = '#000'; lx.stroke(wipePath(w, t));
    lx.globalCompositeOperation = 'source-over'; lx.filter = 'none';
    mx.save(); mx.setTransform(1, 0, 0, 1, 0, 0); mx.drawImage(la, 0, 0); mx.restore();
  }
  mx.setTransform(...v.m);
  if (v.s / KS > .6) {
    mx.save(); mx.beginPath(); mx.rect(0, 0, 6400, BH); mx.clip();
    PAT.setTransform(new DOMMatrix([.25, 0, 0, .25, 0, 0])); mx.globalCompositeOperation = 'soft-light'; mx.globalAlpha = Math.min(.2, (v.s / KS - .6) * .3);
    mx.fillStyle = PAT; mx.fillRect(0, 0, 6400, BH); mx.restore();
  }
  // luz da janela à esquerda: queda suave (neutra, sem amarelar)
  mx.save(); mx.setTransform(...v.m);
  const lg = mx.createLinearGradient(-1500, 0, 7900, 0); lg.addColorStop(0, 'rgb(252,252,248)'); lg.addColorStop(.45, 'rgb(236,237,234)'); lg.addColorStop(1, 'rgb(200,202,204)');
  mx.globalCompositeOperation = 'multiply'; mx.fillStyle = lg; mx.fillRect(-1500, -1500, 9400, 4900);
  mx.restore();
  // a ponta do giz: alguns grãos claros onde a escrita está agora
  for (const s of F.S) {
    if (t <= s.t0 || t >= s.t1) continue;
    const f = s.prog(t); const p = s.at(f * s.len);
    drawFront(mx, t, v, p[0], p[1], s.color, Math.min(s.w, 9), .5);
  }
  return c;
}

// ───────── legenda: palavra a palavra, discreta, Sora 700; a palavra dita em amarelo INEMA
await document.fonts.load('40px Sora');
const sc = document.getElementById('s'); sc.width = W; sc.height = H; const sx = sc.getContext('2d');
const POR = H > W, FS = POR ? 50 : 40, BY = POR ? Math.round(H * .80) : H - 64;
const NOSUBS = Q.has('nosubs');
function subtitle(t) {
  sx.clearRect(0, 0, W, H); if (NOSUBS) return;
  const q = F.CAPS.find(c => t >= c.t0 && t < c.t1); if (!q) return;
  const a = Math.min(1, (t - q.t0) / .08, (q.t1 - t) / .08);
  sx.font = `700 ${FS}px Sora`; sx.textBaseline = 'alphabetic';
  const sp = sx.measureText(' ').width, ws = q.words.map(w => sx.measureText(w.w).width);
  const tw = ws.reduce((x, y) => x + y, 0) + sp * (ws.length - 1), px = 22, py = 14;
  const x0 = (W - tw) / 2;
  sx.globalAlpha = a * .55; sx.fillStyle = '#0c0c10'; sx.beginPath(); sx.roundRect(x0 - px, BY - FS - py + 6, tw + 2 * px, FS + 2 * py, 12); sx.fill();
  sx.globalAlpha = a; let x = x0;
  q.words.forEach((w, i) => {
    sx.fillStyle = t >= w.t0 && t < (q.words[i + 1]?.t0 ?? q.t1) ? '#FACC15' : '#f2f0ea';
    sx.fillText(w.w, x, BY); x += ws[i] + sp;
  });
  sx.globalAlpha = 1;
}
const shotOf = t => F.camAt(t).shot;
window.render = t => {
  const c = frame(t);
  const tp = t - .5 / 30, pc = shotOf(tp) === c.shot ? F.camAt(tp) : c, k = pc.s / c.s;
  const bl = [k, 0, 0, 0, k, 0, W / 2 - k * W / 2 + pc.s * KS * (c.cx - pc.cx), H / 2 - k * H / 2 + pc.s * KS * (c.cy - pc.cy), 1];
  post.draw(main, bl, t, .3);
  subtitle(t);
};
window.TEXTS = t => {
  const v = view(F.camAt(t)), out = [];
  for (const q of F.TX) {
    if (t < q.t0 || t >= q.t1) continue;
    const [a, b] = v.toScreen(q.box[0], q.box[1]), [d, e] = v.toScreen(q.box[2], q.box[3]);
    out.push({ id: q.id, text: q.text, x0: a, y0: b, x1: d, y1: e });
  }
  return out;
};
window.F = F;
window.render(+(Q.get('t') || 0));
window.READY = true;
