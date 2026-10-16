# Garments, services and search — how SUTURA works (2026-10-14)

Plain-language logic, checked against the code. File paths are evidence only. Steps and test results:
`../IMPLEMENTATION-STEPS.md`.

## 1. Why it changed

The adviser and panel said the old 4-level list (Men's / Women's / Children's → subcategory → top / bottom / set →
garment) looked like an online clothing store, not a tailoring service directory. A tailor uses the same machines and
the same work for a jersey whether a man or a woman wears it, and customers search by garment ("Barong") or by work +
garment ("fix my pants").

## 2. The two lists

| List | Answers | Levels | Where |
| --- | --- | --- | --- |
| **Garments** | "What clothing?" | 10 categories → 54 garments (+ "Other Garments" for a typed name) | `CanonicalTaxonomy::GARMENT_CATEGORIES` / `GARMENTS` |
| **Services** | "What work?" | 4 services → their tasks (capabilities) | `CanonicalTaxonomy::SERVICE_GROUPS` |

The 4 services: **Custom Tailoring & Garment Making**, **Uniform, Jersey & Teamwear Production**, **Alterations &
Repairs**, **Garment Customization & Embroidery**. Printing & Sublimation and Custom Costume Creation are gone: jerseys
are made under Uniform, Jersey & Teamwear; costumes under Custom Tailoring with the Costumes garments. A shop may still
call its service "sublimation jerseys" — the tracker shows sewing stages (Mass Cutting, Sewing, QC), never printing.

No tables were added: the lists live in code, the client copy (`src/lib/garmentTaxonomy.ts`) is generated from it.

## 3. What happened to the old data

- The old tree had 110 entries, 92 different garments, 18 of them twice (men's and women's). Every one of the 92 maps to
  one of the 54 (`LEGACY_GARMENT_SLUGS`). Designs were moved to the new garment; the old value is kept beside it
  (`catalog_items.legacy_garment_type`). Anything still carrying an old slug (an old link, a re-run seeder) still works.
- Men / Women / Kids, subcategory and top/bottom stay in the database, unused and never shown.
- Services in a removed category moved (old value kept in `legacy_service_category`); services got their garments
  from their own designs and their tasks from their own price rows ("Zipper Replacement" → zipper replacement).
- Migration `2026_10_14_150000_consolidate_garments_and_service_groups` — additive; rolling it back restores every
  value exactly (tested).

## 4. What the owner does

1. **Designs:** pick Garment category → Garment, or "Other garment" and type the name (the admin approves a typed
   name before the design shows).
2. **Services:** Kind of work (one of 4) → Garments (grouped by category, "Select all in category") → What you do (tick
   only the tasks offered; "Bulk / Batch Orders" asks for the minimum order) → Prices & add-ons (e.g. "With collar +
   jacket ₱300"; a row with no price shows "Depends — quotation, or walk in with the item").
3. The job-order screens (team roster, repair flow, two fittings) follow from that automatically
   (`Service::deriveOrderTypes`): Alterations → repair flow; Uniform + bulk orders → team roster; Custom Tailoring of a
   barong, Filipiniana or gown → two fittings.
4. An Alterations or Customization service with **no garments ticked works on any garment**.

## 5. What the customer sees

- **Search "barong":** the shop with its Barong Tagalog Tailoring and its Alterations service (so they know the shop can
  also alter or fix it), plus the barong designs.
- **"make a barong tagalog":** only the services that make it. **"fix my pants" / "shorten my trousers":** only
  alteration services — never a shop that only makes pants. **"add a logo to my school uniform":** only shops whose
  embroidery service (or a uniform service with the embroidery task) works on school uniforms. Words are read in
  English, Tagalog and Bisaya (`App\Support\SearchIntent`; the Bisaya list should be checked by the team).
- **Service page:** what kind of work, the garments it works on (or "Any garment"), what they do, the minimum order for
  bulk, the time, prices & add-ons, and a link when the same shop also alters & repairs that garment.
- **Shop cards and the shop page** say "Alters & repairs" when the shop has that service.
- **All Categories / header menu:** Garments (10 → 54), Services (4 → tasks), Discover. No Men / Women / Kids.

## 5b. The shop side uses the same lists (2026-10-16)

- **Services dashboard filters** (`components/services/useServiceFilters.ts`, `serviceTaxonomyFilters.ts`): Kind of work (the 4 services), Garment (garment category, an "any garment" service counts in each) and Task (capability), same names and order as the landing page and `/search`. Search matches the words customers use (garment names and aliases, tasks, kind of work).
- **Storefront Services tab chips** (`lib/storefrontGroups.ts`) follow from what the owner ticked: a service sits under each garment category of its garments; one with no garments sits under its kind of work. The separate "Shown under on your shop page" field (and its Uniform / Casual / Office… list) is gone from the service form; the `showcase_category` column stays but nothing reads it.
- **Create Job Order** offers the same garments and only the services that work on them (`ORDER-FLOW.md`).

## 6. Still open

1. `/dashboard/services/[id]` was not page-checked: the running dev server lost its Node version (restart `npm run dev`).
2. The Bisaya search words are a first list.
3. The two unused search filter panels and the storefront catalog filter still use the old list (no page shows them).
4. Two Tugbok barangay spellings still need the PSA check (see the locations step).
