/**
 * Catalogo esercizi dell'app: nomi e istruzioni in italiano, ognuno con la sua
 * animazione. Ogni voce è: [id, nome, movimento, attrezzo, livello, nota?, muscoli?].
 * I muscoli di default dipendono dal movimento (vedi MOVEMENT_MUSCLES).
 */
import type { Implement } from './anim/engine';
import { EXTRA_MUSCLES, EXTRA_ROWS, EXTRA_STEPS } from './catalogExtra';

export type Level = 'beginner' | 'intermediate' | 'expert';
export type Equip = 'barbell' | 'dumbbell' | 'body only' | 'cable' | 'machine' | 'kettlebells';

export const MOVEMENT_MUSCLES: Record<string, [string[], string[]]> = {
  ...EXTRA_MUSCLES,
  bench_press: [['chest'], ['shoulders', 'triceps']],
  incline_press: [['chest'], ['shoulders', 'triceps']],
  chest_press_machine: [['chest'], ['shoulders', 'triceps']],
  push_up: [['chest'], ['shoulders', 'triceps']],
  dips: [['chest', 'triceps'], ['shoulders']],
  chest_fly: [['chest'], ['shoulders']],
  overhead_press: [['shoulders'], ['triceps']],
  front_raise: [['shoulders'], []],
  upright_row: [['shoulders'], ['traps', 'biceps']],
  shrug: [['traps'], []],
  biceps_curl: [['biceps'], ['forearms']],
  triceps_pushdown: [['triceps'], []],
  lying_triceps_ext: [['triceps'], []],
  triceps_overhead: [['triceps'], []],
  squat: [['quadriceps'], ['glutes', 'hamstrings']],
  squat_front: [['quadriceps'], ['glutes', 'abdominals']],
  squat_hang: [['quadriceps'], ['glutes', 'hamstrings']],
  lunge: [['quadriceps'], ['glutes', 'hamstrings']],
  leg_press: [['quadriceps'], ['glutes', 'hamstrings']],
  leg_extension: [['quadriceps'], []],
  leg_curl: [['hamstrings'], ['calves']],
  deadlift: [['hamstrings', 'lower back'], ['glutes', 'traps']],
  romanian_deadlift: [['hamstrings'], ['glutes', 'lower back']],
  good_morning: [['hamstrings', 'lower back'], ['glutes']],
  hip_thrust: [['glutes'], ['hamstrings']],
  back_extension: [['lower back'], ['glutes', 'hamstrings']],
  calf_raise: [['calves'], []],
  bent_row: [['middle back', 'lats'], ['biceps', 'forearms']],
  seated_row: [['middle back'], ['lats', 'biceps']],
  lat_pulldown: [['lats'], ['biceps', 'middle back']],
  pull_up: [['lats'], ['biceps', 'middle back']],
  crunch: [['abdominals'], []],
  leg_raise: [['abdominals'], []],
};

/** Istruzioni di base per movimento (italiano). */
export const MOVEMENT_STEPS: Record<string, string[]> = {
  ...EXTRA_STEPS,
  bench_press: [
    'Sdraiati sulla panca con i piedi ben appoggiati a terra, scapole addotte e leggermente depresse.',
    'Afferra il carico con una presa poco più larga delle spalle e portalo sopra il petto con le braccia tese.',
    'Scendi in modo controllato fino a sfiorare la parte centrale del petto, con i gomiti a circa 45–70° dal busto.',
    'Spingi verso l’alto fino a distendere le braccia, senza staccare glutei e testa dalla panca.',
  ],
  chest_press_machine: [
    'Siediti alla macchina e regola il sedile in modo che le maniglie siano all’altezza del petto.',
    'Appoggia bene schiena e testa allo schienale, con i piedi a terra e le scapole addotte.',
    'Impugna le maniglie e spingi in avanti fino a distendere quasi del tutto le braccia, senza bloccare i gomiti.',
    'Torna lentamente alla posizione di partenza, controllando il carico e senza staccare la schiena dallo schienale.',
  ],
  incline_press: [
    'Regola la panca a 30–45° e siediti con la schiena ben appoggiata e i piedi a terra.',
    'Porta il carico sopra la parte alta del petto con le braccia tese.',
    'Scendi lentamente fino a sfiorare la parte alta del petto.',
    'Spingi verso l’alto senza inarcare la schiena e senza far rimbalzare il carico.',
  ],
  push_up: [
    'Appoggia le mani a terra poco più larghe delle spalle, corpo in linea retta dalla testa ai talloni.',
    'Contrai addominali e glutei per non far cedere il bacino.',
    'Scendi piegando i gomiti fino a sfiorare il pavimento con il petto.',
    'Spingi con forza fino a distendere le braccia, senza perdere l’allineamento.',
  ],
  dips: [
    'Afferra le parallele e solleva il corpo a braccia tese, spalle lontane dalle orecchie.',
    'Incrocia o piega le gambe dietro di te e inclina leggermente il busto in avanti.',
    'Scendi piegando i gomiti fino a circa 90° mantenendo il controllo.',
    'Spingi verso l’alto fino a distendere le braccia, senza oscillare.',
  ],
  chest_fly: [
    'Sdraiati sulla panca con un manubrio per mano sopra il petto, palmi uno di fronte all’altro.',
    'Mantieni i gomiti leggermente flessi per tutta l’esecuzione.',
    'Apri le braccia in un arco ampio finché senti il petto allungarsi.',
    'Richiudi lungo lo stesso arco, come se abbracciassi un grosso albero, contraendo il petto in alto.',
  ],
  overhead_press: [
    'In piedi o seduto, porta il carico all’altezza delle spalle con i gomiti leggermente davanti al corpo.',
    'Contrai addome e glutei per tenere il busto stabile.',
    'Spingi il carico sopra la testa fino a distendere le braccia, spostando appena la testa indietro per far passare il carico.',
    'Riporta il carico alle spalle in modo controllato.',
  ],
  front_raise: [
    'In piedi, tieni il carico davanti alle cosce con le braccia quasi tese.',
    'Sollevalo davanti a te fino all’altezza delle spalle, senza dondolare con il busto.',
    'Fai una breve pausa in alto.',
    'Scendi lentamente senza lasciar cadere il carico.',
  ],
  upright_row: [
    'In piedi, tieni il carico davanti alle cosce con una presa non troppo stretta.',
    'Solleva il carico lungo il corpo portando i gomiti verso l’alto e in fuori.',
    'Fermati all’altezza dello sterno, con i gomiti sopra i polsi.',
    'Scendi lentamente fino alla posizione di partenza.',
  ],
  shrug: [
    'In piedi, tieni il carico lungo i fianchi a braccia tese.',
    'Solleva le spalle verso le orecchie, senza piegare i gomiti.',
    'Mantieni la contrazione per un secondo.',
    'Abbassa lentamente le spalle.',
  ],
  biceps_curl: [
    'In piedi, schiena dritta e gomiti vicini ai fianchi, tieni il carico a braccia tese.',
    'Fletti i gomiti portando il carico verso le spalle, senza far oscillare il busto.',
    'Contrai i bicipiti in alto per un istante.',
    'Scendi lentamente fino a distendere completamente le braccia.',
  ],
  triceps_pushdown: [
    'In piedi davanti al cavo alto, afferra la barra o la corda con i gomiti vicini ai fianchi.',
    'Parti con gli avambracci a circa 90°.',
    'Spingi verso il basso estendendo i gomiti, mantenendo le braccia ferme.',
    'Risali lentamente fino a 90° senza staccare i gomiti dal corpo.',
  ],
  lying_triceps_ext: [
    'Sdraiati su una panca piana con il carico sopra il petto, braccia tese e perpendicolari al busto.',
    'Fletti solo i gomiti portando il carico verso la fronte o dietro la testa.',
    'Mantieni i gomiti puntati verso il soffitto, fermi e non troppo aperti.',
    'Estendi i gomiti riportando il carico in alto contraendo i tricipiti.',
  ],
  triceps_overhead: [
    'In piedi o seduto, tieni il carico sopra la testa con le braccia tese.',
    'Fletti i gomiti portando il carico dietro la nuca, con i gomiti vicini alla testa.',
    'Mantieni la parte alta delle braccia ferma e verticale.',
    'Estendi i gomiti fino a tornare con le braccia tese sopra la testa.',
  ],
  squat: [
    'Posiziona il bilanciere sui trapezi, piedi larghi come le spalle e punte leggermente aperte.',
    'Contrai l’addome e scendi spingendo il bacino indietro e le ginocchia in linea con i piedi.',
    'Scendi fino a quando le cosce sono almeno parallele al pavimento, con la schiena neutra.',
    'Risali spingendo sui talloni fino a estendere completamente anche e ginocchia.',
  ],
  squat_front: [
    'Tieni il carico davanti al corpo (sulle spalle o al petto) con i gomiti alti.',
    'Piedi larghi come le spalle, busto il più eretto possibile.',
    'Scendi piegando le ginocchia verso l’esterno e restando verticale.',
    'Risali spingendo sui talloni, mantenendo i gomiti alti.',
  ],
  squat_hang: [
    'In piedi con un manubrio o un peso per mano lungo i fianchi, piedi larghi come le spalle.',
    'Contrai l’addome e scendi spingendo il bacino indietro.',
    'Scendi finché le cosce sono parallele al pavimento, tenendo il petto alto.',
    'Risali spingendo sui talloni.',
  ],
  lunge: [
    'In piedi, con il carico sulle spalle o in mano ai lati, busto eretto.',
    'Fai un passo avanti e scendi fino a portare il ginocchio posteriore vicino al pavimento.',
    'Il ginocchio anteriore resta sopra la caviglia, senza superare troppo la punta del piede.',
    'Spingi con la gamba anteriore per tornare alla posizione di partenza.',
  ],
  leg_press: [
    'Siediti alla macchina con la schiena e il bacino ben appoggiati allo schienale.',
    'Appoggia i piedi sulla pedana larghi come le spalle e sblocca i fermi.',
    'Scendi in modo controllato fino a portare le ginocchia vicino a 90°, senza staccare il bacino.',
    'Spingi la pedana fino a distendere quasi del tutto le gambe, senza bloccare le ginocchia.',
  ],
  leg_extension: [
    'Siediti alla macchina con la schiena appoggiata e il cuscinetto sopra le caviglie.',
    'Regola lo schienale in modo che le ginocchia siano allineate con l’asse della macchina.',
    'Estendi le gambe fino a distenderle quasi del tutto, contraendo i quadricipiti.',
    'Scendi lentamente senza far toccare i pesi.',
  ],
  leg_curl: [
    'Siediti (o sdraiati) alla macchina con il cuscinetto appoggiato sopra le caviglie.',
    'Parti con le gambe quasi distese.',
    'Fletti le ginocchia portando i talloni verso i glutei, contraendo i femorali.',
    'Torna lentamente alla posizione di partenza, senza far toccare i pesi.',
  ],
  deadlift: [
    'In piedi con i piedi sotto il bilanciere, larghezza anche; afferra la barra appena fuori dalle ginocchia.',
    'Petto alto, schiena neutra, spalle sopra la barra e addome contratto.',
    'Spingi con le gambe e alza la barra tenendola vicina al corpo, fino alla stazione eretta.',
    'Scendi in modo controllato portando prima indietro il bacino e poi piegando le ginocchia.',
  ],
  romanian_deadlift: [
    'In piedi con il carico davanti alle cosce, ginocchia appena flesse.',
    'Spingi il bacino indietro facendo scendere il carico lungo le gambe, con la schiena neutra.',
    'Scendi fino a sentire un forte allungamento dei femorali, di solito sotto le ginocchia.',
    'Risali spingendo il bacino in avanti e contraendo i glutei.',
  ],
  good_morning: [
    'Con il bilanciere sui trapezi, piedi larghi come le spalle e ginocchia appena flesse.',
    'Spingi il bacino indietro inclinando il busto in avanti, con la schiena neutra.',
    'Scendi fino a quasi parallelo al pavimento, sentendo i femorali.',
    'Risali spingendo il bacino in avanti fino alla posizione eretta.',
  ],
  hip_thrust: [
    'Siediti a terra con la parte alta della schiena appoggiata a una panca e il carico sul bacino.',
    'Piedi a terra, ginocchia piegate a circa 90°.',
    'Spingi il bacino verso l’alto fino ad allineare busto e cosce, contraendo i glutei.',
    'Scendi lentamente senza appoggiare del tutto il carico.',
  ],
  back_extension: [
    'Posizionati sulla panca per iperestensioni con i fianchi appoggiati al cuscino e le caviglie bloccate.',
    'Incrocia le braccia sul petto o dietro la nuca e parti con il busto piegato in avanti.',
    'Solleva il busto fino ad allinearlo con le gambe, contraendo lombari e glutei.',
    'Scendi lentamente senza iperestendere la schiena.',
  ],
  calf_raise: [
    'In piedi, con la parte anteriore del piede su un rialzo e i talloni nel vuoto.',
    'Solleva i talloni il più in alto possibile, restando in punta di piedi.',
    'Mantieni la contrazione per un secondo.',
    'Scendi lentamente fino a sentire l’allungamento dei polpacci.',
  ],
  bent_row: [
    'In piedi con le ginocchia flesse, inclina il busto in avanti con la schiena neutra.',
    'Tieni il carico a braccia tese davanti a te.',
    'Tira il carico verso l’addome portando i gomiti indietro e stringendo le scapole.',
    'Scendi lentamente senza arrotondare la schiena.',
  ],
  seated_row: [
    'Siediti alla macchina o ai cavi bassi con i piedi sulle pedane, schiena dritta e ginocchia leggermente flesse.',
    'Afferra la maniglia con le braccia tese.',
    'Tira verso l’addome portando i gomiti indietro e stringendo le scapole.',
    'Torna lentamente alla posizione di partenza, senza dondolare con il busto.',
  ],
  lat_pulldown: [
    'Siediti alla lat machine con le cosce bloccate sotto i rulli e afferra la barra a presa larga.',
    'Inclina leggermente il busto indietro e tieni il petto alto.',
    'Tira la barra fino alla parte alta del petto portando i gomiti verso il basso.',
    'Risali lentamente fino a distendere le braccia, mantenendo il controllo.',
  ],
  pull_up: [
    'Afferra la sbarra con le mani a presa prona, un po’ più larghe delle spalle, e resta appeso a braccia tese.',
    'Contrai dorsali e addome, scapole in basso.',
    'Tirati su finché il mento supera la sbarra.',
    'Scendi lentamente fino a distendere del tutto le braccia.',
  ],
  crunch: [
    'Sdraiati sulla schiena con le ginocchia piegate e i piedi a terra.',
    'Metti le mani dietro la nuca o incrociate sul petto, senza tirare il collo.',
    'Solleva spalle e parte alta della schiena contraendo gli addominali.',
    'Scendi lentamente senza rilassare del tutto l’addome.',
  ],
  leg_raise: [
    'Sdraiati sulla schiena con le mani lungo i fianchi o sotto i glutei.',
    'Tieni la zona lombare a contatto con il pavimento.',
    'Solleva le gambe tese fino a portarle verticali.',
    'Scendi lentamente senza far toccare i piedi a terra.',
  ],
};

type Row = [
  id: string,
  name: string,
  movement: string,
  equipment: Equip,
  level: Level,
  note?: string,
  muscles?: [string[], string[]],
];

const B = 'beginner';
const I = 'intermediate';
const E = 'expert';

const ROWS: Row[] = [
  // --- Petto
  ['panca-piana-bilanciere', 'Panca piana con bilanciere', 'bench_press', 'barbell', I],
  ['panca-piana-manubri', 'Panca piana con manubri', 'bench_press', 'dumbbell', B],
  ['panca-piana-presa-stretta', 'Panca piana presa stretta', 'bench_press', 'barbell', I, 'Presa a larghezza spalle: lavorano di più i tricipiti.', [['triceps', 'chest'], ['shoulders']]],
  ['panca-piana-presa-larga', 'Panca piana presa larga', 'bench_press', 'barbell', I],
  ['panca-piana-multipower', 'Panca piana al multipower', 'bench_press', 'machine', B],
  ['floor-press-bilanciere', 'Floor press con bilanciere', 'bench_press', 'barbell', I, 'Sdraiato a terra: il movimento si ferma quando i gomiti toccano il pavimento.'],
  ['floor-press-manubri', 'Floor press con manubri', 'bench_press', 'dumbbell', B, 'Sdraiato a terra: il movimento si ferma quando i gomiti toccano il pavimento.'],
  ['chest-press-macchina', 'Chest press alla macchina', 'chest_press_machine', 'machine', B],
  ['chest-press-cavi', 'Chest press ai cavi', 'bench_press', 'cable', B],
  ['panca-inclinata-bilanciere', 'Panca inclinata con bilanciere', 'incline_press', 'barbell', I],
  ['panca-inclinata-manubri', 'Panca inclinata con manubri', 'incline_press', 'dumbbell', I],
  ['panca-inclinata-multipower', 'Panca inclinata al multipower', 'incline_press', 'machine', B],
  ['panca-inclinata-cavi', 'Panca inclinata ai cavi', 'incline_press', 'cable', I],
  ['croci-manubri-panca', 'Croci con manubri su panca piana', 'chest_fly', 'dumbbell', I],
  ['croci-cavi-panca', 'Croci ai cavi su panca', 'chest_fly', 'cable', I],
  ['flessioni', 'Flessioni a terra', 'push_up', 'body only', B],
  ['flessioni-presa-stretta', 'Flessioni presa stretta', 'push_up', 'body only', B, 'Mani sotto le spalle: lavorano di più i tricipiti.', [['triceps', 'chest'], ['shoulders']]],
  ['flessioni-presa-larga', 'Flessioni presa larga', 'push_up', 'body only', B],
  ['dip-parallele', 'Dip alle parallele', 'dips', 'body only', I],
  ['dip-parallele-petto', 'Dip alle parallele (petto)', 'dips', 'body only', I, 'Inclina il busto in avanti per coinvolgere di più il petto.'],

  // --- Spalle
  ['military-press-bilanciere', 'Military press con bilanciere', 'overhead_press', 'barbell', I],
  ['lento-avanti-manubri', 'Lento avanti con manubri', 'overhead_press', 'dumbbell', B],
  ['lento-avanti-manubri-seduto', 'Lento avanti seduto con manubri', 'overhead_press', 'dumbbell', B],
  ['lento-avanti-bilanciere-seduto', 'Lento avanti seduto con bilanciere', 'overhead_press', 'barbell', I],
  ['arnold-press', 'Arnold press', 'overhead_press', 'dumbbell', I, 'Parti con i palmi rivolti verso di te e ruotali durante la spinta.'],
  ['push-press', 'Push press', 'overhead_press', 'barbell', E, 'Usa una leggera spinta delle gambe per aiutare la partenza.'],
  ['lento-avanti-multipower', 'Lento avanti al multipower', 'overhead_press', 'machine', B],
  ['lento-avanti-kettlebell', 'Lento avanti con kettlebell', 'overhead_press', 'kettlebells', I],
  ['alzate-frontali-bilanciere', 'Alzate frontali con bilanciere', 'front_raise', 'barbell', I],
  ['alzate-frontali-manubri', 'Alzate frontali con manubri', 'front_raise', 'dumbbell', B],
  ['alzate-frontali-cavo', 'Alzate frontali al cavo basso', 'front_raise', 'cable', B],
  ['tirate-mento-bilanciere', 'Tirate al mento con bilanciere', 'upright_row', 'barbell', I],
  ['tirate-mento-manubri', 'Tirate al mento con manubri', 'upright_row', 'dumbbell', I],
  ['tirate-mento-multipower', 'Tirate al mento al multipower', 'upright_row', 'machine', I],
  ['tirate-mento-cavo', 'Tirate al mento al cavo basso', 'upright_row', 'cable', I],
  ['scrollate-bilanciere', 'Scrollate con bilanciere', 'shrug', 'barbell', B],
  ['scrollate-manubri', 'Scrollate con manubri', 'shrug', 'dumbbell', B],
  ['scrollate-multipower', 'Scrollate al multipower', 'shrug', 'machine', B],
  ['scrollate-cavo', 'Scrollate al cavo basso', 'shrug', 'cable', B],

  // --- Braccia
  ['curl-bilanciere', 'Curl con bilanciere', 'biceps_curl', 'barbell', B],
  ['curl-bilanciere-ez', 'Curl con barra EZ', 'biceps_curl', 'barbell', B],
  ['curl-bilanciere-presa-stretta', 'Curl con bilanciere presa stretta', 'biceps_curl', 'barbell', B],
  ['curl-bilanciere-presa-larga', 'Curl con bilanciere presa larga', 'biceps_curl', 'barbell', B],
  ['curl-bilanciere-presa-inversa', 'Curl a presa inversa con bilanciere', 'biceps_curl', 'barbell', I, 'Presa prona: lavorano di più gli avambracci.', [['forearms', 'biceps'], []]],
  ['curl-manubri', 'Curl con manubri', 'biceps_curl', 'dumbbell', B],
  ['curl-manubri-alternato', 'Curl alternato con manubri', 'biceps_curl', 'dumbbell', B],
  ['curl-manubri-seduto', 'Curl seduto con manubri', 'biceps_curl', 'dumbbell', B],
  ['curl-hammer', 'Curl a martello con manubri', 'biceps_curl', 'dumbbell', B, 'Palmi uno di fronte all’altro per tutto il movimento.', [['biceps', 'forearms'], []]],
  ['curl-hammer-alternato', 'Curl a martello alternato', 'biceps_curl', 'dumbbell', B, 'Palmi uno di fronte all’altro per tutto il movimento.', [['biceps', 'forearms'], []]],
  ['curl-cavo-barra', 'Curl al cavo basso con barra', 'biceps_curl', 'cable', B],
  ['curl-cavo-corda', 'Curl a martello al cavo con corda', 'biceps_curl', 'cable', B, 'Palmi uno di fronte all’altro per tutto il movimento.', [['biceps', 'forearms'], []]],
  ['curl-kettlebell', 'Curl con kettlebell', 'biceps_curl', 'kettlebells', B],
  ['pushdown-barra', 'Pushdown ai cavi con barra', 'triceps_pushdown', 'cable', B],
  ['pushdown-corda', 'Pushdown ai cavi con corda', 'triceps_pushdown', 'cable', B],
  ['pushdown-barra-v', 'Pushdown ai cavi con barra a V', 'triceps_pushdown', 'cable', B],
  ['pushdown-presa-inversa', 'Pushdown a presa inversa', 'triceps_pushdown', 'cable', I],
  ['french-press-ez', 'French press con barra EZ', 'lying_triceps_ext', 'barbell', I],
  ['french-press-manubri', 'French press con manubri', 'lying_triceps_ext', 'dumbbell', I],
  ['french-press-bilanciere', 'French press con bilanciere', 'lying_triceps_ext', 'barbell', I],
  ['french-press-multipower', 'French press al multipower', 'lying_triceps_ext', 'machine', I],
  ['estensioni-sopra-testa-manubrio', 'Estensioni sopra la testa con manubrio', 'triceps_overhead', 'dumbbell', B],
  ['estensioni-sopra-testa-kettlebell', 'Estensioni sopra la testa con kettlebell', 'triceps_overhead', 'kettlebells', B],
  ['estensioni-sopra-testa-ez', 'Estensioni sopra la testa con barra EZ', 'triceps_overhead', 'barbell', I],
  ['estensioni-sopra-testa-cavo', 'Estensioni sopra la testa al cavo', 'triceps_overhead', 'cable', B],

  // --- Gambe
  ['squat-bilanciere', 'Squat con bilanciere', 'squat', 'barbell', I],
  ['squat-multipower', 'Squat al multipower', 'squat', 'machine', B],
  ['squat-box', 'Squat alla panca (box squat)', 'squat', 'barbell', I],
  ['squat-pausa', 'Squat con pausa', 'squat', 'barbell', E, 'Fermati un secondo in basso prima di risalire.'],
  ['squat-frontale', 'Squat frontale con bilanciere', 'squat_front', 'barbell', E],
  ['squat-frontale-multipower', 'Squat frontale al multipower', 'squat_front', 'machine', I],
  ['goblet-squat-manubrio', 'Goblet squat con manubrio', 'squat_front', 'dumbbell', B],
  ['goblet-squat-kettlebell', 'Goblet squat con kettlebell', 'squat_front', 'kettlebells', B],
  ['squat-zercher', 'Squat Zercher', 'squat_front', 'barbell', E],
  ['squat-manubri', 'Squat con manubri', 'squat_hang', 'dumbbell', B],
  ['squat-kettlebell', 'Squat con due kettlebell', 'squat_hang', 'kettlebells', B],
  ['squat-corpo-libero', 'Squat a corpo libero', 'squat_hang', 'body only', B],
  ['affondi-bilanciere', 'Affondi con bilanciere', 'lunge', 'barbell', I],
  ['affondi-manubri', 'Affondi con manubri', 'lunge', 'dumbbell', B],
  ['affondi-indietro-manubri', 'Affondi indietro con manubri', 'lunge', 'dumbbell', B],
  ['affondi-multipower', 'Affondi al multipower', 'lunge', 'machine', B],
  ['affondi-corpo-libero', 'Affondi a corpo libero', 'lunge', 'body only', B],
  ['leg-press-45', 'Leg press 45°', 'leg_press', 'machine', B],
  ['leg-press-piedi-alti', 'Leg press piedi alti', 'leg_press', 'machine', B, 'Piedi più in alto sulla pedana: lavorano di più glutei e femorali.', [['glutes', 'hamstrings'], ['quadriceps']]],
  ['leg-press-piedi-bassi', 'Leg press piedi bassi', 'leg_press', 'machine', B],
  ['leg-extension', 'Leg extension', 'leg_extension', 'machine', B],
  ['leg-curl-seduto', 'Leg curl seduto', 'leg_curl', 'machine', B],
  ['leg-curl-sdraiato', 'Leg curl sdraiato', 'leg_curl', 'machine', B],
  ['stacco-bilanciere', 'Stacco da terra con bilanciere', 'deadlift', 'barbell', E],
  ['stacco-manubri', 'Stacco da terra con manubri', 'deadlift', 'dumbbell', I],
  ['stacco-kettlebell', 'Stacco con kettlebell', 'deadlift', 'kettlebells', B],
  ['stacco-multipower', 'Stacco al multipower', 'deadlift', 'machine', I],
  ['stacco-rumeno-bilanciere', 'Stacco rumeno con bilanciere', 'romanian_deadlift', 'barbell', I],
  ['stacco-rumeno-manubri', 'Stacco rumeno con manubri', 'romanian_deadlift', 'dumbbell', I],
  ['stacco-gambe-tese-bilanciere', 'Stacco a gambe tese con bilanciere', 'romanian_deadlift', 'barbell', I],
  ['stacco-gambe-tese-manubri', 'Stacco a gambe tese con manubri', 'romanian_deadlift', 'dumbbell', I],
  ['stacco-rumeno-multipower', 'Stacco rumeno al multipower', 'romanian_deadlift', 'machine', I],
  ['good-morning', 'Good morning con bilanciere', 'good_morning', 'barbell', E],
  ['good-morning-gambe-tese', 'Good morning a gambe tese', 'good_morning', 'barbell', E],
  ['hip-thrust-bilanciere', 'Hip thrust con bilanciere', 'hip_thrust', 'barbell', I],
  ['ponte-glutei', 'Ponte per i glutei a corpo libero', 'hip_thrust', 'body only', B],
  ['ponte-glutei-bilanciere', 'Ponte per i glutei con bilanciere', 'hip_thrust', 'barbell', I],
  ['iperestensioni', 'Iperestensioni (panca per lombari)', 'back_extension', 'body only', B],
  ['polpacci-in-piedi-bilanciere', 'Calf in piedi con bilanciere', 'calf_raise', 'barbell', B],
  ['polpacci-in-piedi-manubri', 'Calf in piedi con manubri', 'calf_raise', 'dumbbell', B],
  ['polpacci-in-piedi-multipower', 'Calf in piedi al multipower', 'calf_raise', 'machine', B],
  ['polpacci-corpo-libero', 'Calf a corpo libero', 'calf_raise', 'body only', B],

  // --- Schiena
  ['rematore-bilanciere', 'Rematore con bilanciere', 'bent_row', 'barbell', I],
  ['rematore-bilanciere-presa-inversa', 'Rematore a presa inversa con bilanciere', 'bent_row', 'barbell', I],
  ['rematore-manubri', 'Rematore con due manubri', 'bent_row', 'dumbbell', I],
  ['rematore-manubrio-un-braccio', 'Rematore con manubrio a un braccio', 'bent_row', 'dumbbell', B],
  ['rematore-t-bar', 'Rematore con T-bar', 'bent_row', 'barbell', I],
  ['rematore-kettlebell', 'Rematore con kettlebell', 'bent_row', 'kettlebells', B],
  ['rematore-multipower', 'Rematore al multipower', 'bent_row', 'machine', I],
  ['pulley-basso', 'Pulley basso (rematore ai cavi)', 'seated_row', 'cable', B],
  ['pulley-presa-stretta', 'Pulley con maniglia triangolare', 'seated_row', 'cable', B],
  ['pulley-presa-larga', 'Pulley con barra larga', 'seated_row', 'cable', B],
  ['lat-machine-presa-larga', 'Lat machine presa larga', 'lat_pulldown', 'cable', B],
  ['lat-machine-presa-stretta', 'Lat machine presa stretta', 'lat_pulldown', 'cable', B],
  ['lat-machine-presa-inversa', 'Lat machine presa inversa', 'lat_pulldown', 'cable', B],
  ['lat-machine-triangolo', 'Lat machine con maniglia triangolare', 'lat_pulldown', 'cable', B],
  ['lat-machine-dietro-nuca', 'Lat machine dietro la nuca', 'lat_pulldown', 'cable', I],
  ['trazioni-presa-prona', 'Trazioni alla sbarra (presa prona)', 'pull_up', 'body only', I],
  ['trazioni-presa-supina', 'Trazioni a presa supina (chin-up)', 'pull_up', 'body only', I, 'Presa supina: lavorano di più i bicipiti.', [['lats', 'biceps'], ['middle back']]],
  ['trazioni-presa-neutra', 'Trazioni a presa neutra', 'pull_up', 'body only', I],
  ['trazioni-presa-larga', 'Trazioni presa larga', 'pull_up', 'body only', E],

  // --- Addome
  ['crunch', 'Crunch a terra', 'crunch', 'body only', B],
  ['crunch-mani-nuca', 'Crunch con mani dietro la nuca', 'crunch', 'body only', B],
  ['sit-up', 'Sit-up', 'crunch', 'body only', B],
  ['sollevamento-gambe', 'Sollevamento gambe da sdraiato', 'leg_raise', 'body only', I],
  ['sollevamento-gambe-ginocchia-flesse', 'Sollevamento gambe a ginocchia flesse', 'leg_raise', 'body only', B],
];

export type CatalogExercise = {
  id: string;
  name: string;
  equipment: Equip;
  level: Level;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  movement: string;
  impl: Implement;
};

const IMPL: Record<Equip, Implement> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  'body only': 'none',
  cable: 'cable',
  machine: 'none',
  kettlebells: 'kettlebell',
};

export const CATALOG: CatalogExercise[] = [...ROWS, ...EXTRA_ROWS].map(
  ([id, name, movement, equipment, level, note, muscles]) => {
    const [primary, secondary] = muscles ?? MOVEMENT_MUSCLES[movement];
    const steps = [...MOVEMENT_STEPS[movement]];
    if (note) steps.push(note);
    // Multipower/Smith: il bilanciere scorre su guide
    const isSmith = equipment === 'machine' && /multipower/i.test(name);
    return {
      id,
      name,
      equipment,
      level,
      primaryMuscles: primary,
      secondaryMuscles: secondary,
      instructions: steps,
      movement,
      impl: isSmith ? 'barbell' : IMPL[equipment],
    };
  },
);
