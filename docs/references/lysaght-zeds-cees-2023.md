# Evaluation: Lysaght Zeds & Cees User Guide 2023

> Status: evaluated 2026-06-13 (connection library research session). ⛔ Gate 1 OPEN —
> do not ingest until BlueScope grants written permission.

## Identity

- **Name:** Lysaght Zeds & Cees User Guide 2023 (publication LYT0063)
- **URL:** https://www.lysaght.com (technical resources / user guides)
- **What it is:** BlueScope Lysaght's design guide for their Z and C cold-formed purlin/girt
  sections: section properties, load/capacity tables, bridging and connection details, all
  designed to AS/NZS 4600. The authoritative manufacturer source for C-section capacities
  in the AU market. 2023 edition — current.
- **Found by / date:** connection library research session, 2026-06-13

## ⛔ Gate 1 — Licence

- **Licence / terms:** proprietary, free-to-view manufacturer publication. Viewing/design
  use is normal industry practice; embedding the tables in a commercial product is not
  covered by the published terms.
- **Commercial use permitted?** unclear — **written permission from BlueScope required
  before ingest** (blocking action: email Lysaght/BlueScope re commercial embedding).
- **Redistribution permitted?** unclear — same permission request covers it.
- **Attribution required?** assume yes; every ingested entry carries the provenance string
  `"Lysaght Zeds & Cees User Guide 2023 (LYT0063), BlueScope Steel, per AS/NZS 4600"`.

## Gate 2 — Data or code?

- **Form:** structured data — capacity/load tables (published as PDF; tables are
  transcribable into JSON by the one-time translation script).
- **If structured:** section properties and member capacities for Z/C sections per
  AS/NZS 4600, plus bridging/connection detail specifications and fastener requirements.
- **If drawings only:** n/a (detail drawings exist in the guide but the value is the data).

## Gate 3 — Australian alignment

- **Standards basis:** AS/NZS 4600 (cold-formed steel structures). Native AU source.
- **Metric + AU section sizes?** yes — these ARE the AU C/Z catalogue sections.
- **AU fasteners?** yes (metric, M-series bolts).
- **Translation needed:** none — units and sections are already ours. Only format
  translation (PDF tables → catalogue JSON).

## ⛔ Gate 4 — Engineering backing

- **Rated capacities from a named source?** yes → eligible for `verification: 'catalogue'`
  once licence is granted.
- **Source of the ratings:** manufacturer engineering data published to AS/NZS 4600 —
  the same data the industry designs to.

## Mapping to our catalogue

| External detail | → `ConnectionKind` | `params` we'd capture | Verification status | Notes |
|---|---|---|---|---|
| C-section capacity tables | (member data, not a connection) | per-section capacities keyed by SKU | `catalogue` | Feeds member sizing / SECTION_CATALOG enrichment rather than a frame-end connection; capacities stored per the ConnectionVariant capacity-schema proposal ([connection-capacity-schema.md](connection-capacity-schema.md)) |
| Purlin/girt cleat + bridging details | candidate new kind (e.g. `purlin-cleat`) | cleat size, bolt count/size, bridging spacing | `catalogue` | New `ConnectionKind` = contract change → lib version bump; confirm we need it before proposing |

## Recommendation

- **Verdict:** ingest — **first in priority order** (Lysaght → Simpson → ASI → geometry
  blocks) once permission is in hand.
- **Effort estimate:** one session: translation script in `scripts/` (PDF tables → entries
  with provenance), plus review pass.
- **Open questions for Gavin:**
  - ⛔ Email BlueScope/Lysaght for written permission to embed the tables in a commercial
    product (the blocking action).
  - Do we want the purlin-cleat/bridging details as a new `ConnectionKind`, or only the
    section capacity data this round?
