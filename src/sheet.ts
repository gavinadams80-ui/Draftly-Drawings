// ── Shared drawing sheet (paper-size aware) ──
// One template both Draftly apps render, so a Drafting sheet and an Engineering
// submission sheet are identical by construction. Builds a standard landscape
// sheet — background, outer border, dashed working-area frame, and the AS1100
// title block strip across the bottom — for any ISO size (A4–A1).
//
// Pure: params in, SVG string out. No React, no DOM.
//
// `withTitleBlock()` (the A3 helper Engineering already calls) is preserved with
// its exact signature and output; it now delegates to `placeOnSheet('A3', …)`.

import {
  type TitleBlockData,
  TITLE_BLOCK_H,
  renderTitleBlock,
} from './titleBlock.js';

/** ISO 'A' sizes, landscape orientation. */
export type PaperSize = 'A4' | 'A3' | 'A2' | 'A1';

/** Sheet dimensions in millimetres (landscape: width ≥ height). */
export const SHEET_MM: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 297, h: 210 },
  A3: { w: 420, h: 297 },
  A2: { w: 594, h: 420 },
  A1: { w: 841, h: 594 },
};

// Pixel scale chosen so A3 lands at the historical 1190 px width (keeps the
// existing Engineering A3 output byte-for-byte identical).
const PX_PER_MM = 1190 / 420; // ≈ 2.8333

/** Border / margin inside the sheet edge (px). Fixed across sizes. */
export const SHEET_BORDER = 15;

const SHEET_BG = '#12131a';
const BORDER_COL = '#6b7090';

/** Sheet pixel dimensions for a given paper size. */
export function sheetPx(paperSize: PaperSize = 'A3'): { w: number; h: number } {
  const mm = SHEET_MM[paperSize];
  return { w: Math.round(mm.w * PX_PER_MM), h: Math.round(mm.h * PX_PER_MM) };
}

/** The drawing area inside the border and above the title block (px). */
export function getSheetWorkingArea(paperSize: PaperSize = 'A3'): {
  x: number; y: number; w: number; h: number;
} {
  const { w, h } = sheetPx(paperSize);
  return {
    x: SHEET_BORDER,
    y: SHEET_BORDER,
    w: w - SHEET_BORDER * 2,
    h: h - TITLE_BLOCK_H - SHEET_BORDER * 2,
  };
}

/** Sheet background + outer border + dashed working-area frame. */
function sheetChrome(W: number, H: number): { chrome: string; drawAreaW: number; drawAreaH: number } {
  const drawAreaW = W - SHEET_BORDER * 2;
  const drawAreaH = H - TITLE_BLOCK_H - SHEET_BORDER * 2;
  let chrome = '';
  chrome += `<rect width="${W}" height="${H}" fill="${SHEET_BG}"/>`;
  chrome += `<rect x="${SHEET_BORDER / 2}" y="${SHEET_BORDER / 2}" width="${W - SHEET_BORDER}" height="${H - SHEET_BORDER}" fill="none" stroke="${BORDER_COL}" stroke-width="0.8"/>`;
  chrome += `<rect x="${SHEET_BORDER}" y="${SHEET_BORDER}" width="${drawAreaW}" height="${drawAreaH}" fill="none" stroke="${BORDER_COL}" stroke-width="0.5" stroke-dasharray="4,3" opacity="0.4"/>`;
  return { chrome, drawAreaW, drawAreaH };
}

/** Options shared by the sheet builders. */
export interface SheetOptions {
  paperSize?: PaperSize;
  sheet?: number;
  totalSheets?: number;
  scale?: string;
}

/**
 * The blank sheet template (a "stencil"): sheet border + working-area frame +
 * title block, with no drawing content. Drop this onto a paper-space layout and
 * place model content inside `getSheetWorkingArea()`.
 */
export function generateSheetTemplate(
  tb: TitleBlockData,
  drawingTitle: string,
  drawingNumber: string,
  opts: SheetOptions = {},
): string {
  const { paperSize = 'A3', sheet = 1, totalSheets = 1, scale = 'NTS' } = opts;
  const { w: W, h: H } = sheetPx(paperSize);
  const { chrome } = sheetChrome(W, H);

  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;background:${SHEET_BG};">`;
  out += chrome;
  out += renderTitleBlock(0, H - TITLE_BLOCK_H, W, tb, drawingTitle, drawingNumber, sheet, totalSheets, scale);
  out += `</svg>`;
  return out;
}

/**
 * Places an existing drawing SVG onto a sheet of the given paper size. The
 * drawing is scaled to fit the working area (aspect preserved) and centred; the
 * title block spans the full sheet width at the bottom.
 */
export function placeOnSheet(
  svgString: string,
  tb: TitleBlockData,
  drawingTitle: string,
  drawingNumber: string,
  opts: SheetOptions = {},
): string {
  if (!svgString) return svgString;
  const { paperSize = 'A3', sheet = 1, totalSheets = 1, scale = 'NTS' } = opts;
  const { w: W, h: H } = sheetPx(paperSize);

  // ── Parse original drawing dimensions ──
  const vbMatch = svgString.match(/viewBox="([\d.\s-]+)"/);
  if (!vbMatch) return svgString;
  const parts = vbMatch[1].trim().split(/\s+/).map(Number);
  const [origX, origY, origW, origH] = parts.length === 4
    ? parts : [0, 0, parts[0] ?? 600, parts[1] ?? 400];

  const { chrome, drawAreaW, drawAreaH } = sheetChrome(W, H);

  // Scale content to fit, preserving aspect ratio, then centre it.
  const sc = Math.min(drawAreaW / origW, drawAreaH / origH);
  const scaledW = origW * sc;
  const scaledH = origH * sc;
  const offsetX = SHEET_BORDER + (drawAreaW - scaledW) / 2;
  const offsetY = SHEET_BORDER + (drawAreaH - scaledH) / 2;

  // Inner SVG content (everything between the outer <svg …> and </svg>).
  const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  const innerContent = innerMatch ? innerMatch[1] : '';

  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;display:block;background:${SHEET_BG};">`;
  out += chrome;
  // Drawing content, scaled + centred, in its original coordinate space.
  out += `<svg x="${offsetX}" y="${offsetY}" width="${scaledW}" height="${scaledH}" viewBox="${origX} ${origY} ${origW} ${origH}">`;
  out += innerContent;
  out += `</svg>`;
  out += renderTitleBlock(0, H - TITLE_BLOCK_H, W, tb, drawingTitle, drawingNumber, sheet, totalSheets, scale);
  out += `</svg>`;
  return out;
}

/**
 * Places an existing drawing SVG onto a standard A3 landscape sheet.
 * Back-compatible wrapper kept for Engineering's existing call sites; new code
 * should prefer `placeOnSheet()` with an explicit paper size.
 */
export function withTitleBlock(
  svgString: string,
  tb: TitleBlockData,
  drawingTitle: string,
  drawingNumber: string,
  sheet: number = 1,
  totalSheets: number = 1,
  scale: string = 'NTS',
): string {
  return placeOnSheet(svgString, tb, drawingTitle, drawingNumber, {
    paperSize: 'A3', sheet, totalSheets, scale,
  });
}
