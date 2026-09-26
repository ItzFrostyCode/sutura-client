# Owner → Customer Data Reflection

For each mapping below: **CURRENTLY REFLECTING** (verified working today) vs **SHOULD REFLECT AFTER OWNER IMPLEMENTATION** (not yet true, target only). Nothing here is claimed working unless it was directly verified in the repository this pass.

```
OWNER / BRANCH
    │
    ├── Shop Profile ──────────→ CUSTOMER: Shop Profile (/store/[store_id])
    │                             CURRENTLY REFLECTING — same route/component,
    │                             owner's inline-edit is layered on the exact
    │                             same read the customer sees, not a copy.
    │
    ├── Location / Branches ───→ CUSTOMER: Map (/map), Shop Profile branch picker
    │                             CURRENTLY REFLECTING — GET /public/stores
    │                             (map pins) and the branch list both read the
    │                             same StoreBranch rows Owner manages.
    │
    ├── Services ───────────────→ CUSTOMER: Services tab on Shop Profile,
    │                             /search?tab=services
    │                             CURRENTLY REFLECTING — GET /public/.../services
    │                             reads the same Service rows Owner writes.
    │
    ├── Apparel Specializations → CUSTOMER: Shop Discovery filter, Shop Profile
    │                             CURRENTLY REFLECTING — STORE_SPECIALIZATIONS
    │                             enum, owner-configured via SettingsBusinessType,
    │                             consumed as the `specialization` filter on /search.
    │
    ├── Catalog ─────────────────→ CUSTOMER: Catalog (/store/[id]/catalog)
    │                             CURRENTLY REFLECTING — same CatalogItem rows.
    │                             ("Portfolio" is a legacy URL alias to this
    │                             same catalog, not a second surface.)
    │                             [CURRENT, this pass] Owner-set `color` and
    │                             `fabric_image_url`/`material` on CatalogItem
    │                             now populated for all seeded items (was a
    │                             data-completeness gap, not a missing
    │                             feature) and surfaced to the customer via a
    │                             color swatch + fabric-name pill on the item
    │                             detail page and a multi-select color-family
    │                             filter on /search and the Catalog tab — see
    │                             docs/CUSTOMER-WORKFLOW.md §6. Same CatalogItem
    │                             columns, no duplicate/synced copy.
    │
    ├── Designs ─────────────────→ CUSTOMER: (no dedicated page)
    │                             NOT APPLICABLE TODAY — no standalone "Designs"
    │                             concept exists on either side. Design
    │                             reference is an attached image/link on a
    │                             booking or job order, not a browsable shop
    │                             catalog. If a real "Designs" feature is
    │                             wanted, it does not exist to reflect yet —
    │                             this would be a NEW feature, not a reflection
    │                             fix.
    │
    ├── Pricing ─────────────────→ CUSTOMER: inline per catalog item/service
    │                             CURRENTLY REFLECTING, but only as inline
    │                             fields on Service/CatalogItem — there is no
    │                             standalone Pricing page on either side to
    │                             compare against. If a dedicated pricing view
    │                             is wanted, same note as Designs above.
    │
    └── Store Size Chart / Reference → STAFF: measurement reference
                                       → CUSTOMER: own Measurement data (post-claim)
                                  SHOULD REFLECT AFTER OWNER IMPLEMENTATION.
                                  Today: NOT CURRENTLY IMPLEMENTED on the Owner
                                  side (no shop-wide chart entity exists at
                                  all — confirmed, see SOURCE-OF-TRUTH-MATRIX.md).
                                  What DOES already work, independent of this
                                  gap: Staff records a per-customer Measurement,
                                  and a claimed customer reads their own history
                                  via /account/measurements — that reflection
                                  is real today, it's just not yet informed by
                                  an Owner-configured reference chart.
```

## Detailed status per mapping

| Owner data | Customer surface | Status |
|---|---|---|
| Shop Profile | `/store/[store_id]` | **CURRENTLY REFLECTING** |
| Location/Branches | `/map`, Shop Profile | **CURRENTLY REFLECTING** |
| Services | Shop Profile, `/search` | **CURRENTLY REFLECTING** |
| Apparel Specializations | Discovery filter, Shop Profile | **CURRENTLY REFLECTING** |
| Catalog | `/store/[id]/catalog` | **CURRENTLY REFLECTING** (incl. `color`/fabric now populated + surfaced via color-family filter and swatch/fabric-name display) |
| Designs | — | **NOT APPLICABLE** (feature doesn't exist on either side) |
| Pricing | inline fields only | **CURRENTLY REFLECTING** (no dedicated page to compare) |
| Store Size Chart → Staff reference → Customer measurement | `/account/measurements` | **PARTIALLY REFLECTING**: Customer↔Staff measurement flow works today; the Owner-configured reference chart that SHOULD inform it does not exist yet |

## The one non-negotiable rule (repeated from `SHARED-DATA-CONTRACT.md`)

None of the above should ever be implemented as a duplicate Customer-side copy of shops/services/catalog/designs/apparel specializations/pricing/branch information. Every verified-working reflection above achieves this by having the Customer-facing endpoint read the SAME Owner-owned table (often through a `/public/*` route), never a synced copy. Any Store Size Chart implementation must follow this same pattern: Owner owns one chart, Staff reads it as reference, Customer's own `Measurement` record stays a separate, FK-linked, per-customer row — never a copy of the chart itself.
