import { BODY, Pose, STAND_HIP_Y, V3, anchor } from './engine';

/** Altezza dell'anca da seduti (seduta ~63, coscia orizzontale, stinchi verticali con caviglie a 11). */
export const SEAT_HIP_Y = 77;

/** In piedi con le gambe dritte (anca all'altezza giusta), piedi alla larghezza dell'anca. */
export const standing = (o: Partial<Pose> = {}): Pose => ({
  hip: [0, STAND_HIP_Y, 0],
  lean: 0,
  legs: { w: [16, 11, 0] },
  ...o,
});

/** Seduto con le cosce orizzontali. */
export const seated = (o: Partial<Pose> = {}): Pose => ({
  hip: [0, SEAT_HIP_Y, 0],
  lean: 0,
  legs: { el: 90, pl: 8, bend: 90 },
  ...o,
});

export { anchor, BODY };
export type { Pose, V3 };
