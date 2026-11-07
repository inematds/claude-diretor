// inema.js — "A luz do Lumi" (reel 9:16, 17.6 s). Storyboard in STORYBOARD.md.
// A dark room, an unlit bulb and a chained-up book (0–4.6) → the idea: Lumi lights up and the lock pops open (4.6–8.6)
// → courses, guides and videos fly out of the book, a graduation cap lands (8.6–13.4) → the INEMA.CLUB sign, goodbye,
// bulb-shaped iris on the light (13.4–17.6). Voice timings come from assets/tiempos.js (window.TIEMPOS, film time).
(() => {
  const FONT = px => `${px}px "MontBlack", sans-serif`;
  const CREAM = '#F5F0E6', NIGHT = '#16151D', NIGHT2 = '#1E1C27', DEEP = '#13121A';
  const BOOK = '#34456A', BOOKDK = '#24304C', PAGES = '#EFE6D2', LOCK = '#9C8A4E', CHAIN = '#7D7A86';
  const WORDS = (window.TIEMPOS && window.TIEMPOS.palabras) || [];
  const wt = (txt, d) => { const w = WORDS.find(p => p.texto.toLowerCase().startsWith(txt.toLowerCase())); return w ? w.inicio : d; };
  const TW = { cursos: wt('Cursos', 9.2), guias: wt('guias', 9.86), videos: wt('vídeos', 10.84), tudo: wt('Tudo', 11.74), aberto: wt('aberto', 12.4),
               ta: wt('Tá', 14.0), tudo2: 14.19, no: wt('no', 14.5), club: wt('INEMA', 14.69) };

  // ---- captions (reel rule: Montserrat Black, dark outline, keyword in #FACC15), screen space ----
  const cap = (txt, y, size, col, age, o = {}) => letter(txt, W / 2, y, size, col, { font: FONT(size), stroke: '#0c0c10', screen: true, pop: age * 5, ...o });

  // ---- props ----
  // where a Lumi's hand is in world space, from the same pose lumi() draws with (so held things touch)
  function handPos(x, y, u, o, side) {
    const a = side < 0 ? (o.aL ?? -.4) : (o.aR ?? -.4), sq = o.sq || 0, fl = o.flip ? -1 : 1;
    let px = side * 2.0 * u, py = -3.0 * u; const ang = side < 0 ? a : -a;
    px += Math.cos(ang) * side * 3.55 * u; py += Math.sin(ang) * side * 3.55 * u;
    px *= fl * (o.sx ?? 1) * (1 + sq * .6); py *= (o.sy ?? 1) * (1 - sq);
    const r = o.rot || 0, c = Math.cos(r), s = Math.sin(r);
    return [x + (o.dx || 0) * u + px * c - py * s, y + (o.dy || 0) * u + px * s + py * c];
  }
  function closedBook(cx, base, w, h, col = BOOK, dk = BOOKDK, key = 'book') {
    boilSeed(key);
    paint(rrPts(cx - w / 2 + w * .06, base - h + 10, w, h - 6, 14, 2), { wash: PAGES, ink: PAL.ink, sw: 1 });      // page block peeking right
    for (let i = 0; i < 5; i++) inkLine([[cx + w / 2 + w * .02, base - h + 40 + i * (h - 70) / 4], [cx + w / 2 + w * .05, base - h + 44 + i * (h - 70) / 4]], .5, mixCol(PAGES, PAL.ink, .4), 'inkfine', 0);
    paint(rrPts(cx - w / 2, base - h, w, h, 16, 3), { wash: col, ink: PAL.ink, sw: 1.3 });
    paint(rrPts(cx - w / 2, base - h, w * .14, h, 12, 2), { wash: dk, ink: null });                               // spine
    paint(ellPts(cx - w * .12, base - h * .78, w * .28, h * .1, 14, 3, -.3), { fill: mixCol(col, CREAM, .3), fillOp: 90, bleed: .2, tex: .6, ink: null });
  }
  function padlock(x, y, s, open = 0, key = 'lock') {
    boilSeed(key);
    const lift = open * s * .55;
    push(); translate(x + s * .35, y - s * .35 - lift); rotate(-open * .5); translate(-s * .35, 0);
    inkLine([[-s * .35, 0], [-s * .38, -s * .55], [0, -s * .8], [s * .38, -s * .55], [s * .35, 0]], 3.2 * s / 60, PAL.ink, 'ink', .6);
    inkLine([[-s * .35, 0], [-s * .38, -s * .55], [0, -s * .8], [s * .38, -s * .55], [s * .35, 0]], 2.2 * s / 60, CHAIN, 'ink', .6);
    pop();
    paint(rrPts(x - s * .5, y - s * .35, s, s * .8, s * .14, 1), { wash: LOCK, ink: PAL.ink, sw: .9 * s / 60 });
    paint(ellPts(x, y - s * .02, s * .1, s * .12, 10), { wash: PAL.ink, ink: null });
    paint([[x - s * .04, y + s * .05], [x + s * .04, y + s * .05], [x + s * .06, y + s * .26], [x - s * .06, y + s * .26]], { wash: PAL.ink, ink: null });
  }
  function chain(p0, p1, key = 'chain', n = 9) {
    boilSeed(key);
    const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    for (let i = 0; i <= n; i++) {
      const k = i / n, x = lerp(p0[0], p1[0], k), y = lerp(p0[1], p1[1], k) + Math.sin(k * Math.PI) * 6;
      paint(ellPts(x, y, 15, i % 2 ? 6 : 10, 12, 0, ang + (i % 2 ? 0 : 0)), { wash: null, ink: CHAIN, sw: 1.1 });
    }
  }
  // a book flying like a bird: two covers flapping around the spine
  function flyBook(x, y, s, flap, col, key) {
    boilSeed(key);
    const a = .35 + .55 * (.5 + .5 * Math.sin(flap));
    for (const sd of [-1, 1]) {
      const tip = [x + sd * s * Math.cos(a), y - s * Math.sin(a) * .9];
      paint([[x, y - s * .05], [tip[0], tip[1]], [tip[0] + sd * s * .05, tip[1] + s * .75], [x, y + s * .7]], { wash: PAGES, ink: PAL.ink, sw: .8 });
      paint([[x, y - s * .05], [tip[0] + sd * s * .08, tip[1] - s * .06], [tip[0] + sd * s * .12, tip[1] + s * .7], [x, y + s * .78]], { wash: col, washOp: 255, ink: null });
      paint([[x, y - s * .05], [tip[0] + sd * s * .08, tip[1] - s * .06], [tip[0] + sd * s * .12, tip[1] + s * .7], [x, y + s * .78]], { ink: PAL.ink, sw: .9 });
    }
    inkLine([[x, y - s * .05], [x, y + s * .75]], 1, PAL.ink, 'ink', 0);
  }
  // a folded guide: three panels with a dotted route and a pin
  function guide(x, y, s, open, key) {
    boilSeed(key);
    const pw = s * .55 * lerp(.35, 1, open), ph = s * 1.1;
    for (let i = 0; i < 3; i++) {
      const x0 = x + (i - 1.5) * pw, sk = (i % 2 ? 1 : -1) * s * .08 * open;
      paint([[x0, y - ph / 2 + sk], [x0 + pw, y - ph / 2 - sk], [x0 + pw, y + ph / 2 - sk], [x0, y + ph / 2 + sk]], { wash: i % 2 ? '#E9DFC6' : '#F6EEDB', ink: PAL.ink, sw: .8 });
    }
    if (open > .3) {
      const P = [[x - pw * 1.2, y + ph * .25], [x - pw * .5, y - ph * .1], [x + pw * .2, y + ph * .15], [x + pw * .9, y - ph * .22]];
      for (let i = 0; i < 9; i++) { const q = through(P)[Math.floor(i * (through(P).length - 1) / 8)]; paint(ellPts(q[0], q[1], s * .035, s * .035, 8), { wash: '#C2410C', ink: null }); }
      paint(heartPts(x + pw * .9, y - ph * .3, s * .14), { wash: '#C2410C', ink: PAL.ink, sw: .6 });
    }
  }
  // a little screen with a play button
  function screenProp(x, y, s, play, key) {
    boilSeed(key);
    paint(rrPts(x - s * .75, y - s * .5, s * 1.5, s, s * .14, 2), { wash: '#24232D', ink: PAL.ink, sw: 1.1 });
    paint(rrPts(x - s * .64, y - s * .4, s * 1.28, s * .8, s * .08, 2), { wash: '#3A3947', ink: null });
    const k = 1 + .12 * play;
    paint([[x - s * .16 * k, y - s * .24 * k], [x + s * .26 * k, y], [x - s * .16 * k, y + s * .24 * k]], { wash: LUMI.y, ink: PAL.ink, sw: .7 });
    paint(rrPts(x - s * .2, y + s * .5, s * .4, s * .1, s * .04), { wash: '#24232D', ink: PAL.ink, sw: .7 });
  }
  function openBook(cx, base, w, key) {
    boilSeed(key);
    const h = w * .22;
    paint([[cx, base - h * .2], [cx - w / 2, base - h * .55], [cx - w / 2 - 10, base + h * .1], [cx, base + h * .35]], { wash: PAGES, ink: PAL.ink, sw: 1 });
    paint([[cx, base - h * .2], [cx + w / 2, base - h * .55], [cx + w / 2 + 10, base + h * .1], [cx, base + h * .35]], { wash: '#F7F0DF', ink: PAL.ink, sw: 1 });
    for (let i = 1; i < 4; i++) for (const sd of [-1, 1]) inkLine([[cx + sd * w * .08, base - h * .2 + i * h * .12], [cx + sd * w * .4, base - h * .5 + i * h * .12]], .45, mixCol(PAGES, PAL.ink, .45), 'inkfine', 0);
    paint([[cx - w / 2 - 10, base + h * .1], [cx, base + h * .35], [cx + w / 2 + 10, base + h * .1], [cx + w / 2 + 14, base + h * .2], [cx, base + h * .48], [cx - w / 2 - 14, base + h * .2]], { wash: BOOK, ink: PAL.ink, sw: 1 });
  }
  // the bulb outline as an iris hole, centred on the glass centre (gx, gy), glass radius r
  function bulbPts(gx, gy, r) {
    const P = []; for (let i = 0; i <= 26; i++) { const a = (125 + i * (290 / 26)) * Math.PI / 180; P.push([gx + Math.cos(a) * r, gy + Math.sin(a) * r]); }
    P.push([gx + .48 * r, gy + .75 * r], [gx + .46 * r, gy + 1.15 * r], [gx - .46 * r, gy + 1.15 * r], [gx - .48 * r, gy + .75 * r]);
    return P;
  }
  function room(t, key, warm = 0) {
    boilSeed(key);
    paint(rectPts(-300, -300, W + 600, H + 600), { wash: NIGHT, ink: null });
    paint(ellPts(W * .3, H * .35, 700, 520, 24, 20), { fill: '#2A2840', fillOp: 70, bleed: .3, tex: .5, ink: null });
    paint(rectPts(-300, 1470, W + 600, 900), { wash: NIGHT2, ink: null });
    inkLine([[-200, 1472], [W / 2, 1468], [W + 200, 1474]], .7, '#3A3747', 'inkfine', .3);
    // a window with a thin moon, far left (depth: paler, smaller)
    paint(rrPts(70, 640, 230, 300, 10, 2), { wash: '#232235', ink: '#3A3747', sw: .7 });
    inkLine([[185, 642], [185, 938]], .5, '#3A3747', 'inkfine', 0); inkLine([[72, 790], [298, 790]], .5, '#3A3747', 'inkfine', 0);
    paint(ellPts(240, 700, 22, 22, 16), { wash: '#C9C6D6', ink: null });
    paint(ellPts(250, 694, 20, 20, 16), { wash: '#232235', ink: null });
  }

  // ======================= A · 0–4.6: o livro trancado =======================
  function shotA(t, lt, dur) {
    const z = 1 + .035 * lt + .5 * easeIn(seg(lt, dur - .4, dur));
    const G = 1460, u = 40, bx = 780;
    const st = stroll(lt, 1.0, 1.55, 300, 420, u);
    const cfx = lerp(600, st.x, ease(seg(lt, dur - .4, dur))), cfy = lerp(1000, G - 8.2 * u, ease(seg(lt, dur - .4, dur)));
    camBegin(cfx + 8 * Math.sin(lt * .7), cfy, z);
    room(t, 'roomA');
    closedBook(bx, G, 300, 400, BOOK, BOOKDK, 'bookA');
    // pulling: lean back, both feet planted; the chain end follows the hand
    const pull = seg(lt, 1.7, 1.95) * (1 - seg(lt, 2.45, 2.65));
    const mood = emotions(lt, [[0, 'curious', { lookX: .9 }], [1.6, 'determined', { lookX: .8 }], [2.65, 'confused', { lookX: .6 }], [3.75, 'thinking']]);
    const tug = ring(lt, [1.95, 2.15, 2.35], 7, 26) * .08;
    const o = { ...mood, lit: 0, walk: st.walk, rot: (mood.rot || 0) * (1 - pull) - .2 * pull + tug, dy: (mood.dy || 0) + st.dy };
    if (lt > 1.5 && lt < 2.7) { o.aR = lerp(o.aR ?? 0, .28, ease(seg(lt, 1.5, 1.7)) * (1 - ease(seg(lt, 2.5, 2.7)))); o.aL = -.2 - .3 * pull; }
    const hand = handPos(st.x, G, u, o, 1);
    const lockX = bx, lockY = 1290, jig = ring(lt, [1.95, 2.15, 2.35], 8, 30);
    // the chain wraps the book; while held, its loose end runs to Lumi's hand
    chain([bx - 150, 1270], [bx + 150, 1270], 'chainA', 10);
    if (lt > 1.62 && lt < 2.62) chain([bx - 150, 1270], hand, 'chainHand', 5);
    padlock(lockX + jig * 6, lockY, 70, 0, 'lockA');
    lumi(st.x, G, u, { ...o, boilKey: 'A' });
    if (lt > 2.65 && lt < 3.75) emote('sweat', st.x - 4.4 * u, G - 11.5 * u, u * .8, seg(lt, 2.8, 3.0), lt - 2.8);
    camEnd();
    // gancho no quadro 0: a pergunta escrita, segurada até a câmera mergulhar
    const out = seg(lt, dur - .45, dur - .1);
    if (out < 1) {
      cap('APRENDER IA', 330, 104, CREAM, 1, { alpha: 1 - out });
      cap('DE GRAÇA?', 460, 128, LUMI.y, lt < 1.6 ? 1 : 1 + (lt - 1.6) * 0, { alpha: 1 - out, pop: lt >= 1.6 && lt < 1.9 ? 1 + .25 * Math.sin((lt - 1.6) * 20) : 1 });
    }
  }

  // ======================= B · 4.6–8.6: a ideia acende =======================
  function shotB(t, lt, dur) {
    const G = 1500, u = 54, lx = 400, bx = 860;
    const back = ease(seg(lt, 2.4, 3.3));
    const z = lerp(1.42, 1.0, back) - .04 * Math.sin(Math.min(lt, .6) / .6 * Math.PI / 2) * (1 - back) + .3 * (1 - easeOut(seg(lt, 0, .35)));
    camBegin(lerp(lx, 540, back), lerp(G - 8.2 * u, 960, back), z);
    room(t, 'roomB');
    closedBook(bx, G, 300, 400, BOOK, BOOKDK, 'bookB');
    // flicker, then the light comes on at 1.8 (6.4 s)
    const fl = [1.15, 1.35, 1.52, 1.62].reduce((s, a, i) => s + (lt > a && lt < a + [.06, .05, .08, .05][i] ? 1 : 0), 0);
    const lit = clamp(backOut(seg(lt, 1.8, 2.05)) * 1.0);
    const open = backOut(seg(lt, 3.4, 3.65));
    const drop = easeIn(seg(lt, 3.45, 3.95));
    if (drop < 1) {
      boilSeed('chainB');
      chain([bx - 150, 1270 + drop * 420], [bx + 150, 1270 + drop * 520], 'chainB', 10);
    }
    padlock(bx, 1290 + drop * 480, 70, open, 'lockB');
    const mood = emotions(lt, [[0, 'thinking', { lookY: -.9, lookX: .2 }], [1.1, 'curious', { lookY: -1, lookX: 0, emote: null }],
      [1.85, 'surprised'], [2.5, 'excited'], [3.5, 'happy', { lookX: 1 }]]);
    const hop = jump(lt, 2.7, 3.15, 2.2);
    lumi(lx, G, u, { ...mood, lit, flick: fl * .9, dy: (mood.dy || 0) + hop.dy, sq: (mood.sq || 0) + hop.sq, boilKey: 'B' });
    // rays when it lights: short strokes that shoot out and fade
    if (lt > 1.8 && lt < 2.8) {
      boilSeed('rays');
      const k = easeOut(seg(lt, 1.8, 2.5)), fade = 1 - seg(lt, 2.3, 2.8), gy = G - 8.2 * u + hop.dy * u;
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i - 4.5) * .3, r0 = 5.6 * u + k * 2 * u, r1 = r0 + (1.6 + hash(i) * .8) * u * fade;
        inkLine([[lx + Math.cos(a) * r0, gy + Math.sin(a) * r0], [lx + Math.cos(a) * r1, gy + Math.sin(a) * r1]], 2.2 * fade + .2, LUMI.y, 'ink', 0);
      }
    }
    // the lock pops: sparkle on it
    if (lt > 3.4 && lt < 4.0) emote('spark', bx + 70, 1180, 30, seg(lt, 3.4, 3.55), lt - 3.4);
    camEnd();
    if (lt > 1.8 && lt < 2.1) flash(.35 * (1 - seg(lt, 1.8, 2.1)), '#FFF6D6');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, [LUMI.yDk, LUMI.y]);
  }

  // ======================= C · 8.6–13.4: tudo aberto =======================
  function shotC(t, lt, dur) {
    const G = 1480, u = 46, lx = 540, t0 = 8.6;
    const tt = x => x - t0;   // film time → shot time
    camBegin(540 + 10 * Math.sin(lt * .6), 960 - 10 * lt, 1.0 + .02 * lt);
    boilSeed('bgC');
    paint(rectPts(-300, -300, W + 600, H + 600), { wash: '#F4E9CF', ink: null });
    paint(ellPts(540, 1050, 640, 620, 26, 25), { fill: '#FDE68A', fillOp: 120, bleed: .3, tex: .5, border: .4, ink: null });
    paint(rectPts(-300, 1490, W + 600, 900), { fill: '#E6D3A6', fillOp: 160, bleed: .08, tex: .5, ink: null });
    inkLine([[-200, 1492], [W / 2, 1488], [W + 200, 1494]], .7, mixCol('#E6D3A6', PAL.ink, .4), 'inkfine', .3);
    openBook(lx, G + 10, 560, 'openC');
    // three things fly out of the book, one per spoken word, then bob in place
    const items = [
      { t: tt(TW.cursos) - .25, to: [215, 930], draw: (x, y, age) => flyBook(x, y, 95, age * 9 + (lt > tt(TW.tudo) ? age * 6 : 0), '#2F7D73', 'fb') },
      { t: tt(TW.guias) - .25, to: [865, 930], draw: (x, y, age) => guide(x, y, 150, seg(age, .3, .8) * .6 + .4 * seg(lt, tt(TW.tudo), tt(TW.tudo) + .4), 'gd') },
      { t: tt(TW.videos) - .25, to: [540, 650], draw: (x, y, age) => screenProp(x, y, 130, pulse(t, 5), 'sc') },
    ];
    items.forEach((it, i) => {
      const age = lt - it.t; if (age < 0) return;
      const k = easeOut(seg(age, 0, .55)), p = arcPt([lx + (i - 1) * 60, G - 40], it.to, 260, k);
      const bob = Math.sin((lt + i) * 2.4) * 10 * seg(age, .5, .9), s = lerp(.35, 1, k);
      push(); translate(p[0], p[1] + bob); scale(s); it.draw(0, 0, age); pop();
      if (age < .7) emote('spark', p[0] + 70, p[1] - 60, 22, seg(age, .45, .6), age - .45);
    });
    const look = lt < tt(TW.cursos) ? {} : lt < tt(TW.guias) ? { lookX: -1, lookY: -.3 } : lt < tt(TW.videos) ? { lookX: 1, lookY: -.3 } : lt < tt(TW.tudo) ? { lookX: 0, lookY: -1 } : {};
    const mood = emotions(lt, [[0, 'happy'], [tt(TW.cursos) + .1, 'curious', { emote: null }], [tt(TW.tudo), 'excited'], [tt(TW.aberto) + .55, 'proud']]);
    const hop = jump(lt, tt(TW.tudo) + .15, tt(TW.tudo) + .6, 2.5);
    const capK = seg(lt, tt(TW.aberto) - .05, tt(TW.aberto) + .5), land = tt(TW.aberto) + .5;
    const sqLand = lt > land ? .16 * Math.exp(-8 * (lt - land)) * Math.cos(20 * (lt - land)) : 0;
    lumi(lx, G, u, { ...mood, ...look, lit: 1, haloA: .6, cap: capK, capT: T > 0 ? land + t0 : 0, dy: (mood.dy || 0) + hop.dy, sq: (mood.sq || 0) + hop.sq + sqLand, boilKey: 'C' });
    const head = toScreen(lx, G - 8.2 * u);
    camEnd();
    // captions, one word at a time (keyword yellow)
    const c = lt + t0;
    if (c >= TW.cursos && c < TW.guias) cap('CURSOS', 380, 120, LUMI.y, c - TW.cursos);
    else if (c >= TW.guias && c < TW.videos) cap('GUIAS', 380, 120, LUMI.y, c - TW.guias);
    else if (c >= TW.videos && c < TW.tudo) cap('VÍDEOS', 380, 120, LUMI.y, c - TW.videos);
    else if (c >= TW.tudo) { cap('TUDO', 330, 110, CREAM, c - TW.tudo); if (c >= TW.aberto) cap('ABERTO', 460, 130, LUMI.y, c - TW.aberto); }
    if (lt > dur - .35) { flushLetters(); const k = easeIn(seg(lt, dur - .35, dur)); irisShape(bulbPts(head[0], head[1], lerp(1500, 0, k) + 1), DEEP); }
  }

  // ======================= D · 13.4–17.6: INEMA.CLUB =======================
  function shotD(t, lt, dur) {
    const G = 1580, u = 44, lx = 540, t0 = 13.4, c = lt + t0;
    camBegin(540, 960 - 6 * lt, 1.0 + .012 * lt);
    boilSeed('bgD');
    paint(rectPts(-300, -300, W + 600, H + 600), { wash: DEEP, ink: null });
    paint(rectPts(-300, 1590, W + 600, 900), { wash: '#1C1A24', ink: null });
    inkLine([[-200, 1592], [W / 2, 1588], [W + 200, 1594]], .7, '#34313F', 'inkfine', .3);
    openBook(lx, G + 10, 520, 'openD');
    // the sign rises on the word "INEMA.CLUB"
    const sk = backOut(seg(c, TW.club - .3, TW.club + .1)), sy = lerp(1500, 820, sk);
    if (sk > 0.001) {
      boilSeed('sign');
      inkLine([[lx - 300, sy + 120], [lx - 300, 1585]], 2.2, '#3A3747', 'ink', 0); inkLine([[lx + 300, sy + 120], [lx + 300, 1585]], 2.2, '#3A3747', 'ink', 0);
      paint(rrPts(lx - 470, sy - 120, 940, 240, 26, 3), { wash: LUMI.y, ink: PAL.ink, sw: 1.6 });
      paint(ellPts(lx - 250, sy - 70, 230, 40, 16, 4, -.05), { fill: '#FEF08A', fillOp: 120, bleed: .2, tex: .6, ink: null });
    }
    const mood = emotions(lt, [[0, 'proud'], [TW.ta - t0, 'excited', { emote: null }], [TW.club - t0 + .2, 'happy', { aR: 1.05, lookX: .2, lookY: -1 }], [15.7 - t0, 'waving']]);
    lumi(lx, G, u, { ...mood, lit: 1, cap: 1, boilKey: 'D' });
    const head = toScreen(lx, G - 8.2 * u), signS = toScreen(lx, sy);
    camEnd();
    if (sk > 0.001) letter('INEMA.CLUB', signS[0], signS[1] + 6, 112, '#14141A', { font: FONT(112), screen: true, ink: false, pop: 1 });
    if (c >= TW.ta) cap(c < TW.tudo2 ? 'TÁ' : c < TW.no ? 'TÁ TUDO' : 'TÁ TUDO NO', 520, 96, CREAM, c < TW.tudo2 ? c - TW.ta : 1);
    if (lt < .35) { flushLetters(); irisShape(bulbPts(head[0], head[1], lerp(0, 1500, easeIn(seg(lt, 0, .35))) + 1), DEEP); }
    const e0 = dur - .75;
    if (lt > e0) { flushLetters(); const k = ease(seg(lt, e0, dur - .2)); irisShape(bulbPts(head[0], head[1], lerp(1500, 0, k) + 1), DEEP); }
  }

  shots([[0, shotA], [4.6, shotB], [8.6, shotC], [13.4, shotD]]);
})();
