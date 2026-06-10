// @draftly/drawings — shared, framework-agnostic SVG drawing generators.
//
// Every generator is a pure function that takes plain params and returns an
// SVG **string**. No React, no DOM in this entry. The DOM-dependent PDF
// exporter lives in a separate entry: `@draftly/drawings/pdf`.

// ── Types ──
export type { Section, MemberForm, SectionDB } from './types.js';

// ── Section catalog (single source of standard sizes + properties) ──
export {
  CSECTION_SECTIONS,
  STEEL_SECTIONS,
  TIMBER_SECTIONS,
  ALUMINIUM_SECTIONS,
  getSectionDB,
  SECTION_CATALOG,
  searchSections,
  type SectionMaterial,
  type SectionCatalogEntry,
} from './sections.js';

// ── Shared frame + title block ──
export {
  type DrawingInfo,
  generateDrawingFrame,
  getWorkingArea,
} from './drawingFrame.js';
export {
  type TitleBlockData,
  DEFAULT_TITLE_BLOCK,
  TITLE_BLOCK_H,
  renderTitleBlock,
} from './titleBlock.js';

// ── Shared drawing sheet (paper-size aware; renders in both apps) ──
export {
  type PaperSize,
  type SheetOptions,
  SHEET_MM,
  SHEET_BORDER,
  sheetPx,
  getSheetWorkingArea,
  generateSheetTemplate,
  placeOnSheet,
  withTitleBlock,
} from './sheet.js';

// ── DesignSet — the Engineering ⇄ Drafting handover contract ──
export {
  type DesignSet,
  type DesignSetInput,
  type DesignMember,
  type MemberCheck,
  type DesignGeometry,
  type DesignResults,
  type DesignDrainage,
  type DesignDownpipe,
  type DesignLoads,
  type DesignSchedule,
  type ScheduleLine,
  type DesignStatus,
  DESIGNSET_FORMAT,
  DESIGNSET_SCHEMA_VERSION,
  DesignSetParseError,
  computeDesignStatus,
  makeDesignSet,
  serializeDesignSet,
  validateDesignSet,
  parseDesignSet,
} from './designSet.js';

// ── Plan + roof geometry ──
export {
  generateRoofGeometrySVG,
  generateBuildingPlanSVG,
} from './planDrawings.js';

// ── Sections + elevations ──
export { generateWallSectionSVG, type WallSectionHeights } from './wallSection.js';
export { generateFullElevationSVG } from './fullElevation.js';
export { generateSideElevationSVG } from './sideElevation.js';

// ── Site plan ──
export {
  type LatLng,
  type SitePlanData,
  generateSitePlanSVG,
} from './sitePlan.js';

// ── Stormwater drainage sheet ──
export {
  generateDrainageSheetSVG,
  requiredFlowLs,
} from './drainage.js';

// ── Member preview + gable infill ──
export {
  generateThreeViewSVG,
  generateGableInfillSVG,
  parseSectionDims,
  type ParsedDims,
} from './drawings.js';

// ── Connection details ──
export {
  generateCornerPostSVG,
  generateRafterLedgerSVG,
  generateCrossBracingSVG,
  generateLedgerConnectionSVG,
} from './connectionDrawings.js';
export {
  generateSocketJointSVG,
  generateFasciaPenetrationSVG,
} from './socketJointDrawing.js';

// ── Parametric detail controls ──
export {
  type DrawingParams,
  type ParamMeta,
  DRAWING_PARAM_META,
  getDefaultDrawingParams,
  getParamsForDrawing,
  groupParamsByCategory,
} from './drawingParams.js';

// ── Single editable member profile (for Drafting blocks) ──
export { generateMemberProfile } from './memberProfile.js';
export type { MemberView, MemberProfileOptions } from './memberProfile.js';

// ── Shared terminology key (one vocabulary across Intelligence / Engineering / Drafting) ──
export {
  type StructureType, type RoofType, type Attachment, type FrameType, type MemberRole,
  type TermCategory, type GlossaryTerm,
  type BuildingType, type FrameMaterial, type CatalogueClass,
  BUILDING_TYPE_LABEL, ROOF_TYPE_LABEL, FRAME_MATERIAL_LABEL, classLabel,
  GLOSSARY, canonicalTerm, glossaryByCategory, termsForRoofType,
} from './terms.js';
