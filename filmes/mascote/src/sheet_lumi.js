// sheet_lumi.js: Lumi's model sheet (9:16) — the eight core emotions, alive, with Portuguese labels.
//   node render.mjs --loop=lumi --sheet=1.3 --cols=1 --w=1080 --out=folha-emocoes.jpg
(() => {
  const FONT = (px) => `${px}px "MontBlack", sans-serif`;
  const EMOS = [
    ['happy', 'FELIZ'], ['curious', 'CURIOSO'], ['surprised', 'SURPRESO'], ['thinking', 'PENSANDO'],
    ['excited', 'EMPOLGADO'], ['confused', 'CONFUSO'], ['proud', 'ORGULHOSO'], ['waving', 'ACENANDO'],
  ];
  LOOPS.lumi = t => {
    paint(rectPts(-40, -40, W + 80, H + 80), { wash: '#F3EBDC', ink: null });
    letter('LUMI', W / 2, 110, 92, LUMI.y, { font: FONT(92), stroke: LUMI.black });
    letter('MASCOTE DO INEMA.CLUB', W / 2, 190, 34, PAL.ink, { font: FONT(34), ink: false });
    const cw = W / 2, top = 250, ch = (H - top - 30) / 4;
    EMOS.forEach(([name, lab], i) => {
      const cx = cw * (i % 2) + cw / 2, gy = top + ch * Math.floor(i / 2) + ch - 100;
      boilSeed('cell' + i);
      paint(rrPts(cx - cw / 2 + 22, gy - ch + 115, cw - 44, ch - 30, 26, 3), { fill: i % 2 ? '#EDE3CF' : '#F7EFDF', fillOp: 200, bleed: .06, tex: .4, ink: mixCol(PAL.paper, PAL.ink, .3), sw: .5 });
      inkLine([[cx - 170, gy + 6], [cx, gy + 3], [cx + 170, gy + 7]], .6, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', .5);
      const f = feel(name, t, { seed: i });
      if (name === 'proud') f.cap = 1;
      lumi(cx, gy, 19, { ...f, lit: 1, haloA: .5, boilKey: 'S' + i });
      letter(lab, cx, gy + 50, 36, PAL.ink, { font: FONT(36), ink: false });
    });
  };
  LOOPS.lumi.len = 4;
})();
