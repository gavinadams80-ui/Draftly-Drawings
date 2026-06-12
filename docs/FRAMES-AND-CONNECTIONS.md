# Portal frames & connection variants

> The per-frame dropdown model, in plain language. Defined in
> [`src/frames.ts`](../src/frames.ts); the building anchor lives in
> [`src/project.ts`](../src/project.ts) (`BuildingContext.anchor` / `BuildingContext.frames`).

## The model in one paragraph

The plan view ports across **north-up** with the existing dwelling already known. Each
**portal frame is a selectable object**; each of its two ends offers a **dropdown of
connection options** — the same interaction the user already knows from the downpipe and
light-fitting pickers. Picking an option regenerates the section and side views. When a
user customises a connection in Drafting, the edit is **absorbed**: captured as a new
named variant, run through Engineering, and added to *their* options list. The dropdown
stays the single source of truth — it just got one option longer.

## The anchor chain

```
GPS + north bearing            (BuildingAnchor — set once, from the siting step)
   └─ building origin
        └─ grid                (PortalFrame.positionMm along the ridge = the gridline)
             └─ frame
                  └─ connection detail   (FrameEndConnection at each frame end)
```

Details never hang off GPS directly. Nudge the block position 200 mm and everything
follows cleanly — nothing churns, no detail re-anchoring. This is also how real drawing
sets reference details (gridline intersections), so certifiers read it naturally.

## The dropdown rules

1. **Context-filtered.** A frame end landing on a side that attaches to the dwelling
   (`DesignGeometry.attachedSides`) offers the attached kinds (ledger, rafter-ledger,
   socket-joint, fascia-penetration) *plus* the freestanding kinds. A free side offers
   only freestanding kinds (post-footing, corner-post) + custom. `allowedKinds()` is the
   one place this filter lives.
2. **Unresolved is honest.** A frame end with no choice yet is *unresolved* — the UI
   prompts; the system never assumes a connection.
3. **Versions are pinned.** A placement references `{ variantId, variantVersion }`.
   Editing a variant creates version+1 with lineage (`basedOn`); existing placements keep
   the version they chose until deliberately updated — same immutable-tag discipline as
   the lib itself.

## Verification — no automatic green ticks

| Status | Meaning |
|---|---|
| `catalogue` | Ships with the product; pre-engineered, known capacities. |
| `auto-checked` | A parametric tweak of a known kind; Engineering re-ran the numbers and it passed. |
| `requires-review` | Novel geometry the system cannot honestly certify — usable, but flagged until an engineer signs off. |
| `engineer-approved` | A human engineer reviewed and approved it. |

`bumpVariant()` (the edit-capture helper) always **resets verification** — an edited
connection re-earns its tick. This is the same omit-don't-guess rule that governs the
planning data, applied to user designs.

## What flows from a choice

A connection choice is an engineering event, not just a drawing change. Picking a variant
should flow to: the regenerated section/side views → the structural re-check (`DesignSet`
round-trip) → the fixings schedule / BOM → cost. The contract carries the identity; the
apps wire the flow.

## Ownership

- **Catalogue variants** ship with the product (`owner: 'catalogue'`).
- **User variants** belong to the user who made them (`owner: 'user'`) — *their* variation,
  never pushed to everyone. (Structurally this also leaves room for a future curated /
  shared library — a named, engineer-verified, versioned detail set is a B2B asset.)

## Bridging from today

Existing designs carry only `portalFrameCount`. `defaultFrames(geometry)` expands that to
an explicit, evenly-spaced frame list with unresolved ends, ready for the dropdowns. The
field is optional everywhere, so nothing existing breaks.
