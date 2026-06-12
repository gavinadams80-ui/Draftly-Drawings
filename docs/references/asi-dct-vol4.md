# Evaluation: ASI Design Capacity Tables Vol. 4 (rigid connections)

> Status: evaluated 2026-06-13 (connection library research session). ⛔ Gate 1 OPEN —
> paid publication; purchase the ebook before any ingest.

## Identity

- **Name:** Australian Steel Institute — Design Capacity Tables Volume 4: Rigid Connections
- **URL:** https://www.steel.org.au (ASI bookshop, ebook)
- **What it is:** The gold-standard Australian reference for rigid steel connections —
  pre-engineered connection configurations (bolted/welded moment connections, base plates
  etc.) with design capacities to AS 4100. Published by the industry body; the source AU
  structural engineers actually design from.
- **Found by / date:** connection library research session, 2026-06-13

## ⛔ Gate 1 — Licence

- **Licence / terms:** paid, copyrighted ASI publication. We do not hold a copy yet.
- **Commercial use permitted?** unclear until purchased — review the licence that comes
  with the ebook; embedding capacities in a product will likely need an ASI conversation
  beyond a single-seat ebook purchase.
- **Redistribution permitted?** unclear — assess after purchase.
- **Attribution required?** assume yes; provenance string per entry, e.g.
  `"ASI Design Capacity Tables Vol. 4, rigid connections per AS 4100"`.

## Gate 2 — Data or code?

- **Form:** structured data — design capacity tables (ebook/PDF), plus standard
  connection geometry.
- **If structured:** per connection configuration: member range, plate/bolt/weld spec,
  design capacities per AS 4100.
- **If drawings only:** n/a — the tables are the asset; geometry supports our generators.

## Gate 3 — Australian alignment

- **Standards basis:** AS 4100 (steel structures). The definitive AU source.
- **Metric + AU section sizes?** yes — keyed to AU open sections per the AU catalogues.
- **AU fasteners?** yes (metric structural bolts, AU practice).
- **Translation needed:** none — format translation only.

## ⛔ Gate 4 — Engineering backing

- **Rated capacities from a named source?** yes — the strongest backing of the five
  sources evaluated → `verification: 'catalogue'` once obtained and licensed.
- **Source of the ratings:** ASI-published design calculations to AS 4100; the national
  reference for rigid connections.

## Mapping to our catalogue

| External detail | → `ConnectionKind` | `params` we'd capture | Verification status | Notes |
|---|---|---|---|---|
| Rigid connection configurations | mostly new kinds (moment end plate, base plate…) | configuration id, member range, bolt/plate/weld spec, capacities | `catalogue` | Most entries won't fit the current carport-oriented kinds — expect a `ConnectionKind` contract extension + lib version bump; mapping deferred until we hold the book |

## Recommendation

- **Verdict:** ingest — **third in priority order** (after Lysaght and Simpson), gated on
  purchase. Catalogue-grade once obtained.
- **Effort estimate:** script + review across multiple sessions — largest and most
  contract-impacting of the five sources.
- **Open questions for Gavin:**
  - ⛔ Purchase the DCT Vol. 4 ebook from steel.org.au (the blocking action).
  - After purchase: does the licence cover embedding capacities in a commercial product,
    or do we need a separate ASI agreement?
