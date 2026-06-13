# Evaluation: cad-steel.info

> Status: evaluated 2026-06-13 (connection library research session). Geometry only —
> anything ingested enters as `requires-review`, never `catalogue`.

## Identity

- **Name:** cad-steel.info — Australian structural steel CAD sections
- **URL:** https://cad-steel.info
- **What it is:** A free library of CAD geometry for Australian structural steel sections,
  drawn per the OneSteel 7th Edition catalogue (AS/NZS 3679 hot-rolled sections).
  Geometry/profiles only — no capacities, no engineering data.
- **Found by / date:** connection library research session, 2026-06-13

## ⛔ Gate 1 — Licence

- **Licence / terms:** free-to-download CAD blocks; explicit redistribution/commercial
  terms not formally stated on the site.
- **Commercial use permitted?** unclear — low-risk relative to capacity data (we'd be
  redrawing dimensioned profiles, and section dimensions themselves are catalogue facts),
  but confirm before embedding any file verbatim.
- **Redistribution permitted?** unclear — prefer redrawing as parametric generators from
  the dimension data rather than embedding their files.
- **Attribution required?** carry the provenance string regardless:
  `"cad-steel.info, Australian structural steel sections per OneSteel 7th Ed., AS/NZS 3679"`.

## Gate 2 — Data or code?

- **Form:** drawings (CAD blocks) of section profiles.
- **If structured:** n/a — no capacity fields.
- **If drawings only:** worth using as a dimensional cross-check / source for parametric
  profile generators. Our member profiles are already 1:1 real-mm parametric — the value
  here is verification and any AU sections we don't yet draw.

## Gate 3 — Australian alignment

- **Standards basis:** AS/NZS 3679 via the OneSteel 7th Edition catalogue.
- **Metric + AU section sizes?** yes — that's the whole point of the library.
- **AU fasteners?** n/a (sections, not connections).
- **Translation needed:** redraw as parametric generators (our standing rule: generators
  emit 1:1 real-mm, no embedded foreign files).

## ⛔ Gate 4 — Engineering backing

- **Rated capacities from a named source?** no — geometry only → anything ingested enters
  as `verification: 'requires-review'`.
- **Source of the ratings:** none. Dimensions trace to the OneSteel 7th Ed. catalogue,
  which is checkable, but there is nothing rated here.

## Mapping to our catalogue

| External detail | → `ConnectionKind` | `params` we'd capture | Verification status | Notes |
|---|---|---|---|---|
| AU section profiles (UB/UC/PFC/SHS/RHS…) | (section geometry, not a connection) | section dimensions per SKU | `requires-review` | Cross-check / extend SECTION_CATALOG profile generators; ingest dimensions, never their CAD files |

## Recommendation

- **Verdict:** reference-only for now — use as a dimensional cross-check; ingest specific
  profiles only if we find gaps in our own generators. **Last in priority order** (geometry
  blocks come after the three data sources).
- **Effort estimate:** trivial per-section; only worth a session if a batch of missing
  profiles turns up.
- **Open questions for Gavin:**
  - Any AU sections our profile generators don't cover yet that are worth pulling from here?
