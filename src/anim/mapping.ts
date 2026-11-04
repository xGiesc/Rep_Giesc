import { MOVEMENT_MUSCLES } from '../catalog';
import type { DbExercise } from '../exerciseDb';
import type { Implement } from './engine';

export type Animation = { pattern: string; impl: Implement };

/** Ogni esercizio del catalogo ha la sua animazione. */
export function animationFor(ex: DbExercise): Animation {
  return { pattern: ex.movement, impl: ex.impl };
}

// ---- esercizi con nome personalizzato (es. "Panca piana") ---------------------

const IT_RULES: Array<[string, RegExp]> = [
  ['hip_thrust', /hip thrust|ponte (per i )?glutei|glute bridge/],
  ['pull_up', /trazion|pull[- ]?up|chin[- ]?up/],
  ['lat_pulldown', /lat machine|pulldown|lat pull/],
  ['triceps_pushdown', /push ?down|pressdown/],
  ['triceps_overhead', /sopra (la )?testa.*tricipiti|tricipiti.*sopra (la )?testa|estensioni.*sopra/],
  ['lying_triceps_ext', /french|skull|estensioni.*tricipiti|tricipiti.*(panca|sdraiato)/],
  ['dips', /\bdip|parallele/],
  ['push_up', /flession|push[- ]?up/],
  ['chest_fly', /croci|\bfly\b|flyes?/],
  ['incline_press', /(panca|chest press|distensioni).*inclinat|incline/],
  ['bench_press', /panca piana|panca|bench|chest press|distensioni/],
  ['overhead_press', /military|lento avanti|shoulder press|arnold|spinte.*(spalle|alto)|overhead press/],
  ['front_raise', /alzate frontali|front raise/],
  ['upright_row', /tirate al mento|upright/],
  ['shrug', /scrollate|shrug/],
  ['romanian_deadlift', /rumeno|romanian|stacco.*gambe tese|stiff/],
  ['deadlift', /stacco|deadlift/],
  ['good_morning', /good ?morning/],
  ['leg_press', /leg press|pressa/],
  ['leg_extension', /leg extension|estensioni.*(gambe|quadricipiti)/],
  ['leg_curl', /leg curl|curl.*(femorali|gambe)/],
  ['squat_front', /squat frontale|front squat|goblet/],
  ['squat', /squat|accosciat/],
  ['lunge', /affond|lunge/],
  ['back_extension', /iperestension|hyperextension|lombari/],
  ['bent_row', /rematore|bent.?over row|row con (bilanciere|manubrio)/],
  ['seated_row', /pulley|seated row|row.*cavo|low row/],
  ['biceps_curl', /curl|bicipiti/],
  ['calf_raise', /calf|polpacci/],
  ['leg_raise', /sollevamento gambe|leg raise/],
  ['crunch', /crunch|addominali|sit-?up/],
];

export type CustomAnimation = Animation & { primary: string[]; secondary: string[] };

export function animationForName(name: string): CustomAnimation | null {
  const n = name.toLowerCase();
  for (const [pattern, re] of IT_RULES) {
    if (!re.test(n)) continue;
    let impl: Implement = 'barbell';
    if (/manubri|dumbbell|\bdb\b/.test(n)) impl = 'dumbbell';
    else if (/kettlebell/.test(n)) impl = 'kettlebell';
    else if (/cavo|cable|pulley|lat machine|pushdown|push down|pulldown|corda/.test(n)) impl = 'cable';
    else if (
      ['pull_up', 'push_up', 'crunch', 'dips', 'leg_press', 'leg_extension', 'leg_curl', 'back_extension', 'leg_raise'].includes(pattern)
    )
      impl = 'none';
    else if (['lat_pulldown', 'triceps_pushdown', 'seated_row'].includes(pattern)) impl = 'cable';
    const [primary, secondary] = MOVEMENT_MUSCLES[pattern] ?? [[], []];
    return { pattern, impl, primary, secondary };
  }
  return null;
}
