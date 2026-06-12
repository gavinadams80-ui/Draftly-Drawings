// ── Connection catalogue — the standard options behind every frame-end dropdown ──
//
// This is the connections counterpart of SECTION_CATALOG: the single shared list of
// pre-engineered connection options both apps read, so they can never disagree. The
// per-frame dropdown (see frames.ts) is built from this catalogue filtered by
// allowedKinds(side, attachedSides), plus the user's own variants on top.
//
// Seeded from the lib's existing connection generators — each entry names the generator
// that draws it. External reference libraries (see docs/references/) get INGESTED into
// this format by a one-time translation script, never consumed at runtime: entries carry
// their provenance in `source`, and imports without engineering backing enter as
// 'requires-review', never 'catalogue' (the no-automatic-green-ticks rule).
//
// Pure data + pure helpers. No React, no DOM.

import { type BuildingSide } from './designSet.js';
import {
  type ConnectionKind,
  type ConnectionVariant,
  allowedKinds,
} from './frames.js';

/** Plain-English dropdown group label per kind. */
export const KIND_LABELS: Record<ConnectionKind, string> = {
  'post-footing': 'Post to footing',
  'corner-post': 'Corner post',
  'rafter-ledger': 'Rafter to ledger',
  'ledger': 'Ledger to dwelling',
  'socket-joint': 'Socket joint',
  'fascia-penetration': 'Through-fascia',
  'custom': 'Custom',
};

/**
 * Which lib generator draws each kind (null = no parametric generator yet — the entry
 * must carry its own `svg`, or the kind is drawn by the consuming app).
 */
export const KIND_GENERATORS: Record<ConnectionKind, string | null> = {
  'post-footing': null, // standard footing detail — generator wanted (see docs/references/)
  'corner-post': 'generateCornerPostSVG',
  'rafter-ledger': 'generateRafterLedgerSVG',
  'ledger': 'generateLedgerConnectionSVG',
  'socket-joint': 'generateSocketJointSVG',
  'fascia-penetration': 'generateFasciaPenetrationSVG',
  'custom': null,
};

/**
 * The standard catalogue — every entry `owner: 'catalogue'`, version 1. Params mirror the
 * generator inputs (section choices come from SECTION_CATALOG at placement time; the
 * params here are the connection-specific knobs).
 *
 * NOTE: cross bracing (generateCrossBracingSVG) is deliberately NOT here — bracing is a
 * bay-level system, not a frame-END connection; it belongs to a future bracing contract.
 */
export const CONNECTION_CATALOG: readonly ConnectionVariant[] = [
  {
    id: 'cat_corner_post',
    version: 1,
    kind: 'corner-post',
    name: 'Corner post · ledger connection',
    owner: 'catalogue',
    params: {}, // sections (ledger, post) chosen at placement from SECTION_CATALOG
    verification: { status: 'catalogue', note: 'Standard detail — generateCornerPostSVG' },
  },
  {
    id: 'cat_rafter_ledger',
    version: 1,
    kind: 'rafter-ledger',
    name: 'Rafter → ledger connection',
    owner: 'catalogue',
    params: {}, // sections (rafter, ledger) chosen at placement
    verification: { status: 'catalogue', note: 'Standard detail — generateRafterLedgerSVG' },
  },
  {
    id: 'cat_ledger_dwelling',
    version: 1,
    kind: 'ledger',
    name: 'Ledger fixed to dwelling',
    owner: 'catalogue',
    params: { standoffMm: 0 }, // + ledger section/form at placement
    verification: { status: 'catalogue', note: 'Standard detail — generateLedgerConnectionSVG' },
  },
  {
    id: 'cat_socket_joint',
    version: 1,
    kind: 'socket-joint',
    name: 'Socket joint into masonry',
    owner: 'catalogue',
    params: { rafterSize: 'C250×65×2.4' },
    verification: { status: 'catalogue', note: 'Standard detail — generateSocketJointSVG' },
  },
  {
    id: 'cat_fascia_penetration',
    version: 1,
    kind: 'fascia-penetration',
    name: 'Through-fascia attachment',
    owner: 'catalogue',
    params: {},
    verification: { status: 'catalogue', note: 'Standard detail — generateFasciaPenetrationSVG' },
  },
  {
    id: 'cat_post_footing',
    version: 1,
    kind: 'post-footing',
    name: 'Post on concrete footing',
    owner: 'catalogue',
    params: {}, // footing size/embedment per engineering at placement
    verification: {
      status: 'catalogue',
      note: 'Baseline freestanding option — parametric footing generator wanted',
    },
  },
];

/**
 * Build the dropdown for one frame end: catalogue entries valid on this side, plus the
 * caller's user variants (already filtered to the same rules), newest version of each id
 * only. This is THE function the portfolio UI calls per frame end.
 */
export function connectionOptionsForSide(
  side: BuildingSide,
  attachedSides: readonly BuildingSide[] | undefined,
  userVariants: readonly ConnectionVariant[] = [],
): ConnectionVariant[] {
  const kinds = new Set(allowedKinds(side, attachedSides));
  const latest = new Map<string, ConnectionVariant>();
  for (const v of [...CONNECTION_CATALOG, ...userVariants]) {
    if (!kinds.has(v.kind)) continue;
    const seen = latest.get(v.id);
    if (!seen || v.version > seen.version) latest.set(v.id, v);
  }
  return [...latest.values()];
}

/** Case-insensitive search over the catalogue + user variants (name + kind label). */
export function searchConnections(
  query: string,
  userVariants: readonly ConnectionVariant[] = [],
): ConnectionVariant[] {
  const q = query.trim().toLowerCase();
  const pool = [...CONNECTION_CATALOG, ...userVariants];
  if (!q) return pool;
  return pool.filter(v =>
    v.name.toLowerCase().includes(q)
    || v.kind.includes(q)
    || KIND_LABELS[v.kind].toLowerCase().includes(q),
  );
}
