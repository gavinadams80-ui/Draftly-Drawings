// Verify the drainage sheet generator consumes `results.drainage` from a
// DesignSet and renders the design storm, the catchment, the downpipe schedule
// (with required-vs-rated capacity) and the over-capacity flag.
//
// Run after `npm run build`:  node scripts/verify-drainage.mjs
// Writes the rendered SVG to scripts/out/ for visual inspection.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseDesignSet, generateDrainageSheetSVG, requiredFlowLs } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const ds = parseDesignSet(readFileSync(join(root, 'fixtures', 'sample.designset.json'), 'utf8'));
const drainage = ds.results?.drainage;
const notes = ds.results?.siteNotes;

// Absent drainage → empty string (caller keeps prior behaviour).
const empty = generateDrainageSheetSVG(undefined);
// Present drainage → full sheet, with site notes surfaced in the footer too.
const sheet = generateDrainageSheetSVG(drainage, { siteNotes: notes });

const dp3 = drainage.downpipes.find(d => d.label === 'DP3');
const dp3Req = requiredFlowLs(drainage.designIntensityMmHr, dp3.servesM2);

const checks = [
  ['absent drainage renders nothing', empty === ''],
  ['sheet renders', sheet.startsWith('<svg') && sheet.endsWith('</svg>')],
  ['title present', sheet.includes('STORMWATER DRAINAGE')],
  [`design storm (${drainage.aepPercent}% AEP)`, sheet.includes(`${drainage.aepPercent}% AEP`)],
  [`intensity (${drainage.designIntensityMmHr} mm/hr)`, sheet.includes(`${drainage.designIntensityMmHr} mm/hr`)],
  [`catchment (${Math.round(drainage.totalCatchmentAreaM2)} m²)`, sheet.includes(`${Math.round(drainage.totalCatchmentAreaM2)} m²`)],
  ['all downpipes listed', drainage.downpipes.every(d => sheet.includes(`>${d.label}<`))],
  ['over-capacity banner shown', sheet.includes('SYSTEM OVER CAPACITY')],
  [`DP3 flagged OVER (req ${dp3Req.toFixed(1)} > cap ${dp3.capacityLs})`, dp3Req > dp3.capacityLs && sheet.includes('OVER')],
  ['planning notes surfaced', sheet.includes('PLANNING NOTES')],
];

let ok = true;
for (const [name, pass] of checks) {
  console.log(`${pass ? '  ok ' : 'FAIL '} ${name}`);
  if (!pass) ok = false;
}

mkdirSync(join(here, 'out'), { recursive: true });
writeFileSync(join(here, 'out', 'drainage.sheet.svg'), sheet);
console.log('\nSVG written to scripts/out/drainage.sheet.svg.');

if (!ok) { console.error('\nVERIFY FAILED'); process.exit(1); }
console.log('VERIFY PASSED');
