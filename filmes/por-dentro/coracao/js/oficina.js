// Oficina da série "Como funciona por dentro": peças comuns aos episódios (luz de estúdio, fundo,
// etiquetas com fio, partículas presas a curvas, câmera por chaves). Tudo é função do tempo t.
import { THREE, W, H, clamp, lerp, ramp, io, out3, win, rng } from '../motor/base.js';
import { RoomEnvironment } from './RoomEnvironment.js';

// ------------------------------------------------------------- estúdio
export function estudio(renderer, scene, { env = 0.55, centro = '#1b2330', borda = '#0c0c10', cy = 0.5 } = {}) {
  renderer.shadowMap.enabled = false;
  renderer.localClippingEnabled = true;
  renderer.toneMappingExposure = 1.05;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = env;
  // fundo: degradê radial escuro (sem brilho, sem bloom)
  const c = document.createElement('canvas'); c.width = 540; c.height = 960;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(270, 960 * cy, 30, 270, 960 * cy, 720);
  gr.addColorStop(0, centro); gr.addColorStop(1, borda);
  g.fillStyle = gr; g.fillRect(0, 0, 540, 960);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
  const key = new THREE.DirectionalLight(0xfff3ea, 2.3); key.position.set(-5, 7, 9);
  const rim = new THREE.DirectionalLight(0xa9c8ec, 1.5); rim.position.set(6, 3, -7);
  const fill = new THREE.HemisphereLight(0xdfe8f5, 0x1a1012, 0.35);
  scene.add(key, rim, fill);
  return { key, rim, fill };
}

// ------------------------------------------------------------- câmera por chaves [t, az°, el°, dist, alvo(Vector3)]
export function cameraPorChaves(camera, chaves) {
  const D = Math.PI / 180;
  return (t) => {
    let a = chaves[0], b = chaves[0], k = 0;
    for (let i = 1; i < chaves.length; i++) {
      if (t <= chaves[i][0]) { a = chaves[i - 1]; b = chaves[i]; k = io(ramp(t, a[0], b[0])); break; }
      a = b = chaves[i];
    }
    const az = lerp(a[1], b[1], k) * D, el = lerp(a[2], b[2], k) * D, d = lerp(a[3], b[3], k);
    const alvo = a[4].clone().lerp(b[4], k);
    camera.position.set(alvo.x + d * Math.sin(az) * Math.cos(el), alvo.y + d * Math.sin(el), alvo.z + d * Math.cos(az) * Math.cos(el));
    camera.lookAt(alvo);
    camera.updateMatrixWorld();
  };
}

// ------------------------------------------------------------- etiquetas com fio (DOM, letra nítida)
// defs: {txt, sub, lado: 'e'|'d', y (px), alvo: () => Vector3 mundo, de, ate (s), q (destaque amarelo)}
const NS = 'http://www.w3.org/2000/svg';
export function etiquetas(defs) {
  const caixa = document.getElementById('etis'), fios = document.getElementById('fios');
  const itens = defs.map((d) => {
    const el = document.createElement('div'); el.className = 'eti' + (d.q ? ' q' : '');
    el.innerHTML = d.txt + (d.sub ? `<small>${d.sub}</small>` : '');
    caixa.appendChild(el);
    const ln = document.createElementNS(NS, 'polyline');
    ln.setAttribute('fill', 'none'); ln.setAttribute('stroke', 'rgba(255,255,255,0.85)'); ln.setAttribute('stroke-width', '3');
    const pt = document.createElementNS(NS, 'circle'); pt.setAttribute('r', '8');
    pt.setAttribute('fill', d.q ? '#FACC15' : '#ffffff'); pt.setAttribute('stroke', '#0c0c10'); pt.setAttribute('stroke-width', '3');
    fios.appendChild(ln); fios.appendChild(pt);
    return { d, el, ln, pt };
  });
  const v = new THREE.Vector3();
  return (t, camera) => {
    for (const it of itens) {
      const op = win(t, it.d.de, it.d.ate, 0.3, 0.25);
      it.el.style.opacity = op; it.ln.style.opacity = op; it.pt.style.opacity = op;
      if (op <= 0.001) continue;
      v.copy(it.d.alvo()).project(camera);
      const ax = (v.x + 1) / 2 * W, ay = (1 - v.y) / 2 * H;
      const w = it.el.offsetWidth, h = it.el.offsetHeight;
      const x = it.d.lado === 'e' ? 40 : W - 40 - w;
      const y = it.d.y - h / 2 + (1 - out3(ramp(t, it.d.de, it.d.de + 0.35))) * 16;
      it.el.style.left = `${x}px`; it.el.style.top = `${y}px`;
      const ex = it.d.lado === 'e' ? x + w : x, ey = it.d.y;
      const mx = it.d.lado === 'e' ? ex + 36 : ex - 36;
      const p = clamp(ramp(t, it.d.de + 0.05, it.d.de + 0.45)); // o fio cresce da etiqueta até a peça
      const fx = lerp(mx, ax, p), fy = lerp(ey, ay, p);
      it.ln.setAttribute('points', `${ex},${ey} ${mx},${ey} ${fx},${fy}`);
      it.pt.setAttribute('cx', fx); it.pt.setAttribute('cy', fy);
      it.pt.style.opacity = op * (p > 0.98 ? 1 : 0);
    }
  };
}

// ------------------------------------------------------------- partículas presas a uma curva
// Cada partícula tem um deslocamento fixo (semente) e anda s = frac(off + avanço(t)).
export function fluxo(scene, curvas, { n = 80, cor = 0xffffff, r = 0.05, seed = 1, jit = 0.08, emissivo = 0.35, pai = scene } = {}) {
  const geo = new THREE.SphereGeometry(r, 10, 8);
  const m = new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: emissivo, roughness: 0.35, metalness: 0, transparent: true, opacity: 1 });
  const inst = new THREE.InstancedMesh(geo, m, n); inst.frustumCulled = false;
  pai.add(inst);
  const R = rng(seed);
  const amostras = curvas.map((c) => c.getSpacedPoints(400));
  const ps = [...Array(n)].map((_, i) => ({ off: R(), c: i % curvas.length, j: new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(2 * jit), esc: 0.75 + 0.5 * R() }));
  const M = new THREE.Matrix4(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3();
  return (avanco, opac, deforma) => {
    inst.visible = opac > 0.01; m.opacity = opac;
    if (!inst.visible) return;
    ps.forEach((p, i) => {
      const s = ((p.off + avanco) % 1 + 1) % 1;
      const a = amostras[p.c], f = s * (a.length - 1), i0 = Math.floor(f), k = f - i0;
      P.copy(a[i0]).lerp(a[Math.min(a.length - 1, i0 + 1)], k).add(p.j);
      if (deforma) deforma(P);
      const fade = Math.min(1, s / 0.05, (1 - s) / 0.05);
      S.setScalar(p.esc * fade);
      M.compose(P, Q, S); inst.setMatrixAt(i, M);
    });
    inst.instanceMatrix.needsUpdate = true;
  };
}

// textura de fibras (músculo / metal escovado): listras finas com semente
export function texturaFibras({ base = '#7a1a20', claro = 'rgba(255,170,160,0.10)', escuro = 'rgba(40,0,6,0.22)', ang = -0.5, seed = 3, tam = 1024, n = 900 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = tam;
  const g = c.getContext('2d'); const R = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, tam, tam);
  for (let i = 0; i < 60; i++) { // manchas suaves
    const x = R() * tam, y = R() * tam, r = 40 + R() * 160;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, R() < 0.5 ? 'rgba(255,120,120,0.08)' : 'rgba(30,0,4,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  g.save(); g.translate(tam / 2, tam / 2); g.rotate(ang); g.translate(-tam, -tam);
  for (let i = 0; i < n; i++) {
    const y = R() * tam * 2, x = R() * tam * 2, L = 60 + R() * 260;
    g.strokeStyle = R() < 0.5 ? claro : escuro; g.lineWidth = 1 + R() * 2.2;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + L * 0.3, y + 6 * (R() - 0.5), x + L * 0.7, y + 6 * (R() - 0.5), x + L, y); g.stroke();
  }
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
