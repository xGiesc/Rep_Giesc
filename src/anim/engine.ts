/**
 * Motore delle animazioni dell'omino (vista laterale, tutto in SVG).
 *
 * Un movimento è definito da due pose (partenza e arrivo). Ogni frame
 * interpola le pose, calcola l'omino (cinematica inversa per gambe e braccia)
 * e restituisce un elenco di forme da disegnare. Le forme sono indipendenti
 * dal renderer: l'app le disegna con react-native-svg.
 *
 * Convenzioni: coordinate SVG (y verso il basso), angoli in gradi con 0 = +x
 * e 90 = giù. L'omino "guarda" verso +x. Disteso supino ha la testa a sinistra.
 */

export type V = [number, number];

export const VIEW = { w: 300, h: 240 };
export const GROUND = 214;

export const LEN = {
  torso: 50,
  neck: 9,
  head: 10,
  uarm: 30,
  farm: 28,
  thigh: 45,
  shin: 43,
  foot: 18,
  heel: 5,
};

export const COLORS = {
  bg: '#f3f3f6',
  floor: '#dcdce2',
  body: '#cfd1d8',
  bodyFar: '#a3a6b0',
  torso: '#b8bbc4',
  head: '#dadde3',
  outline: '#4d515c',
  red: '#e30613',
  metal: '#5a6070',
  plate: '#30343f',
  bench: '#9aa1ae',
  cable: '#7b8190',
};

export type Shape =
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number; w: number; c: string; o?: number }
  | { k: 'circle'; cx: number; cy: number; r: number; c: string; o?: number }
  | { k: 'rect'; x: number; y: number; w: number; h: number; rx?: number; c: string; o?: number }
  | { k: 'poly'; pts: V[]; c: string; o?: number };

/** Dove va la mano: posizione assoluta, relativa a spalla/anca, oppure angoli (FK). */
export type Hand =
  | { abs: V }
  | { sh: V }
  | { hip: V }
  | { fk: [number, number] }; // [angolo braccio, angolo avambraccio]

export type Pose = {
  hip: V;
  torso: number; // anca → spalla
  ankle: V;
  foot?: number; // caviglia → punta (default 0)
  hand: Hand;
  neck?: number; // default = torso
  shrug?: number;
  kneeDir?: V; // verso in cui piega il ginocchio (default avanti)
  elbowDir?: V; // verso in cui piega il gomito (default indietro-giù)
  ankle2?: V; // gamba lontana (se diversa)
  foot2?: number;
  kneeDir2?: V;
};

export type Joints = {
  hip: V;
  shoulder: V;
  neckEnd: V;
  head: V;
  knee: V;
  ankle: V;
  toe: V;
  heel: V;
  far: { knee: V; ankle: V; toe: V; heel: V } | null;
  elbow: V;
  wrist: V;
  torsoAngle: number;
};

export type Implement = 'barbell' | 'dumbbell' | 'kettlebell' | 'cable' | 'none';

export type Scene = { back: Shape[]; front: Shape[] };

export type Pattern = {
  id: string;
  label: string;
  a: Pose;
  b: Pose;
  scene: (j: Joints, impl: Implement) => Scene;
  /** durata di una ripetizione (ms), default 2800 */
  ms?: number;
};

// ---- vettori -----------------------------------------------------------------

const rad = (d: number) => (d * Math.PI) / 180;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const polar = (deg: number, len: number): V => [
  Math.cos(rad(deg)) * len,
  Math.sin(rad(deg)) * len,
];
const lerp = (a: number, b: number, s: number) => a + (b - a) * s;
const lerpV = (a: V, b: V, s: number): V => [lerp(a[0], b[0], s), lerp(a[1], b[1], s)];

/** Cinematica inversa a due segmenti: restituisce articolazione intermedia e punta. */
function ik(a: V, c: V, l1: number, l2: number, pref: V) {
  const dx = c[0] - a[0];
  const dy = c[1] - a[1];
  const d = Math.hypot(dx, dy);
  const dc = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, d));
  const base = Math.atan2(dy, dx);
  const cosA = (l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc);
  const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const end: V = [a[0] + Math.cos(base) * dc, a[1] + Math.sin(base) * dc];
  const m1: V = [a[0] + l1 * Math.cos(base + A), a[1] + l1 * Math.sin(base + A)];
  const m2: V = [a[0] + l1 * Math.cos(base - A), a[1] + l1 * Math.sin(base - A)];
  const s1 = (m1[0] - a[0]) * pref[0] + (m1[1] - a[1]) * pref[1];
  const s2 = (m2[0] - a[0]) * pref[0] + (m2[1] - a[1]) * pref[1];
  return { mid: s1 >= s2 ? m1 : m2, end };
}

// ---- pose → omino --------------------------------------------------------------

export function solve(p: Pose): Joints {
  const shoulder = add(add(p.hip, polar(p.torso, LEN.torso)), [0, -(p.shrug ?? 0)]);
  const neckDir = p.neck ?? p.torso;
  const neckEnd = add(shoulder, polar(neckDir, LEN.neck));
  const head = add(neckEnd, polar(neckDir, LEN.head - 2));

  const f = p.foot ?? 0;
  const leg = ik(p.hip, p.ankle, LEN.thigh, LEN.shin, p.kneeDir ?? [1, 0]);
  const toe = add(leg.end, polar(f, LEN.foot));
  const heel = add(leg.end, polar(f + 180, LEN.heel));

  let far: Joints['far'] = null;
  if (p.ankle2) {
    const f2 = p.foot2 ?? 0;
    const l2 = ik(p.hip, p.ankle2, LEN.thigh, LEN.shin, p.kneeDir2 ?? p.kneeDir ?? [1, 0]);
    far = {
      knee: l2.mid,
      ankle: l2.end,
      toe: add(l2.end, polar(f2, LEN.foot)),
      heel: add(l2.end, polar(f2 + 180, LEN.heel)),
    };
  }

  let elbow: V;
  let wrist: V;
  const h = p.hand;
  if ('fk' in h) {
    elbow = add(shoulder, polar(h.fk[0], LEN.uarm));
    wrist = add(elbow, polar(h.fk[1], LEN.farm));
  } else {
    const target: V =
      'abs' in h ? h.abs : 'sh' in h ? add(shoulder, h.sh) : add(p.hip, h.hip);
    const arm = ik(shoulder, target, LEN.uarm, LEN.farm, p.elbowDir ?? [-0.3, 1]);
    elbow = arm.mid;
    wrist = arm.end;
  }

  return {
    hip: p.hip,
    shoulder,
    neckEnd,
    head,
    knee: leg.mid,
    ankle: leg.end,
    toe,
    heel,
    far,
    elbow,
    wrist,
    torsoAngle: p.torso,
  };
}

export function lerpPose(a: Pose, b: Pose, s: number): Pose {
  let hand: Hand;
  if ('fk' in a.hand && 'fk' in b.hand) {
    hand = { fk: [lerp(a.hand.fk[0], b.hand.fk[0], s), lerp(a.hand.fk[1], b.hand.fk[1], s)] };
  } else if ('abs' in a.hand && 'abs' in b.hand) {
    hand = { abs: lerpV(a.hand.abs, b.hand.abs, s) };
  } else if ('sh' in a.hand && 'sh' in b.hand) {
    hand = { sh: lerpV(a.hand.sh, b.hand.sh, s) };
  } else if ('hip' in a.hand && 'hip' in b.hand) {
    hand = { hip: lerpV(a.hand.hip, b.hand.hip, s) };
  } else {
    throw new Error('Le due pose devono usare lo stesso tipo di mano');
  }
  const a2 = a.ankle2 ?? a.ankle;
  const b2 = b.ankle2 ?? b.ankle;
  const hasFar = !!(a.ankle2 || b.ankle2);
  return {
    hip: lerpV(a.hip, b.hip, s),
    torso: lerp(a.torso, b.torso, s),
    ankle: lerpV(a.ankle, b.ankle, s),
    foot: lerp(a.foot ?? 0, b.foot ?? 0, s),
    hand,
    neck: lerp(a.neck ?? a.torso, b.neck ?? b.torso, s),
    shrug: lerp(a.shrug ?? 0, b.shrug ?? 0, s),
    kneeDir: a.kneeDir ?? b.kneeDir,
    elbowDir: lerpV(a.elbowDir ?? [-0.3, 1], b.elbowDir ?? [-0.3, 1], s),
    ankle2: hasFar ? lerpV(a2, b2, s) : undefined,
    foot2: lerp(a.foot2 ?? 0, b.foot2 ?? 0, s),
    kneeDir2: a.kneeDir2 ?? b.kneeDir2,
  };
}

/** Fase del ciclo (0..1) → posizione tra le due pose (0..1), con pause alle estremità. */
export function phaseToS(p: number): number {
  let u: number;
  if (p < 0.12) u = 0;
  else if (p < 0.5) u = (p - 0.12) / 0.38;
  else if (p < 0.62) u = 1;
  else u = 1 - (p - 0.62) / 0.38;
  return u * u * (3 - 2 * u);
}

// ---- muscoli evidenziati --------------------------------------------------------

type SegName = 'torso' | 'uarm' | 'farm' | 'thigh' | 'shin' | 'neck';

type Region =
  | { seg: SegName; t0: number; t1: number; off: number; w: number }
  | { seg: SegName; t: number; off: number; r: number };

const MUSCLE_REGIONS: Record<string, Region[]> = {
  chest: [{ seg: 'torso', t0: 0.55, t1: 0.92, off: 5, w: 20 }],
  abdominals: [{ seg: 'torso', t0: 0.06, t1: 0.5, off: 8, w: 14 }],
  lats: [{ seg: 'torso', t0: 0.3, t1: 0.8, off: -7, w: 15 }],
  'middle back': [{ seg: 'torso', t0: 0.45, t1: 0.85, off: -8, w: 13 }],
  'lower back': [{ seg: 'torso', t0: 0.0, t1: 0.32, off: -8, w: 13 }],
  traps: [
    { seg: 'torso', t0: 0.8, t1: 1.0, off: -5, w: 14 },
    { seg: 'neck', t0: 0.0, t1: 1.0, off: 0, w: 8 },
  ],
  neck: [{ seg: 'neck', t0: 0.0, t1: 1.0, off: 0, w: 8 }],
  shoulders: [
    { seg: 'uarm', t: 0.0, off: 0, r: 9 },
    { seg: 'uarm', t0: 0.0, t1: 0.3, off: 0, w: 11 },
  ],
  biceps: [{ seg: 'uarm', t0: 0.18, t1: 0.82, off: 4, w: 7 }],
  triceps: [{ seg: 'uarm', t0: 0.18, t1: 0.82, off: -4, w: 7 }],
  forearms: [{ seg: 'farm', t0: 0.08, t1: 0.92, off: 0, w: 7 }],
  quadriceps: [{ seg: 'thigh', t0: 0.1, t1: 0.85, off: 5, w: 12 }],
  hamstrings: [{ seg: 'thigh', t0: 0.1, t1: 0.85, off: -5, w: 12 }],
  glutes: [{ seg: 'torso', t: 0.0, off: -7, r: 12 }],
  calves: [{ seg: 'shin', t0: 0.08, t1: 0.6, off: -5, w: 10 }],
  adductors: [{ seg: 'thigh', t0: 0.4, t1: 0.95, off: 0, w: 9 }],
  abductors: [{ seg: 'torso', t: 0.0, off: -3, r: 10 }],
};

function segment(j: Joints, seg: SegName): { a: V; b: V; front: number } {
  switch (seg) {
    case 'torso':
      return { a: j.hip, b: j.shoulder, front: 1 };
    case 'neck':
      return { a: j.shoulder, b: j.neckEnd, front: 1 };
    case 'uarm':
      return { a: j.shoulder, b: j.elbow, front: -1 };
    case 'farm':
      return { a: j.elbow, b: j.wrist, front: -1 };
    case 'thigh':
      return { a: j.hip, b: j.knee, front: -1 };
    case 'shin':
      return { a: j.knee, b: j.ankle, front: -1 };
  }
}

function pointOn(j: Joints, seg: SegName, t: number, off: number): V {
  const { a, b, front } = segment(j, seg);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return [a[0] + dx * t + nx * off * front, a[1] + dy * t + ny * off * front];
}

function muscleShapes(j: Joints, muscle: string, opacity: number): Shape[] {
  const out: Shape[] = [];
  for (const r of MUSCLE_REGIONS[muscle] ?? []) {
    if ('r' in r) {
      const c = pointOn(j, r.seg, r.t, r.off);
      out.push({ k: 'circle', cx: c[0], cy: c[1], r: r.r, c: COLORS.red, o: opacity });
    } else {
      const p0 = pointOn(j, r.seg, r.t0, r.off);
      const p1 = pointOn(j, r.seg, r.t1, r.off);
      out.push({
        k: 'line',
        x1: p0[0],
        y1: p0[1],
        x2: p1[0],
        y2: p1[1],
        w: r.w,
        c: COLORS.red,
        o: opacity,
      });
    }
  }
  return out;
}

export const KNOWN_MUSCLES = Object.keys(MUSCLE_REGIONS);

// ---- frame completo -------------------------------------------------------------

const line = (a: V, b: V, w: number, c: string, o?: number): Shape => ({
  k: 'line',
  x1: a[0],
  y1: a[1],
  x2: b[0],
  y2: b[1],
  w,
  c,
  o,
});

const OW = 3; // spessore extra del contorno

/** Catena di segmenti: prima tutti i contorni, poi i riempimenti (niente righe ai giunti). */
function chain(out: Shape[], parts: Array<[V, V, number]>, fill: string) {
  for (const [a, b, w] of parts) out.push(line(a, b, w + OW, COLORS.outline));
  for (const [a, b, w] of parts) out.push(line(a, b, w, fill));
}

export function buildFrame(
  pattern: Pattern,
  s: number,
  impl: Implement,
  primary: string[],
  secondary: string[],
): Shape[] {
  const pose = lerpPose(pattern.a, pattern.b, s);
  const j = solve(pose);
  const scene = pattern.scene(j, impl);
  const out: Shape[] = [...scene.back];

  // gamba lontana
  if (j.far) {
    out.push(line(j.hip, j.far.knee, 15, COLORS.bodyFar));
    out.push(line(j.far.knee, j.far.ankle, 11, COLORS.bodyFar));
    out.push(line(j.far.heel, j.far.toe, 7, COLORS.bodyFar));
  }
  // braccio lontano, appena spostato per dare profondità
  const off: V = [-5, -2];
  const sh2 = add(j.shoulder, off);
  out.push(line(sh2, add(j.elbow, off), 10, COLORS.bodyFar));
  out.push(line(add(j.elbow, off), add(j.wrist, off), 8, COLORS.bodyFar));

  // busto e bacino (contorno + riempimento)
  out.push(line(j.hip, j.shoulder, 28 + OW, COLORS.outline));
  out.push({ k: 'circle', cx: j.hip[0], cy: j.hip[1], r: 14 + OW / 2, c: COLORS.outline });
  out.push(line(j.hip, j.shoulder, 28, COLORS.torso));
  out.push({ k: 'circle', cx: j.hip[0], cy: j.hip[1], r: 14, c: COLORS.torso });

  // gamba vicina
  chain(out, [
    [j.hip, j.knee, 17],
    [j.knee, j.ankle, 13],
    [j.heel, j.toe, 7],
  ], COLORS.body);

  // collo e testa
  out.push(line(j.shoulder, j.neckEnd, 8, COLORS.head));
  out.push({ k: 'circle', cx: j.head[0], cy: j.head[1], r: LEN.head + OW / 2, c: COLORS.outline });
  out.push({ k: 'circle', cx: j.head[0], cy: j.head[1], r: LEN.head, c: COLORS.head });

  // braccio vicino
  out.push({ k: 'circle', cx: j.shoulder[0], cy: j.shoulder[1], r: 8 + OW / 2, c: COLORS.outline });
  chain(out, [
    [j.shoulder, j.elbow, 11],
    [j.elbow, j.wrist, 9],
  ], COLORS.body);
  out.push({ k: 'circle', cx: j.wrist[0], cy: j.wrist[1], r: 5 + OW / 2, c: COLORS.outline });
  out.push({ k: 'circle', cx: j.shoulder[0], cy: j.shoulder[1], r: 8, c: COLORS.body });
  out.push({ k: 'circle', cx: j.wrist[0], cy: j.wrist[1], r: 5, c: COLORS.body });

  // muscoli: prima i secondari (chiari), poi i principali (pieni)
  for (const m of secondary) out.push(...muscleShapes(j, m, 0.38));
  for (const m of primary) out.push(...muscleShapes(j, m, 0.92));

  out.push(...scene.front);
  return out;
}

// ---- pezzi di scena riusabili ----------------------------------------------------

export const floor = (): Shape => ({
  k: 'rect',
  x: 10,
  y: GROUND + 1,
  w: 280,
  h: 3,
  rx: 1.5,
  c: COLORS.floor,
});

/** Peso tenuto in mano, visto di lato. */
export function weightAt(p: V, impl: Implement, plateR = 12): Shape[] {
  if (impl === 'barbell') {
    return [
      { k: 'circle', cx: p[0], cy: p[1], r: plateR, c: COLORS.plate },
      { k: 'circle', cx: p[0], cy: p[1], r: 3.5, c: COLORS.metal },
    ];
  }
  if (impl === 'dumbbell') {
    return [
      { k: 'circle', cx: p[0], cy: p[1], r: 7.5, c: COLORS.plate },
      { k: 'circle', cx: p[0], cy: p[1], r: 2.5, c: COLORS.metal },
    ];
  }
  if (impl === 'kettlebell') {
    return [
      { k: 'circle', cx: p[0], cy: p[1] + 5, r: 9, c: COLORS.plate },
      { k: 'rect', x: p[0] - 4, y: p[1] - 7, w: 8, h: 6, rx: 2, c: COLORS.metal },
    ];
  }
  return [];
}

/** Cavo da una carrucola fissa fino alla mano. */
export function cableTo(pulley: V, p: V, impl: Implement): Shape[] {
  if (impl !== 'cable') return [];
  return [
    line(pulley, p, 2, COLORS.cable),
    { k: 'circle', cx: pulley[0], cy: pulley[1], r: 6, c: COLORS.metal },
    { k: 'circle', cx: pulley[0], cy: pulley[1], r: 2, c: COLORS.bg },
  ];
}

export const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
  rx = 2,
): Shape => ({ k: 'rect', x, y, w, h, rx, c });

export const seg = line;
