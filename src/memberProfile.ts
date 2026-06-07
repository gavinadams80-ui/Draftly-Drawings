// ── Member profile (single editable block) ──
// params in (Section + view + length) -> SVG string, drawn in REAL mm so the
// consuming editor (Drafting) can place it at true scale and wrap it with grips.
// Reuses parseSectionDims from drawings.ts so section geometry stays one source.

import type { Section } from './types.js';
import { parseSectionDims } from './drawings.js';

export type MemberView = 'section' | 'side' | 'plan';

export interface MemberProfileOptions {
  view: MemberView;
  /** Member length in mm — required for 'side' and 'plan'; ignored for 'section'. */
  lengthMm?: number;
  stroke?: string;
  fill?: string;
}

const PAD = 4; // mm padding around the shape so strokes aren't clipped
const DEF_STROKE = '#c8cce0';
const DEF_FILL = 'rgba(170,176,196,0.18)';

function svgWrap(wMm: number, hMm: number, body: string): string {
  // viewBox is in mm; width/height advertised in mm too (consumer scales mm->px)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-PAD} ${-PAD} ${wMm + PAD * 2} ${hMm + PAD * 2}" `
    + `width="${wMm + PAD * 2}mm" height="${hMm + PAD * 2}mm" data-units="mm">${body}</svg>`;
}

function rect(x: number, y: number, w: number, h: number, stroke: string, fill: string, sw = 1): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

/** Cross-section (end view) — the true profile shape. */
function sectionView(dims: ReturnType<typeof parseSectionDims>, stroke: string, fill: string): string {
  const { type, d, b, t, lip } = dims;
  const sw = Math.max(t * 0.4, 0.8);
  if (type === 'SHS' || type === 'RHS') {
    // hollow box: outer + inner
    let s = rect(0, 0, b, d, stroke, fill, sw);
    s += rect(t, t, Math.max(b - 2 * t, 0), Math.max(d - 2 * t, 0), stroke, 'none', sw * 0.7);
    return svgWrap(b, d, s);
  }
  if (type === 'C' || type === 'C2B' || type === 'C2F') {
    // lipped channel, open face to the right, drawn as composed members
    let s = rect(0, 0, t, d, stroke, fill, sw);              // web
    s += rect(0, 0, b, t, stroke, fill, sw);                 // top flange
    s += rect(0, d - t, b, t, stroke, fill, sw);             // bottom flange
    s += rect(b - t, t, t, lip, stroke, fill, sw);           // top lip
    s += rect(b - t, d - t - lip, t, lip, stroke, fill, sw); // bottom lip
    return svgWrap(b, d, s);
  }
  // RECT / fallback: solid
  return svgWrap(b, d, rect(0, 0, b, d, stroke, fill, sw));
}

/** Elevation (side) or top (plan) — a length × depth/width outline. */
function lengthView(dims: ReturnType<typeof parseSectionDims>, lengthMm: number, isPlan: boolean, stroke: string, fill: string): string {
  const across = isPlan ? dims.b : dims.d; // plan shows width, side shows depth
  const sw = Math.max(dims.t * 0.4, 0.8);
  let s = rect(0, 0, lengthMm, across, stroke, fill, sw);
  // hollow/open sections: hint the walls with inner lines
  if (dims.type === 'SHS' || dims.type === 'RHS' || dims.type.startsWith('C')) {
    s += `<line x1="0" y1="${dims.t}" x2="${lengthMm}" y2="${dims.t}" stroke="${stroke}" stroke-width="${sw * 0.6}" opacity="0.5"/>`;
    s += `<line x1="0" y1="${across - dims.t}" x2="${lengthMm}" y2="${across - dims.t}" stroke="${stroke}" stroke-width="${sw * 0.6}" opacity="0.5"/>`;
  }
  return svgWrap(lengthMm, across, s);
}

/**
 * Render a single member profile as an SVG string in mm coordinates.
 * - 'section' → cross-section shape (length ignored)
 * - 'side'    → elevation: length × section depth
 * - 'plan'    → top view: length × section width
 */
export function generateMemberProfile(sec: Section, opts: MemberProfileOptions): string {
  const dims = parseSectionDims(sec);
  const stroke = opts.stroke ?? DEF_STROKE;
  const fill = opts.fill ?? DEF_FILL;
  if (opts.view === 'section') return sectionView(dims, stroke, fill);
  const lengthMm = opts.lengthMm ?? 1000;
  return lengthView(dims, lengthMm, opts.view === 'plan', stroke, fill);
}
