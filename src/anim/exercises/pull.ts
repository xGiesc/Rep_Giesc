import { Implement, Joints, Pattern, Pose, SceneBuilder, V3 } from '../engine';
import { BODY, SEAT_HIP_Y, anchor, seated, standing } from '../kit';

const DARK_PAD = '#34353b';

/** Bilanciere tra le mani (con `behind` il carico sta dietro al corpo, per le viste da dietro). */
function barbell(S: SceneBuilder, j: Joints, bias: number) {
  const L = j.wr[0];
  const R = j.wr[1];
  const c: V3 = [(L[0] + R[0]) / 2, (L[1] + R[1]) / 2, (L[2] + R[2]) / 2];
  const half = Math.max(Math.hypot(L[0] - R[0], L[1] - R[1], L[2] - R[2]) / 2 + 70, 105);
  S.bar([c[0] + half + 12, c[1], c[2]], [c[0] - half - 12, c[1], c[2]], 2.6, { bias });
  for (const sg of [1, -1]) {
    S.disc([c[0] + sg * (half - 6), c[1], c[2]], [1, 0, 0], 20, 6, { bias });
    S.disc([c[0] + sg * (half - 14), c[1], c[2]], [1, 0, 0], 16.5, 6, { bias });
  }
}

/** Carico in mano secondo l'attrezzo; 'none' ripiega su un bilanciere (multipower). */
function hold(S: SceneBuilder, impl: Implement, j: Joints, o: { cableFrom?: V3; bias?: number } = {}) {
  const bias = o.bias ?? 3;
  if (impl === 'dumbbell' || impl === 'kettlebell') {
    S.load(impl, j);
    return;
  }
  if (impl === 'cable' && o.cableFrom) {
    const a = j.wr[0];
    const b = j.wr[1];
    S.bar([a[0] + 12, a[1], a[2]], [b[0] - 12, b[1], b[2]], 2.6, { fill: '#2a2b30', bias });
    const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    S.disc(o.cableFrom, [1, 0, 0], 8, 4, { fill: '#cfd0d5', bias: -20 });
    S.box([o.cableFrom[0], 5, o.cableFrom[2]], [30, 10, 30], { bias: -60 });
    S.cable(o.cableFrom, m);
    return;
  }
  barbell(S, j, bias);
}

// ---- lat machine (da dietro) ---------------------------------------------------------

const latPose = (lean: number, w: V3): Pose => seated({ lean, arms: { w, pole: [1, -1, -0.5] } });

const LAT: Pattern = {
  id: 'lat_pulldown',
  label: 'Lat machine',
  cam: { yaw: 195, pitch: 10 },
  a: latPose(-8, [60, 262, 24]),
  b: latPose(-14, [58, 166, 26]),
  scene(j, impl, S) {
    S.box([0, 57, 4], [72, 12, 60], { fill: DARK_PAD, bias: -40 });
    S.box([0, 28, -2], [18, 56, 18], { bias: -60 });
    // cuscino sulle cosce
    S.bar([-30, 102, 38], [30, 102, 38], 7, { fill: DARK_PAD, bias: -10 });
    S.bar([0, 102, 38], [0, 56, 46], 3, { bias: -20 });
    // telaio con carrucola in alto
    S.box([-118, 175, 40], [14, 350, 14], { bias: -90 });
    S.box([118, 175, 40], [14, 350, 14], { bias: -90 });
    S.box([0, 352, 40], [250, 14, 14], { bias: -90 });
    S.box([0, 5, 40], [270, 10, 40], { bias: -95 });
    S.disc([0, 336, 40], [1, 0, 0], 10, 5, { fill: '#cfd0d5', bias: -80 });
    const a = j.wr[0];
    const b = j.wr[1];
    S.bar([a[0] + 18, a[1], a[2]], [b[0] - 18, b[1], b[2]], 3, { fill: '#2a2b30', bias: 4 });
    S.cable([a[0] + 18, a[1], a[2]], [0, 336, 40]);
    S.cable([b[0] - 18, b[1], b[2]], [0, 336, 40]);
  },
};

// ---- trazioni ---------------------------------------------------------------------

const BAR_Y = 300;
const pullPose = (hipY: number, lean: number): Pose => ({
  hip: [0, hipY, 0],
  lean,
  legs: { el: 12, bend: 95 },
  arms: { w: [52, BAR_Y, 8], pole: [1, -1, -0.3] },
});

const PULL_UP: Pattern = {
  id: 'pull_up',
  label: 'Trazioni alla sbarra',
  cam: { yaw: 200, pitch: 8 },
  a: pullPose(100, 0),
  b: pullPose(184, -8),
  scene(j, impl, S) {
    S.box([-110, 150, 8], [12, 300, 12], { bias: -90 });
    S.box([110, 150, 8], [12, 300, 12], { bias: -90 });
    S.box([0, 4, 8], [250, 8, 40], { bias: -95 });
    S.bar([-110, BAR_Y + 2, 8], [110, BAR_Y + 2, 8], 3.5, { bias: -10 });
  },
};

// ---- pulley basso (3/4) --------------------------------------------------------------

const rowSeat = (lean: number, z: number): Pose => ({
  hip: [0, 58, 0],
  lean,
  legs: { w: [18, 52, 128], pole: [0.3, 1, 0] },
  arms: { w: [9, 100, z], pole: [0.6, -0.3, -1] },
  toe: [0, 1, 0.25],
});

const SEATED_ROW: Pattern = {
  id: 'seated_row',
  label: 'Rematore ai cavi da seduti',
  cam: { yaw: 52, pitch: 10 },
  a: rowSeat(26, 120),
  b: rowSeat(-6, 28),
  scene(j, impl, S) {
    S.box([0, 3, 55], [34, 6, 240], { bias: -95 });
    S.box([0, 40, -8], [44, 10, 44], { fill: DARK_PAD, bias: -40 });
    S.box([0, 20, -8], [10, 40, 10], { bias: -60 });
    S.box([0, 52, 140], [100, 70, 8], { fill: '#d9dadf', bias: -40 });
    S.box([0, 28, 150], [10, 60, 10], { bias: -60 });
    S.disc([0, 62, 156], [1, 0, 0], 8, 4, { fill: '#cfd0d5', bias: -30 });
    const a = j.wr[0];
    const b = j.wr[1];
    S.bar([a[0], a[1], a[2]], [b[0], b[1], b[2]], 2.6, { fill: '#2a2b30', bias: 4 });
    S.cable([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [0, 62, 156]);
  },
};

// ---- rematore (da dietro, 3/4) --------------------------------------------------------

const rowPose = (hand: V3): Pose => {
  const p: Pose = { hip: [0, 136, -40], lean: 62, legs: { w: [18, 11, 0] } };
  p.arms = { w: hand, pole: [1, 0.3, -0.8] };
  return p;
};

const BENT_ROW: Pattern = {
  id: 'bent_row',
  label: 'Rematore',
  cam: { yaw: 130, pitch: 14 },
  a: rowPose([46, 86, 52]),
  b: rowPose([46, 138, -4]),
  scene(j, impl, S) {
    hold(S, impl === 'cable' ? 'barbell' : impl, j, { bias: -30 });
  },
};

// ---- curl bicipiti (3/4 frontale) -------------------------------------------------------

const curlPose = (bend: number): Pose => standing({
  legs: { w: [18, 11, 0] },
  arms: { el: 4, pl: 8, bend },
});

const CURL: Pattern = {
  id: 'biceps_curl',
  label: 'Curl per bicipiti',
  cam: { yaw: 24, pitch: 8 },
  a: curlPose(2),
  b: curlPose(138),
  scene(j, impl, S) {
    hold(S, impl, j, { cableFrom: [0, 10, 110] });
  },
};

// ---- scrollate (da dietro, 3/4) -----------------------------------------------------------

const shrugPose = (shrug: number): Pose =>
  standing({ legs: { w: [18, 11, 0] }, arms: { el: 6, pl: 4, bend: 0 }, shrug });

const SHRUG: Pattern = {
  id: 'shrug',
  label: 'Scrollate (shrug)',
  cam: { yaw: 150, pitch: 10 },
  a: shrugPose(0),
  b: shrugPose(16),
  scene(j, impl, S) {
    hold(S, impl, j, { cableFrom: [0, 10, 110], bias: -40 });
  },
};

// ---- tirate al mento ----------------------------------------------------------------------

const uprightPose = (hand: V3): Pose =>
  standing({ legs: { w: [18, 11, 0] }, arms: { w: hand, pole: [1, 0.3, 0] } });

const UPRIGHT: Pattern = {
  id: 'upright_row',
  label: 'Tirate al mento',
  cam: { yaw: 22, pitch: 8 },
  a: uprightPose([16, 144, 20]),
  b: uprightPose([16, 232, 26]),
  scene(j, impl, S) {
    hold(S, impl, j, { cableFrom: [0, 10, 110] });
  },
};

// ---- iperestensioni ------------------------------------------------------------------------

const BE_HIP: V3 = [0, 95, 0];
const hyperPose = (lean: number): Pose => ({
  hip: BE_HIP,
  lean,
  legs: { w: [16, 60, -130], pole: [0, 0, 1] },
  arms: { b: [-26, 28, 4], pole: [1, 0, -0.2] },
});

const BACK_EXT: Pattern = {
  id: 'back_extension',
  label: 'Hyperextension',
  cam: { yaw: 118, pitch: 18 },
  a: hyperPose(118),
  b: hyperPose(76),
  scene(j, impl, S) {
    S.box([0, 3, -60], [66, 6, 250], { bias: -95 });
    S.bar([-34, 68, 6], [34, 68, 6], 12, { fill: DARK_PAD, bias: -10 });
    for (const x of [-26, 26]) {
      S.box([x, 34, 6], [8, 68, 8], { bias: -60 });
      S.box([x + (x > 0 ? 6 : -6), 38, -130], [6, 76, 6], { bias: -60 });
    }
    S.bar([-32, 77, -130], [32, 77, -130], 7, { fill: DARK_PAD, bias: -10 });
    S.box([0, 44, -140], [70, 8, 14], { fill: '#d9dadf', bias: -60 });
    void BODY;
    void anchor;
    void SEAT_HIP_Y;
  },
};

export const PULL: Record<string, Pattern> = {
  lat_pulldown: LAT,
  pull_up: PULL_UP,
  seated_row: SEATED_ROW,
  bent_row: BENT_ROW,
  biceps_curl: CURL,
  shrug: SHRUG,
  upright_row: UPRIGHT,
  back_extension: BACK_EXT,
};
