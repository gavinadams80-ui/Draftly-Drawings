# The Draftly Project contract

> One object, passed hand-to-hand between the four apps, so the customer experiences **one
> project moving through five plain steps** — never four separate tools.

Defined in [`src/project.ts`](../src/project.ts), exported from `@draftly/drawings` as
`DraftlyProject` (+ `createProject`, `recordStep`, `isDraftlyProject`).

## The idea in one picture

```
  ┌──────────────┐   ┌────────────┐   ┌──────────────┐   ┌──────────────┐
  │ INTELLIGENCE │ → │  DRAFTING  │ → │ ENGINEERING  │ → │ INTELLIGENCE │
  │  front desk  │   │  drawing   │   │ is-it-strong │   │ council pack │
  └──────┬───────┘   └─────┬──────┘   └──────┬───────┘   └──────┬───────┘
         │                 │                 │                  │
         ▼                 ▼                 ▼                  ▼
     site +           drawing            structural        submission
     planning +       (DrawingRef)       (DesignSet)        (SubmissionState)
     building
         └──────────────── one DraftlyProject ─────────────────┘
                       (+ an append-only ledger)
```

Each app **owns** a slice and **reads** the rest:

| Slice | Owner | Plain meaning |
|---|---|---|
| `site` | Intelligence | The verified address, parcel, frontage, lot size. |
| `planning` | Intelligence | Council, zone, overlays, easements, and the **approval pathway** (exempt / complying / DA). |
| `building` | Intelligence (siting) | What's being built — footprint, height, setbacks, roof — in plain terms. |
| `drawing` | Drafting | The `.draftly` drawing (embedded or linked) + the title block. |
| `structural` | Engineering | The `DesignSet` — member sizes + pass/fail checks (the existing Eng⇄Drafting contract, composed in). |
| `submission` | Intelligence | The council-pack checklist, lodgement route, and bundle status. |
| `ledger` | everyone (append-only) | Who decided what, when, and against which rule version. |

## Two rules baked into the shape

1. **Provenance — never guess.** Planning facts (`council`, `zone`, `maxHeightM`) are wrapped in
   `Sourced<T>`: a value *plus* where it came from (`government` / `domain` / `user` / `derived` /
   `ai-extracted`) and when it was verified. A fact that can't be verified against an official
   source is **left undefined**, not invented. `overlaysComplete` tells the UI whether the overlay
   set was exhaustively machine-checked or only partially.

2. **An audit trail.** `ledger` is append-only. Every meaningful step (`planning.verified`,
   `pathway.determined`, `drawing.saved`, `structural.checked`, `submission.generated`) records the
   app, the timestamp, and — for determinations — the `ruleVersion`. This is the evidentiary record
   a certification product needs: you can prove *what* was advised, *when*, and against *which* rules,
   even after the rules later change.

## Why it composes instead of redefining

The envelope reuses contracts the lib already owns rather than copying them:
- `structural` **is** a `DesignSet` (from `designSet.ts`).
- `building` uses the shared vocabulary from `terms.ts` (`StructureType`, `RoofType`, `Attachment`,
  `BuildingType`) and `BuildingSide` from `designSet.ts`.
- `drawing.titleBlock` is the shared `TitleBlockData`.

One concept, one definition — the whole point of the shared lib.

## Using it

```ts
import { createProject, recordStep } from '@draftly/drawings';

// Intelligence — user starts a job:
let project = createProject({ name: 'Deck at 12 Smith St', app: 'intelligence' });

// …after a verified government lookup:
project = recordStep(project, {
  app: 'intelligence',
  action: 'planning.verified',
  note: 'GRZ1, no overlays (VicPlan)',
});

// recordStep returns a NEW object (immutable-friendly) and stamps updatedAt + ledger.
```

## Status & next steps

- **v1 (this file).** Shape agreed and typed; pure helpers (`createProject`, `recordStep`,
  `isDraftlyProject`). No app wired to it yet.
- **Next:** (a) Intelligence emits a `DraftlyProject` instead of its private `projectData`; (b) Drafting
  opens it, fills `drawing`, hands back; (c) the `.draftly` drawing serializer becomes the `drawing.document`
  payload (schema v2). Re-pin both apps to the lib version that ships this whenever the shape changes.
