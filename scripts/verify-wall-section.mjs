// Verify the wall-section generator consumes the as-sited heights handed over in
// a DesignSet (`results.eaveHeight` / `gutterHeight` / `fasciaHeight` /
// `ridgeHeight` / `siteNotes`) and sets the section out from them.
//
// Run after `npm run build`:  node scripts/verify-wall-section.mjs
// Writes the rendered SVG to scripts/out/ for visual inspection.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseDesignSet, generateWallSectionSVG } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const ds = parseDesignSet(readFileSync(join(root, 'fixtures', 'sample.designset.json'), 'utf8'));
const g = ds.geometry;
const r = ds.results ?? {};
const purlin = ds.members.find(m => m.role === 'purlin');
const rafter = ds.members.find(m => m.role === 'rafter');
const post = ds.members.find(m => m.role === 'post');

const args = [
  g.depth, g.pitch,
  purlin?.d ?? 100, purlin?.b ?? 50, purlin?.t ?? 1.5,
  true, 150, 'intermediate', post?.d ?? 100, g.roofType === 'gable', rafter?.d ?? 250,
];

// Baseline: no heights handed over (older export) — must still render.
const baseline = generateWallSectionSVG(...args);
// With the as-sited heights threaded from results + the standoff/clearance
// set-out from geometry.standoff and results.existingGutterOverhangMm.
const sited = generateWallSectionSVG(...args, {
  eaveHeight: r.eaveHeight,
  gutterHeight: r.gutterHeight,
  fasciaHeight: r.fasciaHeight,
  ridgeHeight: r.ridgeHeight,
  standoff: g.standoff,
  existingGutterOverhangMm: r.existingGutterOverhangMm,
  siteNotes: r.siteNotes,
});

const sc = 0.12, H = 600, SLAB_H = 100;
const fflY = (H - 50) - SLAB_H * sc;
const mmToY = mm => +(fflY - mm * sc).toFixed(1);
const expect = {
  fasciaTop: mmToY(r.gutterHeight),  // 216.4
  fasciaBot: mmToY(r.fasciaHeight),  // 240.4
  ridge: mmToY(r.ridgeHeight),       // 137.2
};

const checks = [
  ['baseline still renders', baseline.startsWith('<svg') && baseline.endsWith('</svg>')],
  ['sited differs from baseline', sited !== baseline],
  [`fascia top at gutterHeight Y=${expect.fasciaTop}`, sited.includes(`"${expect.fasciaTop}"`)],
  [`fascia bottom at fasciaHeight Y=${expect.fasciaBot}`, sited.includes(`"${expect.fasciaBot}"`)],
  [`ridge at ridgeHeight Y=${expect.ridge}`, sited.includes(`${expect.ridge}`)],
  ['site notes block present', sited.includes('SITE NOTES')],
  ['site notes text present', sited.includes('Council flagged')],
  ['baseline has no site notes', !baseline.includes('SITE NOTES')],
  ['existing dwelling drawn', sited.includes('EXISTING DWELLING')],
  ['existing gutter drawn', sited.includes('EXIST. GUTTER')],
  [`standoff dimensioned (STANDOFF ${g.standoff})`, sited.includes(`STANDOFF ${g.standoff}`)],
  [`clearance dimensioned (CLR ${g.standoff - r.existingGutterOverhangMm})`,
    sited.includes(`CLR ${g.standoff - r.existingGutterOverhangMm}`)],
  ['baseline has no dwelling detail', !baseline.includes('EXISTING DWELLING')],
];

let ok = true;
for (const [name, pass] of checks) {
  console.log(`${pass ? '  ok ' : 'FAIL '} ${name}`);
  if (!pass) ok = false;
}

mkdirSync(join(here, 'out'), { recursive: true });
writeFileSync(join(here, 'out', 'wall-section.sited.svg'), sited);
writeFileSync(join(here, 'out', 'wall-section.baseline.svg'), baseline);
console.log('\nSVGs written to scripts/out/ (sited + baseline).');

if (!ok) { console.error('\nVERIFY FAILED'); process.exit(1); }
console.log('VERIFY PASSED');
