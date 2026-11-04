/** Contact sheet delle animazioni: `npx tsx scripts/anim-sheet.ts [id,id,...] [out.html]` */
import { writeFileSync } from 'node:fs';
import { GRADIENTS, Shape, buildFrame } from '../src/anim/engine';
import { PATTERNS } from '../src/anim/patterns';
import { MOVEMENT_MUSCLES } from '../src/catalog';

export function svgOf(shapes: Shape[], vb: number[], w = 300, h = 240): string {
  const defs = GRADIENTS.map(
    (g) =>
      `<linearGradient id="${g.id}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${g.stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`,
  ).join('');
  const body = shapes
    .map((s) => {
      const o = 'o' in s && s.o != null ? ` opacity="${s.o}"` : '';
      if (s.k === 'path') return `<path d="${s.d}" fill="${s.f ?? 'none'}"${s.s ? ` stroke="${s.s}" stroke-width="${s.sw ?? 1}" stroke-linejoin="round" stroke-linecap="round"` : ''}${o}/>`;
      if (s.k === 'circle') return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${s.f}"${s.s ? ` stroke="${s.s}" stroke-width="${s.sw ?? 1}"` : ''}${o}/>`;
      if (s.k === 'ellipse') return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${s.f}"${s.s ? ` stroke="${s.s}" stroke-width="${s.sw ?? 1}"` : ''}${o}/>`;
      return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${s.c}" stroke-width="${s.w}" stroke-linecap="round"${o}/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${w}" height="${h}" style="background:#f6f6f8"><defs>${defs}</defs>${body}</svg>`;
}

const ids = (process.argv[2] ?? '').split(',').filter(Boolean);
const out = process.argv[3] ?? 'sheet.html';
const IMPL = (process.argv[4] ?? 'barbell') as 'barbell' | 'dumbbell' | 'kettlebell' | 'cable' | 'none';
const list = ids.length ? ids : Object.keys(PATTERNS);
const rows = list
  .map((id) => {
    const p = PATTERNS[id];
    const [pr, se] = MOVEMENT_MUSCLES[id] ?? [[], []];
    const cells = [0, 0.33, 0.66, 1]
      .map((s) => {
        const f = buildFrame(p, s, IMPL, pr, se);
        return svgOf(f.shapes, f.vb);
      })
      .join('');
    return `<div style="font:12px sans-serif;margin:6px 0 0">${id}</div><div style="display:flex;gap:6px">${cells}</div>`;
  })
  .join('');
writeFileSync(out, `<html><body style="margin:8px;background:#fff">${rows}</body></html>`);
