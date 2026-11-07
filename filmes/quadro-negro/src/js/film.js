// "Como funciona um agente de IA" — o filme inteiro como dados: cada traço de giz com seu tempo, os apagadores,
// a câmera, a legenda e os eventos de som. Unidades do mundo: a lousa (x 0…6400, y 0…1700).
// Tudo é cronometrado pela voz do Nei (Chatterbox local + Whisper: window.TIEMPOS, palavra a palavra).
// Duas composições: paisagem (1920x1080) e retrato (1080x1920) — o retrato é recomposto (coluna), não cortado.
import { clamp, lerp, eio } from '/core/lib.js';
import { Stroke, catmull, arc, head } from './chalk.js';
import { writeLatin, latinWidth } from './hand.js';

// pausas extras na voz entre blocos (para o apagador e os giros de câmera), em segundos
export const VO0 = .45;
export const EXTRA = { gancho: 0, loop: .55, memoria: .35, parada: .55, fecho: 1.25 };

export function build(W = 1920, H = 1080, TM) {
  const P = H > W;                                   // retrato
  const S = [], TX = [], EV = [], CAPS = [], wipes = [];
  const T = {};
  // ───────── tempos da voz
  const order = TM.bloques.map(b => b.id);
  const shiftOf = bid => { let s = VO0; for (const id of order) { s += EXTRA[id] || 0; if (id === bid) break; } return s; };
  const FR = {}; for (const f of TM.frases) FR[f.id] = { i: f.inicio + shiftOf(f.bloque), f: f.fin + shiftOf(f.bloque), b: f.bloque };
  const WD = {}; for (const w of TM.palabras) { const b = FR[w.frase].b; (WD[w.frase] ||= []).push({ w: w.texto, t0: w.inicio + shiftOf(b), t1: w.fin + shiftOf(b) }); }
  const wd = (id, k) => WD[id][Math.min(k, WD[id].length - 1)].t0;
  const fi = id => FR[id].i, ff = id => FR[id].f;
  for (const b of TM.bloques) EV.push({ t: +(b.inicio + shiftOf(b.id)).toFixed(3), type: 'vo', src0: b.inicio, src1: b.fin });

  // legenda: blocos de até 3 palavras / 22 caracteres, dentro de cada frase
  for (const id of Object.keys(WD)) {
    const ws = WD[id]; let cur = [];
    const flush = () => { if (!cur.length) return; CAPS.push({ t0: cur[0].t0 - .05, t1: cur[cur.length - 1].t1 + .12, words: cur }); cur = []; };
    for (const w of ws) {
      const len = cur.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length;
      if (cur.length >= 3 || len > 22) flush();
      cur.push(w); if (/[.,:?!]$/.test(w.w)) flush();
    }
    flush();
  }
  CAPS.sort((a, b) => a.t0 - b.t0);
  for (let i = 0; i + 1 < CAPS.length; i++) {        // sem buraco curto entre blocos; sem sobrepor
    const a = CAPS[i], b = CAPS[i + 1];
    if (b.t0 - a.t1 < .35) a.t1 = b.t0; else a.t1 = Math.min(a.t1 + .2, b.t0);
  }

  // ───────── construtores
  let SEEDC = 1;
  const add = (arr, wipe = null) => { arr.forEach(s => { s.wipe = wipe; S.push(s); }); return arr; };
  const box = (id, txt, strokes, t1 = 1e9, pad = 8) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const s of strokes) for (const [x, y] of s.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    TX.push({ id, text: txt, box: [x0 - pad, y0 - pad, x1 + pad, y1 + pad], t0: strokes[0].t0, t1 });
  };
  const fit = (txt, cap, maxW) => Math.min(cap, cap * maxW / Math.max(1, latinWidth(txt, cap)));
  // texto à esquerda (x) ou centrado (cx), linha de base by, altura de maiúscula cap; speed = caps por segundo
  const txtL = (txt, x, by, cap, t, o = {}) => writeLatin(txt, x, by, cap, t, { seed: SEEDC++, lspeed: o.lspeed ?? 70, ...o });
  const txtC = (txt, cx, by, cap, t, o = {}) => txtL(txt, cx - latinWidth(txt, cap) / 2, by, cap, t, o);
  const mk = (pts, o, t0, dur, smooth = false) => {
    const s = new Stroke(smooth ? catmull(pts, 10) : pts, { kind: 'write', taper: .2, taperLen: .2, land: .6, skip: .14, endSpecks: true, specks: .6, w: 8, color: 'white', ...o });
    s.t0 = t0; s.t1 = t0 + dur; return s;
  };
  const arrowS = (pts, t0, dur, o = {}) => {
    const sh = mk(pts, { taper: .05, ...o }, t0, dur, pts.length > 2);
    const q = sh.at(sh.len - 26), e = sh.end || sh.at(sh.len), a = Math.atan2(e[1] - q[1], e[0] - q[0]);
    const hd = head(e[0], e[1], a, o.hs ?? 42, { kind: 'write', w: o.w ?? 8, color: o.color || 'white', taper: .1, land: .6, skip: .14 });
    hd.t0 = t0 + dur + .02; hd.t1 = hd.t0 + .12;
    return [sh, hd];
  };
  const circ = (cx, cy, r, t0, dur, o = {}, a0 = -Math.PI * .6, sweep = Math.PI * 2.08) => {
    const s = arc(cx, cy, r, a0, a0 + sweep, { kind: 'write', w: 8, color: 'white', taper: .15, land: .6, skip: .14, endSpecks: true, ...o });
    s.t0 = t0; s.t1 = t0 + dur; return s;
  };
  // ícones em giz (z = tamanho): lâmpada (pensar), martelo (agir), olho (olhar), relógio, pessoa, visto, xis
  const icon = {
    bulb: (cx, cy, z, t, c = 'white') => {
      const r = z * .32;
      const a = circ(cx, cy - z * .1, r, t, .45, { color: c }, Math.PI * .72, Math.PI * 1.56);
      const b = mk([[cx - r * .55, cy + z * .17], [cx - r * .5, cy + z * .34], [cx + r * .5, cy + z * .34], [cx + r * .55, cy + z * .17]], { color: c }, t + .48, .2);
      const d = mk([[cx - r * .4, cy + z * .44], [cx + r * .4, cy + z * .44]], { color: c }, t + .7, .08);
      const rays = [-2.4, -1.57, -.74].map((ang, i) => mk([[cx + Math.cos(ang) * r * 1.35, cy - z * .1 + Math.sin(ang) * r * 1.35], [cx + Math.cos(ang) * r * 1.75, cy - z * .1 + Math.sin(ang) * r * 1.75]], { color: c, w: 7 }, t + .8 + i * .07, .06));
      return [a, b, d, ...rays];
    },
    hammer: (cx, cy, z, t, c = 'white') => {
      const h = mk([[cx - z * .28, cy + z * .42], [cx + z * .1, cy - z * .12]], { color: c }, t, .2);
      const hx = cx + z * .14, hy = cy - z * .17, L = z * .28, ang = Math.atan2(-.54, .38) + Math.PI / 2;
      const ux = Math.cos(ang) * L, uy = Math.sin(ang) * L, vx = -uy * .45, vy = ux * .45;
      const head1 = mk([[hx - ux, hy - uy], [hx + ux, hy + uy], [hx + ux + vx, hy + uy + vy], [hx - ux * .6 + vx, hy - uy * .6 + vy], [hx - ux, hy - uy]], { color: c, taper: .05 }, t + .24, .3);
      return [h, head1];
    },
    eye: (cx, cy, z, t, c = 'white') => {
      const wv = z * .46, hv = z * .26;
      const top = mk([[cx - wv, cy], [cx - wv * .4, cy - hv], [cx + wv * .4, cy - hv], [cx + wv, cy]], { color: c }, t, .22, true);
      const bot = mk([[cx - wv, cy], [cx - wv * .4, cy + hv], [cx + wv * .4, cy + hv], [cx + wv, cy]], { color: c }, t + .24, .22, true);
      const pu = circ(cx, cy, z * .13, t + .5, .22, { color: c, w: 9 });
      return [top, bot, pu];
    },
    clock: (cx, cy, z, t, c = 'white') => [circ(cx, cy, z * .36, t, .35, { color: c }), mk([[cx, cy], [cx, cy - z * .24]], { color: c }, t + .38, .08), mk([[cx, cy], [cx + z * .17, cy + z * .06]], { color: c }, t + .48, .08)],
    person: (cx, cy, z, t, c = 'white') => [circ(cx, cy - z * .2, z * .15, t, .25, { color: c }), mk([[cx - z * .32, cy + z * .38], [cx - z * .25, cy + z * .1], [cx, cy + z * .02], [cx + z * .25, cy + z * .1], [cx + z * .32, cy + z * .38]], { color: c }, t + .28, .3, true)],
    check: (cx, cy, z, t, c = 'white') => [mk([[cx - z * .3, cy], [cx - z * .08, cy + z * .25], [cx + z * .34, cy - z * .3]], { color: c, w: 10, taper: .25 }, t, .25)],
    cross: (cx, cy, z, t, c = 'white') => [mk([[cx - z * .22, cy - z * .22], [cx + z * .22, cy + z * .22]], { color: c, w: 9 }, t, .1), mk([[cx + z * .22, cy - z * .22], [cx - z * .22, cy + z * .22]], { color: c, w: 9 }, t + .14, .1)],
  };
  // apagador: um passe em serpentina que cobre a caixa; os traços marcados com esse índice somem com ele
  const wipeOver = (x0, y0, x1, y1, t0, dur, w = 300) => {
    const rows = Math.max(1, Math.ceil((y1 - y0) / (w * .62))), pts = [];
    for (let r = 0; r <= rows; r++) { const y = lerp(y0, y1, r / rows); const L = r % 2 === 0; pts.push(L ? [x0 - w * .3, y] : [x1 + w * .3, y]); pts.push(L ? [x1 + w * .3, y + w * .12] : [x0 - w * .3, y + w * .12]); }
    wipes.push({ t0, t1: t0 + dur, w, path: catmull(pts, 8) }); EV.push({ t: +t0.toFixed(3), type: 'wipe', d: dur });
    return wipes.length - 1;
  };

  const C1 = 1600, C2 = 4800;                        // centros das duas regiões da lousa
  const lead = .25;                                  // o giz começa um pouco antes da palavra dita

  // ═════════ CENA 1 · gancho — o título já está no quadro no quadro 0
  T.end = 0;
  const tl1 = P ? ['Como funciona um', 64, 210] : ['Como funciona um', 70, 300];
  const tl2 = P ? ['AGENTE DE IA', 118, 380] : ['AGENTE DE IA', 140, 490];
  const ti1 = add(txtC(tl1[0], C1, tl1[2], fit(tl1[0], tl1[1], 880), -9, { lspeed: 60 }));
  const ti2 = add(txtC(tl2[0], C1, tl2[2], fit(tl2[0], tl2[1], 880), ti1.end + .05, { lspeed: 50, lw: .075 }));
  const tW = latinWidth(tl2[0], fit(tl2[0], tl2[1], 880));
  const tiU = mk([[C1 - tW / 2, tl2[2] + 34], [C1 + tW / 2, tl2[2] + 28]], { w: 7 }, ti2.end + .05, .2);
  add([tiU]); box('title', 'Como funciona um AGENTE DE IA', [...ti1, ...ti2]);
  const W1 = wipes.length;                           // índice do 1º apagador (definido abaixo)
  const g = [];                                      // traços da cena 1 que o apagador leva
  {
    let t = fi('a1') - lead;
    if (!P) {
      const yA = 790, yB = 1130, xL = 520;
      g.push(...txtL('CHAT', xL, yA, 84, t, { lspeed: 55 }));
      t = wd('a1', 1) - lead; const p1 = txtL('pergunta', 900, yA, 62, t); g.push(...p1);
      g.push(...arrowS([[p1.x + 30, yA - 26], [p1.x + 200, yA - 30]], p1.end + .02, .18));
      const r1 = txtL('resposta', p1.x + 250, yA, 62, p1.end + .3); g.push(...r1);
      g.push(...txtL('1 vez', r1.x + 80, yA, 50, wd('a1', 2) - .1, { color: 'white' }));
      t = fi('a2') - lead;
      const ag = txtL('AGENTE', xL, yB, 84, t, { lspeed: 55 }); g.push(...ag);
      const p2 = txtL('pergunta', 900, yB, 62, ag.end + .05, { lspeed: 90 }); g.push(...p2);
      g.push(...arrowS([[p2.x + 30, yB - 26], [p2.x + 200, yB - 30]], p2.end + .02, .18));
      const lx = p2.x + 360, ly = yB - 30;
      const lp = arc(lx, ly, 105, -Math.PI * .5, Math.PI * 1.32, { kind: 'write', w: 10, color: 'inema', taper: .05, land: .6, skip: .12 });
      lp.t0 = wd('a2', 5) - lead; lp.t1 = lp.t0 + .55; g.push(lp);
      const e = lp.at(lp.len), q = lp.at(lp.len - 30), hd = head(e[0], e[1], Math.atan2(e[1] - q[1], e[0] - q[0]), 40, { kind: 'write', w: 10, color: 'inema', taper: .1 });
      hd.t0 = lp.t1 + .02; hd.t1 = hd.t0 + .12; g.push(hd);
      g.push(...txtL('até terminar', lx + 150, yB, 50, wd('a2', 6) - lead, { lspeed: 80 }));
      box('chat', 'CHAT pergunta resposta 1 vez', g.slice(0, 1), 1e9);
    } else {
      const yA = 600, yB = 1000;
      g.push(...txtC('CHAT', C1, yA, 86, t, { lspeed: 55 }));
      t = wd('a1', 1) - lead;
      const cap = 54, wP = latinWidth('pergunta', cap), wR = latinWidth('resposta', cap), gap = 150, tot = wP + gap + wR, x0 = C1 - tot / 2;
      const p1 = txtL('pergunta', x0, yA + 120, cap, t); g.push(...p1);
      g.push(...arrowS([[x0 + wP + 22, yA + 98], [x0 + wP + gap - 28, yA + 95]], p1.end + .02, .16, { hs: 34 }));
      g.push(...txtL('resposta', x0 + wP + gap, yA + 120, cap, p1.end + .25));
      g.push(...txtC('1 vez', C1, yA + 215, 46, wd('a1', 2) - .1));
      t = fi('a2') - lead;
      const ag = txtC('AGENTE', C1, yB, 86, t, { lspeed: 55 }); g.push(...ag);
      const x1 = C1 - (wP + 140 + 200) / 2;
      const p2 = txtL('pergunta', x1, yB + 130, cap, ag.end + .05, { lspeed: 90 }); g.push(...p2);
      g.push(...arrowS([[x1 + wP + 20, yB + 108], [x1 + wP + 120, yB + 106]], p2.end + .02, .14, { hs: 32 }));
      const lx = x1 + wP + 230, ly = yB + 106;
      const lp = arc(lx, ly, 82, -Math.PI * .5, Math.PI * 1.32, { kind: 'write', w: 10, color: 'inema', taper: .05, land: .6, skip: .12 });
      lp.t0 = wd('a2', 5) - lead; lp.t1 = lp.t0 + .5; g.push(lp);
      const e = lp.at(lp.len), q = lp.at(lp.len - 30), hd = head(e[0], e[1], Math.atan2(e[1] - q[1], e[0] - q[0]), 34, { kind: 'write', w: 10, color: 'inema', taper: .1 });
      hd.t0 = lp.t1 + .02; hd.t1 = hd.t0 + .12; g.push(hd);
      g.push(...txtC('até terminar', C1, yB + 245, 48, wd('a2', 6) - lead, { lspeed: 80 }));
    }
  }
  T.w1 = ff('a2') + .3;
  const w1 = P ? wipeOver(C1 - 470, 480, C1 + 470, 1300, T.w1, .8, 280) : wipeOver(420, 650, 2650, 1210, T.w1, .85, 300);
  add(g, w1);
  box('cena1', 'CHAT pergunta resposta / AGENTE loop', g, T.w1 + .2);

  // ═════════ CENA 2 · o loop: pensar → agir → olhar → de novo (acento amarelo = o loop)
  const loopS = [];
  T.l1 = fi('l1');
  let tPen = wd('l1', 2) - lead - .35, tAg = wd('l2', 1) - lead - .3, tOl = wd('l3', 1) - lead - .3;
  tPen = Math.max(tPen, T.w1 + .7);
  let NODES;
  if (!P) {
    const y = 960, X = [820, 1600, 2380], iy = 735, isz = 190;
    NODES = X.map(x => [x, y]);
    loopS.push(...icon.bulb(X[0], iy, isz, tPen));
    const wPen = txtC('PENSAR', X[0], y, 78, tPen + .5, { lspeed: 60 }); loopS.push(...wPen);
    loopS.push(...arrowS([[X[0] + 200, y - 30], [X[1] - 170, y - 32]], tAg - .25, .3, { color: 'inema', w: 10 }));
    loopS.push(...icon.hammer(X[1], iy, isz, tAg));
    const wAg = txtC('AGIR', X[1], y, 78, tAg + .45, { lspeed: 60 }); loopS.push(...wAg);
    loopS.push(...txtC('web · arquivo · código', X[1], y + 95, 44, wd('l2', 6) - lead - .5, { lspeed: 110 }));
    loopS.push(...arrowS([[X[1] + 170, y - 32], [X[2] - 200, y - 30]], tOl - .25, .3, { color: 'inema', w: 10 }));
    loopS.push(...icon.eye(X[2], iy, isz, tOl));
    const wOl = txtC('OLHAR', X[2], y, 78, tOl + .5, { lspeed: 60 }); loopS.push(...wOl);
    T.ret = wd('l4', 4) - lead - .2;
    loopS.push(...arrowS([[X[2], y + 40], [X[2] + 40, y + 200], [X[1] + 300, y + 285], [X[1] - 300, y + 285], [X[0] - 40, y + 200], [X[0], y + 45]], T.ret, .9, { color: 'inema', w: 10, hs: 44 }));
    loopS.push(...txtC('de novo', X[1], y + 270, 50, T.ret + .55, { lspeed: 80 }));
    box('loop', 'PENSAR AGIR OLHAR', [...wPen, ...wAg, ...wOl]);
  } else {
    const xI = 1250, xW = 1370, Y = [600, 880, 1160], isz = 150;
    NODES = Y.map(y => [xI, y]);
    loopS.push(...icon.bulb(xI, Y[0] - 30, isz, tPen));
    const wPen = txtL('PENSAR', xW, Y[0], 80, tPen + .5, { lspeed: 60 }); loopS.push(...wPen);
    loopS.push(...arrowS([[xI, Y[0] + 70], [xI, Y[1] - 120]], tAg - .25, .22, { color: 'inema', w: 10, hs: 34 }));
    loopS.push(...icon.hammer(xI, Y[1] - 30, isz, tAg));
    const wAg = txtL('AGIR', xW, Y[1], 80, tAg + .45, { lspeed: 60 }); loopS.push(...wAg);
    loopS.push(...txtL('web · arquivo', xW, Y[1] + 72, 40, wd('l2', 6) - lead - .5, { lspeed: 110 }));
    loopS.push(...txtL('código', xW, Y[1] + 132, 40, wd('l2', 11) - lead, { lspeed: 110 }));
    loopS.push(...arrowS([[xI, Y[1] + 120], [xI, Y[2] - 120]], tOl - .25, .22, { color: 'inema', w: 10, hs: 34 }));
    loopS.push(...icon.eye(xI, Y[2] - 30, isz, tOl));
    const wOl = txtL('OLHAR', xW, Y[2], 80, tOl + .5, { lspeed: 60 }); loopS.push(...wOl);
    T.ret = wd('l4', 4) - lead - .2;
    loopS.push(...arrowS([[xW + latinWidth('OLHAR', 80) + 40, Y[2] - 30], [2000, Y[2] - 140], [2015, Y[1]], [2000, Y[0] + 60], [xW + latinWidth('PENSAR', 80) + 50, Y[0] - 30]], T.ret, .9, { color: 'inema', w: 10, hs: 38 }));
    box('loop', 'PENSAR AGIR OLHAR', [...wPen, ...wAg, ...wOl]);
  }
  // contagem de voltas (risquinhos) enquanto a voz diz "cada volta fica anotada"
  const tally = [];
  {
    const x0 = P ? 1830 : 2330, y0 = P ? 1290 : 1250, hgt = P ? 70 : 80;
    for (let i = 0; i < 3; i++) tally.push(mk([[x0 + i * 30, y0], [x0 + i * 30 + 4, y0 - hgt]], { color: 'inema', w: 8 }, ff('l4') + .05 + i * .22, .1));
  }
  add(loopS, null); add(tally, null);

  // ═════════ CENA 3 · contexto = memória de trabalho (região 2, à direita)
  T.whip1 = ff('l4') + .3;
  const ctxS = [];
  {
    const m1 = fi('m1');
    if (!P) {
      ctxS.push(...txtC('CONTEXTO', C2, 360, 110, wd('m1', 5) - lead - .35, { lspeed: 55 }));
      ctxS.push(...txtC('a memória de trabalho', C2, 470, 52, wd('m1', 7) - lead - .2, { lspeed: 95 }));
      const bx0 = 3990, bx1 = 5610, by0 = 560, by1 = 1290;
      ctxS.push(mk([[bx0, by0], [bx1, by0 + 4], [bx1 - 4, by1], [bx0 + 4, by1 - 4], [bx0, by0]], { w: 7, taper: .02 }, m1 - .15, .9));
      const L = [['volta 1 ·  buscou na web', 700], ['volta 2 ·  erro no arquivo', 900], ['volta 3 ·  corrigiu', 1100]];
      const l1 = txtL(L[0][0], bx0 + 90, L[0][1], 58, wd('m1', 1) - .1, { lspeed: 95 }); ctxS.push(...l1);
      const l2 = txtL(L[1][0], bx0 + 90, L[1][1], 58, Math.max(l1.end + .1, wd('m1', 9) - .4), { lspeed: 95 }); ctxS.push(...l2);
      ctxS.push(...icon.cross(l2.x + 70, L[1][1] - 22, 90, l2.end + .08));
      const tE = wd('m2', 7) - lead - .1, ex = bx0 + 90 + latinWidth('volta 2 ·  ', 58);
      ctxS.push(mk([[ex - 20, L[1][1] - 70], [ex + 120, L[1][1] - 92], [ex + 270, L[1][1] - 60], [ex + 255, L[1][1] + 26], [ex + 100, L[1][1] + 34], [ex - 30, L[1][1] + 6], [ex - 10, L[1][1] - 72]], { w: 7, color: 'inema' }, tE - .35, .5, true));
      const l3 = txtL(L[2][0], bx0 + 90, L[2][1], 58, wd('m2', 3) - lead - .2, { lspeed: 95 }); ctxS.push(...l3);
      ctxS.push(...icon.check(l3.x + 80, L[2][1] - 24, 110, l3.end + .08, 'inema'));
      ctxS.push(...txtL('não repete o erro', bx0 + 90, 1230, 46, tE + .3, { lspeed: 110 }));
      box('ctx', 'CONTEXTO a memória de trabalho', ctxS.slice(0, 8), 1e9);
    } else {
      ctxS.push(...txtC('CONTEXTO', C2, 270, fit('CONTEXTO', 104, 860), wd('m1', 5) - lead - .35, { lspeed: 55 }));
      ctxS.push(...txtC('a memória de trabalho', C2, 370, fit('a memória de trabalho', 48, 860), wd('m1', 7) - lead - .2, { lspeed: 95 }));
      const bx0 = 4365, bx1 = 5235, by0 = 450, by1 = 1290;
      ctxS.push(mk([[bx0, by0], [bx1, by0 + 4], [bx1 - 4, by1], [bx0 + 4, by1 - 4], [bx0, by0]], { w: 7, taper: .02 }, m1 - .15, .9));
      const xs = bx0 + 50, cap = 46;
      const l1a = txtL('volta 1', xs, 560, cap, wd('m1', 1) - .1, { lspeed: 95 }); ctxS.push(...l1a);
      const l1b = txtL('buscou na web', xs + 40, 630, cap, l1a.end + .05, { lspeed: 110 }); ctxS.push(...l1b);
      const l2a = txtL('volta 2', xs, 760, cap, Math.max(l1b.end + .1, wd('m1', 9) - .4), { lspeed: 95 }); ctxS.push(...l2a);
      const l2b = txtL('erro no arquivo', xs + 40, 830, cap, l2a.end + .05, { lspeed: 110 }); ctxS.push(...l2b);
      ctxS.push(...icon.cross(l2b.x + 50, 812, 70, l2b.end + .06));
      const tE = wd('m2', 7) - lead - .1, ex = xs + 40;
      ctxS.push(mk([[ex - 20, 785], [ex + 60, 770], [ex + 125, 795], [ex + 118, 850], [ex + 40, 858], [ex - 25, 835], [ex - 14, 783]], { w: 7, color: 'inema' }, tE - .35, .45, true));
      const l3a = txtL('volta 3', xs, 960, cap, wd('m2', 3) - lead - .2, { lspeed: 95 }); ctxS.push(...l3a);
      const l3b = txtL('corrigiu', xs + 40, 1030, cap, l3a.end + .05, { lspeed: 110 }); ctxS.push(...l3b);
      ctxS.push(...icon.check(l3b.x + 60, 1010, 90, l3b.end + .06, 'inema'));
      ctxS.push(...txtL('não repete o erro', xs, 1190, 42, tE + .3, { lspeed: 110 }));
    }
  }
  T.w2 = Math.max(ff('m2') + .35, ...ctxS.map(s => s.t1)) + .15;
  const w2 = P ? wipeOver(C2 - 480, 180, C2 + 480, 1320, T.w2, .9, 300) : wipeOver(3900, 250, 5700, 1320, T.w2, .95, 320);
  add(ctxS, w2);

  // ═════════ CENA 4 · quando ele para
  const stopS = [];
  {
    const tq = fi('p1') - lead;
    if (!P) {
      stopS.push(...txtC('QUANDO PARA?', C2, 400, 110, Math.max(tq, T.w2 + .85), { lspeed: 55 }));
      const xi = 4130, xt = 4290, R = [[690, 'objetivo cumprido', 3, 'check'], [910, 'limite: tempo · passos', 8, 'clock'], [1130, 'sua aprovação', 15, 'person']];
      R.forEach(([y, s, k, ic], i) => {
        const t = wd('p2', k) - lead - .35;
        stopS.push(...icon[ic](xi, y - 24, 130, t, i === 0 ? 'inema' : 'white'));
        stopS.push(...txtL(s, xt, y, 64, t + .3, { lspeed: i === 1 ? 110 : 85 }));
      });
    } else {
      const t0 = Math.max(tq, T.w2 + .85);
      const q1 = txtC('QUANDO', C2, 270, 104, t0, { lspeed: 60 }); stopS.push(...q1);
      stopS.push(...txtC('PARA?', C2, 410, 104, q1.end + .03, { lspeed: 60 }));
      const xi = 4410, xt = 4530, cap = 52, R = [[630, ['objetivo', 'cumprido'], 3, 'check'], [900, ['limite: tempo', '· passos'], 8, 'clock'], [1170, ['sua', 'aprovação'], 15, 'person']];
      R.forEach(([y, ls, k, ic], i) => {
        const t = wd('p2', k) - lead - .35;
        stopS.push(...icon[ic](xi, y + 10, 120, t, i === 0 ? 'inema' : 'white'));
        const a = txtL(ls[0], xt, y, cap, t + .3, { lspeed: 100 }); stopS.push(...a);
        stopS.push(...txtL(ls[1], xt, y + 70, cap, a.end + .04, { lspeed: 100 }));
      });
    }
  }
  add(stopS, null);
  T.stopEnd = Math.max(...stopS.map(s => s.t1));

  // ═════════ CENA 5 · plano geral da parede, apagador no quadro 1, fecho escrito no mesmo lugar
  T.wide0 = Math.max(ff('p2') + .45, T.stopEnd + .3); T.wide1 = T.wide0 + 1.0;
  const finS = [];
  T.w3 = T.wide1 - .1;
  const keep = [...ti1, ...ti2, tiU, ...loopS, ...tally];
  const w3 = P ? wipeOver(C1 - 480, 110, C1 + 480, 1320, T.w3, 1.0, 300) : wipeOver(380, 170, 2820, 1380, T.w3, 1.05, 330);
  keep.forEach(s => s.wipe = w3);
  {
    const tf = Math.max(fi('f1') - lead, T.w3 + 1.05);
    if (!P) {
      const a = txtC('Chat responde.', C1, 420, 86, tf, { lspeed: 75 }); finS.push(...a);
      const cap = 112, w1_ = latinWidth('Agente ', cap), w2_ = latinWidth('executa.', cap), x0 = C1 - (w1_ + w2_) / 2;
      const b = txtL('Agente ', x0, 640, cap, wd('f1', 2) - lead, { lspeed: 60 }); finS.push(...b);
      finS.push(...txtL('executa.', x0 + w1_, 640, cap, b.end + .02, { lspeed: 60, color: 'inema' }));
      const c = txtC('Tudo no', C1, 900, 72, wd('f2', 0) - lead, { lspeed: 70 }); finS.push(...c);
      const d = txtC('INEMA.CLUB', C1, 1130, 170, wd('f2', 2) - lead - .1, { lspeed: 48, color: 'inema', lw: .08 }); finS.push(...d);
      const wd2 = latinWidth('INEMA.CLUB', 170);
      finS.push(mk([[C1 - wd2 / 2, 1180], [C1 + wd2 / 2, 1172]], { w: 9, color: 'inema' }, d.end + .05, .3));
      box('fim', 'INEMA.CLUB', d);
    } else {
      const a = txtC('Chat', C1, 330, 90, tf, { lspeed: 70 }); finS.push(...a);
      const a2 = txtC('responde.', C1, 450, 90, a.end + .02, { lspeed: 75 }); finS.push(...a2);
      const b = txtC('Agente', C1, 640, 104, wd('f1', 2) - lead, { lspeed: 60 }); finS.push(...b);
      finS.push(...txtC('executa.', C1, 780, 104, b.end + .02, { lspeed: 60, color: 'inema' }));
      finS.push(...txtC('Tudo no', C1, 980, 70, wd('f2', 0) - lead, { lspeed: 70 }));
      const cap = fit('INEMA.CLUB', 130, 860);
      const d = txtC('INEMA.CLUB', C1, 1160, cap, wd('f2', 2) - lead - .1, { lspeed: 48, color: 'inema', lw: .08 }); finS.push(...d);
      const wd2 = latinWidth('INEMA.CLUB', cap);
      finS.push(mk([[C1 - wd2 / 2, 1205], [C1 + wd2 / 2, 1198]], { w: 9, color: 'inema' }, d.end + .05, .3));
      box('fim', 'INEMA.CLUB', d);
    }
  }
  add(finS, null);
  T.fin = Math.max(...finS.map(s => s.t1));
  T.DUR = +(Math.max(T.fin + 2.6, ff('f2') + 2.8)).toFixed(2);

  // ═════════ câmera: chaves [t, cx, cy, s]; cada plano corta para as suas chaves
  const M1 = P ? { cx: C1, cy: 860, s: 1.9 } : { cx: C1, cy: 820, s: .86 };   // plano médio região 1
  const M2 = P ? { cx: C2, cy: 860, s: 1.9 } : { cx: C2, cy: 820, s: .86 };   // plano médio região 2
  const K = (t, m, dx = 0, dy = 0, k = 1) => [t, m.cx + dx, m.cy + dy, m.s * k];
  const shots = [];
  if (!P) {
    shots.push({ t0: 0, keys: [K(0, M1, 0, -120, 1.16), K(.9, M1, 0, -120, 1.16), K(fi('a1') + .6, M1, -150, 30, 1.0), K(fi('a2') + 1.2, M1, -60, 60, 1.04), K(T.w1 + .9, M1, 0, 40, 1.0)] });
    shots.push({ t0: T.w1 + .9, keys: [K(T.w1 + .9, M1, -620, 60, 1.2), K(tAg - .1, M1, -600, 60, 1.2), K(tAg + .6, M1, 0, 60, 1.2), K(tOl - .1, M1, 0, 60, 1.2), K(tOl + .6, M1, 600, 60, 1.2), K(T.ret - .3, M1, 600, 60, 1.2), K(T.ret + .6, M1, 0, 30, 1.0), K(T.whip1, M1, 0, 30, 1.0)] });
    shots.push({ t0: T.whip1, keys: [K(T.whip1, M1, 900, 30, 1.0), K(T.whip1 + .45, M2, 0, 0, 1.0), K(fi('m2'), M2, -60, 40, 1.08), K(T.w2 + .2, M2, 0, 0, 1.0)] });
    shots.push({ t0: T.w2 + .2, keys: [K(T.w2 + .2, M2, 0, 0, 1.0), K(T.wide0, M2, 0, 0, 1.0)] });
    shots.push({ t0: T.wide0, keys: [K(T.wide0, M2, 0, 0, 1.0), K(T.wide0 + .7, { cx: 3200, cy: 860, s: .275 }, 0, 0, 1), K(T.wide1 - .05, { cx: 3200, cy: 860, s: .275 }, 0, 0, 1), K(T.wide1 + .9, M1, 0, 0, 1.0), K(T.DUR, M1, 0, 0, 1.03)] });
  } else {
    shots.push({ t0: 0, keys: [K(0, M1, 0, -200, 1.15), K(.9, M1, 0, -200, 1.15), K(fi('a1') + .5, M1, 0, -40, 1.0), K(T.w1 + .9, M1, 0, 0, 1.0)] });
    shots.push({ t0: T.w1 + .9, keys: [K(T.w1 + .9, M1, 0, -170, 1.12), K(tAg - .1, M1, 0, -170, 1.12), K(tAg + .6, M1, 0, 30, 1.12), K(tOl - .1, M1, 0, 30, 1.12), K(tOl + .6, M1, 0, 150, 1.12), K(T.ret - .3, M1, 0, 150, 1.12), K(T.ret + .6, M1, 0, 0, 1.0), K(T.whip1, M1, 0, 0, 1.0)] });
    shots.push({ t0: T.whip1, keys: [K(T.whip1, M1, 600, 0, 1.0), K(T.whip1 + .45, M2, 0, 0, 1.0), K(T.w2 + .2, M2, 0, 0, 1.03)] });
    shots.push({ t0: T.w2 + .2, keys: [K(T.w2 + .2, M2, 0, 0, 1.0), K(T.wide0, M2, 0, 0, 1.0)] });
    shots.push({ t0: T.wide0, keys: [K(T.wide0, M2, 0, 0, 1.0), K(T.wide0 + .7, { cx: 3200, cy: 860, s: .56 }, 0, 0, 1), K(T.wide1 - .05, { cx: 3200, cy: 860, s: .56 }, 0, 0, 1), K(T.wide1 + .9, M1, 0, 0, 1.0), K(T.DUR, M1, 0, 0, 1.03)] });
  }
  EV.push({ t: +T.whip1.toFixed(3), type: 'whip' });
  const camAt = tt => {
    let i = 0; while (i + 1 < shots.length && tt >= shots[i + 1].t0) i++;
    const Ks = shots[i].keys;
    let k = 0; while (k + 1 < Ks.length - 1 && tt > Ks[k + 1][0]) k++;
    const a = Ks[k], b = Ks[Math.min(Ks.length - 1, k + 1)], u = b[0] > a[0] ? eio(clamp((tt - a[0]) / (b[0] - a[0]))) : 1;
    return { cx: lerp(a[1], b[1], u), cy: lerp(a[2], b[2], u), s: lerp(a[3], b[3], u), shot: i };
  };
  // eventos de giz para o som: um por traço visível
  for (const st of S) {
    if (st.t1 <= 0 || st.t0 >= T.DUR) continue;
    const c = camAt((st.t0 + st.t1) / 2), p = st.at(st.len / 2), sx = (p[0] - c.cx) * c.s / 1920 * 2;
    if (Math.abs(sx) > 1.3) continue;
    EV.push({ t: +st.t0.toFixed(3), type: 'chalk', d: +(st.t1 - st.t0).toFixed(3), len: Math.round(st.len * c.s), color: st.color, pan: +clamp(sx * .5, -.6, .6).toFixed(2) });
  }
  EV.sort((a, b) => a.t - b.t);
  return { S, TX, EV, CAPS, T, wipes, camAt, shots, DUR: T.DUR };
}
