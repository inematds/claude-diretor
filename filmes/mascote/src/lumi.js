// lumi.js: Lumi, the INEMA mascot — a small light bulb that lights up when it learns something.
// Painted with the same kit as Clawd (p5.brush, flat wash + boiling ink), but a new character: a round glass head in
// INEMA yellow (#FACC15), a dark screw-cap body, two thin noodle arms, two stubby legs, a filament curl on top.
// (x, y) = ground point between the feet; u = size unit. Lumi is about 9.6u wide and 13u tall.
//
// Body-local coordinates (front view): glass circle centre (0, -8.2u), radius 4.8u; neck at y -3.6u; cap -3.6u..-1.8u;
// legs -2u..0. Eyes at (±2.5u, -8.6u), mouth near (0, -6.9u). Arms pivot at (±2.5u, -4.4u), 3u long; armL / armR hooks
// are called at the hand, in arm space (+x outward), like clawd().
//
// Extra options on top of clawd()'s face/pose ones (eyes, mouth, lookX/Y, squint, blush, gloom, emote, dx, dy, sq, rot,
// flip, aL, aR, walk, tint):
//   lit 0..1     the glass glows (0 = unlit grey glass, 1 = full INEMA yellow + halo)
//   flick        0..1 extra filament flicker (for the "about to get it" moment)
//   cap 0..1     the graduation cap (1 = sitting on the head; < 1 = still falling, from above)
//   haloA        multiply the halo strength (default 1)

const LUMI = {
  y: '#FACC15', yLt: '#FEF08A', yDk: '#D69E0B', glassOff: '#CFCBC0', glassOffDk: '#A8A397', glassOffLt: '#EAE6DC',
  base: '#2A2A33', baseLt: '#4B4B57', thread: '#6E6E7C', fil: '#B45309', black: '#14141A',
};
let LUMI_N = 0;

function lumi(x, y, u, o = {}) {
  const id = o.boilKey ?? ('L' + (++LUMI_N)), rs = part => boilSeed(`lumi ${id} ${part}`);
  x += (o.dx || 0) * u;
  const dy = (o.dy || 0) * u, sq = (o.sq || 0), sw = clamp(u / 15, .45, 2.6), J = u * .06;
  const lit = clamp(o.lit ?? 1);
  // glass colours: unlit grey → lit yellow, then the mood tint on top (tintCols mixes like clawd's)
  let tc = tintCols({ ...o, col: mixCol(LUMI.glassOff, LUMI.y, lit), dk: mixCol(LUMI.glassOffDk, LUMI.yDk, lit), lt: mixCol(LUMI.glassOffLt, LUMI.yLt, lit) });
  if (o.col) tc = { col: o.col, dk: o.dk || tc.dk, lt: o.lt || tc.lt };
  const { col, dk, lt } = tc;

  rs('shadow');
  if (!o.noShadow) {
    const f = 1 - Math.min(.5, Math.abs(o.dy || 0) * .05);
    paint(ellPts(x, y + u * .15, u * 3.6 * f, u * .75 * f, 22), { fill: PAL.ink, fillOp: 90, bleed: .25, tex: .3, border: .1, ink: null });
  }
  // the halo, behind the body (additive light: strong on dark grounds, faint on paper, like real light)
  if (lit > .02 && (o.haloA ?? 1) > 0) {
    rs('halo');
    const hx = x + Math.sin(o.rot || 0) * 8.2 * u, hy = y + dy - 8.2 * u * (1 - sq) * Math.cos(o.rot || 0);
    const fl = 1 + .04 * Math.sin(T * 23) + .03 * Math.sin(T * 9.3);
    glow(hx, hy, u * 11 * lit * fl, '#FFC93C', .9 * lit * (o.haloA ?? 1));
    glow(hx, hy, u * 6 * lit * fl, '#FFE58A', .7 * lit * (o.haloA ?? 1));
  }

  push();
  translate(x, y + dy);
  if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (o.sx ?? 1) * (1 + sq * .6), (o.sy ?? 1) * (1 - sq));

  // legs (under everything): two stubby dark legs with round feet
  if (!o.noLegs) [-1.25, 1.25].forEach((lx, i) => {
    rs('leg' + i);
    let h = 2.1, sx = 0;
    if (o.walk != null) { const ph = (o.walk + (i ? .5 : 0)) * TAU; sx = Math.sin(ph) * .5; h = 2.1 - Math.max(0, Math.cos(ph)) * .7; }
    paint(rectPts((lx + sx) * u - .42 * u, -2.2 * u, .84 * u, h * u, J * .5), { wash: LUMI.base, ink: PAL.ink, sw: sw * .7 });
    paint(ellPts((lx + sx) * u + (lx < 0 ? -.2 : .2) * u, -(2.2 - h) * u - .25 * u, .85 * u, .42 * u, 14, J * .4), { wash: LUMI.base, ink: PAL.ink, sw: sw * .7 });
  });

  // arms: drawn in front of everything (after the glass and the face), from the sides of the screw cap
  const arm = (side) => {
    const which = side < 0 ? 'L' : 'R', a = which === 'L' ? (o.aL ?? -.4) : (o.aR ?? -.4), hook = which === 'L' ? o.armL : o.armR;
    rs('arm' + which);
    push(); translate(side * 2.0 * u, -3.0 * u); rotate(side < 0 ? a : -a);
    const P = [[0, 0], [side * 1.2 * u, -.3 * u], [side * 2.4 * u, -.2 * u], [side * 3.4 * u, 0]];
    paint(ribbon(P, .6 * u, .42 * u), { wash: LUMI.base, ink: PAL.ink, sw: sw * .6 });
    paint(ellPts(side * 3.55 * u, 0, .64 * u, .58 * u, 14, J * .3), { wash: LUMI.base, ink: PAL.ink, sw: sw * .7 });
    if (hook) { translate(side * 3.55 * u, 0); if (side < 0) scale(-1, 1); hook(u, sw); }
    pop();
  };
  // screw cap: a dark rounded block with thread lines and a contact nub
  rs('cap');
  paint(ellPts(0, -1.95 * u, .9 * u, .45 * u, 12, J * .3), { wash: LUMI.black, ink: PAL.ink, sw: sw * .6 });
  paint(rrPts(-2.25 * u, -3.85 * u, 4.5 * u, 2.05 * u, .55 * u, J * .4), { wash: LUMI.base, ink: PAL.ink, sw: sw * .9 });
  paint(rrPts(-2.05 * u, -3.7 * u, 1.3 * u, 1.75 * u, .4 * u, J * .3), { fill: LUMI.baseLt, fillOp: 140, bleed: .1, tex: .5, ink: null });
  for (let i = 0; i < 2; i++) inkLine([[-2.15 * u, (-3.2 + i * .62) * u], [0, (-3.05 + i * .62) * u], [2.15 * u, (-3.2 + i * .62) * u]], sw * .55, LUMI.thread, 'inkfine', .5);

  // glass: one outline, a circle that narrows into the neck
  rs('glass');
  const G = [], cy = -8.2 * u, r = 4.8 * u;
  for (let i = 0; i <= 26; i++) { const a = (125 + i * (290 / 26)) * Math.PI / 180; G.push([Math.cos(a) * r, cy + Math.sin(a) * r]); }   // 125° → 415° (= 55°), over the top
  G.push([2.3 * u, -4.6 * u], [2.05 * u, -3.75 * u], [-2.05 * u, -3.75 * u], [-2.3 * u, -4.6 * u]);
  const glass = G.map(([a, b]) => [a + jit(J * .5), b + jit(J * .5)]);
  paint(glass, { wash: col, washOp: 255, ink: null, curv: .25 });
  paint(ellPts(1.9 * u, -6.0 * u, 2.7 * u, 2.2 * u, 18, J, -.5), { fill: dk, fillOp: 120, bleed: .18, tex: .7, border: .7, ink: null });   // shade, lower right
  paint(ellPts(-1.8 * u, -10.4 * u, 2.2 * u, 1.5 * u, 18, J, -.6), { fill: lt, fillOp: 150, bleed: .2, tex: .8, border: .8, ink: null });  // light, upper left
  if (o.gloom > .02) paint(ellPts(0, -11.2 * u, 3.6 * u, 1.6 * u, 16, J), { fill: PAL.indigo, fillOp: 130 * o.gloom, bleed: .1, tex: .5, ink: null });
  paint(glass, { ink: PAL.ink, sw, curv: .25 });
  // glint: two short cream strokes on the upper left of the glass
  inkLine([[-3.6 * u, -9.4 * u], [-3.3 * u, -10.8 * u], [-2.5 * u, -11.8 * u]], sw * 1.1, PAL.cream, 'ink', .6);
  inkLine([[-2.0 * u, -12.25 * u], [-1.6 * u, -12.45 * u]], sw * .9, PAL.cream, 'ink', 0);

  // filament: a little spring-shaped curl at the top of the glass, glowing when lit
  rs('fil');
  const fk = clamp(lit + (o.flick || 0));
  const F = []; for (let i = 0; i <= 16; i++) { const k = i / 16; F.push([lerp(-1.3, 1.3, k) * u, (-11.55 + .38 * Math.sin(k * TAU * 2.5)) * u]); }
  inkLine([[-1.3 * u, -11.55 * u], [-1.05 * u, -10.7 * u]], sw * .5, mixCol(LUMI.thread, LUMI.fil, fk), 'inkfine', 0);
  inkLine([[1.3 * u, -11.55 * u], [1.05 * u, -10.7 * u]], sw * .5, mixCol(LUMI.thread, LUMI.fil, fk), 'inkfine', 0);
  inkLine(F, sw * .75, mixCol(LUMI.thread, '#C2410C', fk), 'ink', .5);
  if (o.flick > .05) { flushBrush(); }

  // face: clawd's eyes and mouths, moved up onto the glass
  rs('face');
  push(); translate(0, -2.6 * u);
  if (o.blush) blush(u, sw, { sides: [-1, 1], bx: 3.3 }, o.blush === true ? 1 : o.blush);
  rs('eyes'); eyes(u, o, sw, [-1, 1], 0);
  rs('mouth'); mouth(u, o.mouth, sw);
  pop();

  // graduation cap: a dark mortarboard with a yellow tassel, dropping in from above while cap < 1
  if (o.cap > 0) {
    rs('grad');
    const k = clamp(o.cap), fall = (1 - easeIn(k)) * 9 * u, tilt = (1 - k) * .5 + .14 + .05 * Math.sin(T * 3) * (1 - k);
    push(); translate(.5 * u, -12.6 * u - fall); rotate(-tilt * .6);
    paint(rrPts(-2.2 * u, -.2 * u, 4.4 * u, 1.5 * u, .35 * u, J * .3), { wash: LUMI.black, ink: PAL.ink, sw: sw * .8 });
    paint([[-4.6 * u, -.5 * u], [0, -2.1 * u], [4.6 * u, -.5 * u], [0, 1.1 * u]], { wash: LUMI.base, ink: PAL.ink, sw: sw * .8 });
    paint(ellPts(0, -.5 * u, .35 * u, .25 * u, 10), { wash: LUMI.y, ink: PAL.ink, sw: sw * .5 });
    const sway = .25 * Math.sin(T * 4.2) + spring(T, o.capT ?? 0, 4, 14) * .6;
    const tx = 3.6 * u + sway * u, ty = 2.2 * u;
    inkLine([[0, -.5 * u], [2.2 * u, -.2 * u], [3.5 * u, .4 * u], [tx, ty * .8]], sw * .7, LUMI.y, 'ink', .5);
    paint([[tx - .35 * u, ty * .8], [tx + .35 * u, ty * .8], [tx + .5 * u, ty + .9 * u], [tx - .5 * u, ty + .9 * u]], { wash: LUMI.y, ink: PAL.ink, sw: sw * .5 });
    pop();
  }
  arm(-1); arm(1);
  rs('draw'); if (o.draw) o.draw(u, sw);
  pop();

  rs('emote');
  if (o.emote) {
    const top = EMOTE_TOP.includes(o.emote), dir = o.flip ? -1 : 1;
    const ex = top ? x : x + dir * 5.4 * u, ey = y + dy + (top ? -15.2 : -12.4) * u * (1 - sq);
    emote(o.emote, ex, ey, u * .9, o.emoteK ?? 1, o.emoteAge ?? T);
  }
  rs('after');
}

// Lumi's own emotions, on top of clawd's 31 (they all work on Lumi: feel(), emotions()).
//   curious: leans in, one eye wider, pupils searching. waving: a big hello/goodbye with the right arm.
EMO.curious = { eyes: ['normal', 'wide'], mouth: 'o', emote: '?', fade: true, take: .5, body: t => { const b = _b(t), s = Math.sin(t * TAU * .5); return { lookX: .7 * s, lookY: -.2, rot: .1 + .03 * s, dx: .3, sq: -.04, aL: -.6, aR: .3 + .15 * b.s1 }; } };
EMO.waving = { eyes: 'happy', mouth: 'grin', blush: .35, take: .5, body: t => { const b = _b(t); return { dy: -.5 * b.ab, rot: -.05 + .03 * Math.sin(t * TAU * 2.2), aR: 1.25 + .45 * Math.sin(t * TAU * 2.4), aL: -.55, sq: .05 * b.hit }; } };
// For a bulb, "idea" is the light itself: no extra bulb emote.
EMO.idea = { ...EMO.idea, emote: 'spark' };
