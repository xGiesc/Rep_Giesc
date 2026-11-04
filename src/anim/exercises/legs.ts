import type { Implement, Joints, Pattern, SceneBuilder } from '../engine';
import { BODY, Pose, V3, anchor, seated, standing } from '../kit';

const PAD = '#34353b';
const MAT = '#3c3d45';

/** Carico tenuto con entrambe le mani: sbarra se non c'è altro (a vuoto / cavo → sbarra). */
function holdBar(S: SceneBuilder, impl: Implement, j: Joints, o?: { plateR?: number }) {
  S.load(impl === 'none' || impl === 'cable' ? 'barbell' : impl, j, o);
}

/** Manubrio/kettlebell tenuto con due mani al petto (goblet). */
function goblet(S: SceneBuilder, impl: Implement, j: Joints) {
  const c = j.hands;
  if (impl === 'kettlebell') S.load('kettlebell', j);
  else if (impl === 'dumbbell') {
    S.bar([c[0], c[1] - 14, c[2]], [c[0], c[1] + 14, c[2]], 2.6, { bias: 2 });
    S.disc([c[0], c[1] + 14, c[2]], [0, 1, 0], 10.5, 7, { bias: 3 });
    S.disc([c[0], c[1] - 14, c[2]], [0, 1, 0], 10.5, 7, { bias: 3 });
  } else if (impl !== 'none') S.load('barbell', j);
}

/** Gambe con piedi fissi a terra; il ginocchio punta sempre in avanti nel mondo (anche col busto inclinato). */
const feet = (foot: V3, lean: number) => {
  const l = (lean * Math.PI) / 180;
  return { w: foot, pole: [0.12, Math.sin(l), Math.cos(l)] as V3 };
};

// ---- pose riutilizzabili -------------------------------------------------------

/** Bilanciere sulla schiena (trapezio): mani sulla sbarra, ovunque sia il busto. */
const backBar = (p: Pose): Pose => ({
  ...p,
  arms: { w: anchor(p, BODY.torso + 2, 52, -16), pole: [1, -0.3, -1] },
});

/** Squat/good morning: piedi fissi a terra, anca che si sposta. */
const withBar = (hip: V3, lean: number, foot: V3 = [30, 11, 0], pole: V3 = [1, -0.3, -1]): Pose => {
  const p = backBar({ hip, lean, legs: feet(foot, lean) });
  return { ...p, arms: { w: (p.arms as { w: V3 }).w, pole } };
};

/** Braccia che pendono in verticale ai lati / davanti alle cosce. */
const hang = (p: Pose, lat: number, fwd: number, drop = 102): Pose => {
  const s = anchor(p, BODY.torso - 6, lat, 0);
  return { ...p, arms: { w: [s[0], s[1] - drop, s[2] + fwd], pole: [1, -0.2, -0.3] } };
};

const standHip = (z = 0): V3 => [0, 146, z];

// ---- esercizi -----------------------------------------------------------------

export const LEGS: Record<string, Pattern> = {
  squat: {
    id: 'squat',
    label: 'Squat',
    cam: { yaw: 62, pitch: 6 },
    a: withBar(standHip(0), 2),
    b: withBar([0, 88, -44], 38),
    scene(j, impl, S) {
      holdBar(S, impl, j);
    },
  },

  squat_front: {
    id: 'squat_front',
    label: 'Squat frontale / Goblet squat',
    cam: { yaw: 62, pitch: 6 },
    // mani davanti al petto (braccia incrociate / goblet), gomiti in avanti
    a: front(standHip(0), 0),
    b: front([0, 90, -40], 26),
    scene(j, impl, S) {
      goblet(S, impl, j);
    },
  },

  squat_hang: {
    id: 'squat_hang',
    label: 'Squat con pesi lungo i fianchi',
    cam: { yaw: 62, pitch: 6 },
    a: hang({ hip: standHip(0), lean: 0, legs: feet([30, 11, 0], 0) }, 46, 8),
    b: hang({ hip: [0, 92, -36], lean: 28, legs: feet([30, 11, 0], 28) }, 46, 8),
    scene(j, impl, S) {
      holdBar(S, impl, j, { plateR: 18 });
    },
  },

  lunge: {
    id: 'lunge',
    label: 'Affondi',
    cam: { yaw: 70, pitch: 6 },
    a: lungePose([0, 136, 0], 2),
    b: lungePose([0, 86, 0], 6),
    scene(j, impl, S) {
      holdBar(S, impl, j);
    },
  },

  deadlift: {
    id: 'deadlift',
    label: 'Stacco da terra',
    cam: { yaw: 62, pitch: 6 },
    a: { hip: [0, 78, -68], lean: 57, legs: feet([16, 11, 0], 57), arms: { w: [40, 24, 8], pole: [1, -0.2, -0.3] } },
    b: { hip: [0, 146, -6], lean: 2, legs: feet([16, 11, 0], 2), arms: { w: [40, 136, 12], pole: [1, -0.2, -0.3] } },
    scene(j, impl, S) {
      holdBar(S, impl, j, { plateR: 20 });
    },
  },

  romanian_deadlift: {
    id: 'romanian_deadlift',
    label: 'Stacco rumeno / Good morning',
    cam: { yaw: 62, pitch: 6 },
    a: { hip: [0, 145, -2], lean: 2, legs: feet([16, 11, 0], 2), arms: { w: [40, 136, 12], pole: [1, -0.2, -0.3] } },
    b: { hip: [0, 132, -52], lean: 72, legs: feet([16, 11, 0], 72), arms: { w: [40, 60, 24], pole: [1, -0.2, -0.3] } },
    scene(j, impl, S) {
      holdBar(S, impl, j, { plateR: 18 });
    },
  },

  good_morning: {
    id: 'good_morning',
    label: 'Good morning',
    cam: { yaw: 62, pitch: 6 },
    a: withBar([0, 145, -2], 2, [16, 11, 0], [1, -0.4, 0]),
    b: withBar([0, 134, -50], 66, [16, 11, 0], [1, -0.4, 0]),
    scene(j, impl, S) {
      holdBar(S, impl, j);
    },
  },

  hip_thrust: {
    id: 'hip_thrust',
    label: 'Hip thrust / Ponte per i glutei',
    cam: { yaw: 72, pitch: 8 },
    a: thrust(62, -71, 40),
    b: thrust(112, -100, 34),
    scene(j, impl, S) {
      S.box([0, 38, -126], [56, 76, 72], { fill: '#4a4c56', bias: -40 });
      const hip = j.hip;
      const c: V3 = [hip[0], hip[1] + 20, hip[2] + 14];
      if (impl === 'dumbbell') {
        S.bar([c[0] - 14, c[1], c[2]], [c[0] + 14, c[1], c[2]], 2.6, { bias: 6 });
        S.disc([c[0] - 14, c[1], c[2]], [1, 0, 0], 10.5, 7, { bias: 7 });
        S.disc([c[0] + 14, c[1], c[2]], [1, 0, 0], 10.5, 7, { bias: 7 });
      } else if (impl === 'kettlebell') S.ball([c[0], c[1] + 2, c[2]], 11, { bias: 6 });
      else if (impl !== 'none') {
        S.bar([c[0] - 105, c[1], c[2]], [c[0] + 105, c[1], c[2]], 2.6, { bias: 6 });
        for (const sg of [1, -1]) {
          S.disc([c[0] + sg * 98, c[1], c[2]], [1, 0, 0], 20, 6, { bias: 7 });
          S.disc([c[0] + sg * 90, c[1], c[2]], [1, 0, 0], 16, 6, { bias: 7 });
        }
      }
    },
  },

  calf_raise: {
    id: 'calf_raise',
    label: 'Calf in piedi',
    cam: { yaw: 150, pitch: 8 },
    a: calf(0),
    b: calf(1),
    scene(j, impl, S) {
      S.box([0, 3, 0], [90, 6, 70], { fill: '#6b6d76', bias: -80 }); // pedana
      if (impl === 'none') return;
      if (impl === 'barbell' || impl === 'cable') {
        // sbarra tenuta ai fianchi
        holdBar(S, impl, j, { plateR: 16 });
      } else S.load(impl, j);
    },
  },

  leg_extension: {
    id: 'leg_extension',
    label: 'Leg extension',
    cam: { yaw: 42, pitch: 10 },
    a: seated({ lean: -6, legs: { el: 90, pl: 4, bend: 92 }, arms: { w: [46, 96, 12], pole: [1, -0.5, -0.2] } }),
    b: seated({ lean: -6, legs: { el: 90, pl: 4, bend: 6 }, arms: { w: [46, 96, 12], pole: [1, -0.5, -0.2] } }),
    scene(j, impl, S) {
      S.box([0, 57, 0], [70, 12, 66], { fill: PAD, bias: -40 });
      S.box([0, 126, -30], [62, 110, 12], { fill: PAD, bias: -40 });
      S.box([0, 28, 0], [26, 56, 26], { bias: -60 });
      S.box([0, 4, 6], [90, 8, 120], { bias: -80 });
      S.box([0, 100, -78], [44, 150, 36], { fill: '#2e2f35', bias: -90 });
      for (const sg of [1, -1]) {
        // leva dal perno (sotto il ginocchio) al rullo sulle caviglie
        const piv: V3 = [sg * 30, 62, 38];
        const roll: V3 = [sg * 22, j.an[0][1] + 4, j.an[0][2] + 8];
        S.bar(piv, roll, 3.2, { fill: '#c9cad0', bias: -30 });
      }
      const r = j.an[0];
      S.bar([-26, r[1] + 4, r[2] + 8], [26, r[1] + 4, r[2] + 8], 6, { fill: '#2a2b30', bias: 4 });
    },
  },

  leg_curl: {
    id: 'leg_curl',
    label: 'Leg curl',
    cam: { yaw: 42, pitch: 10 },
    a: seated({ lean: -6, legs: { el: 92, pl: 4, bend: 2 }, arms: { w: [46, 96, 12], pole: [1, -0.5, -0.2] } }),
    b: seated({ lean: -6, legs: { el: 92, pl: 4, bend: 100 }, arms: { w: [46, 96, 12], pole: [1, -0.5, -0.2] } }),
    scene(j, impl, S) {
      S.box([0, 57, 0], [70, 12, 66], { fill: PAD, bias: -40 });
      S.box([0, 126, -30], [62, 110, 12], { fill: PAD, bias: -40 });
      S.box([0, 28, 0], [26, 56, 26], { bias: -60 });
      S.box([0, 4, 6], [90, 8, 120], { bias: -80 });
      S.box([0, 100, -78], [44, 150, 36], { fill: '#2e2f35', bias: -90 });
      const r = j.an[0];
      S.bar([-26, r[1] - 6, r[2] - 4], [26, r[1] - 6, r[2] - 4], 6, { fill: '#2a2b30', bias: 4 });
      for (const sg of [1, -1]) S.bar([sg * 30, 60, 42], [sg * 24, r[1] - 6, r[2] - 4], 3.2, { fill: '#c9cad0', bias: -30 });
    },
  },

  leg_press: {
    id: 'leg_press',
    label: 'Leg press',
    cam: { yaw: 70, pitch: 8 },
    a: press([30, 128, 56]),
    b: press([30, 152, 98]),
    scene(j, impl, S) {
      const hip = j.hip;
      const up = j.ax.up;
      const fwd = j.ax.fwd;
      // schienale inclinato
      const base: V3 = [hip[0] - 0, hip[1] - fwd[1] * 26, hip[2] - fwd[2] * 26];
      S.bar([base[0] - up[0] * 22, base[1] - up[1] * 22, base[2] - up[2] * 22], [base[0] + up[0] * 118, base[1] + up[1] * 118, base[2] + up[2] * 118], 14, { fill: PAD, bias: -40 });
      S.box([0, 4, -20], [100, 8, 190], { bias: -80 });
      // guide e piattaforma
      for (const sg of [1, -1]) {
        S.bar([sg * 52, 12, 20], [sg * 52, 190, 128], 4, { fill: '#c9cad0', bias: -60 });
      }
      const dd: V3 = [0, 0.5, 0.87];
      const c: V3 = [0, j.an[0][1] + dd[1] * 14 + 8, j.an[0][2] + dd[2] * 14 + 4];
      S.disc(c, dd, 40, 5, { fill: '#aeb0b8', bias: 6 });
      for (const sg of [1, -1]) S.bar([sg * 52, c[1], c[2]], [sg * 40, c[1], c[2]], 4, { fill: '#9a9ba2', bias: 2 });
      // pacco pesi sotto la piattaforma
      S.box([0, 20, 130], [60, 40, 30], { fill: '#2e2f35', bias: -70 });
    },
  },

  crunch: {
    id: 'crunch',
    label: 'Crunch',
    cam: { yaw: 58, pitch: 18 },
    a: floorPose(-90, 0, 0),
    b: floorPose(-58, 28, 1),
    scene(_j, _impl, S) {
      S.box([0, 2, -20], [80, 4, 300], { fill: MAT, bias: -80 });
    },
  },

  leg_raise: {
    id: 'leg_raise',
    label: 'Sollevamento gambe',
    cam: { yaw: 58, pitch: 18 },
    a: { hip: [0, 21, 0], lean: -90, legs: { el: 6, pl: 0, bend: 0 }, arms: { el: 0, pl: 18, bend: 0 } },
    b: { hip: [0, 21, 0], lean: -90, legs: { el: 88, pl: 0, bend: 2 }, arms: { el: 0, pl: 18, bend: 0 } },
    scene(_j, _impl, S) {
      S.box([0, 2, -20], [80, 4, 300], { fill: MAT, bias: -80 });
    },
  },
};

// ---- costruttori delle pose più articolate -------------------------------------

/** Mani davanti al petto, gomiti in avanti (front squat / goblet). */
function front(hip: V3, lean: number): Pose {
  const p: Pose = { hip, lean, legs: feet([30, 11, 0], lean) };
  p.arms = { w: anchor(p, BODY.torso - 22, 13, 24), pole: [0.3, 0.2, 1] };
  return p;
}

/** Affondo: un piede avanti e uno indietro (fermi), bilanciere sulla schiena. */
function lungePose(hip: V3, lean: number): Pose {
  const p: Pose = { hip, lean, legL: { ...feet([14, 11, 50], lean) }, legR: { ...feet([-14, 11, -46], lean) } };
  p.arms = { w: anchor(p, BODY.torso + 2, 52, -16), pole: [1, -0.3, -1] };
  return p;
}

/** Hip thrust: schiena alta sulla panca, piedi a terra. `hipY` altezza bacino, `lean` inclinazione del busto. */
function thrust(hipY: number, lean: number, footZ: number): Pose {
  const p: Pose = { hip: [0, hipY, 0], lean, head: 18, legs: { w: [16, 11, footZ] } };
  p.arms = { w: anchor(p, 6, 24, 22), pole: [1, 0, -0.4] };
  return p;
}

/** Calf raise: la punta resta a terra, il tallone sale (il piede si inclina). */
function calf(k: number): Pose {
  const lift = 17 * k;
  const pitch = 0.66 * k;
  const p: Pose = {
    hip: [0, 146 + lift, 0],
    lean: 0,
    legs: { w: [16, 11 + lift, 0] },
    toe: [0, -pitch, 1 - 0.25 * k],
  };
  return hang(p, 46, 8);
}

/** Leg press: schiena reclinata, piedi sulla pedana (bersaglio della caviglia). */
function press(ankle: V3): Pose {
  return {
    hip: [0, 75, 0],
    lean: -40,
    legs: { w: ankle },
    toe: [0, 0.87, -0.5],
    arms: { w: [50, 98, 8], pole: [1, -0.3, -0.2] },
  };
}

/** A terra (crunch): busto `lean` sul pavimento, mani dietro la testa. */
function floorPose(lean: number, head: number, _k: number): Pose {
  const p: Pose = { hip: [0, 21, 0], lean, head, legs: { w: [16, 11, 82] } };
  p.arms = { w: anchor(p, BODY.torso + 30, 17, -3), pole: [1, 0.4, 0] };
  return p;
}

void standing;
