// ── DraftlyProject — the one object the whole product passes around ──
//
// The customer never sees four apps; they see ONE project that moves through five
// plain steps (what & where → what's allowed → draw it → we checked it → council pack).
// This file is the single shared shape of that project, so each engine reads and writes
// it the same way:
//
//   • Intelligence (the "front desk") creates the project, owns `site`, `planning`,
//     `building` (siting), and `submission`.
//   • Drafting (the "drawing table") owns `drawing` and the on-canvas member metadata.
//   • Engineering (the "is-it-strong-enough?" check) owns `structural` (a DesignSet).
//   • The Drawings lib is the glue — the shared parts catalogue + these contracts.
//
// Two principles are baked in:
//   1. PROVENANCE — every planning fact records where it came from. Facts that can't be
//      verified against an official source are OMITTED, never guessed (the data-integrity
//      rule). The `ledger` is an append-only record of who decided what, when, and against
//      which rule version — the evidentiary trail a certification product needs.
//   2. COMPOSITION — this envelope reuses the existing contracts (DesignSet, the shared
//      terms vocabulary, TitleBlockData) rather than redefining them, so there is one
//      source of truth per concept.
//
// Pure data + small pure helpers. No React, no DOM.

import type { DesignSet, BuildingSide } from './designSet.js';
import type { PortalFrame } from './frames.js';
import type { StructureType, RoofType, Attachment, BuildingType } from './terms.js';
import type { TitleBlockData } from './titleBlock.js';

export const PROJECT_FORMAT = 'draftly-project';
export const PROJECT_SCHEMA_VERSION = 1;

/** Which engine is writing. */
export type DraftlyApp = 'intelligence' | 'drafting' | 'engineering';

/** Australian states / territories. */
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

/** The determined approval route. Mirrors Intelligence's pathway engine. */
export type ApprovalPathway = 'exempt' | 'complying' | 'da' | 'building-permit' | 'unknown';

// ───────────────────────────── Provenance & ledger ─────────────────────────────

/** Where a value came from — the spine of the data-integrity rule. */
export interface Provenance {
  /** government = official spatial/planning API; domain = Domain API; user = entered/confirmed
   *  by the person; derived = computed from other verified values; ai-extracted = pulled from an
   *  uploaded document by AI (never a planning FACT — extraction only). */
  source: 'government' | 'domain' | 'user' | 'derived' | 'ai-extracted';
  /** Human label, e.g. 'VicPlan', 'NSW ePlanning', 'Domain API', 'theLIST'. */
  sourceName?: string;
  sourceUrl?: string;
  /** ISO timestamp this fact was fetched/confirmed — lets the UI flag stale data. */
  verifiedAt?: string;
}

/** A value paired with where it came from. Use for any fact that carries weight. */
export interface Sourced<T> {
  value: T;
  provenance: Provenance;
}

/** One append-only entry in the project's audit trail. */
export interface LedgerEntry {
  /** ISO timestamp. */
  at: string;
  app: DraftlyApp;
  appVersion?: string;
  /** Dotted action, e.g. 'planning.verified' | 'pathway.determined' | 'drawing.saved'
   *  | 'structural.checked' | 'submission.generated'. */
  action: string;
  /** For determinations: which rule table/version produced the result (so a past decision
   *  can be reproduced even after the rules change). */
  ruleVersion?: string;
  note?: string;
}

// ───────────────────────────── Site ─────────────────────────────

/** Verified location of the property. */
export interface SiteContext {
  /** What the user typed. */
  rawInput?: string;
  /** The geocoded, canonical address. */
  canonicalAddress?: string;
  state?: AustralianState;
  suburb?: string;
  postcode?: string;
  /** WGS84 centroid of the parcel/point. */
  location?: { lat: number; lng: number };
  /** Cadastre parcel polygon (lat/lng ring), if resolved. */
  parcel?: Array<{ lat: number; lng: number }>;
  /** Index of the parcel edge that faces the street + the street name. */
  frontEdgeIndex?: number;
  streetName?: string;
  /** Lot dimensions/area when known (m / m²). */
  lotWidthM?: number;
  lotDepthM?: number;
  lotAreaM2?: number;
}

// ───────────────────────────── Planning ─────────────────────────────

/** A mapped planning control affecting the site (overlay, hazard, easement…). */
export interface PlanningOverlay {
  /** e.g. 'Heritage Overlay', 'Bushfire Prone Land', 'Flood'. */
  kind: string;
  label?: string;
  provenance: Provenance;
}

/** One pass/fail check behind a pathway determination. */
export interface PathwayCheck {
  label: string;
  pass: boolean;
}

/** The approval-pathway determination — Intelligence's rules engine output. */
export interface PathwayResult {
  pathway: ApprovalPathway;
  label: string;
  /** Whether the VIC VicSmart fast-track applies. */
  vicsmart?: boolean;
  checks: PathwayCheck[];
  caveats: string[];
  /** When it was decided + which rule version, for reproducibility. */
  decidedAt?: string;
  ruleVersion?: string;
}

/**
 * Everything Intelligence verified about whether/how the project can be approved.
 * Planning FACTS (zone, overlays) are Sourced and government-only; anything unverified
 * is left undefined rather than guessed.
 */
export interface PlanningContext {
  council?: Sourced<string>;
  zone?: Sourced<string>;
  zoneName?: string;
  /** True only when the overlay set for this state is exhaustive (see Intelligence's
   *  per-state `overlaysComplete`). False ⇒ some overlays are not machine-checked. */
  overlaysComplete?: boolean;
  overlays?: PlanningOverlay[];
  /** Registered easements crossing the parcel. */
  easements?: PlanningOverlay[];
  /** Council/zone maximum building height (m), with its source. */
  maxHeightM?: Sourced<number>;
  /** The determined approval pathway. */
  pathway?: PathwayResult;
}

// ───────────────────────────── Building (siting) ─────────────────────────────

/**
 * Where the building sits on the earth — the TOP of the anchor chain:
 *
 *   GPS + north bearing  →  building origin  →  grid (frame positions)  →  frame  →  connection detail
 *
 * Details never hang off GPS directly: the building anchors to the block ONCE, frames
 * anchor to the building (positionMm along the ridge), connections anchor to frame ends.
 * Nudge the block position and everything follows cleanly; nothing churns.
 */
export interface BuildingAnchor {
  /** WGS84 position of the building origin corner. */
  lat: number;
  lng: number;
  /** True-north bearing (degrees) of the building's ridge axis from the origin. */
  bearingDeg: number;
}

/**
 * The product-level description of what's being built — produced by Intelligence's siting
 * step and consumed by Drafting/Engineering. The full engineering elaboration (pitch, portal
 * frames, member sizing) lives in `structural` (a DesignSet); this is the plain-language layer.
 */
export interface BuildingContext {
  buildingType?: BuildingType;
  structureType?: StructureType;
  roofType?: RoofType;
  attachment?: Attachment;
  /** Which faces attach to the existing dwelling. */
  attachedSides?: BuildingSide[];
  /** Footprint (m). */
  widthM?: number;
  depthM?: number;
  /** Overall height to ridge/highest point (m). */
  heightM?: number;
  /** Wall/gutter height (m) — used by some state rules (e.g. WA R-Codes). */
  wallHeightM?: number;
  /** Setback to each boundary (m); 0 = on the boundary. */
  setbacksM?: { front?: number; rear?: number; left?: number; right?: number };
  /** Indicative build-cost estimate (AUD) from the Step-1 pre-check. */
  estimatedCostAud?: number;
  /** Where the building sits on the block — the root of the anchor chain. */
  anchor?: BuildingAnchor;
  /**
   * The explicit portal-frame list (grid positions + per-end connection choices).
   * See frames.ts. Absent ⇒ legacy: frames derived from DesignGeometry.portalFrameCount
   * via defaultFrames().
   */
  frames?: PortalFrame[];
}

// ───────────────────────────── Drawing ─────────────────────────────

/** A reference to the Drafting drawing for this project. */
export interface DrawingRef {
  /** 'embed' = the .draftly document travels inside this project (self-contained, bigger);
   *  'link' = only a locator is stored (small, but breakable). */
  mode: 'embed' | 'link';
  /** Embedded .draftly document (schema-versioned drawing JSON). Present when mode === 'embed'. */
  document?: unknown;
  /** Locator when mode === 'link'. */
  uri?: string;
  /** Title-block data for the active sheet, so sign-off fields survive open/save. */
  titleBlock?: TitleBlockData;
  updatedAt?: string;
}

// ───────────────────────────── Submission ─────────────────────────────

/** Status of one required document in the council pack. */
export interface SubmissionDocStatus {
  id: string;
  label: string;
  required: boolean;
  attached: boolean;
}

/** Where the project sits in assembling the council submission pack. */
export interface SubmissionState {
  /** Lodgement route, e.g. 'NSW Planning Portal', 'VIC SPEAR', 'building-permit'. */
  lodgementMode?: string;
  documents?: SubmissionDocStatus[];
  /** Outstanding required items not yet satisfied. */
  outstanding?: string[];
  /** True once a bundle has been generated. */
  bundleGenerated?: boolean;
  generatedAt?: string;
}

// ───────────────────────────── The envelope ─────────────────────────────

/** The single object every Draftly engine reads and writes. */
export interface DraftlyProject {
  format: typeof PROJECT_FORMAT;
  schemaVersion: number;
  /** Stable id; survives across apps and saves. */
  id: string;
  /** Display name, e.g. 'Deck at 12 Smith St'. */
  name?: string;
  createdAt: string;
  updatedAt: string;
  /** Which app last wrote the project. */
  lastWrittenBy: DraftlyApp;

  site: SiteContext;
  planning: PlanningContext;
  building: BuildingContext;
  drawing?: DrawingRef;
  /** Engineering's structural design (the existing Eng ⇄ Drafting contract). */
  structural?: DesignSet;
  submission?: SubmissionState;

  /** Append-only audit trail. */
  ledger: LedgerEntry[];
}

// ───────────────────────────── Pure helpers ─────────────────────────────

let _counter = 0;
/** A non-cryptographic but collision-resistant id for a new project. */
function genId(): string {
  _counter = (_counter + 1) % 0x10000;
  return `prj_${Date.now().toString(36)}_${_counter.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Create a fresh, empty project. Intelligence calls this when a user starts. */
export function createProject(init: { name?: string; app?: DraftlyApp; appVersion?: string } = {}): DraftlyProject {
  const now = new Date().toISOString();
  const app: DraftlyApp = init.app ?? 'intelligence';
  return {
    format: PROJECT_FORMAT,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: genId(),
    name: init.name,
    createdAt: now,
    updatedAt: now,
    lastWrittenBy: app,
    site: {},
    planning: {},
    building: {},
    ledger: [{ at: now, app, appVersion: init.appVersion, action: 'project.created' }],
  };
}

/**
 * Record a step in the audit trail and stamp the project as freshly written. Returns a NEW
 * project object (does not mutate the input) so callers can keep immutable state cleanly.
 */
export function recordStep(
  project: DraftlyProject,
  entry: Omit<LedgerEntry, 'at'> & { at?: string },
): DraftlyProject {
  const at = entry.at ?? new Date().toISOString();
  return {
    ...project,
    updatedAt: at,
    lastWrittenBy: entry.app,
    ledger: [...project.ledger, { ...entry, at }],
  };
}

/** Type guard — is this parsed JSON a DraftlyProject we understand? */
export function isDraftlyProject(x: unknown): x is DraftlyProject {
  return !!x && typeof x === 'object'
    && (x as DraftlyProject).format === PROJECT_FORMAT
    && typeof (x as DraftlyProject).id === 'string'
    && Array.isArray((x as DraftlyProject).ledger);
}
