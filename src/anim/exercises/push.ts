import { Implement, Pattern, Pose, SceneBuilder, V3, axesOf } from '../engine';
import { BODY, seated, standing } from '../kit';

const DARK_PAD = '#34353b';
const BAR_DARK = '#2a2b30';

/** Cosa si tiene in mano: bilanciere se l'attrezzo non è adatto. */
const held = (impl: Implement, dflt: Implement): Implement => (impl === 'none' || impl === 'cable' ? dflt : impl);

/** Centro del bacino che porta il centro delle spalle in `s` con busto inclinato `lean`. */
const hipFor = (s: V3, lean: number): V3 => {
  const up = axesOf(lean, 0).up;
  return [s[0] - up[0] * (BODY.torso - 6), s[1] - up[1] * (BODY.torso - 6), s[2] - up[2] * (BODY.torso - 6)];
};

// ---- panche ------------------------------------------------------------------------

/** Supino sulla panca piana (testa verso -z, piedi a terra verso +z). */
const supine = (o: Partial<Pose>): Pose => ({ hip: [0, 95, 40], lean: -90, legs: { w: [30, 11, 98] }, ...o });

const flatBench = (S: SceneBuilder) => {
  S.box([0, 72, -25], [52, 12, 205], { fill: DARK_PAD, bias: -40 });
  for (const [x, z] of [[-18, -110], [18, -110], [-18, 60], [18, 60]]) S.box([x, 33, z], [7, 66, 7], { bias: -60 });
};

/** Schienale inclinato fatto di tante barre affiancate. */
const tiltedPad = (S: SceneBuilder, hip: V3, lean: number, from: number, to: number) => {
  const ax = axesOf(lean, 0);
  const off = 18 + 4.4;
  for (let x = -24; x <= 24; x += 6) {
    const p = (u: number): V3 => [hip[0] + ax.up[0] * u - ax.fwd[0] * off + x, hip[1] + ax.up[1] * u - ax.fwd[1] * off, hip[2] + ax.up[2] * u - ax.fwd[2] * off];
    S.bar(p(from), p(to), 4.4, { fill: DARK_PAD, bias: -40 });
  }
};

// ---- panca inclinata -----------------------------------------------------------------
const INC_LEAN = -48;
const INC_HIP: V3 = [0, 77, 16];
const incline = (o: Partial<Pose>): Pose => ({
  hip: INC_HIP,
  lean: INC_LEAN,
  legs: { w: [24, 11, 74] },
  ...o,
});

// ---- piegamenti ----------------------------------------------------------------------
const ANKLE_Y = 22;
const ANKLE_Z = -110;
const plank = (lean: number, handZ: number): Pose => {
  const up = axesOf(lean, 0).up;
  return {
    hip: [0, ANKLE_Y + 136 * up[1], ANKLE_Z + 136 * up[2]],
    lean,
    legs: { w: [10, ANKLE_Y, ANKLE_Z] },
    toe: [0, -0.55, 0.83],
    arms: { b: [0, 0, 0] },
    armL: { w: [40, 7, handZ], pole: [1, -0.5, 0] },
    armR: { w: [-40, 7, handZ], pole: [1, -0.5, 0] },
  };
};
const PLANK_UP = axesOf(68, 0).up;
const PLANK_HZ = ANKLE_Z + 136 * PLANK_UP[2] + (BODY.torso - 6) * PLANK_UP[2];

// ---- dip -------------------------------------------------------------------------------
const BAR_Y = 150;
const dipPose = (sy: number, lean: number): Pose => ({
  hip: hipFor([0, sy, 0], lean),
  lean,
  legs: { el: 4, pl: 0, bend: 80 },
  armL: { w: [38, BAR_Y, 0], pole: [0.4, 0, -1] },
  armR: { w: [-38, BAR_Y, 0], pole: [0.4, 0, -1] },
});

export const PUSH: Record<string, Pattern> = {
  chest_press_machine: {
    id: 'chest_press_machine',
    label: 'Chest press alla macchina',
    cam: { yaw: 0, pitch: 6 },
    a: seated({ arms: { w: [58, 150, 26], pole: [1, 0, -0.6] } }),
    b: seated({ arms: { w: [22, 150, 84], pole: [1, -0.2, -0.3] } }),
    scene(j, impl, S) {
      S.box([0, 57, 6], [72, 12, 64], { fill: DARK_PAD, bias: -40 });
      S.box([0, 135, -24], [62, 120, 12], { fill: DARK_PAD, bias: -40 });
      S.box([0, 28, -6], [18, 56, 18], { bias: -60 });
      S.box([-128, 135, -22], [16, 270, 16], { bias: -90 });
      S.box([128, 135, -22], [16, 270, 16], { bias: -90 });
      S.box([0, 268, -22], [272, 14, 16], { bias: -90 });
      S.box([172, 90, -22], [40, 150, 26], { fill: '#2e2f35', bias: -90 });
      for (const x of [-128, 128]) {
        S.disc([x, 150, -14], [0, 0, 1], 9, 4, { fill: '#cfd0d5', bias: -80 });
        S.cable([x, 150, -14], [x * 0.4, 150, 0], 1.8);
      }
      const a = j.wr[0];
      const b = j.wr[1];
      S.bar([a[0] + 10, a[1], a[2]], [b[0] - 10, b[1], b[2]], 3, { fill: BAR_DARK, bias: 4 });
    },
  },

  bench_press: {
    id: 'bench_press',
    label: 'Panca piana',
    cam: { yaw: 28, pitch: 22 },
    a: supine({ arms: { w: [46, 205, -56], pole: [1, 0, -0.5] } }),
    b: supine({ arms: { w: [46, 126, -52], pole: [1, 0, -0.5] } }),
    scene(j, impl, S) {
      flatBench(S);
      S.load(held(impl, 'barbell'), j);
    },
  },

  incline_press: {
    id: 'incline_press',
    label: 'Panca inclinata',
    cam: { yaw: 32, pitch: 16 },
    a: incline({ arms: { w: [44, 246, -50], pole: [1, -0.2, -0.6] } }),
    b: incline({ arms: { w: [44, 162, -40], pole: [1, -0.2, -0.6] } }),
    scene(j, impl, S) {
      S.box([0, 57, 24], [56, 12, 70], { fill: DARK_PAD, bias: -40 });
      S.box([0, 28, 24], [14, 56, 14], { bias: -60 });
      tiltedPad(S, INC_HIP, INC_LEAN, -12, 128);
      S.box([0, 3, 0], [60, 6, 120], { bias: -80 });
      S.load(held(impl, 'barbell'), j);
    },
  },

  push_up: {
    id: 'push_up',
    label: 'Piegamenti sulle braccia',
    cam: { yaw: 58, pitch: 10 },
    a: plank(68, PLANK_HZ),
    b: plank(84, PLANK_HZ),
    scene(j, impl, S) {
      S.box([0, -1.5, 10], [120, 3, 330], { fill: '#c9cbd3', bias: -100 });
    },
  },

  dips: {
    id: 'dips',
    label: 'Dip alle parallele',
    cam: { yaw: 38, pitch: 10 },
    a: dipPose(BAR_Y + 103, 6),
    b: dipPose(BAR_Y + 50, 26),
    scene(j, impl, S) {
      for (const x of [-38, 38]) {
        S.bar([x, BAR_Y, -58], [x, BAR_Y, 58], 3.6, { fill: '#8d8f97', bias: 2 });
        for (const z of [-58, 58]) S.box([x, BAR_Y / 2, z], [6, BAR_Y, 6], { bias: -50 });
        S.box([x, 2, 0], [8, 4, 130], { bias: -70 });
      }
      S.box([0, 2, 0], [84, 4, 8], { bias: -70 });
    },
  },

  chest_fly: {
    id: 'chest_fly',
    label: 'Croci su panca',
    cam: { yaw: 25, pitch: 24 },
    a: supine({ arms: { el: 90, pl: 6, bend: 8 } }),
    b: supine({ arms: { el: 90, pl: 100, bend: 28 } }),
    scene(j, impl, S) {
      flatBench(S);
      S.load('dumbbell', j);
    },
  },

  overhead_press: {
    id: 'overhead_press',
    label: 'Lento avanti / Military press',
    cam: { yaw: 14, pitch: 6 },
    a: standing({ arms: { w: [38, 250, 16], pole: [0.3, -1, 0.3] } }),
    b: standing({ arms: { w: [36, 342, 2], pole: [0.3, -1, 0.3] } }),
    scene(j, impl, S) {
      S.load(held(impl, 'barbell'), j);
    },
  },

  front_raise: {
    id: 'front_raise',
    label: 'Alzate frontali',
    cam: { yaw: 52, pitch: 6 },
    a: standing({ arms: { el: 6, pl: 0, bend: 8 } }),
    b: standing({ arms: { el: 92, pl: 0, bend: 6 } }),
    scene(j, impl, S) {
      S.load(held(impl, 'dumbbell'), j, { plateR: 17 });
    },
  },

  triceps_pushdown: {
    id: 'triceps_pushdown',
    label: 'Pushdown per tricipiti',
    cam: { yaw: 42, pitch: 8 },
    a: standing({ lean: 6, arms: { el: 12, pl: -90, bend: 100 } }),
    b: standing({ lean: 6, arms: { el: 12, pl: -90, bend: 6 } }),
    scene(j, impl, S) {
      // colonna del cavo con blocco pesi e carrucola in alto
      S.box([0, 170, 78], [60, 340, 26], { fill: '#565860', bias: -90 });
      S.box([0, 335, 56], [14, 14, 40], { bias: -80 });
      S.disc([0, 336, 50], [1, 0, 0], 9, 4, { fill: '#cfd0d5', bias: -70 });
      const a = j.wr[0];
      const b = j.wr[1];
      S.bar([a[0] + 6, a[1], a[2]], [b[0] - 6, b[1], b[2]], 2.8, { fill: BAR_DARK, bias: 4 });
      const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      S.cable([0, 336, 50], m, 1.8);
    },
  },

  lying_triceps_ext: {
    id: 'lying_triceps_ext',
    label: 'Estensioni per tricipiti da sdraiati',
    cam: { yaw: 62, pitch: 16 },
    a: supine({ arms: { el: 96, pl: 0, bend: 112 } }),
    b: supine({ arms: { el: 96, pl: 0, bend: 6 } }),
    scene(j, impl, S) {
      flatBench(S);
      S.load(held(impl, 'barbell'), j, { plateR: 16 });
    },
  },

  triceps_overhead: {
    id: 'triceps_overhead',
    label: 'Estensioni sopra la testa',
    cam: { yaw: 100, pitch: 6 },
    a: standing({ arms: { b: [-30, 104, 0], pole: [0.3, 1, 0.2] } }),
    b: standing({ arms: { b: [-30, 50, -42], pole: [0.3, 1, 0.2] } }),
    scene(j, impl, S) {
      const a = j.wr[0];
      const b = j.wr[1];
      const m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      if (impl === 'cable') {
        S.disc([0, 12, -70], [1, 0, 0], 9, 4, { fill: '#cfd0d5', bias: -70 });
        S.cable([0, 12, -70], m, 1.8);
        S.ball(m, 5, { fill: BAR_DARK, bias: 4 });
      } else if (impl === 'barbell' || impl === 'kettlebell') {
        S.load(impl, j, { plateR: 16 });
      } else {
        // un solo manubrio tenuto in verticale con due mani
        S.bar([m[0], m[1] + 14, m[2]], [m[0], m[1] - 14, m[2]], 2.6, { bias: 2 });
        S.disc([m[0], m[1] + 14, m[2]], [0, 1, 0], 11, 7, { bias: 3 });
        S.disc([m[0], m[1] - 14, m[2]], [0, 1, 0], 11, 7, { bias: 3 });
      }
    },
  },
};
