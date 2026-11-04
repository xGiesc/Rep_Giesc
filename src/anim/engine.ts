import { DARK } from '../brand';
/**
 * Motore delle animazioni dell'omino, in stile "anatomico" (grigio con i muscoli che lavorano in rosso).
 *
 * L'omino è uno scheletro 3D (proporzioni da 7,5 teste: testa = 40 unità) risolto con
 * cinematica diretta (angoli) o inversa (bersagli per mani e piedi). Ogni fotogramma viene
 * proiettato con una camera (rotazione + inclinazione) e disegnato con l'algoritmo del pittore.
 * Il risultato è un elenco di forme 2D indipendenti dal renderer: l'app le disegna con
 * react-native-svg (vedi ExerciseAnimation.tsx).
 *
 * Coordinate del mondo: x verso destra, y verso l'alto, z verso chi guarda (camera di fronte).
 * L'omino guarda verso +z; il suo lato sinistro è +x. Il pavimento è y = 0.
 */

export type V = [number, number];
export type V3 = [number, number, number];

export type Implement = 'barbell' | 'dumbbell' | 'kettlebell' | 'cable' | 'none';

export const VIEW = { w: 300, h: 240 };

/** Misure del corpo (testa = 40). */
export const BODY = {
  head: 40,
  torso: 100, // anca → linea delle spalle
  shoulderHalf: 38,
  hipHalf: 16,
  uarm: 60,
  farm: 46,
  thigh: 70,
  shin: 66,
  ankleY: 11, // altezza della caviglia da terra quando si sta in piedi
  headCenter: 35, // linea spalle → centro testa
};
export const STAND_HIP_Y = BODY.ankleY + BODY.shin + BODY.thigh;

export const COLORS = {
  bg: DARK ? '#2b2b29' : '#f6f6f8',
  outline: '#4a4b52',
  skin: '#e2e3e7',
  skinHi: '#f8f8fa',
  skinLo: '#a9aab1',
  hair: '#2a2b30',
  shorts: '#33343b',
  shoe: '#f2f2f4',
  muscle: '#e0483a',
  muscleDark: '#8c1f17',
  frame: '#d9dadf',
  frameDark: '#9a9ba2',
  pad: '#2e2f35',
  plate: '#26272c',
  bar: '#9ea0a8',
  cable: '#2a2b30',
  shadow: '#000000',
};

export const GRADIENTS: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; stops: Array<[number, string]> }> = [
  { id: 'skin', x1: 0, y1: 0, x2: 1, y2: 1, stops: [[0, '#f4f4f6'], [1, '#c9cad0']] },
  { id: 'frame', x1: 0, y1: 0, x2: 1, y2: 0, stops: [[0, '#ffffff'], [0.6, '#e4e5e8'], [1, '#b9bac0']] },
  { id: 'dark', x1: 0, y1: 0, x2: 1, y2: 1, stops: [[0, '#5a5b63'], [1, '#2a2b30']] },
  { id: 'pec', x1: 0, y1: 0, x2: 1, y2: 1, stops: [[0, '#f06a55'], [1, '#b52d22']] },
];

export type Shape =
  | { k: 'path'; d: string; f?: string; s?: string; sw?: number; o?: number }
  | { k: 'circle'; cx: number; cy: number; r: number; f: string; s?: string; sw?: number; o?: number }
  | { k: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rot?: number; f: string; s?: string; sw?: number; o?: number }
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number; w: number; c: string; o?: number };

// ---- vettori --------------------------------------------------------------------

const rad = (d: number) => (d * Math.PI) / 180;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const lerp = (a: number, b: number, s: number) => a + (b - a) * s;
const lerp3 = (a: V3, b: V3, s: number): V3 => [lerp(a[0], b[0], s), lerp(a[1], b[1], s), lerp(a[2], b[2], s)];
const mid3 = (a: V3, b: V3): V3 => lerp3(a, b, 0.5);

function rodrigues(v: V3, k: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const kv = cross(k, v);
  const kd = dot(k, v) * (1 - c);
  return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd];
}

/** Componente di v perpendicolare a axis, normalizzata. */
function perp(v: V3, axis: V3): V3 {
  const a = norm(axis);
  const p = sub(v, mul(a, dot(v, a)));
  return len(p) < 1e-6 ? [0, 0, 1] : norm(p);
}

// ---- pose -----------------------------------------------------------------------

/**
 * Arto (braccio o gamba).
 *  - fk: angoli. el = elevazione dall'arto lungo il corpo (0) fino in alto (180); pl = piano
 *    (0 avanti, 90 di lato verso l'esterno, 180 indietro); bend = flessione di gomito/ginocchio.
 *  - b: bersaglio di polso/caviglia relativo a spalla/anca, negli assi del corpo [fuori, su, avanti].
 *  - w: bersaglio di polso/caviglia nel mondo.
 *  pole = verso in cui punta gomito/ginocchio (assi del corpo [fuori, su, avanti]).
 */
export type Limb =
  | { el: number; pl?: number; bend: number }
  | { b: V3; pole?: V3 }
  | { w: V3; pole?: V3 };

export type Pose = {
  hip: V3; // centro del bacino (articolazione delle anche)
  lean: number; // inclinazione del busto in avanti (90 = orizzontale a faccia in giù, -90 = supino)
  yaw?: number; // rotazione del corpo attorno alla verticale
  head?: number; // testa in avanti (gradi)
  shrug?: number; // spalle alzate (unità)
  /** per entrambe le braccia (un bersaglio `w` vale per la sinistra, la destra è speculare) */
  arms?: Limb;
  armL?: Limb;
  armR?: Limb;
  legs?: Limb;
  legL?: Limb;
  legR?: Limb;
  /** direzione delle punte dei piedi (mondo); predefinito: avanti in orizzontale */
  toe?: V3;
};

type Rpose = {
  hip: V3;
  lean: number;
  yaw: number;
  head: number;
  shrug: number;
  limbs: [Limb, Limb, Limb, Limb]; // armL, armR, legL, legR
  toe?: V3;
};

export type Axes = { up: V3; fwd: V3; left: V3 };

export function axesOf(lean: number, yaw: number): Axes {
  const l = rad(lean);
  const y = rad(yaw);
  const ry = (v: V3): V3 => [v[0] * Math.cos(y) + v[2] * Math.sin(y), v[1], -v[0] * Math.sin(y) + v[2] * Math.cos(y)];
  return {
    up: ry([0, Math.cos(l), Math.sin(l)]),
    fwd: ry([0, -Math.sin(l), Math.cos(l)]),
    left: ry([1, 0, 0]),
  };
}

const local = (ax: Axes, side: number, v: V3): V3 =>
  add(add(mul(ax.left, side * v[0]), mul(ax.up, v[1])), mul(ax.fwd, v[2]));

const DEF_ARM: V3 = [0.8, -0.6, -0.3];
const DEF_LEG: V3 = [0.15, 0, 1];

function mirrorW(v: V3, hip: V3, left: V3): V3 {
  const o = sub(v, hip);
  return sub(v, mul(left, 2 * dot(o, left)));
}

function resolve(p: Pose): Rpose {
  const ax = axesOf(p.lean, p.yaw ?? 0);
  const pick = (own: Limb | undefined, both: Limb | undefined, side: number, fallback: Limb): Limb => {
    if (own) return own;
    if (!both) return fallback;
    if ('w' in both && side === 1) return { w: mirrorW(both.w, p.hip, ax.left), pole: both.pole };
    return both;
  };
  const armRest: Limb = { el: 0, bend: 0 };
  return {
    hip: p.hip,
    lean: p.lean,
    yaw: p.yaw ?? 0,
    head: p.head ?? 0,
    shrug: p.shrug ?? 0,
    limbs: [
      pick(p.armL, p.arms, 0, armRest),
      pick(p.armR, p.arms, 1, armRest),
      pick(p.legL, p.legs, 0, { el: 0, bend: 0 }),
      pick(p.legR, p.legs, 1, { el: 0, bend: 0 }),
    ],
    toe: p.toe,
  };
}

function lerpLimb(a: Limb, b: Limb, s: number): Limb {
  if ('el' in a && 'el' in b) return { el: lerp(a.el, b.el, s), pl: lerp(a.pl ?? 0, b.pl ?? 0, s), bend: lerp(a.bend, b.bend, s) };
  if ('b' in a && 'b' in b) return { b: lerp3(a.b, b.b, s), pole: a.pole && b.pole ? lerp3(a.pole, b.pole, s) : a.pole ?? b.pole };
  if ('w' in a && 'w' in b) return { w: lerp3(a.w, b.w, s), pole: a.pole && b.pole ? lerp3(a.pole, b.pole, s) : a.pole ?? b.pole };
  throw new Error('Le due pose devono usare lo stesso tipo di arto (fk / b / w)');
}

function lerpPose(a: Pose, b: Pose, s: number): Rpose {
  const ra = resolve(a);
  const rb = resolve(b);
  return {
    hip: lerp3(ra.hip, rb.hip, s),
    lean: lerp(ra.lean, rb.lean, s),
    yaw: lerp(ra.yaw, rb.yaw, s),
    head: lerp(ra.head, rb.head, s),
    shrug: lerp(ra.shrug, rb.shrug, s),
    limbs: [0, 1, 2, 3].map((i) => lerpLimb(ra.limbs[i], rb.limbs[i], s)) as Rpose['limbs'],
    toe: ra.toe && rb.toe ? lerp3(ra.toe, rb.toe, s) : ra.toe ?? rb.toe,
  };
}

/** Punto nel sistema del corpo: `up` lungo la schiena dall'anca, `lat` verso sinistra, `fwd` in avanti. */
export function anchor(p: Pose, up: number, lat: number, fwd: number): V3 {
  const ax = axesOf(p.lean, p.yaw ?? 0);
  return add(add(add(p.hip, mul(ax.up, up)), mul(ax.left, lat)), mul(ax.fwd, fwd));
}

// ---- scheletro ------------------------------------------------------------------

export type Joints = {
  ax: Axes;
  hip: V3;
  chest: V3; // linea delle spalle, al centro
  neck: V3;
  head: V3;
  headUp: V3;
  headFwd: V3;
  /** [sinistra, destra] */
  sh: [V3, V3];
  el: [V3, V3];
  wr: [V3, V3];
  hp: [V3, V3];
  kn: [V3, V3];
  an: [V3, V3];
  toe: [V3, V3];
  heel: [V3, V3];
  /** lato "anteriore" (bicipite / quadricipite) di braccio e coscia, e dello stinco */
  antArm: [V3, V3];
  antThigh: [V3, V3];
  antShin: [V3, V3];
  /** punto medio delle mani */
  hands: V3;
};

function twoBone(root: V3, target: V3, l1: number, l2: number, pole: V3): { mid: V3; end: V3 } {
  const d0 = sub(target, root);
  let d = len(d0);
  const dir = d < 1e-6 ? ([0, -1, 0] as V3) : norm(d0);
  d = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.01);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const pp = perp(pole, dir);
  const mid = add(add(root, mul(dir, a)), mul(pp, h));
  return { mid, end: add(root, mul(dir, d)) };
}

function solveLimb(
  root: V3,
  limb: Limb,
  l1: number,
  l2: number,
  ax: Axes,
  side: number,
  isArm: boolean,
): { mid: V3; end: V3; ant: V3 } {
  if ('el' in limb) {
    const th = rad(limb.el);
    const ps = rad(limb.pl ?? 0);
    const d1: V3 = [Math.sin(th) * Math.sin(ps), -Math.cos(th), Math.sin(th) * Math.cos(ps)];
    const k: V3 = [-Math.cos(ps), 0, Math.sin(ps)];
    const A = rodrigues([0, 0, 1], k, th);
    const be = rad(limb.bend);
    const sg = isArm ? 1 : -1;
    const d2: V3 = [
      d1[0] * Math.cos(be) + sg * A[0] * Math.sin(be),
      d1[1] * Math.cos(be) + sg * A[1] * Math.sin(be),
      d1[2] * Math.cos(be) + sg * A[2] * Math.sin(be),
    ];
    const D1 = local(ax, side, d1);
    const D2 = local(ax, side, d2);
    const mid = add(root, mul(D1, l1));
    return { mid, end: add(mid, mul(D2, l2)), ant: local(ax, side, A) };
  }
  const target = 'b' in limb ? add(root, local(ax, side, limb.b)) : limb.w;
  const pl = limb.pole ?? (isArm ? DEF_ARM : DEF_LEG);
  const { mid, end } = twoBone(root, target, l1, l2, local(ax, side, pl));
  // lato anteriore: la flessione piega l'avambraccio verso il davanti (braccio) / lo stinco verso dietro (gamba)
  const dir = norm(sub(end, root));
  const off = perp(sub(mid, add(root, mul(dir, dot(sub(mid, root), dir)))), dir);
  const bentOut = len(sub(mid, add(root, mul(dir, dot(sub(mid, root), dir))))) > 0.5 ? off : perp(local(ax, side, pl), dir);
  return { mid, end, ant: isArm ? mul(bentOut, -1) : bentOut };
}

export function solve(p: Rpose): Joints {
  const ax = axesOf(p.lean, p.yaw);
  const hip = p.hip;
  const chest = add(hip, mul(ax.up, BODY.torso + p.shrug * 0.4));
  // testa: inclinazione attorno all'asse sinistro-destro
  const hr = rad(p.head);
  const headUp = norm(add(mul(ax.up, Math.cos(hr)), mul(ax.fwd, Math.sin(hr))));
  const headFwd = norm(sub(mul(ax.fwd, Math.cos(hr)), mul(ax.up, Math.sin(hr))));
  const neck = add(chest, mul(ax.up, 5));
  const head = add(chest, mul(headUp, BODY.headCenter));

  const sh: V3[] = [];
  const el: V3[] = [];
  const wr: V3[] = [];
  const hp: V3[] = [];
  const kn: V3[] = [];
  const an: V3[] = [];
  const antArm: V3[] = [];
  const antThigh: V3[] = [];
  const antShin: V3[] = [];
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? 1 : -1;
    const S = add(add(chest, mul(ax.left, side * BODY.shoulderHalf)), add(mul(ax.up, -6 + p.shrug), [0, 0, 0]));
    const arm = solveLimb(S, p.limbs[i], BODY.uarm, BODY.farm, ax, side, true);
    sh.push(S);
    el.push(arm.mid);
    wr.push(arm.end);
    antArm.push(arm.ant);
    const H = add(hip, mul(ax.left, side * BODY.hipHalf));
    const leg = solveLimb(H, p.limbs[2 + i], BODY.thigh, BODY.shin, ax, side, false);
    hp.push(H);
    kn.push(leg.mid);
    an.push(leg.end);
    antThigh.push(leg.ant);
    antShin.push(perp(leg.ant, sub(leg.end, leg.mid)));
  }

  // piedi: punte in orizzontale nella direzione in cui guarda il corpo (o quella indicata)
  let fd: V3;
  if (p.toe) fd = norm(p.toe);
  else {
    const fh: V3 = [ax.fwd[0], 0, ax.fwd[2]];
    const uh: V3 = [-ax.up[0], 0, -ax.up[2]];
    fd = len(fh) > 0.5 ? norm(fh) : len(uh) > 0.5 ? norm(uh) : [0, 0, 1];
  }
  const heel: V3[] = [];
  const toe: V3[] = [];
  for (let i = 0; i < 2; i++) {
    heel.push(add(an[i], add(mul(fd, -9), [0, -4, 0])));
    toe.push(add(an[i], add(mul(fd, 26), [0, -5, 0])));
  }
  return {
    ax,
    hip,
    chest,
    neck,
    head,
    headUp,
    headFwd,
    sh: [sh[0], sh[1]],
    el: [el[0], el[1]],
    wr: [wr[0], wr[1]],
    hp: [hp[0], hp[1]],
    kn: [kn[0], kn[1]],
    an: [an[0], an[1]],
    toe: [toe[0], toe[1]],
    heel: [heel[0], heel[1]],
    antArm: [antArm[0], antArm[1]],
    antThigh: [antThigh[0], antThigh[1]],
    antShin: [antShin[0], antShin[1]],
    hands: mid3(wr[0], wr[1]),
  };
}

// ---- pattern --------------------------------------------------------------------

export type Pattern = {
  id: string;
  label: string;
  a: Pose;
  b: Pose;
  /** camera: rotazione attorno alla verticale e inclinazione (gradi) */
  cam?: { yaw?: number; pitch?: number };
  /** disegna attrezzi e macchina; `j` sono le articolazioni del fotogramma corrente (nel mondo) */
  scene: (j: Joints, impl: Implement, S: SceneBuilder, s: number) => void;
};

export type SceneOpts = { fill?: string; bias?: number; dark?: boolean };

export type SceneBuilder = {
  /** cilindro (sbarra, montante, leva) */
  bar(a: V3, b: V3, r: number, o?: SceneOpts): void;
  /** disco (piatto, carrucola, rullo) con normale `n` */
  disc(c: V3, n: V3, r: number, th: number, o?: SceneOpts): void;
  /** parallelepipedo allineato agli assi del mondo (ruotabile attorno alla verticale) */
  box(c: V3, size: V3, o?: SceneOpts & { yaw?: number }): void;
  /** cavo sottile */
  cable(a: V3, b: V3, w?: number): void;
  ball(c: V3, r: number, o?: SceneOpts): void;
  /** carico in mano / sulla sbarra, secondo l'attrezzo */
  load(impl: Implement, j: Joints, o?: { plateR?: number; bar?: boolean }): void;
};

/** Fase del ciclo (0..1) → posizione tra le due pose (0..1), con pause alle estremità. */
export function phaseToS(p: number): number {
  let u: number;
  if (p < 0.12) u = 0;
  else if (p < 0.5) u = (p - 0.12) / 0.38;
  else if (p < 0.62) u = 1;
  else u = 1 - (p - 0.62) / 0.38;
  return u * u * (3 - 2 * u);
}

// ---- muscoli: superfici del busto -------------------------------------------------

type Slice = { t: number; hw: number; hd: number };
const SLICES: Slice[] = [
  { t: -0.2, hw: 27, hd: 16 },
  { t: 0, hw: 31, hd: 17 },
  { t: 0.12, hw: 29, hd: 16 },
  { t: 0.35, hw: 26, hd: 15 },
  { t: 0.62, hw: 32, hd: 18 },
  { t: 0.85, hw: 34, hd: 17 },
  { t: 1.0, hw: 32, hd: 13.5 },
  { t: 1.05, hw: 25, hd: 12 },
  { t: 1.12, hw: 11, hd: 9.5 },
];

function sliceAt(t: number): { hw: number; hd: number } {
  const t0 = Math.min(Math.max(t, SLICES[0].t), SLICES[SLICES.length - 1].t);
  for (let i = 0; i < SLICES.length - 1; i++) {
    const A = SLICES[i];
    const B = SLICES[i + 1];
    if (t0 <= B.t) {
      const u = (t0 - A.t) / (B.t - A.t);
      return { hw: lerp(A.hw, B.hw, u), hd: lerp(A.hd, B.hd, u) };
    }
  }
  const L = SLICES[SLICES.length - 1];
  return { hw: L.hw, hd: L.hd };
}

/** Poligoni (t lungo il busto, a = angolo attorno: 0 davanti, +90 lato sinistro, 180 dietro). Lato sinistro; il destro è speculare. */
type Patch = Array<[number, number]>;
const PATCHES: Record<string, Patch[]> = {
  chest: [[[0.9, 4], [0.92, 30], [0.87, 62], [0.75, 74], [0.64, 56], [0.6, 30], [0.62, 6]]],
  lats: [[[0.86, 150], [0.88, 120], [0.66, 98], [0.38, 112], [0.4, 140], [0.62, 152]]],
  'middle back': [[[0.9, 168], [0.9, 130], [0.64, 128], [0.6, 160], [0.74, 176]]],
  'lower back': [[[0.4, 172], [0.38, 138], [0.06, 142], [0.04, 172]]],
  traps: [
    [[1.12, 172], [1.1, 140], [0.99, 118], [0.8, 160], [0.84, 178]],
    [[1.12, 8], [1.1, 40], [1.0, 80], [0.95, 62], [0.98, 14]],
  ],
  glutes: [[[0.16, 172], [0.14, 128], [-0.02, 112], [-0.16, 140], [-0.16, 172]]],
};

// ---- costruzione del fotogramma -----------------------------------------------------

type Prim = { z: number; sh: Shape[] };

const poly = (pts: V[], f: string, o?: { s?: string; sw?: number; o?: number }): Shape => ({
  k: 'path',
  d: 'M' + pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L') + 'Z',
  f,
  s: o?.s,
  sw: o?.sw,
  o: o?.o,
});

function hull(points: V[]): V[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: V, a: V, b: V) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: V[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: V[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  lo.pop();
  up.pop();
  return [...lo, ...up];
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
}

type Part = { a: V; b: V; ra: number; rb: number; z: number; fill: string; extra?: Shape[] };

/** Capsula rastremata (2D). */
function capsulePath(a: V, b: V, ra: number, rb: number): Shape[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const out: Shape[] = [];
  const f = '#000';
  if (L > Math.abs(ra - rb) + 0.01) {
    const beta = Math.atan2(dy, dx);
    const al = Math.acos((ra - rb) / L);
    const u = (ang: number): V => [Math.cos(ang), Math.sin(ang)];
    const p1 = u(beta + al);
    const p2 = u(beta - al);
    out.push(
      poly(
        [
          [a[0] + ra * p1[0], a[1] + ra * p1[1]],
          [b[0] + rb * p1[0], b[1] + rb * p1[1]],
          [b[0] + rb * p2[0], b[1] + rb * p2[1]],
          [a[0] + ra * p2[0], a[1] + ra * p2[1]],
        ],
        f,
      ),
    );
  }
  out.push({ k: 'circle', cx: a[0], cy: a[1], r: ra, f });
  out.push({ k: 'circle', cx: b[0], cy: b[1], r: rb, f });
  return out;
}

const withFill = (shapes: Shape[], f: string, o?: number): Shape[] => shapes.map((s) => ({ ...s, f, o }) as Shape);

/** Gruppo di parti: prima tutti i contorni, poi i riempimenti (niente righe ai giunti). */
function chain(parts: Part[], extraTop: Shape[] = []): Shape[] {
  const out: Shape[] = [];
  for (const p of parts) out.push(...withFill(capsulePath(p.a, p.b, p.ra + 1.4, p.rb + 1.4), COLORS.outline));
  const sorted = [...parts].sort((x, y) => x.z - y.z);
  for (const p of sorted) {
    out.push(...withFill(capsulePath(p.a, p.b, p.ra, p.rb), p.fill));
    // luce e ombra sul tubo
    const dx = p.b[0] - p.a[0];
    const dy = p.b[1] - p.a[1];
    const L = Math.hypot(dx, dy);
    if (L > 6) {
      let nx = -dy / L;
      let ny = dx / L;
      if (nx + ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      const r0 = Math.min(p.ra, p.rb);
      out.push({ k: 'line', x1: p.a[0] + (dx / L) * 3 + nx * r0 * 0.4, y1: p.a[1] + (dy / L) * 3 + ny * r0 * 0.4, x2: p.b[0] - (dx / L) * 3 + nx * r0 * 0.4, y2: p.b[1] - (dy / L) * 3 + ny * r0 * 0.4, w: Math.max(1.6, r0 * 0.34), c: COLORS.skinHi, o: 0.85 });
      out.push({ k: 'line', x1: p.a[0] + (dx / L) * 3 - nx * r0 * 0.5, y1: p.a[1] + (dy / L) * 3 - ny * r0 * 0.5, x2: p.b[0] - (dx / L) * 3 - nx * r0 * 0.5, y2: p.b[1] - (dy / L) * 3 - ny * r0 * 0.5, w: Math.max(1.4, r0 * 0.28), c: COLORS.skinLo, o: 0.5 });
    }
    if (p.extra) out.push(...p.extra);
  }
  out.push(...extraTop);
  return out;
}

export type Frame = { shapes: Shape[]; vb: [number, number, number, number] };

type Cam = (v: V3) => V3;
function makeCam(yaw: number, pitch: number): Cam {
  const cy = Math.cos(rad(yaw));
  const sy = Math.sin(rad(yaw));
  const cp = Math.cos(rad(pitch));
  const sp = Math.sin(rad(pitch));
  return (v) => {
    const x1 = v[0] * cy + v[2] * sy;
    const z1 = -v[0] * sy + v[2] * cy;
    const y2 = v[1] * cp - z1 * sp;
    const z2 = v[1] * sp + z1 * cp;
    return [x1, -y2, z2];
  };
}

function bboxOf(shapes: Shape[]): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const pt = (x: number, y: number, r = 0) => {
    x0 = Math.min(x0, x - r);
    y0 = Math.min(y0, y - r);
    x1 = Math.max(x1, x + r);
    y1 = Math.max(y1, y + r);
  };
  for (const s of shapes) {
    if (s.k === 'circle') pt(s.cx, s.cy, s.r);
    else if (s.k === 'ellipse') pt(s.cx, s.cy, Math.max(s.rx, s.ry));
    else if (s.k === 'line') {
      pt(s.x1, s.y1, s.w / 2);
      pt(s.x2, s.y2, s.w / 2);
    } else {
      const nums = s.d.match(/-?\d+(\.\d+)?/g) ?? [];
      for (let i = 0; i + 1 < nums.length; i += 2) pt(+nums[i], +nums[i + 1]);
    }
  }
  return [x0, y0, x1, y1];
}

const VB_CACHE = new Map<string, [number, number, number, number]>();

function fitVb(box: [number, number, number, number]): [number, number, number, number] {
  const pad = 14;
  let w = box[2] - box[0] + pad * 2;
  let h = box[3] - box[1] + pad * 2;
  const asp = VIEW.w / VIEW.h;
  if (w / h < asp) w = h * asp;
  else h = w / asp;
  const cx = (box[0] + box[2]) / 2;
  const cy = (box[1] + box[3]) / 2;
  return [cx - w / 2, cy - h / 2, w, h];
}

export function buildFrame(
  pattern: Pattern,
  s: number,
  impl: Implement,
  primary: string[],
  secondary: string[],
): Frame {
  const key = `${pattern.id}|${impl}`;
  const raw = drawFrame(pattern, s, impl, primary, secondary);
  let vb = VB_CACHE.get(key);
  if (!vb) {
    let box: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const b = bboxOf(drawFrame(pattern, t, impl, primary, secondary).filter((x) => !(x.k === 'ellipse' && x.f === COLORS.shadow)));
      box = [Math.min(box[0], b[0]), Math.min(box[1], b[1]), Math.max(box[2], b[2]), Math.max(box[3], b[3])];
    }
    vb = fitVb(box);
    VB_CACHE.set(key, vb);
  }
  return { shapes: raw, vb };
}

function drawFrame(pattern: Pattern, s: number, impl: Implement, primary: string[], secondary: string[]): Shape[] {
  const pose = lerpPose(pattern.a, pattern.b, s);
  const j = solve(pose);
  const cam = makeCam(pattern.cam?.yaw ?? 0, pattern.cam?.pitch ?? 8);
  const P = (v: V3) => cam(v);
  const p2 = (v: V3): V => {
    const c = cam(v);
    return [c[0], c[1]];
  };
  const prims: Prim[] = [];
  const level = (m: string): number => (primary.includes(m) ? 0.95 : secondary.includes(m) ? 0.45 : 0);

  // ombra a terra
  {
    const g = P([j.hip[0], 0, j.hip[2]]);
    const pitch = pattern.cam?.pitch ?? 8;
    prims.push({ z: -1e9, sh: [{ k: 'ellipse', cx: g[0], cy: g[1], rx: 88, ry: 88 * Math.sin(rad(Math.max(pitch, 4))) + 4, f: COLORS.shadow, o: DARK ? 0.35 : 0.08 }] });
  }

  // ---- scena
  const S: SceneBuilder = {
    bar(a, b, r, o) {
      const A = P(a);
      const B = P(b);
      const f = o?.fill ?? COLORS.bar;
      const sh = [...withFill(capsulePath([A[0], A[1]], [B[0], B[1]], r + 1.2, r + 1.2), COLORS.outline), ...withFill(capsulePath([A[0], A[1]], [B[0], B[1]], r, r), f)];
      const dx = B[0] - A[0];
      const dy = B[1] - A[1];
      const L = Math.hypot(dx, dy) || 1;
      sh.push({ k: 'line', x1: A[0] - (dy / L) * r * 0.4, y1: A[1] + (dx / L) * r * 0.4, x2: B[0] - (dy / L) * r * 0.4, y2: B[1] + (dx / L) * r * 0.4, w: Math.max(0.8, r * 0.3), c: '#ffffff', o: 0.5 });
      prims.push({ z: (A[2] + B[2]) / 2 + (o?.bias ?? 0), sh });
    },
    disc(c, n, r, th, o) {
      const nn = norm(n);
      const u = norm(Math.abs(nn[1]) < 0.9 ? cross(nn, [0, 1, 0]) : cross(nn, [1, 0, 0]));
      const v = cross(nn, u);
      const ring = (off: number): V[] => {
        const pts: V[] = [];
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * Math.PI * 2;
          pts.push(p2(add(add(c, mul(nn, off)), add(mul(u, Math.cos(a) * r), mul(v, Math.sin(a) * r)))));
        }
        return pts;
      };
      const front = ring(th / 2);
      const back = ring(-th / 2);
      const zc = P(c)[2];
      const nCam = P(add(c, nn))[2] - zc;
      const fill = o?.fill ?? COLORS.plate;
      const near = nCam >= 0 ? front : back;
      prims.push({
        z: zc + (o?.bias ?? 0),
        sh: [
          poly(hull([...front, ...back]), COLORS.outline, { s: COLORS.outline, sw: 2.4 }),
          poly(hull([...front, ...back]), shade(fill, 0.8)),
          poly(near, fill, { s: COLORS.outline, sw: 1 }),
          { k: 'circle', cx: (near.reduce((x, q) => x + q[0], 0)) / near.length, cy: (near.reduce((x, q) => x + q[1], 0)) / near.length, r: Math.max(1.5, r * 0.18), f: COLORS.bar },
        ],
      });
    },
    box(c, size, o) {
      const yaw = rad(o?.yaw ?? 0);
      const hs: V3 = [size[0] / 2, size[1] / 2, size[2] / 2];
      const corner = (sx: number, sy: number, sz: number): V3 => {
        const x = sx * hs[0];
        const z = sz * hs[2];
        return add(c, [x * Math.cos(yaw) + z * Math.sin(yaw), sy * hs[1], -x * Math.sin(yaw) + z * Math.cos(yaw)]);
      };
      const faces: Array<{ pts: V3[]; n: V3; k: number }> = [
        { pts: [corner(-1, 1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(-1, 1, 1)], n: [0, 1, 0], k: 1.0 },
        { pts: [corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)], n: [0, 0, 1], k: 0.86 },
        { pts: [corner(-1, -1, -1), corner(1, -1, -1), corner(1, 1, -1), corner(-1, 1, -1)], n: [0, 0, -1], k: 0.7 },
        { pts: [corner(1, -1, -1), corner(1, -1, 1), corner(1, 1, 1), corner(1, 1, -1)], n: [1, 0, 0], k: 0.78 },
        { pts: [corner(-1, -1, -1), corner(-1, -1, 1), corner(-1, 1, 1), corner(-1, 1, -1)], n: [-1, 0, 0], k: 0.78 },
        { pts: [corner(-1, -1, -1), corner(1, -1, -1), corner(1, -1, 1), corner(-1, -1, 1)], n: [0, -1, 0], k: 0.6 },
      ];
      const base = o?.fill ?? COLORS.frame;
      const shapes: Shape[] = [];
      const withZ = faces.map((f) => {
        const pc = f.pts.map(P);
        const nrm = mul(add(add(mul([Math.cos(yaw), 0, -Math.sin(yaw)], f.n[0]), mul([0, 1, 0], f.n[1])), mul([Math.sin(yaw), 0, Math.cos(yaw)], f.n[2])), 1);
        const nz = P(nrm)[2] - P([0, 0, 0])[2];
        return { f, pc, nz, z: pc.reduce((a, q) => a + q[2], 0) / 4 };
      });
      withZ
        .filter((q) => q.nz > 0.001)
        .sort((a, b) => a.z - b.z)
        .forEach((q) => shapes.push(poly(q.pc.map((x) => [x[0], x[1]] as V), shade(base, q.f.k), { s: COLORS.frameDark, sw: 1.2 })));
      prims.push({ z: P(c)[2] + (o?.bias ?? 0), sh: shapes });
    },
    cable(a, b, w = 1.8) {
      const A = P(a);
      const B = P(b);
      prims.push({ z: (A[2] + B[2]) / 2, sh: [{ k: 'line', x1: A[0], y1: A[1], x2: B[0], y2: B[1], w, c: COLORS.cable }] });
    },
    ball(c, r, o) {
      const C = P(c);
      prims.push({
        z: C[2] + (o?.bias ?? 0),
        sh: [
          { k: 'circle', cx: C[0], cy: C[1], r: r + 1.3, f: COLORS.outline },
          { k: 'circle', cx: C[0], cy: C[1], r, f: o?.fill ?? COLORS.plate },
          { k: 'circle', cx: C[0] - r * 0.3, cy: C[1] - r * 0.3, r: r * 0.28, f: '#ffffff', o: 0.35 },
        ],
      });
    },
    load(ld, jj, o) {
      const L = jj.wr[0];
      const R = jj.wr[1];
      const pr = o?.plateR ?? 20;
      const lat = norm(sub(L, R));
      const lateral = len(sub(L, R)) < 6 ? jj.ax.left : lat;
      if (ld === 'barbell') {
        const c = mid3(L, R);
        const half = Math.max(len(sub(L, R)) / 2 + 70, 105);
        const a = add(c, mul(lateral, half + 12));
        const b = add(c, mul(lateral, -half - 12));
        this.bar(a, b, 2.6, { fill: COLORS.bar, bias: 2 });
        for (const sg of [1, -1]) {
          this.disc(add(c, mul(lateral, sg * (half - 6))), lateral, pr, 6, { bias: 3 });
          this.disc(add(c, mul(lateral, sg * (half - 14))), lateral, pr * 0.82, 6, { bias: 3 });
        }
      } else if (ld === 'dumbbell') {
        for (const W of [L, R]) {
          this.bar(add(W, mul(jj.ax.left, 12)), add(W, mul(jj.ax.left, -12)), 2.6, { bias: 2 });
          this.disc(add(W, mul(jj.ax.left, 12)), jj.ax.left, 10.5, 7, { bias: 3 });
          this.disc(add(W, mul(jj.ax.left, -12)), jj.ax.left, 10.5, 7, { bias: 3 });
        }
      } else if (ld === 'kettlebell') {
        const c = mid3(L, R);
        this.ball(add(c, [0, -11, 0]), 11, { bias: 3 });
        this.bar(add(c, [-5, 0, 0]), add(c, [5, 0, 0]), 2.2, { bias: 2 });
      }
    },
  };
  pattern.scene(j, impl, S, s);

  // ---- vettori nello spazio della camera
  const cv = (v: V3): V3 => {
    const a = cam([0, 0, 0]);
    const b = cam(v);
    return [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  };
  const Cax = { up: cv(j.ax.up), fwd: cv(j.ax.fwd), left: cv(j.ax.left) };

  // ---- gambe
  for (let i = 0; i < 2; i++) {
    const H = P(j.hp[i]);
    const K = P(j.kn[i]);
    const A = P(j.an[i]);
    const hl = P(j.heel[i]);
    const tp = P(j.toe[i]);
    const parts: Part[] = [];
    const thighExtra: Shape[] = [];
    // pantaloncino sulla parte alta della coscia
    const sa: V = [H[0], H[1]];
    const sb: V = [H[0] + (K[0] - H[0]) * 0.26, H[1] + (K[1] - H[1]) * 0.26];
    thighExtra.push(...withFill(capsulePath(sa, sb, 13.2, 11.8), 'url(#dark)'));
    const limbMuscle = (a3: V3, b3: V3, ant: V3, side: number, ra: number, rb: number, t0: number, t1: number, lv: number): Shape[] => {
      if (lv <= 0) return [];
      const dir = cv(sub(b3, a3));
      const antc = perp(cv(ant), dir);
      const face = side === 0 ? 1 : (side * antc[2]);
      if (face < -0.1) return [];
      const at = (t: number): V3 => P(add(a3, mul(sub(b3, a3), t)));
      const r = (t: number) => lerp(ra, rb, t);
      const off = (t: number): V => {
        const q = at(t);
        const k = side === 0 ? 0 : side * r(t) * 0.3;
        return [q[0] + antc[0] * k, q[1] + antc[1] * k];
      };
      const op = lv * Math.max(0.3, Math.min(1, 0.45 + face * 1.1));
      const sh = withFill(capsulePath(off(t0), off(t1), r(t0) * 0.62, r(t1) * 0.62), 'url(#pec)', op);
      return sh;
    };
    parts.push({
      a: [K[0], K[1]],
      b: [A[0], A[1]],
      ra: 8.6,
      rb: 5.6,
      z: (K[2] + A[2]) / 2,
      fill: COLORS.skin,
      extra: [
        ...limbMuscle(j.kn[i], j.an[i], j.antShin[i], -1, 8.6, 5.6, 0.1, 0.62, level('calves')),
        ...limbMuscle(j.kn[i], j.an[i], j.antShin[i], 0, 8.6, 5.6, 0.1, 0.62, 0),
      ],
    });
    parts.push({
      a: [H[0], H[1]],
      b: [K[0], K[1]],
      ra: 12.8,
      rb: 9,
      z: (H[2] + K[2]) / 2,
      fill: COLORS.skin,
      extra: [
        ...limbMuscle(j.hp[i], j.kn[i], j.antThigh[i], 1, 12.8, 9, 0.18, 0.92, level('quadriceps')),
        ...limbMuscle(j.hp[i], j.kn[i], j.antThigh[i], -1, 12.8, 9, 0.2, 0.9, level('hamstrings')),
        ...limbMuscle(j.hp[i], j.kn[i], j.antThigh[i], 0, 12.8, 9, 0.4, 0.95, 0),
        ...thighExtra,
      ],
    });
    parts.push({ a: [hl[0], hl[1]], b: [tp[0], tp[1]], ra: 5.6, rb: 4.4, z: (hl[2] + tp[2]) / 2 + 1, fill: COLORS.shoe });
    prims.push({ z: (H[2] + K[2] + A[2]) / 3, sh: chain(parts) });
  }

  // ---- busto
  {
    const hipC = j.hip;
    const ring = (t: number, hw: number, hd: number): V[] => {
      const c = add(hipC, mul(j.ax.up, BODY.torso * t));
      const pts: V[] = [];
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        pts.push(p2(add(add(c, mul(j.ax.left, hw * Math.sin(a))), mul(j.ax.fwd, hd * Math.cos(a)))));
      }
      return pts;
    };
    const rings = SLICES.map((q) => ring(q.t, q.hw, q.hd));
    const strips: V[][] = [];
    for (let i = 0; i < rings.length - 1; i++) strips.push(hull([...rings[i], ...rings[i + 1]]));
    const sh: Shape[] = [];
    for (const st of strips) sh.push(poly(st, COLORS.outline, { s: COLORS.outline, sw: 2.8 }));
    for (const st of strips) sh.push(poly(st, 'url(#skin)'));
    // pantaloncino (anche e bacino)
    for (let i = 0; i < 2; i++) sh.push(poly(strips[i], 'url(#dark)'));
    sh.push(poly(hull([...rings[2], ...rings[1]]), 'url(#dark)'));

    // superficie del busto → punto nella camera + normale
    const surf = (t: number, aDeg: number) => {
      const { hw, hd } = sliceAt(t);
      const a = rad(aDeg);
      const c = add(hipC, mul(j.ax.up, BODY.torso * t));
      const p = add(add(c, mul(j.ax.left, hw * Math.sin(a))), mul(j.ax.fwd, hd * Math.cos(a)));
      const nrm = norm(add(mul(j.ax.left, Math.sin(a) / hw), mul(j.ax.fwd, Math.cos(a) / hd)));
      return { p: p2(p), nz: cv(nrm)[2] };
    };
    const patch = (verts: Patch, mirror: boolean): { pts: V[]; face: number } => {
      const pts: V[] = [];
      let face = 0;
      const vv = verts.map(([t, a]) => [t, mirror ? -a : a] as [number, number]);
      for (let i = 0; i < vv.length; i++) {
        const A = vv[i];
        const B = vv[(i + 1) % vv.length];
        for (let k = 0; k < 4; k++) {
          const u = k / 4;
          const r = surf(lerp(A[0], B[0], u), lerp(A[1], B[1], u));
          pts.push(r.p);
          face += r.nz;
        }
      }
      return { pts, face: face / (vv.length * 4) };
    };
    const drawMuscle = (name: string, lv: number) => {
      if (lv <= 0) return;
      for (const verts of PATCHES[name] ?? []) {
        for (const mirror of [false, true]) {
          const { pts, face } = patch(verts, mirror);
          if (face < 0.08) continue;
          const op = lv * Math.min(1, 0.4 + face * 1.1);
          sh.push(poly(pts, 'url(#pec)', { s: COLORS.muscleDark, sw: 1.1, o: op }));
        }
      }
    };
    for (const m of ['chest', 'lats', 'middle back', 'lower back', 'traps', 'glutes']) drawMuscle(m, level(m));

    // addominali (blocchi sul davanti)
    const frontFace = surf(0.5, 0).nz;
    if (frontFace > 0.1) {
      const lv = level('abdominals');
      for (let r = 0; r < 4; r++) {
        for (const sg of [-1, 1]) {
          const t0 = 0.46 - r * 0.11;
          const t1 = t0 - 0.09;
          const a0 = sg * 2;
          const a1 = sg * 24;
          const pts = [surf(t0, a0), surf(t0, a1), surf(t1, a1), surf(t1, a0)].map((x) => x.p);
          sh.push(poly(pts, lv > 0 ? 'url(#pec)' : '#dcdde1', { s: lv > 0 ? COLORS.muscleDark : '#9a9ba2', sw: 1.1, o: lv > 0 ? Math.min(1, lv * frontFace + 0.2) : frontFace }));
        }
      }
      // linea mediana e fianchi
      const l0 = surf(0.9, 0).p;
      const l1 = surf(0.06, 0).p;
      sh.push({ k: 'line', x1: l0[0], y1: l0[1], x2: l1[0], y2: l1[1], w: 1.2, c: '#8a8b92', o: 0.5 * frontFace });
    }
    // schiena: colonna
    const backFace = -surf(0.5, 0).nz;
    if (backFace > 0.1) {
      const l0 = surf(1.1, 180).p;
      const l1 = surf(0.02, 180).p;
      sh.push({ k: 'line', x1: l0[0], y1: l0[1], x2: l1[0], y2: l1[1], w: 1.4, c: '#8a8b92', o: 0.6 * backFace });
    }
    prims.push({ z: P(add(hipC, mul(j.ax.up, BODY.torso * 0.5)))[2], sh });
  }

  // ---- collo e testa
  {
    const N0 = P(add(j.chest, mul(j.ax.up, 2)));
    const N1 = P(add(j.chest, mul(j.headUp, 24)));
    const neckParts: Part[] = [{ a: [N0[0], N0[1]], b: [N1[0], N1[1]], ra: 8.4, rb: 7.4, z: N0[2], fill: COLORS.skin, extra: withFill([], '#000') }];
    const sh: Shape[] = chain(neckParts);
    const hc = j.head;
    const hu = j.headUp;
    const hf = j.headFwd;
    const hl = j.ax.left;
    const ell = (ru: number, rl: number, rf: number, lat: number[], lon: number[]): V[] => {
      const pts: V[] = [];
      for (const la of lat)
        for (const lo of lon) {
          const y = Math.sin(rad(la));
          const rr = Math.cos(rad(la));
          pts.push(p2(add(hc, add(add(mul(hu, ru * y), mul(hl, rl * rr * Math.sin(rad(lo)))), mul(hf, rf * rr * Math.cos(rad(lo)))))));
        }
      return pts;
    };
    const lonAll = Array.from({ length: 16 }, (_, i) => (i / 16) * 360);
    const latAll = [-90, -60, -30, 0, 30, 60, 90];
    const skull = hull(ell(20, 15, 17, latAll, lonAll));
    sh.push(poly(skull, COLORS.outline, { s: COLORS.outline, sw: 2.6 }));
    const headZ = cv(hf)[2];
    const hc2 = p2(hc);
    // orecchie (solo se si vedono di lato/di fronte)
    for (const sg of [1, -1]) {
      const ear = p2(add(hc, add(mul(hl, sg * 15), mul(hu, 1))));
      sh.push({ k: 'ellipse', cx: ear[0], cy: ear[1], rx: 2.6, ry: 5, rot: 0, f: COLORS.skin, s: COLORS.outline, sw: 1.1 });
    }
    sh.push(poly(skull, 'url(#skin)', { s: COLORS.outline, sw: 0.6 }));
    // capelli: calotta in alto (e dietro se si vede la nuca)
    const dome = hull(ell(20, 15, 17, [32, 55, 75, 90], lonAll));
    const backHair = hull(
      ell(20, 15, 17, [-60, -30, 0, 30, 60], Array.from({ length: 8 }, (_, i) => 100 + i * 22.857)).concat(ell(20, 15, 17, [70], lonAll)),
    );
    if (headZ < 0.35) sh.push(poly(backHair, COLORS.hair));
    sh.push(poly(dome, COLORS.hair));
    // viso
    if (headZ > 0.2) {
      const pf = (u: number, l: number, f: number): V => p2(add(hc, add(add(mul(hu, u), mul(hl, l)), mul(hf, f))));
      const op = Math.min(1, (headZ - 0.1) * 1.8);
      for (const sg of [1, -1]) {
        const e0 = pf(2, sg * 3, 16);
        const e1 = pf(2, sg * 8.5, 14.5);
        sh.push({ k: 'line', x1: e0[0], y1: e0[1], x2: e1[0], y2: e1[1], w: 1.7, c: '#55565c', o: op });
      }
      const n0 = pf(1, 0, 17);
      const n1 = pf(-7, 0, 18);
      sh.push({ k: 'line', x1: n0[0], y1: n0[1], x2: n1[0], y2: n1[1], w: 1.2, c: '#8a8b92', o: op });
      const m0 = pf(-12, -3.5, 15.5);
      const m1 = pf(-12.6, 3.5, 15.5);
      sh.push({ k: 'line', x1: m0[0], y1: m0[1], x2: m1[0], y2: m1[1], w: 1.2, c: '#8a8b92', o: op });
    }
    void hc2;
    prims.push({ z: P(hc)[2] + 4, sh });
  }

  // ---- braccia
  for (let i = 0; i < 2; i++) {
    const S0 = P(j.sh[i]);
    const E = P(j.el[i]);
    const W = P(j.wr[i]);
    const side = i === 0 ? 1 : -1;
    const dl = (lv: number) => lv;
    const limbMuscleArm = (a3: V3, b3: V3, ant: V3, sd: number, ra: number, rb: number, t0: number, t1: number, lv: number): Shape[] => {
      if (lv <= 0) return [];
      const dir = cv(sub(b3, a3));
      const antc = perp(cv(ant), dir);
      const face = sd === 0 ? 1 : sd * antc[2];
      if (face < -0.1) return [];
      const at = (t: number): V3 => P(add(a3, mul(sub(b3, a3), t)));
      const r = (t: number) => lerp(ra, rb, t);
      const off = (t: number): V => {
        const q = at(t);
        const k = sd === 0 ? 0 : sd * r(t) * 0.3;
        return [q[0] + antc[0] * k, q[1] + antc[1] * k];
      };
      const op = lv * Math.max(0.3, Math.min(1, 0.45 + face * 1.1));
      return withFill(capsulePath(off(t0), off(t1), r(t0) * 0.62, r(t1) * 0.62), 'url(#pec)', op);
    };
    const parts: Part[] = [];
    parts.push({
      a: [E[0], E[1]],
      b: [W[0], W[1]],
      ra: 7,
      rb: 5,
      z: (E[2] + W[2]) / 2,
      fill: COLORS.skin,
      extra: limbMuscleArm(j.el[i], j.wr[i], j.antArm[i], 0, 7, 5, 0.1, 0.85, level('forearms')),
    });
    parts.push({
      a: [S0[0], S0[1]],
      b: [E[0], E[1]],
      ra: 9,
      rb: 7.2,
      z: (S0[2] + E[2]) / 2,
      fill: COLORS.skin,
      extra: [
        ...limbMuscleArm(j.sh[i], j.el[i], j.antArm[i], 1, 9, 7.2, 0.2, 0.85, level('biceps')),
        ...limbMuscleArm(j.sh[i], j.el[i], j.antArm[i], -1, 9, 7.2, 0.2, 0.85, level('triceps')),
      ],
    });
    parts.push({ a: [W[0], W[1]], b: [W[0], W[1]], ra: 6.4, rb: 6.4, z: W[2] + 1, fill: COLORS.skin });
    // deltoide: cappuccio senza contorno interno, solo l'arco esterno
    const body = P(j.chest);
    let ox = S0[0] - body[0];
    let oy = S0[1] - body[1] + 6;
    const ol = Math.hypot(ox, oy) || 1;
    ox /= ol;
    oy /= ol;
    const R = 11.5;
    const top: Shape[] = [{ k: 'circle', cx: S0[0], cy: S0[1], r: R, f: COLORS.skin }];
    top.push({ k: 'ellipse', cx: S0[0] - 2, cy: S0[1] - 3, rx: R * 0.5, ry: R * 0.42, rot: 0, f: COLORS.skinHi, o: 0.8 });
    const dl2 = level('shoulders');
    if (dl2 > 0) top.push({ k: 'circle', cx: S0[0], cy: S0[1], r: R * 0.7, f: 'url(#pec)', o: dl2 * 0.9 });
    const ang0 = Math.atan2(oy, ox);
    const arc: V[] = [];
    for (let q = -105; q <= 105; q += 15) arc.push([S0[0] + Math.cos(ang0 + rad(q)) * R, S0[1] + Math.sin(ang0 + rad(q)) * R]);
    top.push({ k: 'path', d: 'M' + arc.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L'), s: COLORS.outline, sw: 1.8, f: 'none' });
    void dl;
    void side;
    prims.push({ z: (S0[2] + E[2] + W[2]) / 3 + 0.5, sh: chain(parts, top) });
  }

  prims.sort((a, b) => a.z - b.z);
  return prims.flatMap((p) => p.sh);
}

export const KNOWN_MUSCLES = [
  'chest',
  'abdominals',
  'lats',
  'middle back',
  'lower back',
  'traps',
  'neck',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'adductors',
  'abductors',
];
