import type { DbExercise } from '../exerciseDb';
import type { Implement } from './engine';
import { PATTERNS } from './patterns';

/**
 * Abbina un esercizio del database a un movimento animato (se ne esiste uno
 * fedele). Le regole guardano nome, attrezzo e categoria; meglio nessuna
 * animazione che un movimento sbagliato, quindi le esclusioni sono generose.
 */

type Rule = {
  pattern: keyof typeof PATTERNS;
  test: RegExp;
  not?: RegExp;
  /** consentito anche per attrezzo "machine" */
  machine?: boolean;
};

const SKIP_CATEGORY = new Set(['stretching', 'cardio', 'plyometrics']);
const WRONG_VARIANT =
  /(car deadlift|rickshaw|cable deadlift|finger curl|gorilla|press sit-up|frog sit|turkish|pass through|frankenstein|kneeling squat|jefferson|plate movers|scapular|leg-over|guillotine|hanging bar|middle back shrug|side laterals|above head|over head|feet elevated|off of a dumbbell|bench to skull|incline barbell triceps|behind the head|cable hammer|elevated back lunge|wide stance stiff|rocking|on a dumbbell|one-arm overhead|reverse band|one-arm long bar|bent over one-arm|one arm lat|off pins|weighted squat|with chains|powerlifting|to chin)/i;
const SKIP_NAME =
  /(clean|snatch|jerk|swing|throw|toss|slam|jump|hop|bound|atlas|stone|farmer|yoke|tire|axle|sled|rope climb|battle|sledgehammer|carry|walk|crawl|twist|rotation|windmill|saw|pullover|isometric|hold\b)/i;

const RULES: Rule[] = [
  {
    pattern: 'hip_thrust',
    test: /hip thrust|glute bridge|butt lift/i,
    not: /single|one[- ]leg|side|reverse|wall|ball|machine/i,
    machine: true,
  },
  {
    pattern: 'pull_up',
    test: /pull-?up|pullup|chin-?up|chinup/i,
    not: /assisted|machine|rope|kipping|one[- ]arm|band|towel|gorilla|rocky|l-pull/i,
    machine: true,
  },
  {
    pattern: 'lat_pulldown',
    test: /pulldown|pull-down/i,
    not: /straight-arm|kneeling|incline|push|rope straight/i,
    machine: true,
  },
  {
    pattern: 'triceps_pushdown',
    test: /triceps? pushdown|triceps? push-down/i,
    not: /incline|lying/i,
  },
  {
    pattern: 'lying_triceps_ext',
    test: /skull ?crusher|lying triceps|lying close-grip.*triceps|decline.*triceps (extension|press)|incline.*triceps extension|lying.*triceps extension/i,
    not: /cable|one[- ]arm|single|incline cable|rope/i,
  },
  {
    pattern: 'push_up',
    test: /push-?up|pushup/i,
    not: /clap|handstand|stand|plyo|pike|spider|stability|ball|clock|archer|knuckle|side|medicine|suspended|incline|decline|depth|dive|bosu|rotat|walkout|renegade|reverse|isometric|single|one[- ]arm|wide? ?hand|close and wide|to side/i,
  },
  {
    pattern: 'incline_press',
    test: /incline.*(bench press|chest press|dumbbell press|press)/i,
    not: /curl|fly|flye|row|push-?up|shoulder|military|overhead|one[- ]arm|single|hammer|reverse|triceps|extension|raise/i,
    machine: true,
  },
  {
    pattern: 'bench_press',
    test: /bench press|chest press|floor press/i,
    not: /incline|decline|shoulder|overhead|military|seated|push press|neck|reverse|one[- ]arm|single|alternating|pullover|three bench|stability|ball|isometric|raise|row|curl|dip|shrug/i,
    machine: true,
  },
  {
    pattern: 'overhead_press',
    test: /(military|shoulder|overhead|arnold|push|seated|standing).*press|press.*(overhead)/i,
    not: /bench|leg|calf|incline|decline|chest|floor|behind|neck|one[- ]arm|single|bradford|rocky|lying|triceps|extension|raise|curl|row|pullover|reverse|clean|kneeling|side|machine|alternating|cable|band|wide/i,
  },
  {
    pattern: 'front_raise',
    test: /front.*raise/i,
    not: /pullover|incline|lying|one[- ]arm|alternat|rear|reverse/i,
  },
  {
    pattern: 'upright_row',
    test: /upright row/i,
    not: /one[- ]arm|single|wide/i,
  },
  {
    pattern: 'shrug',
    test: /shrug/i,
    not: /behind|lying|incline|calf|overhead|one[- ]arm|single/i,
  },
  {
    pattern: 'good_morning',
    test: /good morning/i,
    not: /pull through|seated|single|one[- ]leg/i,
  },
  {
    pattern: 'romanian_deadlift',
    test: /romanian|stiff[- ]leg|straight[- ]leg|stiff leg/i,
    not: /single|one[- ]leg|one[- ]arm|stretch|hamstring stretch|curl|dumbbell step/i,
  },
  {
    pattern: 'deadlift',
    test: /deadlift/i,
    not: /sumo|single|one[- ]leg|one[- ]arm|clean|snatch|romanian|stiff|straight|deficit|rack|hex|trap|bar deadlift|reeves|jefferson|suitcase|bands|chain|stretch|crossover|hang/i,
  },
  {
    pattern: 'squat_front',
    test: /(front|goblet|zercher|overhead).*squat|squat.*(front|goblet)/i,
    not: /jump|split|bulgarian|one[- ]leg|single|pistol|wall|sissy|hack|bosu|ball/i,
  },
  {
    pattern: 'squat_hang',
    test: /(dumbbell|kettlebell).*squat|squat.*(dumbbell|kettlebell)/i,
    not: /jump|split|bulgarian|one[- ]leg|single|pistol|wall|sissy|hack|bosu|ball|front|goblet|overhead|plie|sumo|lunge|step|hip|press|curl|row|lateral|side/i,
  },
  {
    pattern: 'squat',
    test: /squat/i,
    not: /jump|split|bulgarian|one[- ]leg|single|pistol|wall|sissy|hack|bosu|ball|overhead|zercher|plie|sumo|side|lateral|kettlebell|dumbbell|front|goblet|isometric|box|lunge|step|bodyweight|body weight|sit|thrust|rotat|reverse|pause|band|chain|wide|narrow|sled|machine/i,
  },
  {
    pattern: 'lunge',
    test: /lunge|split squat/i,
    not: /jump|bulgarian|side|lateral|curtsy|walking|cross|rotat|pistol|overhead|step|good|stretch|iron cross|ball/i,
  },
  {
    pattern: 'bent_row',
    test: /bent[- ]?over.*row|barbell row|dumbbell row|t-bar row|kettlebell row|one[- ]arm.*row/i,
    not: /upright|seated|cable|machine|inverted|renegade|rowing|pull|rear|face|high|incline|chest|lying|pendlay|prone/i,
  },
  {
    pattern: 'seated_row',
    test: /seated.*row|cable.*row|low[- ]?row|machine row|elevated.*row/i,
    not: /rear|face|upright|reverse|high|bent|standing|rope.*rear|one[- ]arm|single|incline|inverted|lying|wide/i,
    machine: true,
  },
  {
    pattern: 'biceps_curl',
    test: /curl/i,
    not: /leg|hamstring|wrist|triceps|lying|preacher|concentration|incline|spider|nordic|glute|ball|bent|kneeling|overhead|high|machine|reverse|decline|prone|behind|drag|body|reach|crunch|reverse|zottman|inner|cross|pinwheel|squat|press|rear|scott|dumbbell lying/i,
  },
  {
    pattern: 'calf_raise',
    test: /calf raise|standing calf|calf-machine/i,
    not: /seated|one[- ]leg|single|donkey|press|leg press|smith|machine/i,
    machine: true,
  },
  {
    pattern: 'crunch',
    test: /crunch|sit-?up|situp/i,
    not: /reverse|twist|bicycle|side|oblique|cross|rotat|ball|cable|machine|hanging|leg|jackknife|v-up|toe|elbow|kneeling|air|decline|incline|stability|bosu|weighted|full|raise|dumbbell|rope|janda|butterfly|flutter|scissor|alternate|exercise ball|knee|tuck|pike|vertical|seated|handstand|v sit/i,
  },
];

export type Animation = { pattern: string; impl: Implement };

function implOf(ex: DbExercise): Implement {
  if (/smith/i.test(ex.name)) return 'barbell';
  switch (ex.equipment) {
    case 'barbell':
    case 'e-z curl bar':
      return 'barbell';
    case 'dumbbell':
      return 'dumbbell';
    case 'kettlebells':
      return 'kettlebell';
    case 'cable':
      return 'cable';
    default:
      return 'none';
  }
}

export function animationFor(ex: DbExercise): Animation | null {
  if (ex.category && SKIP_CATEGORY.has(ex.category)) return null;
  if (SKIP_NAME.test(ex.name) || WRONG_VARIANT.test(ex.name)) return null;
  if (ex.equipment === 'bands') return null;
  const smith = /smith/i.test(ex.name);
  for (const r of RULES) {
    if (!r.test.test(ex.name)) continue;
    if (r.not?.test(ex.name)) return null; // regola specifica ma variante non fedele
    if (ex.equipment === 'machine' && !smith) return null;
    return { pattern: r.pattern as string, impl: implOf(ex) };
  }
  return null;
}

// ---- esercizi con nome personalizzato (es. "Panca piana") ---------------------

const M: Record<string, [string[], string[]]> = {
  bench_press: [['chest'], ['shoulders', 'triceps']],
  incline_press: [['chest'], ['shoulders', 'triceps']],
  push_up: [['chest'], ['shoulders', 'triceps']],
  overhead_press: [['shoulders'], ['triceps']],
  front_raise: [['shoulders'], []],
  upright_row: [['shoulders'], ['traps', 'biceps']],
  shrug: [['traps'], []],
  biceps_curl: [['biceps'], ['forearms']],
  triceps_pushdown: [['triceps'], []],
  lying_triceps_ext: [['triceps'], []],
  squat: [['quadriceps'], ['glutes', 'hamstrings']],
  squat_front: [['quadriceps'], ['glutes']],
  squat_hang: [['quadriceps'], ['glutes', 'hamstrings']],
  lunge: [['quadriceps'], ['glutes', 'hamstrings']],
  deadlift: [['hamstrings'], ['glutes', 'lower back', 'traps']],
  romanian_deadlift: [['hamstrings'], ['glutes', 'lower back']],
  good_morning: [['hamstrings'], ['glutes', 'lower back']],
  hip_thrust: [['glutes'], ['hamstrings']],
  calf_raise: [['calves'], []],
  bent_row: [['middle back'], ['lats', 'biceps']],
  seated_row: [['middle back'], ['lats', 'biceps']],
  lat_pulldown: [['lats'], ['biceps', 'middle back']],
  pull_up: [['lats'], ['biceps', 'middle back']],
  crunch: [['abdominals'], []],
};

const IT_RULES: Array<[string, RegExp]> = [
  ['hip_thrust', /hip thrust|ponte glutei|glute bridge/],
  ['pull_up', /trazion|pull[- ]?up|chin[- ]?up/],
  ['lat_pulldown', /lat machine|pulldown|lat pull/],
  ['triceps_pushdown', /push ?down|pressdown|tricipiti.*(cavo|corda)/],
  ['lying_triceps_ext', /french|skull|estensioni.*tricipiti|tricipiti.*(panca|sdraiato)/],
  ['push_up', /flession|push[- ]?up/],
  ['incline_press', /(panca|chest press|distensioni).*inclinat|incline/],
  ['bench_press', /panca piana|panca|bench|chest press|distensioni/],
  ['overhead_press', /military|lento avanti|shoulder press|arnold|spinte.*(spalle|alto)|overhead press/],
  ['front_raise', /alzate frontali|front raise/],
  ['upright_row', /tirate al mento|upright/],
  ['shrug', /scrollate|shrug/],
  ['romanian_deadlift', /rumeno|romanian|stacco.*gambe tese|stiff/],
  ['deadlift', /stacco|deadlift/],
  ['good_morning', /good ?morning/],
  ['squat_front', /squat frontale|front squat|goblet/],
  ['squat', /squat|accosciat/],
  ['lunge', /affond|lunge/],
  ['bent_row', /rematore|bent.?over row|row con (bilanciere|manubrio)/],
  ['seated_row', /pulley|seated row|row.*cavo|low row/],
  ['biceps_curl', /curl|bicipiti/],
  ['calf_raise', /calf|polpacci/],
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
    else if (['pull_up', 'push_up', 'crunch'].includes(pattern)) impl = 'none';
    else if (['lat_pulldown', 'triceps_pushdown', 'seated_row'].includes(pattern)) impl = 'cable';
    const [primary, secondary] = M[pattern] ?? [[], []];
    return { pattern, impl, primary, secondary };
  }
  return null;
}
