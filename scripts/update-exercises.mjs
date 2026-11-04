// Aggiorna src/data/exercises.json dal database pubblico "Free Exercise DB"
// (https://github.com/yuhonas/free-exercise-db, licenza Unlicense / pubblico dominio).
//
// Uso:  node scripts/update-exercises.mjs
// (se sei dietro un proxy aziendale:  NODE_USE_ENV_PROXY=1 node scripts/update-exercises.mjs)
import { writeFile } from 'node:fs/promises';

const SOURCE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Download fallito: HTTP ${res.status}`);
const raw = await res.json();

const items = raw
  .map((e) => ({
    id: e.id,
    name: e.name,
    equipment: e.equipment ?? null,
    level: e.level ?? null,
    category: e.category ?? null,
    primaryMuscles: e.primaryMuscles ?? [],
    secondaryMuscles: e.secondaryMuscles ?? [],
    instructions: e.instructions ?? [],
    // le immagini sono sempre <id>/0.jpg, <id>/1.jpg: salviamo solo quante sono
    images: (e.images ?? []).length,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

await writeFile('src/data/exercises.json', JSON.stringify(items));
console.log(`Scritti ${items.length} esercizi in src/data/exercises.json`);
