# @draftly/drawings

Shared, **framework-agnostic** SVG drawing generators for the Draftly apps —
**Draftly-Engineering** (parametric generation) and **Draftly-Drafting** (vector
editor). One source of truth so title blocks, scale, dimensioning, and detail
geometry never diverge between the two surfaces.

> Background and rationale: see the *Shared Drawing Library* spec in
> `Draftly-Engineering/docs/shared-drawing-library.md`.

## Design rules

- Every generator is a **pure function**: plain params in, an SVG **string** out.
- **No React, no DOM** in the core entry (`@draftly/drawings`) — it stays
  tree-shakeable and runnable anywhere (browser, worker, Node).
- The only DOM-dependent piece, the PDF exporter, lives in a **separate entry**
  (`@draftly/drawings/pdf`) so it never pulls the DOM into the core.

## Install

This is a private package. Consume it from the monorepo workspace, or via a
`file:`/git dependency until the workspace lands:

```jsonc
// package.json
"dependencies": {
  "@draftly/drawings": "file:../Draftly-Drawings"
}
```

`jspdf` and `svg2pdf.js` are **optional peer dependencies** — only needed if you
import the `/pdf` entry.

## Build

```bash
npm install
npm run build      # emits dist/ (JS + .d.ts)
npm run typecheck  # type-only check, no emit
```

## Versioning & releases

Consumers pin an **immutable git tag** (e.g.
`github:gavinadams80-ui/Draftly-Drawings#v0.3.0`) — nothing consumes `main`.
The full publish + consume recipe and the semver policy live in
[`RELEASING.md`](./RELEASING.md); per-version changes are in
[`CHANGELOG.md`](./CHANGELOG.md).

## Usage

```ts
import {
  withTitleBlock,
  generateBuildingPlanSVG,
  generateWallSectionSVG,
  generateFullElevationSVG,
  generateCornerPostSVG,
} from '@draftly/drawings';

const sheet = withTitleBlock(generateBuildingPlanSVG(/* params */), {
  title: 'Building Plan',
  number: 'DRF-000-PLAN-01',
});

// PDF export (DOM-only, separate entry)
import { exportSheetsToPDF } from '@draftly/drawings/pdf';
await exportSheetsToPDF([{ title: 'Plan', number: 'DRF-000', svg: sheet }], 'submission.pdf');
```

## Modules

| Module | Generators |
|---|---|
| `drawingFrame` | `generateDrawingFrame`, `getWorkingArea`, `DrawingInfo` |
| `titleBlock` | `withTitleBlock`, `DEFAULT_TITLE_BLOCK`, `TitleBlockData` |
| `planDrawings` | `generateBuildingPlanSVG`, `generateRoofGeometrySVG` |
| `wallSection` | `generateWallSectionSVG` |
| `fullElevation` | `generateFullElevationSVG` |
| `sideElevation` | `generateSideElevationSVG` |
| `sitePlan` | `generateSitePlanSVG`, `SitePlanData`, `LatLng` |
| `drawings` | `generateThreeViewSVG`, `generateGableInfillSVG` |
| `connectionDrawings` | `generateCornerPostSVG`, `generateRafterLedgerSVG`, `generateCrossBracingSVG`, `generateLedgerConnectionSVG` |
| `socketJointDrawing` | `generateSocketJointSVG`, `generateFasciaPenetrationSVG` |
| `drawingParams` | `getDefaultDrawingParams`, `DRAWING_PARAM_META`, `getParamsForDrawing`, `groupParamsByCategory` |
| `pdf` (separate entry) | `exportSheetsToPDF`, `ExportSheet` |

## Standards

Drawings follow **AS1100.101 / AS1100.301** technical-drawing conventions
(title blocks, dimensioning, section marks), consistent with the Draftly
engineering output.
