import {
  COLORS,
  GROUND,
  Implement,
  Joints,
  Pattern,
  Pose,
  Scene,
  Shape,
  V,
  cableTo,
  floor,
  rect,
  seg,
  weightAt,
} from './engine';

const STAND_HIP: V = [150, 124];
const STAND_ANKLE: V = [150, 212];

/** Peso in mano, o cavo verso una carrucola. */
const held =
  (plateR = 12, pulley?: V) =>
  (j: Joints, impl: Implement): Shape[] => [
    ...weightAt(j.wrist, impl, plateR),
    ...(pulley ? cableTo(pulley, j.wrist, impl) : []),
  ];

const sceneOf = (back: Shape[], front: (j: Joints, impl: Implement) => Shape[]) =>
  (j: Joints, impl: Implement): Scene => ({ back: [floor(), ...back], front: front(j, impl) });

// ---- scene riutilizzabili -------------------------------------------------------

const flatBench = (): Shape[] => [
  rect(60, 170, 120, 10, COLORS.bench, 4),
  rect(68, 180, 6, GROUND - 180, COLORS.bench, 2),
  rect(164, 180, 6, GROUND - 180, COLORS.bench, 2),
];

const inclineBench = (): Shape[] => [
  seg([132, 190], [92, 150], 10, COLORS.bench),
  rect(124, 192, 56, 8, COLORS.bench, 4),
  rect(130, 200, 6, GROUND - 200, COLORS.bench, 2),
  rect(168, 200, 6, GROUND - 200, COLORS.bench, 2),
];

const pullUpBar = (): Shape[] => [
  rect(104, 8, 92, 5, COLORS.metal, 2.5),
  rect(104, 8, 5, GROUND - 8, COLORS.floor, 2),
  rect(191, 8, 5, GROUND - 8, COLORS.floor, 2),
];

// ---- movimenti ------------------------------------------------------------------

const standing = (hand: Pose['hand'], extra: Partial<Pose> = {}): Pose => ({
  hip: STAND_HIP,
  torso: -90,
  ankle: STAND_ANKLE,
  hand,
  ...extra,
});

const supine = (hand: Pose['hand'], extra: Partial<Pose> = {}): Pose => ({
  hip: [150, 155],
  torso: 180,
  ankle: [185, 212],
  kneeDir: [0.2, -1],
  hand,
  ...extra,
});

const HANG: Pose['hand'] = { sh: [2, 56] };

export const PATTERNS: Record<string, Pattern> = {
  biceps_curl: {
    id: 'biceps_curl',
    label: 'Curl per bicipiti',
    a: standing({ fk: [88, 82] }),
    b: standing({ fk: [98, -78] }),
    scene: sceneOf([], held(11, [185, 208])),
  },

  front_raise: {
    id: 'front_raise',
    label: 'Alzate frontali',
    a: standing({ fk: [88, 88] }),
    b: standing({ fk: [2, -4] }),
    scene: sceneOf([], held(9)),
  },

  triceps_pushdown: {
    id: 'triceps_pushdown',
    label: 'Pushdown per tricipiti',
    a: standing({ fk: [92, -15] }, { torso: -87 }),
    b: standing({ fk: [92, 80] }, { torso: -87 }),
    scene: (j: Joints, impl: Implement): Scene => ({
      back: [floor()],
      front: cableTo([162, 10], j.wrist, 'cable'),
    }),
  },

  lying_triceps_ext: {
    id: 'lying_triceps_ext',
    label: 'Estensioni per tricipiti da sdraiati',
    a: supine({ fk: [-100, 170] }),
    b: supine({ fk: [-100, 265] }),
    scene: sceneOf(flatBench(), held(10)),
  },

  bench_press: {
    id: 'bench_press',
    label: 'Panca piana',
    a: supine({ abs: [100, 132] }, { elbowDir: [1, 0.2] }),
    b: supine({ abs: [100, 96] }, { elbowDir: [1, 0.2] }),
    scene: sceneOf(flatBench(), held(13)),
  },

  incline_press: {
    id: 'incline_press',
    label: 'Panca inclinata',
    a: {
      hip: [146, 176],
      torso: -135,
      ankle: [180, 212],
      kneeDir: [0.3, -1],
      hand: { abs: [133, 135] },
      elbowDir: [1, 0.6],
    },
    b: {
      hip: [146, 176],
      torso: -135,
      ankle: [180, 212],
      kneeDir: [0.3, -1],
      hand: { abs: [126, 87] },
      elbowDir: [1, 0.6],
    },
    scene: sceneOf(inclineBench(), held(13)),
  },

  push_up: {
    id: 'push_up',
    label: 'Piegamenti sulle braccia',
    a: {
      hip: [144.8, 169.4],
      torso: -17.9,
      ankle: [61, 196.4],
      foot: 60,
      kneeDir: [0, 1],
      hand: { abs: [192.4, 208] },
      elbowDir: [-1, -0.5],
    },
    b: {
      hip: [148.8, 190.4],
      torso: -3.9,
      ankle: [61, 196.4],
      foot: 60,
      kneeDir: [0, 1],
      hand: { abs: [198, 208] },
      elbowDir: [-1, -0.5],
    },
    scene: sceneOf([], () => []),
  },

  overhead_press: {
    id: 'overhead_press',
    label: 'Lento avanti / Military press',
    a: standing({ abs: [158, 66] }, { elbowDir: [0.5, 1] }),
    b: standing({ abs: [152, 18] }, { elbowDir: [0.5, 1] }),
    scene: sceneOf([], held(12)),
  },

  squat: {
    id: 'squat',
    label: 'Squat',
    a: standing({ sh: [-10, 6] }, { elbowDir: [-0.5, 1] }),
    b: {
      hip: [124, 165],
      torso: -55,
      ankle: STAND_ANKLE,
      hand: { sh: [-10, 6] },
      elbowDir: [-0.5, 1],
    },
    scene: sceneOf([], held(13)),
  },

  squat_front: {
    id: 'squat_front',
    label: 'Squat frontale / Goblet squat',
    a: standing({ sh: [16, 10] }, { elbowDir: [0.2, 1] }),
    b: {
      hip: [124, 165],
      torso: -60,
      ankle: STAND_ANKLE,
      hand: { sh: [16, 10] },
      elbowDir: [0.2, 1],
    },
    scene: sceneOf([], held(12)),
  },

  squat_hang: {
    id: 'squat_hang',
    label: 'Squat con pesi lungo i fianchi',
    a: standing(HANG),
    b: {
      hip: [124, 165],
      torso: -55,
      ankle: STAND_ANKLE,
      hand: HANG,
    },
    scene: sceneOf([], held(9)),
  },

  good_morning: {
    id: 'good_morning',
    label: 'Good morning',
    a: standing({ sh: [-10, 6] }, { elbowDir: [-0.5, 1] }),
    b: {
      hip: [118, 134],
      torso: -15,
      ankle: STAND_ANKLE,
      hand: { sh: [-10, 6] },
      elbowDir: [-0.5, 1],
    },
    scene: sceneOf([], held(12)),
  },

  lunge: {
    id: 'lunge',
    label: 'Affondi',
    a: {
      hip: [150, 134],
      torso: -90,
      ankle: [182, 212],
      ankle2: [114.4, 198.2],
      foot2: 50,
      kneeDir: [1, 0],
      kneeDir2: [1, 0.3],
      hand: HANG,
    },
    b: {
      hip: [150, 172],
      torso: -90,
      ankle: [182, 212],
      ankle2: [114.4, 198.2],
      foot2: 50,
      kneeDir: [1, 0],
      kneeDir2: [1, 0.3],
      hand: HANG,
    },
    scene: sceneOf([], held(10)),
  },

  deadlift: {
    id: 'deadlift',
    label: 'Stacco da terra',
    a: {
      hip: [130, 152],
      torso: -28,
      ankle: STAND_ANKLE,
      hand: { abs: [164, 186] },
    },
    b: standing({ abs: [156, 130] }),
    scene: sceneOf([], held(14)),
  },

  romanian_deadlift: {
    id: 'romanian_deadlift',
    label: 'Stacco rumeno / Good morning',
    a: standing(HANG),
    b: {
      hip: [118, 134],
      torso: -15,
      ankle: STAND_ANKLE,
      hand: HANG,
    },
    scene: sceneOf([], held(12)),
  },

  hip_thrust: {
    id: 'hip_thrust',
    label: 'Hip thrust / Ponte per i glutei',
    a: {
      hip: [140, 193],
      torso: -150,
      ankle: [185, 212],
      kneeDir: [0.2, -1],
      hand: { hip: [0, -14] },
    },
    b: {
      hip: [146, 160],
      torso: -190,
      ankle: [185, 212],
      kneeDir: [0.2, -1],
      hand: { hip: [0, -14] },
    },
    scene: sceneOf(
      [
        rect(58, 182, 58, 8, COLORS.bench, 4),
        rect(66, 190, 6, GROUND - 190, COLORS.bench, 2),
        rect(102, 190, 6, GROUND - 190, COLORS.bench, 2),
      ],
      held(12),
    ),
  },

  bent_row: {
    id: 'bent_row',
    label: 'Rematore',
    a: {
      hip: [116, 132],
      torso: -25,
      ankle: STAND_ANKLE,
      hand: { abs: [166, 168] },
      elbowDir: [-1, -0.6],
    },
    b: {
      hip: [116, 132],
      torso: -25,
      ankle: STAND_ANKLE,
      hand: { abs: [150, 124] },
      elbowDir: [-1, -0.6],
    },
    scene: sceneOf([], held(12)),
  },

  seated_row: {
    id: 'seated_row',
    label: 'Rematore ai cavi da seduti',
    a: {
      hip: [100, 194],
      torso: -65,
      ankle: [178, 196],
      foot: -70,
      kneeDir: [0, -1],
      hand: { abs: [172, 170] },
      elbowDir: [-1, 0.3],
    },
    b: {
      hip: [100, 194],
      torso: -95,
      ankle: [178, 196],
      foot: -70,
      kneeDir: [0, -1],
      hand: { abs: [118, 170] },
      elbowDir: [-1, 0.3],
    },
    scene: (j: Joints, impl: Implement): Scene => ({
      back: [
        floor(),
        rect(78, 208, 50, 6, COLORS.bench, 3),
        rect(186, 186, 6, GROUND - 186, COLORS.metal, 2),
        rect(236, 150, 8, GROUND - 150, COLORS.floor, 3),
      ],
      front: cableTo([236, 172], j.wrist, 'cable'),
    }),
  },

  lat_pulldown: {
    id: 'lat_pulldown',
    label: 'Lat machine',
    a: {
      hip: [140, 192],
      torso: -98,
      ankle: [188, 212],
      kneeDir: [0.3, -1],
      hand: { abs: [150, 86] },
      elbowDir: [-1, 0.5],
    },
    b: {
      hip: [140, 192],
      torso: -98,
      ankle: [188, 212],
      kneeDir: [0.3, -1],
      hand: { abs: [152, 128] },
      elbowDir: [-1, 0.5],
    },
    scene: (j: Joints, impl: Implement): Scene => ({
      back: [
        floor(),
        rect(116, 204, 50, 6, COLORS.bench, 3),
        rect(168, 168, 36, 7, COLORS.bench, 3),
        rect(200, 6, 8, GROUND - 6, COLORS.floor, 3),
        rect(130, 6, 78, 5, COLORS.floor, 2.5),
      ],
      front: cableTo([152, 10], j.wrist, 'cable'),
    }),
  },

  pull_up: {
    id: 'pull_up',
    label: 'Trazioni alla sbarra',
    a: {
      hip: [150, 122],
      torso: -90,
      ankle: [142, 200],
      kneeDir: [-1, 0.2],
      hand: { abs: [152, 16] },
      elbowDir: [-1, 0.3],
    },
    b: {
      hip: [150, 80],
      torso: -95,
      ankle: [140, 160],
      kneeDir: [-1, 0.2],
      hand: { abs: [152, 16] },
      elbowDir: [-1, 0.3],
    },
    scene: sceneOf(pullUpBar(), () => []),
  },

  calf_raise: {
    id: 'calf_raise',
    label: 'Calf in piedi',
    a: standing(HANG),
    b: {
      hip: [156.4, 110.2],
      torso: -90,
      ankle: [156.4, 198.2],
      foot: 50,
      hand: HANG,
    },
    scene: sceneOf([], held(10)),
  },

  crunch: {
    id: 'crunch',
    label: 'Crunch',
    a: {
      hip: [150, 199],
      torso: 180,
      ankle: [190, 212],
      kneeDir: [0.2, -1],
      hand: { sh: [-14, -6] },
    },
    b: {
      hip: [150, 199],
      torso: 210,
      ankle: [190, 212],
      kneeDir: [0.2, -1],
      hand: { sh: [-14, -6] },
    },
    scene: sceneOf([], () => []),
  },

  shrug: {
    id: 'shrug',
    label: 'Scrollate (shrug)',
    a: standing(HANG),
    b: standing(HANG, { shrug: 9 }),
    scene: sceneOf([], held(12)),
  },

  upright_row: {
    id: 'upright_row',
    label: 'Tirate al mento',
    a: standing({ abs: [158, 126] }, { elbowDir: [0.6, -1] }),
    b: standing({ abs: [160, 88] }, { elbowDir: [0.6, -1] }),
    scene: sceneOf([], held(11)),
  },

  leg_extension: {
    id: 'leg_extension',
    label: 'Leg extension',
    a: {
      hip: [118, 162],
      torso: -98,
      ankle: [166, 204],
      kneeDir: [0.2, -1],
      hand: { abs: [140, 168] },
    },
    b: {
      hip: [118, 162],
      torso: -98,
      ankle: [203, 150],
      kneeDir: [0.2, -1],
      hand: { abs: [140, 168] },
    },
    scene: (j: Joints): Scene => ({
      back: [
        floor(),
        rect(88, 170, 66, 9, COLORS.bench, 4),
        rect(86, 100, 9, 74, COLORS.bench, 4),
        rect(116, 179, 8, GROUND - 179, COLORS.bench, 2),
      ],
      front: [seg([j.ankle[0] - 6, j.ankle[1] - 4], [j.ankle[0] - 2, j.ankle[1] + 2], 10, COLORS.plate)],
    }),
  },

  leg_curl: {
    id: 'leg_curl',
    label: 'Leg curl',
    a: {
      hip: [118, 162],
      torso: -98,
      ankle: [203, 150],
      kneeDir: [0.2, -1],
      hand: { abs: [140, 168] },
    },
    b: {
      hip: [118, 162],
      torso: -98,
      ankle: [166, 204],
      kneeDir: [0.2, -1],
      hand: { abs: [140, 168] },
    },
    scene: (j: Joints): Scene => ({
      back: [
        floor(),
        rect(88, 170, 66, 9, COLORS.bench, 4),
        rect(86, 100, 9, 74, COLORS.bench, 4),
        rect(116, 179, 8, GROUND - 179, COLORS.bench, 2),
      ],
      front: [seg([j.ankle[0] - 4, j.ankle[1] - 2], [j.ankle[0] + 2, j.ankle[1] + 4], 10, COLORS.plate)],
    }),
  },

  leg_press: {
    id: 'leg_press',
    label: 'Leg press',
    a: {
      hip: [96, 176],
      torso: -140,
      ankle: [134, 148],
      kneeDir: [0.3, -1],
      hand: { abs: [112, 182] },
    },
    b: {
      hip: [96, 176],
      torso: -140,
      ankle: [166, 128],
      kneeDir: [0.3, -1],
      hand: { abs: [112, 182] },
    },
    scene: (j: Joints): Scene => ({
      back: [
        floor(),
        seg([60, 200], [96, 156], 10, COLORS.bench),
        seg([60, 200], [190, 200], 5, COLORS.floor),
        seg([60, 200], [60, 212], 5, COLORS.floor),
      ],
      front: [
        seg([j.ankle[0] + 7, j.ankle[1] - 22], [j.ankle[0] + 7, j.ankle[1] + 20], 7, COLORS.plate),
      ],
    }),
  },

  dips: {
    id: 'dips',
    label: 'Dip alle parallele',
    a: {
      hip: [146, 112],
      torso: -92,
      ankle: [128, 150],
      kneeDir: [0.3, 1],
      hand: { abs: [152, 112] },
      elbowDir: [-1, 0.2],
    },
    b: {
      hip: [140, 144],
      torso: -75,
      ankle: [120, 184],
      kneeDir: [0.3, 1],
      hand: { abs: [152, 112] },
      elbowDir: [-1, 0.2],
    },
    scene: sceneOf(
      [
        rect(140, 106, 44, 5, COLORS.metal, 2.5),
        rect(176, 106, 5, GROUND - 106, COLORS.floor, 2),
        rect(110, 106, 5, GROUND - 106, COLORS.floor, 2),
      ],
      () => [],
    ),
  },

  chest_fly: {
    id: 'chest_fly',
    label: 'Croci su panca',
    a: supine({ abs: [58, 158] }, { elbowDir: [0, 1] }),
    b: supine({ abs: [100, 98] }, { elbowDir: [0, 1] }),
    scene: sceneOf(flatBench(), held(9)),
  },

  triceps_overhead: {
    id: 'triceps_overhead',
    label: 'Estensioni sopra la testa',
    a: standing({ fk: [-92, 100] }),
    b: standing({ fk: [-92, -92] }),
    scene: sceneOf([], held(9)),
  },

  back_extension: {
    id: 'back_extension',
    label: 'Hyperextension',
    a: {
      hip: [150, 138],
      torso: 62,
      ankle: [92, 190],
      kneeDir: [0, -1],
      hand: { sh: [4, 40] },
    },
    b: {
      hip: [150, 138],
      torso: -12,
      ankle: [92, 190],
      kneeDir: [0, -1],
      hand: { sh: [30, 14] },
    },
    scene: sceneOf(
      [
        rect(126, 146, 34, 9, COLORS.bench, 4),
        rect(138, 155, 8, GROUND - 155, COLORS.bench, 2),
        seg([86, 196], [98, 186], 9, COLORS.bench),
        rect(80, 196, 26, GROUND - 196, COLORS.bench, 2),
      ],
      () => [],
    ),
  },

  leg_raise: {
    id: 'leg_raise',
    label: 'Sollevamento gambe',
    a: {
      hip: [120, 203],
      torso: 180,
      ankle: [204, 203],
      kneeDir: [0, -1],
      hand: { sh: [-14, 8] },
    },
    b: {
      hip: [120, 203],
      torso: 180,
      ankle: [120, 116],
      kneeDir: [1, 0],
      hand: { sh: [-14, 8] },
    },
    scene: sceneOf([], () => []),
  },
};
