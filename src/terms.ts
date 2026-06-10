// ── Shared terminology key ──
// ONE vocabulary of industry-standard terms that lives in the shared library so
// Intelligence, Engineering and Drafting all speak the same language and the
// naming can't drift. Canonical names + accepted aliases + plain definitions.
//
// Canonical terms confirmed with the user (2026-06-10):
//   • span    — NOT "width" (brick-to-brick across the gable).
//   • pitch   — single name (pitchAngle / pitchDeg are aliases).
//   • standoff — gap between the new structure and the existing BRICK WALL face.
//   • offset   — between TWO walls, the difference between their face positions
//                (a DIFFERENT thing from standoff — both are kept).
//   • gable chord = bottom chord (synonyms — the gable-end tie member).
//   • apex = the highest POINT; ridge = the LINE that runs along the apex.

import type { SectionMaterial } from './sections.js';

// ── Canonical enumerations (use these unions everywhere) ──
export type StructureType = 'carport' | 'patio' | 'pergola' | 'verandah';
// Roof forms to design across all materials. gable/skillion/hip are the core
// set; flat/dutch-gable/pyramid/curved/flyover are the broader pergola/patio
// shapes (proposed — confirm terminology).
export type RoofType =
  | 'gable' | 'skillion' | 'hip' | 'flat'
  | 'dutch-gable' | 'pyramid' | 'curved' | 'flyover';
export type Attachment = 'freestanding' | 'attached' | 'three-side';
/** Portal-frame position along the depth (drives the section variant: A-A/B-B/C-C). */
export type FrameType = 'back' | 'intermediate' | 'front';
/** Structural member role. `column` and `post` are synonyms; `gableChord`/`bottomChord` too. */
export type MemberRole =
  | 'rafter' | 'purlin' | 'post' | 'column' | 'ledger' | 'beam'
  | 'bottomChord' | 'gableChord' | 'gableDropper' | 'brace' | 'knee';

// ── Catalogue taxonomy — every catalogue block classifies by THREE dimensions ──
//   1. Building type    (what it is)        → StructureType
//   2. Roof design type (its roof shape)    → RoofType
//   3. Frame material   (what it's made of) → FrameMaterial (= the section catalogue's material)
export type BuildingType = StructureType;
export type FrameMaterial = SectionMaterial;   // 'steel' | 'cold-formed' | 'timber' | 'aluminium'

export const BUILDING_TYPE_LABEL: Record<BuildingType, string> = {
  pergola: 'Pergola', carport: 'Carport', patio: 'Patio', verandah: 'Verandah',
};
export const ROOF_TYPE_LABEL: Record<RoofType, string> = {
  gable: 'Pitched Gable', skillion: 'Skillion (Mono-pitch)', hip: 'Hip', flat: 'Flat',
  'dutch-gable': 'Dutch Gable', pyramid: 'Pyramid', curved: 'Curved (Bullnose)', flyover: 'Flyover',
};
export const FRAME_MATERIAL_LABEL: Record<FrameMaterial, string> = {
  'cold-formed': 'Metal — Light',     // light-gauge / cold-formed steel (AS/NZS 4600)
  steel: 'Metal — Structural',        // hot-rolled structural steel (AS 4100)
  timber: 'Wood',                     // timber (AS 1720)
  aluminium: 'Aluminium',
};

/** The classification key for a catalogue block / design idea. */
export interface CatalogueClass {
  buildingType: BuildingType;
  roofType: RoofType;
  frameMaterial: FrameMaterial;
}

/** Human-readable taxonomy path, e.g. "Pergola › Pitched Gable › Metal — Light". */
export function classLabel(c: CatalogueClass): string {
  return `${BUILDING_TYPE_LABEL[c.buildingType]} › ${ROOF_TYPE_LABEL[c.roofType]} › ${FRAME_MATERIAL_LABEL[c.frameMaterial]}`;
}

export type TermCategory =
  | 'Structure form' | 'Roof form' | 'Geometry' | 'Member' | 'Set-out height'
  | 'Wall build-up' | 'Connection' | 'Roof / cladding' | 'Drainage';

export interface GlossaryTerm {
  /** Canonical, industry-standard name. */
  term: string;
  category: TermCategory;
  /** Plain-language definition. */
  definition: string;
  /** Other names seen in code or accepted as synonyms. */
  aliases?: string[];
  /** Code field/key this maps to in the DesignSet / DrawingParams, where applicable. */
  field?: string;
  /** Roof type(s) this term is specific to (omitted = applies across all forms). */
  roofTypes?: RoofType[];
  unit?: string;
}

// ── The glossary (single source of the shared key) ──
export const GLOSSARY: GlossaryTerm[] = [
  // Structure form
  { term: 'structure type', category: 'Structure form', field: 'structureType',
    definition: 'The kind of structure: carport / patio / pergola / verandah.' },
  { term: 'roof type', category: 'Structure form', field: 'roofType',
    definition: 'Gable (two-sided, apex) / skillion (mono-pitch) / hip.' },
  { term: 'attachment', category: 'Structure form', field: 'attachment',
    definition: 'How it ties to the dwelling: freestanding / attached / three-side.' },
  { term: 'frame type', category: 'Structure form', field: 'frameType',
    definition: 'Portal-frame position along the depth — back / intermediate / front (sections A-A / B-B / C-C).' },

  // Roof form (the shapes to design across all materials)
  { term: 'gable roof', category: 'Roof form', roofTypes: ['gable'],
    definition: 'Pitched both sides to a central ridge; triangular gable ends.' },
  { term: 'skillion roof', category: 'Roof form', roofTypes: ['skillion'], aliases: ['mono-pitch', 'lean-to'],
    definition: 'Single mono-pitch plane falling from a high eave to a low eave.' },
  { term: 'hip roof', category: 'Roof form', roofTypes: ['hip'],
    definition: 'Slopes down on all sides to the eaves; no gable end.' },
  { term: 'flat roof', category: 'Roof form', roofTypes: ['flat'],
    definition: 'Near-level single plane with a slight fall for drainage.' },
  { term: 'dutch gable', category: 'Roof form', roofTypes: ['dutch-gable'], aliases: ['gablet'],
    definition: 'A hip roof with a small gable (gablet) at the apex.' },
  { term: 'pyramid roof', category: 'Roof form', roofTypes: ['pyramid'], aliases: ['pyramid hip'],
    definition: 'Four hips rising to a central apex point (square / near-square plan).' },
  { term: 'curved roof', category: 'Roof form', roofTypes: ['curved'], aliases: ['bullnose'],
    definition: 'Convex curved roof sheet (e.g. bullnose verandah).' },
  { term: 'flyover roof', category: 'Roof form', roofTypes: ['flyover'], aliases: ['raised', 'raised patio', 'flyover patio'],
    definition: 'Roof raised on posts to pass OVER the existing dwelling eave/fascia.' },

  // Geometry
  { term: 'span', category: 'Geometry', field: 'width', aliases: ['width'], unit: 'mm',
    definition: 'Brick-to-brick dimension across the gable (the gable width).' },
  { term: 'depth', category: 'Geometry', field: 'depth', unit: 'mm',
    definition: 'Front-to-back dimension (house wall to front).' },
  { term: 'height', category: 'Geometry', field: 'height', unit: 'mm',
    definition: 'Overall / wall height reference.' },
  { term: 'pitch', category: 'Geometry', field: 'pitch', aliases: ['pitchAngle', 'pitchDeg'], unit: 'degrees',
    definition: 'Roof slope angle.' },
  { term: 'bay', category: 'Geometry', field: 'bayWidth', unit: 'mm',
    definition: 'Spacing between adjacent portal frames (centre-to-centre).' },
  { term: 'portal frame count', category: 'Geometry', field: 'portalFrameCount', unit: 'no.',
    definition: 'Number of portal frames along the depth.' },
  { term: 'standoff', category: 'Geometry', field: 'standoff', unit: 'mm',
    definition: 'Gap between the new structure and the existing BRICK WALL face.' },
  { term: 'offset', category: 'Geometry', field: 'setbacks', aliases: ['setback', 'rightOffsetMm', 'leftOffsetMm', 'backOffsetMm'], unit: 'mm',
    definition: 'Between two walls — the difference between their face positions (e.g. a side wall stopping short of the front). DISTINCT from standoff.' },
  { term: 'north rotation', category: 'Geometry', field: 'northRotation', unit: 'degrees',
    definition: 'Clockwise rotation of true north relative to the plan (0 = north up).' },
  { term: 'fall', category: 'Geometry', roofTypes: ['skillion', 'flat'], unit: 'mm/m',
    definition: 'Drainage gradient of a skillion or flat roof.' },
  { term: 'spring point', category: 'Geometry', roofTypes: ['curved'], aliases: ['spring line'],
    definition: 'Where a curved (bullnose) roof begins to curve from the straight.' },

  // Members
  { term: 'rafter', category: 'Member', definition: 'Sloping roof member from eave to apex.' },
  { term: 'purlin', category: 'Member', definition: 'Member spanning between frames, carrying the roof sheeting.' },
  { term: 'post', category: 'Member', aliases: ['column'], definition: 'Vertical support member (a.k.a. column).' },
  { term: 'ledger', category: 'Member', definition: 'Horizontal member fixed to the existing wall that the structure bears on.' },
  { term: 'beam', category: 'Member', definition: 'Primary horizontal spanning member.' },
  { term: 'gable chord', category: 'Member', aliases: ['bottomChord', 'bottom chord'],
    definition: 'The tie across the bottom of a gable-end frame (gable chord = bottom chord).' },
  { term: 'gable dropper', category: 'Member', definition: 'Short vertical infill member in the gable end.' },
  { term: 'brace', category: 'Member', definition: 'Diagonal member resisting lateral / racking loads.' },
  { term: 'knee', category: 'Member', definition: 'The braced joint / knee brace at the rafter-to-post corner of a portal frame.' },
  { term: 'apex', category: 'Member', definition: 'The highest POINT of the roof.' },
  { term: 'ridge', category: 'Member', definition: 'The LINE that runs along the apex (ridge line / ridge beam).' },
  // Roof framing — roof-type-specific where noted
  { term: 'hip rafter', category: 'Member', roofTypes: ['hip', 'pyramid', 'dutch-gable'],
    definition: 'Rafter running up the external corner (hip) of the roof.' },
  { term: 'jack rafter', category: 'Member', roofTypes: ['hip', 'pyramid', 'dutch-gable'],
    definition: 'Short rafter from the eave to a hip or valley.' },
  { term: 'valley', category: 'Member', roofTypes: ['hip', 'dutch-gable'],
    definition: 'Internal angle where two roof planes meet (collects water).' },
  { term: 'king post', category: 'Member', roofTypes: ['pyramid', 'hip'],
    definition: 'Central vertical post the hip rafters meet at the apex.' },
  { term: 'barge', category: 'Member', roofTypes: ['gable', 'dutch-gable'], aliases: ['barge board'],
    definition: 'Trim board along the sloping gable edge of the roof.' },
  { term: 'gable end', category: 'Member', roofTypes: ['gable', 'dutch-gable'],
    definition: 'The triangular wall/frame at the end of a gable roof.' },
  { term: 'gable infill', category: 'Member', roofTypes: ['gable', 'dutch-gable'],
    definition: 'Cladding/framing filling the gable-end triangle.' },
  { term: 'batten', category: 'Member', aliases: ['top hat', 'roof batten'],
    definition: 'Member over the rafters/purlins that sheeting or slats fix to.' },
  { term: 'flyover beam', category: 'Member', roofTypes: ['flyover'],
    definition: 'The beam carrying a flyover roof clear over the existing eave.' },
  { term: 'cantilever', category: 'Member',
    definition: 'A member projecting beyond its support (e.g. a flyover or overhang).' },
  { term: 'footing', category: 'Member', aliases: ['pad footing', 'concrete footing'],
    definition: 'Concrete foundation a post bears on.' },
  { term: 'slat', category: 'Member', aliases: ['louvre', 'louver', 'batten infill'],
    definition: 'Spaced top member giving shade on an open pergola roof (fixed slat or adjustable louvre — both terms accepted).' },

  // Set-out heights (mm above FFL = finished floor level)
  { term: 'finished floor level', category: 'Set-out height', aliases: ['FFL'],
    definition: 'The datum (0) all set-out heights are measured up from.' },
  { term: 'eave height', category: 'Set-out height', field: 'eaveHeight', unit: 'mm',
    definition: 'Top of wall / where the rafter bears.' },
  { term: 'gutter height', category: 'Set-out height', field: 'gutterHeight', unit: 'mm',
    definition: 'Top of gutter / eave line.' },
  { term: 'fascia height', category: 'Set-out height', field: 'fasciaHeight', unit: 'mm',
    definition: 'Bottom of the fascia board.' },
  { term: 'ridge height', category: 'Set-out height', field: 'ridgeHeight', unit: 'mm',
    definition: 'Height of the apex / ridge line (highest point).' },
  { term: 'existing-gutter overhang', category: 'Set-out height', field: 'existingGutterOverhangMm', unit: 'mm',
    definition: 'How far the EXISTING dwelling gutter overhangs its wall face (sets the clearance to the new structure).' },
  { term: 'high eave', category: 'Set-out height', roofTypes: ['skillion', 'flyover'], unit: 'mm',
    definition: 'The raised (high) eave of a skillion / flyover roof.' },
  { term: 'low eave', category: 'Set-out height', roofTypes: ['skillion'], unit: 'mm',
    definition: 'The lower eave a skillion roof falls to (gutter side).' },

  // Wall build-up (the existing dwelling)
  { term: 'brick veneer', category: 'Wall build-up', field: 'brickThickness', unit: 'mm',
    definition: 'Outer brick skin of the existing dwelling.' },
  { term: 'cavity', category: 'Wall build-up', field: 'cavityWidth', unit: 'mm',
    definition: 'Air gap between the brick veneer and the timber frame.' },
  { term: 'timber stud', category: 'Wall build-up', field: 'studSize',
    definition: 'Vertical member of the timber wall frame.' },
  { term: 'fascia', category: 'Wall build-up', field: 'fasciaThickness',
    definition: 'Board on the eave face that the gutter fixes to.' },
  { term: 'gutter', category: 'Wall build-up', field: 'gutterType',
    definition: 'Channel collecting roof water at the eave.' },
  { term: 'SHS standoff', category: 'Wall build-up', field: 'shsStandoff',
    definition: 'Square-hollow-section bracket holding the structure off the wall.' },
  { term: 'lag screw', category: 'Wall build-up', field: 'lagScrewSize',
    definition: 'Coach/lag screw fixing the structure or ledger to the wall.' },
  { term: 'parapet', category: 'Wall build-up', roofTypes: ['flat'],
    definition: 'Low wall extending above a flat roof line.' },

  // Connection details (the detail blocks — DRF-00x)
  { term: 'socket joint', category: 'Connection', field: 'DRF-007', definition: 'Stub-in-rafter socket connection.' },
  { term: 'fascia penetration', category: 'Connection', field: 'DRF-008', definition: 'Where an SHS passes through the fascia.' },
  { term: 'corner post', category: 'Connection', field: 'DRF-003', definition: 'Post + base plate at a free corner.' },
  { term: 'rafter-to-ledger', category: 'Connection', field: 'DRF-004', definition: 'Rafter bearing/fixing onto the wall ledger.' },
  { term: 'cross-bracing', category: 'Connection', field: 'DRF-005', definition: 'Diagonal bracing connection.' },
  { term: 'ledger connection', category: 'Connection', field: 'DRF-006', definition: 'Bracket fixing the ledger to the wall.' },
  { term: 'birdsmouth', category: 'Connection', field: 'birdsmouthDepth', unit: 'mm',
    definition: 'Notch cut in a rafter so it seats on a bearing.' },
  { term: 'base plate', category: 'Connection', field: 'basePlateSize', definition: 'Steel plate at the foot of a post.' },
  { term: 'anchor', category: 'Connection', field: 'anchorSize', definition: 'Bolt fixing a base plate into concrete.' },
  { term: 'bolt', category: 'Connection', field: 'boltSize', definition: 'Structural bolt (e.g. M12).' },
  { term: 'fillet weld', category: 'Connection', field: 'weldSize', unit: 'mm', definition: 'Weld at a member junction.' },
  { term: 'bracket', category: 'Connection', field: 'bracketType', definition: 'Fabricated connector (angle / plate / box).' },
  { term: 'packer', category: 'Connection', field: 'packerSize', definition: 'Shim/spacer plate taking up a gap in a joint.' },
  { term: 'stub', category: 'Connection', field: 'stubShs', definition: 'Short SHS section forming part of a socket joint.' },

  // Roof / cladding
  { term: 'cladding', category: 'Roof / cladding', field: 'cladding', aliases: ['sheeting'],
    definition: 'Roof (or wall) sheeting / covering.' },
  { term: 'ridge flashing', category: 'Roof / cladding', definition: 'Capping over the apex where roof sheets meet.' },
  { term: 'eave flashing', category: 'Roof / cladding', definition: 'Flashing at the eave/gutter line.' },
  { term: 'overhang', category: 'Roof / cladding', definition: 'Roof projection past the supporting line.' },
  { term: 'apron flashing', category: 'Roof / cladding', roofTypes: ['skillion', 'flyover'],
    definition: 'Flashing turning up against the dwelling wall on the high side.' },
  { term: 'upstand', category: 'Roof / cladding', roofTypes: ['skillion', 'flyover'],
    definition: 'Raised steel section the high-side roof flashes up against.' },
  { term: 'bullnose', category: 'Roof / cladding', roofTypes: ['curved'],
    definition: 'The convex curved profile of a bullnose verandah roof.' },
  { term: 'open roof', category: 'Roof / cladding',
    definition: 'Pergola roof of spaced battens/slats — not sheeted.' },
  { term: 'sheeted roof', category: 'Roof / cladding',
    definition: 'Roof fully covered with sheeting (weatherproof).' },
  { term: 'lattice', category: 'Roof / cladding',
    definition: 'Cross-hatched open panel infill (shade / screen).' },

  // Drainage
  { term: 'downpipe', category: 'Drainage', definition: 'Vertical pipe taking gutter water to ground / stormwater.' },
  { term: 'catchment area', category: 'Drainage', field: 'totalCatchmentAreaM2', unit: 'm²',
    definition: 'Roof area draining to the system / a downpipe.' },
  { term: 'design intensity', category: 'Drainage', field: 'designIntensityMmHr', unit: 'mm/hr',
    definition: 'Rainfall intensity for the chosen design storm.' },
  { term: 'AEP', category: 'Drainage', field: 'aepPercent', unit: '%',
    definition: 'Annual Exceedance Probability — the design storm likelihood (e.g. 5% AEP).' },
];

/** Resolve any alias to the canonical glossary term (case-insensitive). */
export function canonicalTerm(name: string): GlossaryTerm | undefined {
  const n = name.trim().toLowerCase();
  return GLOSSARY.find(t =>
    t.term.toLowerCase() === n ||
    (t.aliases ?? []).some(a => a.toLowerCase() === n) ||
    (t.field ?? '').toLowerCase() === n ||
    // Bare RoofType value (e.g. 'gable', 'flyover') resolves to its roof-form
    // entry — those are listed first, so the form wins over member terms.
    (t.category === 'Roof form' && (t.roofTypes ?? []).some(rt => rt === n)),
  );
}

/** Glossary entries grouped by category (for term-list UIs / docs). */
export function glossaryByCategory(): Record<TermCategory, GlossaryTerm[]> {
  const out = {} as Record<TermCategory, GlossaryTerm[]>;
  for (const t of GLOSSARY) (out[t.category] ??= []).push(t);
  return out;
}

/**
 * Terms relevant to a given roof type — the universal terms (no `roofTypes`)
 * plus the ones tagged for that form. Drives the "terms used" design note that
 * rides into model space with a placed pergola block.
 */
export function termsForRoofType(roof: RoofType): GlossaryTerm[] {
  return GLOSSARY.filter(t => !t.roofTypes || t.roofTypes.includes(roof));
}
