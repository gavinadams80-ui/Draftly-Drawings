// ── Stormwater drainage sheet ──
// Renders the drainage design Intelligence carries over in a DesignSet
// (`results.drainage`): the design storm (rainfall intensity + AEP), the total
// roof catchment, and a downpipe schedule (label · area served · required vs
// rated capacity). Over-capacity downpipes — and the system-level
// `anyOverCapacity` flag — are called out in red so the planner's stormwater
// concern is answered on the drawing rather than buried in a calc.
//
// Output is a plain SVG string that withTitleBlock() places on an A3 sheet like
// every other generator. Pure data — no React, no DOM.

import type { DesignDrainage } from './designSet.js';

const VB_W = 660;
const VB_H = 500;

const mono     = 'DM Mono,monospace';
const lineCol  = '#c8cce0';
const dimCol   = '#9aa0bc';
const headCol  = '#9fcdf0';
const okCol    = '#7ab8e8';
const warnCol  = '#f44336';

/**
 * Required flow (L/s) to drain `areaM2` at `intensityMmHr`.
 * 1 mm of rain over 1 m² = 1 L, so L/hr = intensity × area; ÷3600 → L/s.
 */
export function requiredFlowLs(intensityMmHr: number, areaM2: number): number {
  return (intensityMmHr * areaM2) / 3600;
}

/**
 * Returns an SVG string for the stormwater drainage sheet, or '' when no
 * drainage design was carried over (caller then keeps its previous behaviour).
 */
export function generateDrainageSheetSVG(d?: DesignDrainage, opts: { siteNotes?: string } = {}): string {
  if (!d) return '';

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const txt = (
    x: number, y: number, s: string, size = 9, fill = lineCol,
    anchor: 'start' | 'middle' | 'end' = 'start', weight = '400',
  ) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${mono}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}">`;
  s += `<rect width="${VB_W}" height="${VB_H}" fill="transparent"/>`;

  // ── Title + design-storm summary ──
  s += txt(20, 26, 'STORMWATER DRAINAGE', 14, headCol, 'start', '700');
  s += `<line x1="20" y1="34" x2="${VB_W - 20}" y2="34" stroke="${dimCol}" stroke-width="0.8"/>`;
  s += txt(20, 54, `Design storm: ${d.aepPercent}% AEP · ${d.designIntensityMmHr} mm/hr`, 9.5, lineCol);
  s += txt(20, 70, `Total catchment: ${Math.round(d.totalCatchmentAreaM2)} m²`, 9.5, lineCol);

  // ── Over-capacity banner ──
  if (d.anyOverCapacity) {
    s += `<rect x="20" y="80" width="${VB_W - 40}" height="22" rx="3" fill="rgba(244,67,54,0.16)" stroke="${warnCol}" stroke-width="0.9"/>`;
    s += txt(30, 95, '⚠  SYSTEM OVER CAPACITY — review downpipe sizing / spacing', 9.5, warnCol, 'start', '700');
  }

  // ── Downpipe schedule ──
  const dps = d.downpipes ?? [];
  const tableY = d.anyOverCapacity ? 122 : 96;
  const cols = [
    { x: 30,  label: 'DOWNPIPE', anchor: 'start'  as const },
    { x: 250, label: 'SERVES m²', anchor: 'end' as const },
    { x: 380, label: 'REQ L/s', anchor: 'end'  as const },
    { x: 500, label: 'CAP L/s', anchor: 'end'  as const },
    { x: 560, label: '', anchor: 'start' as const },
  ];
  // Header row
  for (const c of cols) if (c.label) s += txt(c.x, tableY, c.label, 8.5, headCol, c.anchor, '700');
  s += `<line x1="20" y1="${tableY + 5}" x2="${VB_W - 20}" y2="${tableY + 5}" stroke="${dimCol}" stroke-width="0.7"/>`;

  const rowH = 20;
  dps.forEach((dp, i) => {
    const ry  = tableY + 5 + rowH * (i + 1);
    const req = requiredFlowLs(d.designIntensityMmHr, dp.servesM2);
    const over = req > dp.capacityLs;
    const rowCol = over ? warnCol : lineCol;
    s += txt(cols[0].x, ry, dp.label, 9, rowCol, 'start');
    s += txt(cols[1].x, ry, `${Math.round(dp.servesM2)}`, 9, rowCol, 'end');
    s += txt(cols[2].x, ry, req.toFixed(1), 9, rowCol, 'end');
    s += txt(cols[3].x, ry, dp.capacityLs.toFixed(1), 9, rowCol, 'end');
    if (over) s += txt(cols[4].x, ry, 'OVER', 8, warnCol, 'start', '700');
  });

  if (!dps.length) {
    s += txt(30, tableY + 5 + rowH, 'No downpipes scheduled.', 9, dimCol, 'start');
  }

  // ── Capacity summary footnote ──
  const totalReq = dps.reduce((t, dp) => t + requiredFlowLs(d.designIntensityMmHr, dp.servesM2), 0);
  const totalCap = dps.reduce((t, dp) => t + dp.capacityLs, 0);
  const footY = tableY + 5 + rowH * (dps.length + 1) + 14;
  if (dps.length) {
    s += `<line x1="20" y1="${(footY - 14).toFixed(1)}" x2="${VB_W - 20}" y2="${(footY - 14).toFixed(1)}" stroke="${dimCol}" stroke-width="0.7"/>`;
    s += txt(30, footY, `Total required ${totalReq.toFixed(1)} L/s  ·  total rated ${totalCap.toFixed(1)} L/s`,
      9, totalReq > totalCap ? warnCol : okCol, 'start', '700');
  }

  // ── Optional planning notes footer (surfaces results.siteNotes here too) ──
  if (opts.siteNotes && opts.siteNotes.trim()) {
    const maxChars = 84;
    const words = opts.siteNotes.trim().replace(/\s+/g, ' ').split(' ');
    const wrapped: string[] = [];
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (next.length > maxChars && line) { wrapped.push(line); line = w; } else line = next;
    }
    if (line) wrapped.push(line);
    const lines = wrapped.slice(0, 4);
    let ny = VB_H - 14 - (lines.length - 1) * 11;
    s += txt(20, ny - 14, 'PLANNING NOTES', 8, headCol, 'start', '700');
    for (const ln of lines) { s += txt(20, ny, ln, 8, dimCol, 'start'); ny += 11; }
  }

  s += `</svg>`;
  return s;
}
