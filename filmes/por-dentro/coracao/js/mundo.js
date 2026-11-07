// "Seu coração por dentro" — coração 3D feito só com código, desenhado a partir do tempo do vídeo.
// Fatos: fatos.md (F1–F8). Vista de frente: o lado DIREITO da pessoa fica à ESQUERDA da tela (x < 0).
// Cenas: capa → 100 mil batidas → abre (4 câmaras) → sangue azul (direito → pulmões) → vermelho (esquerdo → aorta)
// → válvulas (tum-tá) → sinal elétrico → vista explodida → fecha e volta à capa (último quadro = primeiro).
import {
  THREE, W, H, D2R, clamp, lerp, ramp, io, out3, win, v3, rng, criarMundo, legenda, cartoes, ligar,
} from '../motor/base.js';
import { FIM, BLOCOS as B, FRASES as F, LEG, palavra } from './tempos.js';
import { estudio, cameraPorChaves, etiquetas, fluxo, texturaFibras } from './oficina.js';

const { renderer, scene, camera } = criarMundo();
camera.fov = 30; camera.updateProjectionMatrix();
estudio(renderer, scene, { env: 0.6, centro: '#1d2533', cy: 0.52 });

// ------------------------------------------------------------- o batimento (70/min — normal em repouso, F8)
const BPM = 70, FREQ = BPM / 60;
const fase = (t) => ((t * FREQ) % 1 + 1) % 1;
const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(Math.PI * (p - a) / (b - a)));
const atrio = (t) => bump(fase(t), 0.0, 0.15);       // átrios contraem primeiro (F7)
const vent = (t) => bump(fase(t), 0.17, 0.48);       // depois os ventrículos
const avAberta = (t) => { const p = fase(t); return p < 0.16 ? 1 : p < 0.2 ? 1 - ramp(p, 0.16, 0.2) : p < 0.5 ? 0 : ramp(p, 0.5, 0.56); };
const slAberta = (t) => { const p = fase(t); return p < 0.2 ? 0 : p < 0.25 ? ramp(p, 0.2, 0.25) : p < 0.45 ? 1 : 1 - ramp(p, 0.45, 0.49); };
const sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
let VV = 0, AA = 0; // contração do quadro atual
function deforma(p) {
  const Y = p.y, wv = sm(0.6, 0.1, Y), wa = sm(0.3, 0.65, Y);
  const s = 1 - 0.075 * VV * wv - 0.07 * AA * wa;
  p.x *= s; p.z *= s; p.y = Y + VV * wv * 0.05 * (0.6 - Y);
  return p;
}

// ------------------------------------------------------------- a forma (esfera deformada; ápice para baixo no eixo local)
function forma(x, y, z) {
  const Y = y * 1.72 - 0.28, t = (y + 1) / 2, base = Math.min(1, t * 1.6);
  const larg = 1.62 * (0.72 + 0.28 * base), prof = 1.18 * (0.75 + 0.25 * base);
  let X = x * larg, Z = z * prof;
  const n = new THREE.Vector3(x, y * 0.5, z).normalize();
  const xg = -0.05 + (0.3 - Y) * 0.2;                                           // sulco interventricular anterior
  let d = 0.07 * Math.exp(-((X - xg) ** 2) / 0.018) * sm(0.0, 0.5, z) * (Y < 0.4 ? 1 : 0);
  d += 0.08 * Math.exp(-((Y - 0.38) ** 2) / 0.012);                               // sulco atrioventricular
  d += 0.12 * Math.exp(-(X * X) / 0.05) * sm(0.7, 1.3, Y);                        // dobra entre os átrios
  d -= 0.028 * Math.sin(3.1 * X + 1.3) * Math.sin(2.7 * Y + 0.4) * Math.sin(3.3 * Z + 2.1); // irregular, orgânico
  return new THREE.Vector3(X - n.x * d, Y - n.y * d, Z - n.z * d);
}

// ------------------------------------------------------------- grupos
const coracao = new THREE.Group(); coracao.rotation.z = 0.38; coracao.position.set(0.15, 0, 0); scene.add(coracao);
const tras = new THREE.Group(); coracao.add(tras);                     // metade de trás (fica)
const dobra = new THREE.Group(); dobra.position.set(-1.7, 0, 0); coracao.add(dobra); // dobradiça da "porta"
const frente = new THREE.Group(); frente.position.set(1.7, 0, 0); dobra.add(frente); // metade da frente (abre)
const PL_TRAS = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), PL_FRENTE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const clipTras = new THREE.Plane(), clipFrente = new THREE.Plane();

// ------------------------------------------------------------- materiais
const fibras = texturaFibras({ base: '#7c1820', seed: 7 });
const corte = texturaFibras({ base: '#8c2830', claro: 'rgba(255,190,180,0.14)', escuro: 'rgba(60,0,8,0.25)', ang: 0.9, seed: 11, n: 1400 });
const musculo = (clip) => new THREE.MeshPhysicalMaterial({
  color: 0xffffff, map: fibras, bumpMap: fibras, bumpScale: 1.2, roughness: 0.42, metalness: 0,
  clearcoat: 0.6, clearcoatRoughness: 0.32, sheen: 0.4, sheenColor: new THREE.Color(0xff9a9a), sheenRoughness: 0.6,
  side: THREE.DoubleSide, clippingPlanes: [clip],
});
const vaso = (cor, clip) => new THREE.MeshPhysicalMaterial({ color: cor, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, side: THREE.DoubleSide, clippingPlanes: clip ? [clip] : [] });

// ------------------------------------------------------------- casca do coração (uma geometria, duas metades)
const casca = new THREE.SphereGeometry(1, 160, 120);
const P0 = casca.attributes.position.array.slice();
const FORMA0 = new Float32Array(P0.length);
for (let i = 0; i < P0.length; i += 3) { const p = forma(P0[i], P0[i + 1], P0[i + 2]); FORMA0.set([p.x, p.y, p.z], i); }
casca.attributes.position.array.set(FORMA0); casca.computeVertexNormals();
tras.add(new THREE.Mesh(casca, musculo(clipTras)));
frente.add(new THREE.Mesh(casca, musculo(clipFrente)));

// aurículas (as "orelhas" dos átrios), na frente
function auricula(px, py, pz, sx, sy, sz, rz) {
  const g = new THREE.SphereGeometry(1, 48, 32); const a = g.attributes.position;
  for (let i = 0; i < a.count; i++) { const x = a.getX(i), y = a.getY(i); a.setY(i, y + 0.25 * Math.sin(x * 3)); a.setX(i, x * (1 + 0.15 * Math.sin(y * 5))); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, musculo(clipFrente)); m.scale.set(sx, sy, sz); m.position.set(px, py, pz); m.rotation.z = rz;
  frente.add(m); return m;
}
const aurD = auricula(-1.08, 0.98, 0.55, 0.42, 0.24, 0.26, 0.5);
const aurE = auricula(1.02, 0.72, 0.62, 0.36, 0.2, 0.22, -0.7);

// ------------------------------------------------------------- o corte: placa com os 4 buracos (câmaras)
const CAM = {
  AD: { c: [-0.66, 0.78], r: [0.40, 0.36] }, VD: { c: [-0.58, -0.32], r: [0.52, 0.86] },
  AE: { c: [0.66, 0.80], r: [0.38, 0.34] }, VE: { c: [0.50, -0.36], r: [0.38, 0.92] },
};
const dentroE = (e, x, y) => ((x - e.c[0]) / e.r[0]) ** 2 + ((y - e.c[1]) / e.r[1]) ** 2 < 1;
function uniao(A, V) { // contorno de átrio ∪ ventrículo (ligados pelo "pescoço" da válvula)
  const pts = [], N = 200;
  for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + (i / N) * 2 * Math.PI; const x = A.c[0] + A.r[0] * Math.cos(a), y = A.c[1] + A.r[1] * Math.sin(a); if (!dentroE(V, x, y)) pts.push(new THREE.Vector2(x, y)); }
  for (let i = 0; i <= N; i++) { const a = Math.PI / 2 + (i / N) * 2 * Math.PI; const x = V.c[0] + V.r[0] * Math.cos(a), y = V.c[1] + V.r[1] * Math.sin(a); if (!dentroE(A, x, y)) pts.push(new THREE.Vector2(x, y)); }
  return pts;
}
function pescoco(A, V) { // as duas pontas do pescoço (onde ficam as dobradiças da válvula)
  const pts = []; const N = 720;
  for (let i = 0; i < N; i++) { const a = (i / N) * 2 * Math.PI; const x = A.c[0] + A.r[0] * Math.cos(a), y = A.c[1] + A.r[1] * Math.sin(a); const dentro = dentroE(V, x, y); const a2 = ((i + 1) / N) * 2 * Math.PI; const x2 = A.c[0] + A.r[0] * Math.cos(a2), y2 = A.c[1] + A.r[1] * Math.sin(a2); if (dentro !== dentroE(V, x2, y2)) pts.push(new THREE.Vector2(x, y)); }
  pts.sort((p, q) => p.x - q.x); return pts; // [esquerda, direita]
}
const contorno = []; for (let i = 0; i < 240; i++) { const a = (i / 240) * 2 * Math.PI; const p = forma(Math.cos(a), Math.sin(a), 0); contorno.push(new THREE.Vector2(p.x, p.y)); }
const shape = new THREE.Shape(contorno);
shape.holes.push(new THREE.Path(uniao(CAM.AD, CAM.VD)), new THREE.Path(uniao(CAM.AE, CAM.VE)));
const placaG = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 1 });
placaG.translate(0, 0, -0.05);
const PLACA0 = placaG.attributes.position.array.slice();
const placaM = new THREE.MeshStandardMaterial({ map: corte, color: 0x9a6a6e, roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
// UV do corte: coordenada plana
{ const uv = placaG.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, PLACA0[i * 3] * 0.32 + 0.5, PLACA0[i * 3 + 1] * 0.32 + 0.5); }
{ // parede: borda escura no endocárdio e no epicárdio, desenhada na textura do corte (UV plano)
  const cv = corte.image, g = cv.getContext('2d'), N = cv.width, X = (x) => (x * 0.32 + 0.5) * N, Y = (y) => (1 - (y * 0.32 + 0.5)) * N;
  const traca = (pts, w, cor) => { g.strokeStyle = cor; g.lineWidth = w; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(p.x), Y(p.y)) : g.moveTo(X(p.x), Y(p.y)))); g.closePath(); g.stroke(); };
  for (const pts of [uniao(CAM.AD, CAM.VD), uniao(CAM.AE, CAM.VE), contorno]) { traca(pts, 34, 'rgba(60,0,10,0.18)'); traca(pts, 18, 'rgba(60,0,10,0.3)'); traca(pts, 7, 'rgba(40,0,6,0.55)'); }
  corte.needsUpdate = true;
}
const placa = new THREE.Mesh(placaG, placaM); tras.add(placa);

// cavidades: tigelas (lado de dentro de elipsoides) cortadas no mesmo plano
const cav = {};
for (const [k, e] of Object.entries(CAM)) {
  const g = new THREE.SphereGeometry(1, 64, 48); g.scale(e.r[0], e.r[1], 0.62 * Math.min(e.r[0], e.r[1]) + 0.25); g.translate(e.c[0], e.c[1], -0.02);
  const m = new THREE.MeshStandardMaterial({ color: 0x5e1318, roughness: 0.5, side: THREE.BackSide, clippingPlanes: [clipTras], emissive: 0x000000 });
  const me = new THREE.Mesh(g, m); me.userData.p0 = g.attributes.position.array.slice(); tras.add(me); cav[k] = me;
}

// ------------------------------------------------------------- vasos (cortados no mesmo plano: metade fica, metade sai com a porta)
function tubo(pts, r, cor, raioFim = r) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => v3(...p)));
  const g = new THREE.TubeGeometry(c, 120, 1, 28, false);
  const a = g.attributes.position, cen = c.getSpacedPoints(120);
  for (let i = 0; i < a.count; i++) { const seg = Math.floor(i / 29), k = seg / 120, rr = lerp(r, raioFim, k); const o = cen[Math.min(120, seg)]; a.setXYZ(i, o.x + (a.getX(i) - o.x) * rr, o.y + (a.getY(i) - o.y) * rr, o.z + (a.getZ(i) - o.z) * rr); }
  g.computeVertexNormals();
  const gT = new THREE.Group(), gF = new THREE.Group();
  gT.add(new THREE.Mesh(g, vaso(cor, clipTras))); gF.add(new THREE.Mesh(g, vaso(cor, clipFrente)));
  tras.add(gT); frente.add(gF);
  return { curva: c, gT, gF };
}
const VERM = 0xb3262b, AZUL = 0x2f5fb8;
const aorta = tubo([[0.12, 0.85, -0.15], [0.16, 1.6, -0.1], [0.2, 2.15, -0.1], [0.6, 2.6, -0.4], [1.05, 2.4, -0.8], [1.15, 1.6, -1.05], [1.05, 0.6, -1.2]], 0.31, VERM, 0.26);
const ramos = [[0.35, 2.5, -0.25], [0.62, 2.62, -0.45], [0.88, 2.55, -0.65]].map((p, i) => tubo([p, [p[0] - 0.05 + i * 0.05, p[1] + 0.75, p[2]]], 0.1 - i * 0.008, VERM));
const pulmonar = tubo([[-0.12, 0.62, 0.12], [-0.05, 1.3, 0.16], [0.0, 1.78, 0.12]], 0.28, AZUL);
const pulmE = tubo([[0.0, 1.78, 0.12], [0.6, 1.98, -0.05], [1.55, 2.05, -0.3]], 0.17, AZUL, 0.14);
const pulmD = tubo([[0.0, 1.78, 0.12], [-0.6, 1.95, -0.25], [-1.6, 1.9, -0.45]], 0.17, AZUL, 0.14);
const cavaS = tubo([[-0.86, 2.75, -0.25], [-0.84, 1.9, -0.25], [-0.78, 1.12, -0.22]], 0.23, AZUL);
const cavaI = tubo([[-0.82, 0.42, -0.5], [-0.86, -0.4, -0.62], [-0.9, -1.2, -0.7]], 0.22, AZUL);
const vpE1 = tubo([[0.85, 0.98, -0.5], [1.35, 1.06, -0.55], [1.85, 1.1, -0.6]], 0.12, VERM);
const vpE2 = tubo([[0.85, 0.68, -0.55], [1.35, 0.6, -0.6], [1.85, 0.52, -0.66]], 0.12, VERM);
const vpD1 = tubo([[0.4, 0.95, -0.75], [-0.6, 1.0, -0.95], [-1.75, 1.05, -1.0]], 0.11, VERM);

// coronárias na superfície (artéria vermelha + veia azul no sulco)
function naSuperficie(lista, r, cor) {
  const pts = lista.map(([x, y]) => { const z = Math.sqrt(Math.max(0.0001, 1 - x * x - y * y)); return forma(x, y, z).multiplyScalar(1.012); });
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, r, 10, false);
  const m = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: cor, roughness: 0.35, clearcoat: 0.6, clippingPlanes: [clipFrente] }));
  frente.add(m); return m;
}
const ladY = (Y) => (Y + 0.28) / 1.72;
const lad = []; for (let i = 0; i <= 14; i++) { const Y = lerp(0.36, -1.75, i / 14), y = ladY(Y), t = (y + 1) / 2, larg = 1.62 * (0.72 + 0.28 * Math.min(1, t * 1.6)); lad.push([(-0.05 + (0.3 - Y) * 0.2) / larg, y]); }
naSuperficie(lad, 0.045, 0xc22a2f);
naSuperficie(lad.map(([x, y]) => [x + 0.05, y]), 0.03, 0x34507e);
const sulco = []; for (let i = 0; i <= 16; i++) { const a = lerp(-0.95, 0.95, i / 16), y = ladY(0.38), r = Math.sqrt(1 - y * y) * 0.999; sulco.push([Math.sin(a) * r, y]); }
naSuperficie(sulco, 0.05, 0xc22a2f);
for (const [i0, dx, dy] of [[4, 0.32, -0.18], [7, 0.3, -0.2], [9, -0.26, -0.16]]) { const [x, y] = lad[i0]; naSuperficie([[x, y], [x + dx * 0.5, y + dy * 0.5], [x + dx, y + dy]], 0.028, 0xc22a2f); }

// ------------------------------------------------------------- válvulas
const VALV = new THREE.MeshPhysicalMaterial({ color: 0xeedfd6, roughness: 0.45, clearcoat: 0.3, side: THREE.DoubleSide });
function valvulaAV(A, V) {
  const [pe, pd] = pescoco(A, V); const meio = (pd.x - pe.x) / 2;
  const fazer = (p, lado) => { const piv = new THREE.Group(); piv.position.set(p.x, p.y, -0.13); const f = new THREE.Mesh(new THREE.BoxGeometry(meio * 1.08, 0.04, 0.24), VALV); f.position.x = lado * meio * 0.54; piv.add(f); tras.add(piv); piv.userData = { lado, p }; return piv; };
  return { abas: [fazer(pe, 1), fazer(pd, -1)], centro: v3((pe.x + pd.x) / 2, (pe.y + pd.y) / 2, -0.1) };
}
const tricuspide = valvulaAV(CAM.AD, CAM.VD), mitral = valvulaAV(CAM.AE, CAM.VE);
function valvulaSL(curva, r) { // 3 cúspides na raiz do vaso
  const g = new THREE.Group(); const p = curva.getPointAt(0.02), tg = curva.getTangentAt(0.02);
  g.position.copy(p); g.quaternion.setFromUnitVectors(v3(0, 1, 0), tg);
  const cus = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), VALV.clone()); m.material.clippingPlanes = [clipTras]; m.scale.set(r * 0.42, r * 0.16, r * 0.42); m.userData.a = i * 2.094 + 0.5; g.add(m); return m; });
  tras.add(g); return { g, cus, r };
}
const vAortica = valvulaSL(aorta.curva, 0.31), vPulmonar = valvulaSL(pulmonar.curva, 0.28);

// ------------------------------------------------------------- sangue (azul = sem oxigênio, vermelho = com oxigênio — convenção)
const curva = (pts) => new THREE.CatmullRomCurve3(pts.map((p) => v3(...p)));
const cAzulA = curva([[-0.86, 2.7, -0.25], [-0.82, 1.6, -0.24], [-0.7, 0.86, -0.2], [-0.62, 0.48, -0.2], [-0.62, -0.3, -0.2], [-0.5, -0.95, -0.2], [-0.24, -0.5, -0.15], [-0.18, 0.2, -0.05], [-0.1, 0.8, 0.12], [-0.04, 1.4, 0.15], [0.0, 1.78, 0.12], [0.7, 2.0, -0.06], [1.55, 2.05, -0.3]]);
const cAzulB = curva([[-0.86, 2.7, -0.25], [-0.82, 1.6, -0.24], [-0.7, 0.86, -0.2], [-0.62, 0.48, -0.2], [-0.62, -0.3, -0.2], [-0.5, -0.95, -0.2], [-0.24, -0.5, -0.15], [-0.18, 0.2, -0.05], [-0.1, 0.8, 0.12], [-0.04, 1.4, 0.15], [0.0, 1.78, 0.12], [-0.7, 1.95, -0.27], [-1.6, 1.9, -0.45]]);
const cVerm = curva([[1.85, 1.1, -0.6], [1.2, 1.0, -0.5], [0.7, 0.82, -0.2], [0.6, 0.5, -0.2], [0.56, -0.3, -0.2], [0.5, -1.05, -0.2], [0.26, -0.45, -0.15], [0.2, 0.3, -0.15], [0.13, 0.95, -0.15], [0.17, 1.7, -0.1], [0.25, 2.2, -0.12], [0.6, 2.58, -0.4], [1.05, 2.38, -0.8], [1.15, 1.6, -1.05], [1.05, 0.7, -1.2]]);
const sAzul = fluxo(scene, [cAzulA, cAzulB], { n: 110, cor: 0x3d7be0, r: 0.05, seed: 5, jit: 0.07, pai: coracao });
const sVerm = fluxo(scene, [cVerm], { n: 110, cor: 0xe0303a, r: 0.05, seed: 9, jit: 0.07, pai: coracao });
const avancoSangue = (t) => { const b = Math.floor(t * FREQ) + sm(0.17, 0.48, fase(t)); return 0.07 * b + 0.025 * t; };
const defSangue = (P) => { if (P.y < 1.2 && Math.abs(P.x) < 1.3 && P.z < 0.05) deforma(P); };

// ------------------------------------------------------------- sinal elétrico (nó sinoatrial → nó AV → feixe → ramos)
const AMAR = 0xfacc15;
const cSinal = curva([[-0.74, 1.1, 0.02], [-0.45, 0.75, 0.02], [-0.06, 0.48, 0.02], [0.03, 0.0, 0.02], [0.04, -0.7, 0.02], [0.05, -1.25, 0.02]]);
const cRamoE = curva([[0.05, -1.25, 0.02], [0.5, -1.35, 0.02], [0.95, -0.7, 0.02], [1.05, 0.1, 0.02]]);
const cRamoD = curva([[0.05, -1.25, 0.02], [-0.45, -1.3, 0.02], [-1.0, -0.6, 0.02], [-1.12, 0.1, 0.02]]);
const fio = (c) => { const g = new THREE.TubeGeometry(c, 160, 0.035, 8, false); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: AMAR, transparent: true, opacity: 0 })); tras.add(m); return m; };
const fios = [fio(cSinal), fio(cRamoE), fio(cRamoD)];
const fiosBase = [cSinal, cRamoE, cRamoD].map((c) => { const m = new THREE.Mesh(new THREE.TubeGeometry(c, 160, 0.02, 6, false), new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0 })); tras.add(m); return m; });
const noSA = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), new THREE.MeshBasicMaterial({ color: AMAR, transparent: true, opacity: 0 })); noSA.position.set(-0.74, 1.1, 0.04); tras.add(noSA);
const noAV = noSA.clone(); noAV.material = noSA.material.clone(); noAV.position.set(-0.06, 0.48, 0.04); noAV.scale.setScalar(0.75); tras.add(noAV);

// ------------------------------------------------------------- relógio da história
const T = {
  abre: [F.camaras.ini - 0.15, F.camaras.ini + 1.1],
  fecha: [F.volta.ini + 0.1, F.volta.ini + 1.3],
  explode: [B.b7.ini - 0.1, B.b7.ini + 1.3], junta: [F.volta.ini - 0.1, F.volta.ini + 1.1],
};
const loc = (x, y, z = 0) => () => coracao.localToWorld(v3(x, y, z));
const alvoLocal = (x, y, z = 0) => { coracao.updateMatrixWorld(); return coracao.localToWorld(v3(x, y, z)); };
const C0 = [-28, 7, 19.5, alvoLocal(0.2, 1.3)];
const camAnda = cameraPorChaves(camera, [
  [0, ...C0], [F.titulo.fim + 0.6, -25, 6, 19.3, alvoLocal(0.2, 1.2)],
  [F.batidas.fim, -12, 5, 18.5, alvoLocal(0.2, 0.55)],
  [F.camaras.ini + 1.3, 0, 1, 17.0, alvoLocal(0.05, 0.6)],
  [F.camaras.fim, 0, 0, 16.6, alvoLocal(0.05, 0.6)],
  [F.azul.fim, -5, 2, 15.6, alvoLocal(-0.35, 0.95)],
  [F.vermelho.fim, 5, 2, 15.6, alvoLocal(0.4, 0.95)],
  [palavra('valvulas', 'tum') , 0, 0, 12.2, alvoLocal(0.0, 0.5)],
  [F.valvulas.fim, 0, 0, 12.0, alvoLocal(0.0, 0.48)],
  [F.sinal.fim, 0, 0, 15.2, alvoLocal(0.0, 0.0)],
  [F.pecas.fim, 22, 8, 20.5, alvoLocal(0.15, 0.95)],
  [F.volta.ini + 1.3, -28, 7, 19.5, alvoLocal(0.2, 1.3)],
  [FIM, ...C0],
]);

// explodida: cada peça sai na sua direção
const SAI = [
  [aorta, v3(0.9, 1.15, 0)], [pulmonar, v3(-0.35, 1.3, 0.9)], [pulmE, v3(0.6, 1.4, 0.9)], [pulmD, v3(-1.1, 1.4, 0.9)],
  [cavaS, v3(-1.3, 0.8, 0)], [cavaI, v3(-1.2, -0.9, 0)], [vpE1, v3(1.3, 0.3, 0)], [vpE2, v3(1.3, -0.1, 0)], [vpD1, v3(-0.4, 0.2, -0.9)],
  ...ramos.map((r) => [r, v3(0.9, 1.6, 0)]),
];

// etiquetas (lado da tela, altura fixa em px, peça no fio)
const vasoPonto = (v, s, dx = 0) => () => { const p = v.curva.getPointAt(s).add(v.gT.position); p.x += dx; return coracao.localToWorld(p); };
const ETI = etiquetas([
  { txt: 'Átrio<br>direito', lado: 'e', y: 700, alvo: loc(-0.7, 0.85, -0.3), de: palavra('camaras', 'átrios') - 0.1, ate: F.camaras.fim + 0.5 },
  { txt: 'Átrio<br>esquerdo', lado: 'd', y: 640, alvo: loc(0.66, 0.85, -0.3), de: palavra('camaras', 'átrios') + 0.2, ate: F.camaras.fim + 0.5 },
  { txt: 'Ventrículo<br>direito', lado: 'e', y: 1110, alvo: loc(-0.62, -0.4, -0.3), de: palavra('camaras', 'ventrículos') - 0.1, ate: F.camaras.fim + 0.5 },
  { txt: 'Ventrículo<br>esquerdo', lado: 'd', y: 1060, alvo: loc(0.5, -0.5, -0.3), de: palavra('camaras', 'ventrículos') + 0.2, ate: F.camaras.fim + 0.5 },
  { txt: 'Veia cava', sub: 'vem do corpo', lado: 'e', y: 560, alvo: vasoPonto(cavaS, 0.25), de: F.azul.ini + 0.2, ate: F.azul.fim + 0.3 },
  { txt: 'Artéria<br>pulmonar', sub: 'vai aos pulmões', lado: 'e', y: 830, alvo: vasoPonto(pulmD, 0.75), de: palavra('azul', 'pulmões') - 0.6, ate: F.vermelho.ini + 0.9 },
  { txt: 'Veias<br>pulmonares', sub: 'vêm dos pulmões', lado: 'd', y: 820, alvo: vasoPonto(vpE1, 0.8), de: F.vermelho.ini + 0.1, ate: F.vermelho.fim + 0.3 },
  { txt: 'Aorta', sub: 'vai ao corpo', lado: 'd', y: 560, alvo: vasoPonto(aorta, 0.45), de: palavra('vermelho', 'aorta') - 0.5, ate: F.valvulas.ini + 1.0, q: true },
  { txt: 'Tricúspide', lado: 'e', y: 760, alvo: () => coracao.localToWorld(tricuspide.centro.clone()), de: palavra('valvulas', 'válvulas') - 0.1, ate: F.valvulas.fim + 0.2 },
  { txt: 'Mitral', lado: 'd', y: 760, alvo: () => coracao.localToWorld(mitral.centro.clone()), de: palavra('valvulas', 'válvulas') + 0.1, ate: F.valvulas.fim + 0.2 },
  { txt: 'Nó sinoatrial', sub: 'o marca-passo', lado: 'e', y: 600, alvo: () => noSA.getWorldPosition(v3(0, 0, 0)), de: palavra('sinal', 'elétrico') - 0.1, ate: F.sinal.fim + 0.3, q: true },
  { txt: 'Aorta', lado: 'd', y: 470, alvo: vasoPonto(aorta, 0.3), de: B.b7.ini + 0.9, ate: F.volta.ini + 0.5 },
  { txt: 'Veia cava', lado: 'e', y: 690, alvo: vasoPonto(cavaS, 0.3), de: B.b7.ini + 1.1, ate: F.volta.ini + 0.5 },
  { txt: 'Veias pulmonares', lado: 'd', y: 1150, alvo: vasoPonto(vpE1, 0.9), de: B.b7.ini + 1.2, ate: F.volta.ini + 0.5 },
  { txt: '4 câmaras', sub: '4 válvulas', lado: 'e', y: 1150, alvo: loc(-0.5, -0.2, -0.2), de: B.b7.ini + 1.3, ate: F.volta.ini + 0.5, q: true },
]);

// monitor (ECG)
const ecg = (p) => 0.18 * bump(p, 0.02, 0.12) + (p > 0.155 && p < 0.175 ? -0.25 * bump(p, 0.155, 0.175) : 0) + 1.0 * bump(p, 0.17, 0.205) - 0.35 * bump(p, 0.205, 0.235) + 0.3 * bump(p, 0.33, 0.47);
const elECG = document.getElementById('mo-ecg'), elN = document.getElementById('mo-n');
const elTum = document.getElementById('som-tum'), elTa = document.getElementById('som-ta');
function monitor(t) {
  document.getElementById('monitor').style.opacity = ramp(t, F.titulo.fim + 0.5, F.titulo.fim + 0.9) * (1 - ramp(t, F.volta.ini - 0.2, F.volta.ini + 0.2));
  let s = '';
  for (let i = 0; i < 70; i++) { const tau = t - 2 + (i / 69) * 2; s += `${(i / 69 * 200).toFixed(1)},${(42 - 30 * ecg(fase(tau))).toFixed(1)} `; }
  elECG.setAttribute('points', s);
  elN.textContent = Math.floor(t * FREQ + 0.83);
  const jan = win(t, F.valvulas.ini, F.valvulas.fim + 0.3, 0.2, 0.2), p = fase(t);
  const pulso = (a) => { const d = ((p - a) % 1 + 1) % 1; return d < 0.3 ? 1 - d / 0.3 : 0; };
  elTum.style.opacity = jan * (0.35 + 0.65 * pulso(0.17)); elTa.style.opacity = jan * (0.35 + 0.65 * pulso(0.48));
  elTum.style.transform = `scale(${1 + 0.15 * pulso(0.17)})`; elTa.style.transform = `scale(${1 + 0.15 * pulso(0.48)})`;
}

// ------------------------------------------------------------- um quadro
const tmp = new THREE.Vector3();
function renderAt(t) {
  VV = vent(t); AA = atrio(t);
  // pulsar a casca, a placa e as cavidades
  const pa = casca.attributes.position.array;
  for (let i = 0; i < pa.length; i += 3) { tmp.set(FORMA0[i], FORMA0[i + 1], FORMA0[i + 2]); deforma(tmp); pa[i] = tmp.x; pa[i + 1] = tmp.y; pa[i + 2] = tmp.z; }
  casca.attributes.position.needsUpdate = true; casca.computeVertexNormals();
  const pp = placaG.attributes.position.array;
  for (let i = 0; i < pp.length; i += 3) { tmp.set(PLACA0[i], PLACA0[i + 1], 0); deforma(tmp); pp[i] = tmp.x; pp[i + 1] = tmp.y; }
  placaG.attributes.position.needsUpdate = true;
  for (const me of Object.values(cav)) { const a = me.geometry.attributes.position.array, p0 = me.userData.p0; for (let i = 0; i < a.length; i += 3) { tmp.set(p0[i], p0[i + 1], p0[i + 2]); deforma(tmp); a[i] = tmp.x; a[i + 1] = tmp.y; a[i + 2] = tmp.z; } me.geometry.attributes.position.needsUpdate = true; }
  aurD.scale.set(0.42 * (1 - 0.12 * AA), 0.24, 0.26 * (1 - 0.12 * AA)); aurE.scale.set(0.36 * (1 - 0.12 * AA), 0.2, 0.22 * (1 - 0.12 * AA));

  // a porta abre e fecha
  const abre = io(ramp(t, ...T.abre)) * (1 - io(ramp(t, ...T.fecha)));
  const ex0 = io(ramp(t, ...T.explode)) * (1 - io(ramp(t, ...T.junta)));
  dobra.rotation.y = -abre * 1.95;
  frente.visible = abre < 0.995;
  const placaOn = abre > 0.001; placa.visible = placaOn; for (const me of Object.values(cav)) me.visible = placaOn;

  // explodida
  const ex = io(ramp(t, ...T.explode)) * (1 - io(ramp(t, ...T.junta)));
  for (const [v, d] of SAI) { v.gT.position.copy(d).multiplyScalar(0.7 * ex); v.gF.position.copy(d).multiplyScalar(0.7 * ex); }
  for (const s of [vAortica]) s.g.position.copy(aorta.curva.getPointAt(0.02)).addScaledVector(SAI[0][1], 0.7 * ex);
  vPulmonar.g.position.copy(pulmonar.curva.getPointAt(0.02)).addScaledVector(SAI[1][1], 0.7 * ex);
  placa.position.z = 0; tras.position.z = -0.0;

  // planos de corte no referencial de cada metade
  coracao.updateMatrixWorld(true);
  clipTras.copy(PL_TRAS).applyMatrix4(coracao.matrixWorld);
  clipFrente.copy(PL_FRENTE).applyMatrix4(frente.matrixWorld);
  // fora do corte, nada é cortado: o plano de trás vai para longe

  // válvulas: abrem e fecham no tempo do batimento (F5, F6)
  const av = avAberta(t), sl = slAberta(t);
  for (const v of [tricuspide, mitral]) for (const a of v.abas) { tmp.set(a.userData.p.x, a.userData.p.y, 0); deforma(tmp); a.position.set(tmp.x, tmp.y, -0.13); a.rotation.z = a.userData.lado * -av * 1.15; }
  for (const v of [vAortica, vPulmonar]) for (const c of v.cus) { const rr = v.r * lerp(0.32, 0.72, sl); c.position.set(Math.cos(c.userData.a) * rr, 0.05, Math.sin(c.userData.a) * rr); c.rotation.z = 0; c.rotation.x = 0; }

  // cor das cavidades: o lado que a fala nomeia ganha luz própria
  const kAz = win(t, F.azul.ini - 0.1, F.vermelho.ini + 0.3, 0.5, 0.4), kVm = win(t, F.vermelho.ini - 0.1, F.valvulas.ini + 0.2, 0.5, 0.4);
  cav.AD.material.emissive.setRGB(0.05 * kAz, 0.12 * kAz, 0.38 * kAz); cav.VD.material.emissive.copy(cav.AD.material.emissive);
  cav.AE.material.emissive.setRGB(0.4 * kVm, 0.04 * kVm, 0.06 * kVm); cav.VE.material.emissive.copy(cav.AE.material.emissive);

  // sangue
  const fluxoOn = placaOn ? win(t, F.azul.ini - 0.3, F.pecas.ini, 0.5, 0.5) : 0;
  sAzul(avancoSangue(t), fluxoOn * (t < F.vermelho.ini ? 1 : 0.55), defSangue);
  sVerm(avancoSangue(t) + 0.31, fluxoOn * (t < F.vermelho.ini - 0.2 ? 0.25 : 1), defSangue);

  // sinal elétrico: a cada batida corre do nó sinoatrial até a ponta
  const kS = win(t, F.sinal.ini - 0.2, F.pecas.ini + 0.2, 0.4, 0.4), p = fase(t);
  const prog = [ramp(p, 0.0, 0.2), ramp(p, 0.17, 0.32), ramp(p, 0.17, 0.32)];
  fios.forEach((m, i) => { m.material.opacity = kS * (1 - ramp(p, 0.4, 0.6)); m.geometry.setDrawRange(0, Math.floor(prog[i] * m.geometry.index.count / 6) * 6); });
  fiosBase.forEach((m) => { m.material.opacity = 0.35 * kS; });
  noSA.material.opacity = kS; noSA.scale.setScalar(1 + 0.6 * bump(p, 0, 0.12));
  noAV.material.opacity = kS * 0.9;

  camAnda(t);
  ETI(t, camera);
  monitor(t);
  cartoes(t, F, B);
  legenda(t < F.titulo.fim + 0.6 ? -1 : t, LEG);
  renderer.render(scene, camera);
}

ligar('coracao-por-dentro', renderAt);
