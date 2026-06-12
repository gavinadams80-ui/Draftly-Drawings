// ── Portal frames + connection variants — the per-frame dropdown contract ──
//
// The product model (agreed 2026-06-13): the plan view ports across north-up with the
// existing dwelling known. Each portal frame is a selectable object whose two ends each
// offer a DROPDOWN of connection options — the same interaction pattern as the downpipe
// and light-fitting pickers. Picking an option regenerates the section/side views.
//
// Customisation is absorption, not divergence: when a user edits a connection in
// Drafting, the edit is captured as a NEW ConnectionVariant (their variation), run
// through Engineering, and added to THEIR options list. The dropdown stays the single
// source of truth — it just got one option longer. Nothing is ever "scribbled on top"
// of a generated view, so there is nothing to clobber.
//
// Three rules baked into the shape:
//   1. ANCHOR CHAIN — details never hang off GPS directly. The building anchors to the
//      block once (origin + bearing, see BuildingAnchor in project.ts); frames anchor to
//      the building (positionMm along the ridge = the gridline); connections anchor to a
//      frame end. Move the building and everything follows cleanly.
//   2. CONTEXT-FILTERED OPTIONS — a frame end can only offer "attach to dwelling" kinds
//      on a side that actually has a dwelling (DesignGeometry.attachedSides).
//   3. HONEST VERIFICATION — a user variant never gets an automatic green tick. A
//      parametric tweak of a known kind can be auto-checked; novel geometry enters the
//      list flagged 'requires-review' until an engineer approves it. Same omit-don't-guess
//      rule that governs the planning data.
//
// Pure data + pure helpers. No React, no DOM.

import {
  type BuildingSide,
  type DesignGeometry,
  frameSpanAxis,
} from './designSet.js';

// ───────────────────────────── Connection kinds ─────────────────────────────

/**
 * The base TYPE of a frame-end connection. Aligned with the lib's existing connection
 * generators so every kind can draw itself. 'custom' = user-drawn novel geometry.
 */
export type ConnectionKind =
  | 'post-footing'        // freestanding post to concrete footing
  | 'corner-post'         // shared corner post           (generateCornerPostSVG)
  | 'rafter-ledger'       // rafter to dwelling ledger    (generateRafterLedgerSVG)
  | 'ledger'              // ledger fixing to dwelling    (generateLedgerConnectionSVG)
  | 'socket-joint'        // socket/sleeve into masonry   (generateSocketJointSVG)
  | 'fascia-penetration'  // through-fascia attachment    (generateFasciaPenetrationSVG)
  | 'custom';

/** Kinds that fasten to the EXISTING DWELLING — only offered on an attached side. */
export const ATTACHED_KINDS: readonly ConnectionKind[] = [
  'rafter-ledger', 'ledger', 'socket-joint', 'fascia-penetration',
];

/** Kinds that stand on their own support — always offerable. */
export const FREESTANDING_KINDS: readonly ConnectionKind[] = [
  'post-footing', 'corner-post',
];

/**
 * The dropdown filter: which connection kinds may be offered at a frame end landing on
 * `side`, given which sides attach to the existing dwelling. Freestanding kinds are always
 * valid (you can still use a post against a dwelling); attached kinds need the dwelling there.
 */
export function allowedKinds(
  side: BuildingSide,
  attachedSides: readonly BuildingSide[] | undefined,
): ConnectionKind[] {
  const attached = !!attachedSides?.includes(side);
  return attached
    ? [...ATTACHED_KINDS, ...FREESTANDING_KINDS, 'custom']
    : [...FREESTANDING_KINDS, 'custom'];
}

// ───────────────────────────── Variant verification ─────────────────────────────

/**
 * How much trust a variant has earned.
 *  - 'catalogue'         — pre-engineered standard option (known capacities/fixings).
 *  - 'auto-checked'      — a parametric tweak of a known kind; Engineering re-ran the
 *                          numbers automatically and it passed.
 *  - 'requires-review'   — novel geometry the system cannot honestly certify; usable,
 *                          but flagged until an engineer signs it off.
 *  - 'engineer-approved' — a human engineer reviewed and approved it.
 */
export type VariantStatus = 'catalogue' | 'auto-checked' | 'requires-review' | 'engineer-approved';

export interface VariantVerification {
  status: VariantStatus;
  /** ISO timestamp of the auto-check or approval. */
  checkedAt?: string;
  /** Demand/capacity ratio from the auto-check (0–1+). */
  utilisation?: number;
  /** Governing case, failure note, or reviewer comment. */
  note?: string;
  /** Who approved it (for 'engineer-approved'). */
  approvedBy?: string;
}

// ───────────────────────────── Connection variants ─────────────────────────────

/**
 * One option in the dropdown. Catalogue entries ship with the product; user entries are
 * created by editing a connection in Drafting ("their variation"), engineer-checked, and
 * added to that user's list — never pushed to everyone.
 */
export interface ConnectionVariant {
  /** Stable id. Placements reference `{ variantId, variantVersion }`. */
  id: string;
  /**
   * Monotonic version. Editing a variant creates version+1; existing placements KEEP the
   * version they chose until deliberately updated (same immutable-tag discipline as the lib).
   */
  version: number;
  /** Lineage — which variant (and version) this was derived from, if any. */
  basedOn?: { id: string; version: number };
  kind: ConnectionKind;
  /** User-facing dropdown label, e.g. 'Ledger — 2 rows M12'. */
  name: string;
  /** 'catalogue' = ships with the product; 'user' = someone's own variation. */
  owner: 'catalogue' | 'user';
  /** Parametric inputs (bolt count, plate thickness, member sizes…) for known kinds. */
  params?: Record<string, number | string>;
  verification: VariantVerification;
  /**
   * Captured drawing for 'custom' variants (catalogue/parametric kinds draw themselves
   * via the lib generators and don't need this).
   */
  svg?: string;
  createdAt?: string;
}

// ───────────────────────────── Portal frames ─────────────────────────────

/** A frame end's chosen option — pinned to a specific variant version. */
export interface FrameEndConnection {
  variantId: string;
  variantVersion: number;
}

/**
 * One portal frame in the building. Anchored to the BUILDING GRID, not to GPS: positionMm
 * runs along the ridge axis from the building origin, so frame 1 at 0 mm is the first
 * gridline. The two ends land on the two sides PARALLEL to the ridge (see frameEndSides).
 */
export interface PortalFrame {
  /** Stable id — survives renumbering, reordering, and the Eng round-trip. */
  id: string;
  /** 1-based display number along the ridge ("Frame 2", section "B-B"). */
  index: number;
  /** Distance (mm) along the ridge axis from the building origin — the gridline. */
  positionMm: number;
  /**
   * The connection chosen at each end, keyed by the BuildingSide the end lands on.
   * Only the two sides from frameEndSides() are meaningful. An end with no entry is
   * UNRESOLVED — the UI should prompt for a choice, never assume one.
   */
  ends: Partial<Record<BuildingSide, FrameEndConnection>>;
}

/**
 * The two sides a frame's ends land on — the sides parallel to the ridge. Ridge ∥ depth
 * (legacy default) ⇒ frames span the width ⇒ ends land on 'left'/'right'; ridge ∥ width ⇒
 * ends land on 'front'/'back'.
 */
export function frameEndSides(g: Pick<DesignGeometry, 'ridgeAxis'>): [BuildingSide, BuildingSide] {
  return frameSpanAxis(g) === 'width' ? ['left', 'right'] : ['front', 'back'];
}

/**
 * Bridge from the legacy `portalFrameCount` to an explicit frame list: count frames evenly
 * spaced along the ridge dimension, ends unresolved (the UI then offers the dropdowns).
 * Returns [] when the geometry can't support frames (count < 2 or zero length).
 */
export function defaultFrames(
  g: Pick<DesignGeometry, 'ridgeAxis' | 'portalFrameCount' | 'width' | 'depth'>,
  makeId: (i: number) => string = (i) => `frame_${i + 1}`,
): PortalFrame[] {
  const count = g.portalFrameCount;
  const ridgeLen = (g.ridgeAxis ?? 'depth') === 'depth' ? g.depth : g.width;
  if (!Number.isFinite(count) || count < 2 || !Number.isFinite(ridgeLen) || ridgeLen <= 0) return [];
  const spacing = ridgeLen / (count - 1);
  return Array.from({ length: count }, (_, i) => ({
    id: makeId(i),
    index: i + 1,
    positionMm: Math.round(i * spacing),
    ends: {},
  }));
}

/**
 * Capture an edit as a new version of a variant (the "absorb, don't diverge" rule).
 * Returns a NEW variant: version+1, lineage recorded, and verification RESET — an edited
 * connection has not been checked yet, so it re-earns its tick ('requires-review' for
 * custom geometry; the caller flips it to 'auto-checked' once Engineering passes it).
 */
export function bumpVariant(
  v: ConnectionVariant,
  changes: Partial<Pick<ConnectionVariant, 'name' | 'params' | 'svg' | 'kind'>> = {},
): ConnectionVariant {
  return {
    ...v,
    ...changes,
    version: v.version + 1,
    basedOn: { id: v.id, version: v.version },
    owner: 'user',
    verification: { status: 'requires-review', note: 'Edited — awaiting engineering check.' },
    createdAt: new Date().toISOString(),
  };
}
