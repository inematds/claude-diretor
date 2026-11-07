// "Um motor a jato por dentro" — turbofan 3D feito só com código, desenhado a partir do tempo do vídeo.
// Fatos: fatos.md. Eixo do motor = x local (entrada em -x, bocal em +x); o grupo é inclinado na diagonal do 9:16.
// Cenas: capa → ventilador (16 pás, 3,4 m) → corte: ar por fora × núcleo → compressor (×60) → combustão
// → turbina e os 2 eixos → bocal (empuxo) → vista explodida (aspira, comprime, queima, sopra) → fecha e volta à capa.
import {
  THREE, W, H, clamp, lerp, ramp, io, out3, win, v3, rng, criarMundo, legenda, cartoes, ligar,
} from '../motor/base.js';
import { FIM, BLOCOS as B, FRASES as F, LEG, palavra } from './tempos.js';
import { estudio, cameraPorChaves, etiquetas, texturaFibras } from './oficina.js';

const { renderer, scene, camera } = criarMundo();
camera.fov = 30; camera.updateProjectionMatrix();
estudio(renderer, scene, { env: 0.75, centro: '#1c2430', cy: 0.52 });

const motor = new THREE.Group(); motor.rotation.z = -0.78; scene.add(motor);
// corte em quarto: some só onde y > c E z > c (clipIntersection)
const PL1 = new THREE.Plane(v3(0, -1, 0), 99), PL2 = new THREE.Plane(v3(0, 0, -1), 99);
const cl1 = new THREE.Plane(), cl2 = new THREE.Plane();
const CORTE = [cl1, cl2];

// ------------------------------------------------------------- materiais
const escovado = texturaFibras({ base: '#c9ced4', claro: 'rgba(255,255,255,0.10)', escuro: 'rgba(60,70,80,0.10)', ang: 0, seed: 21, n: 1600 });
const metal = (cor, { rough = 0.32, metal: me = 0.85, corta = true, map = null, extra = {} } = {}) => new THREE.MeshPhysicalMaterial({
  color: cor, roughness: rough, metalness: me, map, side: THREE.DoubleSide,
  clippingPlanes: corta ? CORTE : [], clipIntersection: true, ...extra,
});
const M = {
  nacele: metal(0xc4c9cf, { rough: 0.4, metal: 0.3, extra: { clearcoat: 0.6, clearcoatRoughness: 0.25 } }),
  naceleDentro: metal(0x5d646c, { rough: 0.55, metal: 0.4 }),
  fan: metal(0x262b31, { rough: 0.3, metal: 0.55, corta: false, extra: { clearcoat: 0.7, clearcoatRoughness: 0.2 } }),
  spinner: metal(0xb9c0c8, { rough: 0.18, metal: 0.95, corta: false }),
  casca: metal(0xaab2bb, { rough: 0.35, map: escovado }),
  comp: metal(0xc6ccd3, { rough: 0.25, corta: false }),
  hub: metal(0x7c858f, { rough: 0.4 }),
  quente: metal(0x8f7c6e, { rough: 0.38, corta: false, extra: { emissive: new THREE.Color(0x3a1404), emissiveIntensity: 0 } }),
  liner: metal(0x9a8f86, { rough: 0.45 }),
  bocal: metal(0x6e6862, { rough: 0.4, metal: 0.9 }),
};
const lathe = (perfil, mat, seg = 160) => {
  const g = new THREE.LatheGeometry(perfil.map(([x, r]) => new THREE.Vector2(r, x)), seg);
  g.rotateZ(-Math.PI / 2); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
};

// ------------------------------------------------------------- peças (cada uma num grupo que a explodida desloca)
const P = {}; for (const k of ['nacele', 'fan', 'comp', 'camara', 'turb', 'bocal', 'eixos']) { P[k] = new THREE.Group(); motor.add(P[k]); }

// nacele (carenagem branca): perfil fechado, casca fina
P.nacele.add(lathe([[-3.15, 1.8], [-2.7, 1.88], [-1.0, 1.9], [1.6, 1.82], [2.35, 1.62], [2.35, 1.68], [1.2, 2.04], [-1.0, 2.12], [-2.6, 2.06], [-3.05, 1.98], [-3.25, 1.88], [-3.15, 1.8]], M.nacele));
P.nacele.add(lathe([[-2.9, 1.84], [2.3, 1.64]], M.naceleDentro));

// ventilador: 16 pás largas e torcidas (GE9X: 16 pás de compósito) + cone
function pa(r0, r1, corda, torcao, passo, seg = 14) {
  const g = new THREE.PlaneGeometry(corda, r1 - r0, 4, seg); g.translate(0, (r0 + r1) / 2, 0);
  const a = g.attributes.position;
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i), y = a.getY(i), k = (y - r0) / (r1 - r0);
    const ang = passo + torcao * k, c = 1 - 0.25 * k; // largura diminui na ponta
    const xc = x * c * (1 + 0.35 * Math.sin(Math.PI * k));
    a.setXYZ(i, xc * Math.cos(ang), y, xc * Math.sin(ang) + 0.06 * Math.sin(Math.PI * (x / corda + 0.5)) );
  }
  g.computeVertexNormals(); return g;
}
function rotor(n, x, r0, r1, corda, torcao, passo, mat, pai) {
  const g = pa(r0, r1, corda, torcao, passo);
  const inst = new THREE.InstancedMesh(g, mat, n); const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeRotationX((i / n) * Math.PI * 2); inst.setMatrixAt(i, m4); }
  const gr = new THREE.Group(); gr.position.x = x; gr.add(inst); pai.add(gr); return gr;
}
const fan = rotor(16, -2.25, 0.5, 1.84, 0.62, 0.95, 0.25, M.fan, P.fan);
const spin = lathe([[-3.05, 0.0], [-2.95, 0.18], [-2.75, 0.38], [-2.5, 0.5], [-2.15, 0.56], [-1.9, 0.56]], M.spinner, 96); P.fan.add(spin);
P.fan.add(lathe([[-1.95, 0.56], [-1.55, 0.98], [-1.5, 0.98]], M.hub, 120)); // divisor do fluxo (bico do núcleo)

// compressor: 10 estágios, cada vez menores (o ar é espremido)
const estagios = [];
for (let i = 0; i < 10; i++) {
  const k = i / 9, x = lerp(-1.35, 0.85, k), r1 = lerp(0.88, 0.52, k), r0 = lerp(0.36, 0.42, k);
  estagios.push(rotor(Math.round(lerp(34, 52, k)), x, r0, r1, 0.13, 0.6, 0.55, M.comp, P.comp));
}
P.comp.add(lathe([[-1.5, 0.34], [-1.0, 0.36], [0.95, 0.42]], M.hub, 96));
// casca do núcleo (cortada em quarto para ver dentro)
const casca = lathe([[-1.5, 0.98], [-0.6, 0.86], [0.95, 0.6], [1.0, 0.74], [1.95, 0.76], [2.0, 0.68], [2.4, 0.7], [3.35, 0.94], [3.5, 0.9], [4.25, 0.6]], M.casca, 160);
P.comp.add(casca);

// câmara de combustão: anel (liner) + chama + 18 bicos de combustível
const liner = lathe([[1.02, 0.47], [1.15, 0.43], [1.85, 0.45], [1.95, 0.5], [1.95, 0.66], [1.85, 0.71], [1.15, 0.72], [1.02, 0.66], [1.02, 0.47]], M.liner, 120);
P.camara.add(liner);
const chamaMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
const chamas = [];
for (let i = 0; i < 3; i++) { const c = lathe([[1.12, 0.5 + i * 0.02], [1.5, 0.52 + i * 0.03], [1.9, 0.5 + i * 0.02], [1.9, 0.66 - i * 0.02], [1.5, 0.66 - i * 0.03], [1.12, 0.64 - i * 0.02]], chamaMat.clone(), 90); c.material.color.setHex([0xff5a10, 0xff8a24, 0xffc070][i]); P.camara.add(c); chamas.push(c); }
for (let i = 0; i < 18; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 10), M.hub); const a = (i / 18) * Math.PI * 2; b.position.set(1.0, Math.sin(a) * 0.59, Math.cos(a) * 0.59); b.rotation.z = Math.PI / 2; P.camara.add(b); }

// turbina: 2 estágios de alta + 6 de baixa (maiores)
const turbinas = [];
for (let i = 0; i < 8; i++) {
  const alta = i < 2, k = alta ? i : (i - 2) / 5;
  const x = alta ? 2.08 + i * 0.18 : lerp(2.5, 3.28, k), r0 = alta ? 0.44 : lerp(0.45, 0.5, k), r1 = alta ? 0.64 : lerp(0.7, 0.88, k);
  turbinas.push(rotor(alta ? 60 : 64, x, r0, r1, 0.11, -0.7, -0.6, M.quente, P.turb));
}
P.turb.add(lathe([[2.0, 0.42], [3.35, 0.48]], M.hub, 96));

// bocal + cone de saída
P.bocal.add(lathe([[3.35, 0.47], [3.9, 0.44], [4.5, 0.18], [4.68, 0.0]], M.bocal, 96));
P.bocal.add(lathe([[3.48, 0.92], [4.28, 0.62], [4.3, 0.58]], M.bocal, 120));

// dois eixos, um dentro do outro (NASA: two spool)
const eixoBaixa = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.8, 24), metal(0xb8c0c8, { rough: 0.2, corta: false, extra: { emissive: new THREE.Color(0xfacc15), emissiveIntensity: 0 } }));
eixoBaixa.rotation.z = Math.PI / 2; eixoBaixa.position.x = 0.55; P.eixos.add(eixoBaixa);
const eixoAlta = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.0, 32, 1, true), metal(0x8d969f, { rough: 0.25, corta: false, extra: { emissive: new THREE.Color(0xfacc15), emissiveIntensity: 0 } }));
eixoAlta.rotation.z = Math.PI / 2; eixoAlta.position.x = 0.75; P.eixos.add(eixoAlta);

// seta do empuxo (o motor é empurrado para a frente = -x)
const seta = new THREE.Group();
{ const m = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0 }); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.6, 20), m); c.rotation.z = Math.PI / 2; const p = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.55, 28), m); p.rotation.z = Math.PI / 2; p.position.x = -1.05; seta.add(c, p); seta.position.set(-0.6, 2.75, 0); motor.add(seta); seta.userData.m = m; }

// ------------------------------------------------------------- o ar: partículas com cor pela temperatura
const R = rng(42);
function ar(n, raio, faixaPhi, xIni, xFim, tam, corDe, vel, perfilX) {
  const g = new THREE.SphereGeometry(tam, 8, 6);
  const m = new THREE.MeshStandardMaterial({ roughness: 0.4, transparent: true, opacity: 0, emissive: 0xffffff, emissiveIntensity: 0.0 });
  const inst = new THREE.InstancedMesh(g, m, n); inst.frustumCulled = false; motor.add(inst);
  const ps = [...Array(n)].map(() => ({ off: R(), phi: lerp(faixaPhi[0], faixaPhi[1], R()), rr: R(), j: R() }));
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pp = new THREE.Vector3(), C = new THREE.Color();
  return (t, opac) => {
    inst.visible = opac > 0.01; m.opacity = opac; if (!inst.visible) return;
    ps.forEach((p, i) => {
      const s = ((p.off + t * vel) % 1 + 1) % 1, x = perfilX ? perfilX(s) : lerp(xIni, xFim, s);
      const r = raio(x, p.rr), ph = p.phi + 0.15 * Math.sin(6 * s + p.j * 6);
      Pp.set(x, Math.sin(ph) * r, Math.cos(ph) * r);
      const fade = Math.min(1, s / 0.04, (1 - s) / 0.06);
      S.set(1.6 + 2.2 * (vel > 0.2 ? 1 : 0.4), 1, 1).multiplyScalar(fade * (0.8 + 0.4 * p.j));
      M4.compose(Pp, Q, S); inst.setMatrixAt(i, M4);
      inst.setColorAt(i, corDe(x, C));
    });
    inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  };
}
const FRIO = new THREE.Color(0x8fc4ff), BRANCO = new THREE.Color(0xf2f6ff), LARANJA = new THREE.Color(0xff7a1a), VERM = new THREE.Color(0xff4a12), MORNO = new THREE.Color(0xffb27a);
const corNucleo = (x, C) => {
  if (x < -1.4) return C.copy(FRIO);
  if (x < 0.95) return C.copy(FRIO).lerp(BRANCO, ramp(x, -1.4, 0.95));
  if (x < 1.9) return C.copy(BRANCO).lerp(LARANJA, ramp(x, 0.95, 1.3));
  if (x < 3.4) return C.copy(LARANJA).lerp(VERM, ramp(x, 1.9, 3.4));
  return C.copy(VERM).lerp(MORNO, ramp(x, 3.4, 6));
};
// o núcleo anda devagar no compressor (o ar se acumula) e rápido no bocal
const xNucleo = (s) => s < 0.18 ? lerp(-4.6, -1.5, s / 0.18) : s < 0.55 ? lerp(-1.5, 0.95, (s - 0.18) / 0.37) : s < 0.68 ? lerp(0.95, 1.95, (s - 0.55) / 0.13) : s < 0.82 ? lerp(1.95, 3.4, (s - 0.68) / 0.14) : lerp(3.4, 7.5, (s - 0.82) / 0.18);
const rNucleo = (x, u) => {
  if (x < -2.2) return lerp(0.25, 1.1, u);
  if (x < -1.5) return lerp(0.6, 0.95, u) * lerp(1, 0.95, ramp(x, -2.2, -1.5));
  if (x < 0.95) { const k = ramp(x, -1.5, 0.95); return lerp(lerp(0.38, 0.44, k), lerp(0.86, 0.55, k), 0.15 + 0.7 * u); }
  if (x < 1.95) return lerp(0.5, 0.65, u);
  if (x < 3.4) { const k = ramp(x, 1.95, 3.4); return lerp(0.46, 0.5, k) + lerp(0.18, 0.36, k) * u; }
  return lerp(0.2, 0.5, u) * lerp(1, 0.8, ramp(x, 3.4, 7.5));
};
const rFora = (x, u) => (x < -2.2 ? lerp(1.15, 1.75, u) : x < 2.3 ? lerp(lerp(1.05, 0.8, ramp(x, -1.5, 2.3)) + 0.06, 1.72 - 0.15 * ramp(x, 1.0, 2.3), 0.15 + 0.75 * u) : lerp(0.9, 1.6, u));
const arNucleo = ar(170, rNucleo, [0.05, 1.5], 0, 0, 0.026, corNucleo, 0.11, xNucleo);
const arFora = ar(220, rFora, [0.05, 1.5], -4.6, 6.0, 0.022, (x, C) => C.copy(FRIO), 0.34);

// ------------------------------------------------------------- relógio da história
const T = {
  abre: [F.bypass.ini - 0.2, F.bypass.ini + 1.3], fecha: [F.volta.ini + 0.1, F.volta.ini + 1.3],
  explode: [F.pecas.ini - 0.2, F.pecas.ini + 1.4], junta: [F.volta.ini - 0.1, F.volta.ini + 1.1],
};
const alvo = (x, y, z = 0) => { motor.updateMatrixWorld(); return motor.localToWorld(v3(x, y, z)); };
const C0 = [-34, 14, 27, alvo(0.6, 0.0).add(v3(0, 2.0, 0))];
const camAnda = cameraPorChaves(camera, [
  [0, ...C0], [F.titulo.fim + 0.6, -38, 12, 29, alvo(0.5, 0.0).add(v3(0, 1.6, 0))],
  [F.fan.fim, -50, 8, 22, alvo(-1.2, 0.0).add(v3(0, 0.6, 0))],
  [F.bypass.fim, -22, 18, 25, alvo(-0.2, 0.7)],
  [F.compressor.fim, -14, 20, 25, alvo(-0.4, 0.9)],
  [F.combustao.fim, -10, 22, 24, alvo(0.5, 0.9)],
  [F.turbina.fim, -14, 20, 25, alvo(0.7, 0.8)],
  [F.bocal.fim, -24, 16, 28, alvo(0.6, 0.8)],
  [F.pecas.fim, -18, 14, 33, alvo(0.5, -0.6)],
  [F.volta.ini + 1.3, ...C0],
  [FIM, ...C0],
]);
const SAI = { nacele: v3(0, 3.4, 0), fan: v3(-2.4, 0, 0), comp: v3(-1.2, 0, 0), camara: v3(0.4, 0, 0), turb: v3(1.3, 0, 0), bocal: v3(2.4, 0, 0), eixos: v3(0, -1.6, 0) };

// etiquetas
const pt = (grupo, x, y, z) => () => grupo.localToWorld(v3(x, y, z));
const ETI = etiquetas([
  { txt: 'Ventilador', sub: '16 pás (GE9X)', lado: 'e', y: 600, alvo: pt(P.fan, -2.25, 1.2, 0.6), de: palavra('fan', 'ventilador') - 0.1, ate: F.fan.fim + 0.3 },
  { txt: 'Ar por fora', sub: 'a maior parte', lado: 'd', y: 620, alvo: pt(motor, 0.4, 1.0, 1.05), de: palavra('bypass', 'fora') - 0.4, ate: F.bypass.fim + 0.4, q: true },
  { txt: 'Núcleo', lado: 'e', y: 1120, alvo: pt(motor, 0.3, 0.45, 0.45), de: palavra('bypass', 'núcleo') - 0.3, ate: F.bypass.fim + 0.4 },
  { txt: 'Compressor', sub: '10 estágios', lado: 'e', y: 640, alvo: pt(P.comp, -0.4, 0.5, 0.5), de: palavra('compressor', 'espremido') - 0.2, ate: F.compressor.fim + 0.3 },
  { txt: 'Câmara de<br>combustão', lado: 'd', y: 1090, alvo: pt(P.camara, 1.5, 0.42, 0.42), de: F.combustao.ini + 0.1, ate: F.combustao.fim + 0.3, q: true },
  { txt: 'Turbina', lado: 'd', y: 1080, alvo: pt(P.turb, 2.9, 0.5, 0.5), de: palavra('turbina', 'turbina') - 0.2, ate: F.turbina.fim + 0.3 },
  { txt: '2 eixos', sub: 'um dentro do outro', lado: 'e', y: 1200, alvo: pt(P.eixos, 0.3, 0.0, 0.1), de: palavra('turbina', 'eixos') - 0.3, ate: F.turbina.fim + 0.3, q: true },
  { txt: 'Bocal', sub: 'o gás sai rápido', lado: 'd', y: 1150, alvo: pt(P.bocal, 4.0, 0.3, 0.3), de: F.bocal.ini + 0.1, ate: F.bocal.fim + 0.3 },
  { txt: 'Empuxo', sub: 'para a frente', lado: 'e', y: 520, alvo: () => seta.localToWorld(v3(-0.9, 0, 0)), de: palavra('bocal', 'empurrado') - 0.2, ate: F.bocal.fim + 0.3, q: true },
  { txt: 'Aspira', sub: 'ventilador', lado: 'e', y: 560, alvo: pt(P.fan, -2.25, 1.0, 0.4), de: palavra('pecas', 'aspira') - 0.1, ate: F.volta.ini + 0.4, q: true },
  { txt: 'Comprime', sub: 'compressor', lado: 'e', y: 820, alvo: pt(P.comp, -0.2, 0.6, 0.3), de: palavra('pecas', 'comprime') - 0.1, ate: F.volta.ini + 0.4, q: true },
  { txt: 'Queima', sub: 'combustão', lado: 'd', y: 1010, alvo: pt(P.camara, 1.5, 0.6, 0.3), de: palavra('pecas', 'queima') - 0.1, ate: F.volta.ini + 0.4, q: true },
  { txt: 'Sopra', sub: 'turbina e bocal', lado: 'd', y: 1230, alvo: pt(P.bocal, 3.9, 0.35, 0.3), de: palavra('pecas', 'sopra') - 0.1, ate: F.volta.ini + 0.4, q: true },
]);
const elPress = document.getElementById('pressao');

// ------------------------------------------------------------- um quadro
function renderAt(t) {
  // giro (o ventilador mais lento que o núcleo: eixos diferentes)
  const ang = t * 2.2; fan.rotation.x = ang; spin.rotation.x = ang; turbinas.slice(2).forEach((g) => (g.rotation.x = ang));
  estagios.forEach((g, i) => (g.rotation.x = i < 3 ? ang : -t * 3.4)); turbinas.slice(0, 2).forEach((g) => (g.rotation.x = -t * 3.4));

  // corte em quarto
  const k = io(ramp(t, ...T.abre)) * (1 - io(ramp(t, ...T.fecha)));
  const c = lerp(2.6, 0.0, k) + (k < 0.001 ? 99 : 0);
  motor.updateMatrixWorld(true);
  PL1.constant = c; PL2.constant = c;
  cl1.copy(PL1).applyMatrix4(motor.matrixWorld); cl2.copy(PL2).applyMatrix4(motor.matrixWorld);

  // explodida (as peças andam no eixo; a nacele sobe)
  const ex = io(ramp(t, ...T.explode)) * (1 - io(ramp(t, ...T.junta)));
  for (const [nome, d] of Object.entries(SAI)) P[nome].position.copy(d).multiplyScalar(ex);
  if (ex > 0.001) { cl1.copy(PL1).applyMatrix4(motor.matrixWorld); cl2.copy(PL2).applyMatrix4(motor.matrixWorld); }

  // fogo: liga na fala da combustão e fica aceso (pulsa sem acaso: soma de senos)
  const fogo = ramp(t, F.combustao.ini - 0.2, palavra('combustao', 'queima') + 0.3) * (1 - ramp(t, F.volta.ini, F.volta.ini + 0.8));
  chamas.forEach((m, i) => { m.material.opacity = fogo * (0.32 + 0.1 * Math.sin(t * 9 + i * 2) + 0.06 * Math.sin(t * 23 + i)); m.scale.set(1, 1 + 0.03 * Math.sin(t * 13 + i), 1 + 0.03 * Math.sin(t * 13 + i)); });
  M.quente.emissiveIntensity = 0.9 * fogo;
  // eixos em destaque
  const kE = win(t, palavra('turbina', 'eixos') - 0.4, F.turbina.fim + 0.4, 0.4, 0.4);
  eixoBaixa.material.emissiveIntensity = 0.8 * kE; eixoAlta.material.emissiveIntensity = 0.55 * kE;
  // seta do empuxo
  seta.userData.m.opacity = win(t, palavra('bocal', 'empurrado') - 0.3, F.bocal.fim + 0.3, 0.3, 0.3);
  seta.visible = seta.userData.m.opacity > 0.01;
  seta.position.x = -0.6 - 0.3 * out3(ramp(t, palavra('bocal', 'empurrado') - 0.3, palavra('bocal', 'empurrado') + 0.6));

  // ar
  const opAr = win(t, F.fan.ini + 0.3, F.pecas.ini + 0.2, 0.6, 0.5);
  arFora(t, opAr * (t < F.compressor.ini ? 1 : 0.45));
  arNucleo(t, opAr * (t < F.bypass.ini ? 0.5 : 1));

  // contador da pressão (×1 → ×60 na palavra "sessenta")
  const pr = lerp(1, 60, io(ramp(t, F.compressor.ini + 1.2, palavra('compressor', 'sessenta') + 0.2)));
  elPress.textContent = `×${Math.round(pr)}`;

  camAnda(t);
  ETI(t, camera);
  cartoes(t, F, B);
  legenda(t < F.titulo.fim + 0.6 ? -1 : t, LEG);
  renderer.render(scene, camera);
}

ligar('motor-jato-por-dentro', renderAt);
