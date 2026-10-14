# Implementation steps — tracking label, deposit waiver, Davao locations (2026-10-14)

One step at a time. A step is ticked only after its check has actually been run.
Source of each fact is the code (file named) or a named outside source — nothing from memory.

**Rules for every step**
- No git commit / push. No `php artisan test`, no `npm run build`, no browser.
- No column removed, no status key renamed, no existing record rewritten.
- Server checks: real API calls with curl, or tinker inside `DB::beginTransaction()` … `rollBack()`.
- Client check: `npx tsc --noEmit`. Server style check: `vendor/bin/pint --test` on changed files.

---

## A. Tracking shows sewing, not printing

Why: the shop wants the tracker to read as tailoring (tahi). The bulk stage key
`mass_cutting_printing` (JobOrder::STATUSES) is shown as "Mass Cutting & Printing" with a printer icon.

- [x] A1. Keep the key. Change every visible label to **"Mass Cutting"** and the printer icon to scissors:
  `OrderTrackingView.tsx`, `JobProductionTimeline.tsx`, `jobHelpers.tsx`, `stageIconFilters.ts`,
  `reportHelpers.tsx`, `StaffQueue.tsx`, `ordersTypes.ts` (client); `JobStatusUpdatedNotification.php` (server).
- [x] A2. Checked: no stage label says "Printing" (only the internal key); tsc exit 0; pint fails on the same 3 fixers as the committed file (pre-existing, not from this change).

## B. "No downpayment for this order" (customer the shop knows)

Facts (code): the deposit rule is copied onto each order at creation (`JobOrder::booted`,
`OrderRequirements::resolve`), as `payment_policy` + `payment_policy_percent`. `none` = no deposit
(`OrderRequirements::depositFraction`). Nothing can change it on one order afterwards.
`users.suki_tag` is shared by all shops, so it can't mean "this shop trusts this customer".

- [x] B1. Server: `POST /stores/{store}/jobs/{jobOrder}/deposit-waiver` in the owner + branch manager
  group (`routes/api.php`, next to `/discount`). Body `{ waive: true, reason }` or `{ waive: false }`.
  - Same store + `branchAccessDenied()` (a manager only on their branch's jobs).
  - Only before production (status not in `JobOrder::STAGES_REQUIRING_DOWNPAYMENT`, not completed/cancelled/rejected).
  - Waive: remember the old policy in the audit log, set `payment_policy = none`.
  - Undo: put back the policy from the last waiver's audit entry.
  - Audit actions `deposit_waived` / `deposit_waiver_removed` with the reason.
- [x] B2. Client: a small control under the discount form on the job's Payments tab
  (`JobFinancialsCard.tsx`, shown to owner/manager only already): "No downpayment for this order" + reason, and "Require the downpayment again".
- [x] B3. Checked in rolled-back transactions (jobs 39/39, audit rows 411/411 after each run):
  owner: no reason → 422; waive job 133 → 200, policy none, required deposit 0, the "deposit" blocker gone (quotation/specs/approval stay);
  waive twice → 422; job in sewing → 422; completed job → 422; undo with no waiver → 422 (clear message); undo → policy back to deposit/50; 2 audit rows.
  branch manager (same branch) → 200; staff → 403; customer → 403. Not tested: another shop's owner (only 1 shop in local data).
  tsc exit 0; pint shows the same fixers as the committed files (pre-existing).

## C. All 11 districts and the 182 barangays

Facts (code): only 8 districts, copied in 7 places (`StoreBranchController` ×2, `StoreApplicationController`,
`storesTypes.ts`, `search/types.ts`, `branchHelpers.tsx`, `mapTypes.ts`). Paquibato, Baguio, Marilog are missing and
the server rejects them. Barangay is optional free text.

Source for the list: Wikipedia "Districts of Davao City" (182 = 40+14+11+13+9+13+8+19+12+25+18), which matches the
research table name for name. **Not yet checked against PSA PSGC:** "Balenggaeng"/"Balengaeng" and
"Biao Guinga"/"Biao Guianga" — matching ignores spelling marks so either is accepted.

- [x] C1. Server `App\Support\DavaoLocations`: district → barangays, district names, and a lookup that matches a
  typed barangay (ignores case, dots, commas, ñ/n, a leading "Barangay"/"Brgy.", either half of "X (Y)"; also the
  research's "Balengaeng" / "Biao Guianga"). Checked: 182 names, 11 districts, all unique, 3 congressional groups cover all 11.
- [x] C2. Client `src/lib/davaoLocations.ts`, **generated from the server file** (no hand copying). `storesTypes.ts`,
  `search/types.ts`, `mapTypes.ts` now take their list from it; the branch list in `branchHelpers.tsx` was no longer
  used and was removed.
- [x] C3. Server rules use it (`StoreBranchController::resolvePlace`): district must be one of the 11. A **new or
  changed** barangay must be on the list and inside the chosen district; it is saved in the official spelling and fills
  an empty district. An unchanged value is kept exactly as stored.
- [x] C4. Branch form (`BranchPlaceFields.tsx`): District, then Barangay from that district (grouped by district when
  none is picked); picking a barangay sets the district; changing the district clears a barangay from another district;
  an old value not on the list shows as "(saved earlier)".
- [x] C5. Application (`StoreApplicationController`): district accepted from the 11; a typed barangay on the list is
  saved in the official spelling and fills a missing district; anything else is kept as typed (never refused).
  **Not run through the API** — an application needs document uploads; covered by the same lookup tested in C1/C6.
- [x] C6. Checked in rolled-back transactions (branches 2/2, rows unchanged afterwards):
  new branch Paquibato/Malabog → 200; Baguio/"malagos" → saved "Malagos"; edit Marilog/Buda → 200;
  Agdao + Mintal → 422 "Mintal is in Tugbok District, not Agdao."; "Lanang" → 422 "not a barangay of Davao City";
  "brgy. 3-a" with no district → saved "Barangay 3-A", district Poblacion; district "Lanang" → 422.
  Unchanged old values ("Old typed place", "ubalde") on a verified branch → 200, kept as stored, still verified
  (each in its own process — several requests in one tinker process gave a false "pending", as the server CLAUDE.md warns).
  tsc exit 0; pint passed on all three server files; /search, /dashboard/branches, /dashboard/jobs/133, /account/orders,
  /track → 200; `GET /public/stores?district=Paquibato` → 200.

---

## D + E. Service and search — ON HOLD, waiting for agreement

What you asked for (2026-10-14): searching **"barong"** should show
1. the **barong designs** (catalog);
2. the services that **make** a barong;
3. the services that can **alter or fix** a barong;
4. for a more specific search, still the same service or other services — same shop or another shop,
   one service or two.

What the code does today (StoreController::publicIndex, ServiceController::publicShowroom):
- the whole phrase must appear in a name, category, design, barangay or address;
- a shop row lists only the services whose name/category or designs match (`matching_service_ids`);
- an alteration service never matches "barong", because nothing says which garments it works on;
- task rows ("Zipper Replacement") are not searched.

Proposal (for agreement — nothing built):

| Search | Designs | Each shop's row |
| --- | --- | --- |
| barong | every listed barong design | **Makes it:** Barong Tagalog Tailoring · from ₱1,500 / **Alters & fixes it:** Garment Alterations & Repair (only if that service takes barongs) |
| jusi barong | barong designs, jusi first | **Makes it:** Barong Tagalog Tailoring (its task row "Jusi Fabric Barong" matched) |
| barong alteration / fix my barong | — | **Alters & fixes it:** only the alteration services that take barongs |

- A shop shows when it has **either** line; a shop with both shows both (2 services), a shop with one shows one.
- "Makes it" = the service's name/category, its designs, or its task rows match. "Alters & fixes it" = an
  alteration/repair service that the owner marked as working on that kind of garment.
- The words are matched one by one, so "jusi barong" and "fix my barong" work (today the whole phrase must match).

Questions before building:
1. How does an owner mark "my alteration service takes barongs"? Proposal: on alteration/repair services, a
   "Garments we work on" pick list from the existing garment groups (Formal wear, Traditional wear — barong &
   Filipiniana, Dresses & gowns, Casual, Uniforms, Sportswear, Outerwear). Needs one new nullable column on services
   (additive) — or reuse the free-text `categories` field (no migration, but mixed with marketing labels).
2. If an alteration service has nothing marked, should it show for every garment ("fixes anything") or for none?
3. The same two labelled lines on the Services tab and in the map panel?

Also on hold from earlier: the "Made for our customers" finished-work section (4 decisions).

---

# Garment categories (2 levels) + 4 services + capability search (started 2026-10-14)

Source: the adviser/panel task prompt (2026-10-14) + the owner's answers:
one **Garments** menu (no Men/Women/Kids anywhere) · gender **hidden completely** (column kept, unused) ·
order types **derived automatically** · **phase by phase, stop after phase 2 for review** ·
no new tables, taxonomy stays in code with an **old-slug fallback map** · garment pickers always **grouped by the 10 categories**.

**Facts checked in the code before planning (not from the prompt):**
- There are **no** `garment_categories`, `garment_types`, `capabilities` or `shop_service_garments` tables. The taxonomy is code:
  `App\Support\CanonicalTaxonomy` + `src/lib/canonicalTaxonomy.ts`. A design stores its garment as a slug in
  `catalog_items.garment_type` (+ `department`, `subcategory`, `garment_structure`). A service stores `service_category`,
  `service_leaf_type`, `showcase_category` and the order types in `service_types`.
- The tree has **110 raw entries, 92 unique garments, 18 duplicated** (the same 18 the prompt names). The prompt says
  "86 raw / 48 unique" but lists **54** garments — the 54 listed are used.
- `merged_into_id` → in code: the **old-slug map** (each of the 92 old slugs → its canonical slug).
- A garment slug **not** on the known list makes the design a *custom apparel name* (pending admin approval, hidden).
  So the known list must keep **old and new** slugs, or old designs would be hidden on their next save.
- `php artisan test` is not allowed in this project (it wiped the DB once). Checks are tinker in rolled-back
  transactions, curl, `tsc`, `pint`.
- Used in 16 server files and 39 client files.

## Phase 1 — the new taxonomy in code (no data change)
- [x] G1. Server `CanonicalTaxonomy`: 10 garment categories + "Other", 54 garments, aliases (category + garment),
  the old-slug map (all 92), the 4 service groups with their capabilities + aliases, the old-service-category map.
  Old constants stay until phase 5 so nothing breaks.
- [x] G2. Helpers (`canonicalGarment`, `garmentVariants`, `knownGarmentSlugs`, `garmentsInCategory`, `capabilitiesMentionedIn` + `wordStems`): canonical slug of any slug, all variants of a slug (canonical + its old slugs), known slugs (old + new).
- [x] G3. Client mirror **generated** from the server data (`src/lib/garmentTaxonomy.ts`); old label maps also know the new slugs.
- [x] G4. Compatibility (`CatalogItem::garmentCategories` = old + new, scope `ofGarment`, used by `CatalogController` ×2 and `StoreController`; old client label/service lists know the new values; `CatalogCategoryFields` shows a moved garment): design validation and the custom-apparel check use the known list (old + new); catalog filters
  by garment match all variants; the old design form shows a value it doesn't list instead of blanking it.
- [x] G5. Checked: 92/92 old slugs mapped, all to existing garments, no extra keys; 54 garments, 54 unique labels,
  every one used by at least one old slug, each in one of the 10 categories (3/6/8/8/5/9/5/4/3/3, Other 0);
  4 service groups, 22 capabilities. Filters: old and new slug find the same designs (basketball 5/5, volleyball 3/3,
  school uniform 2/2; "suit" now finds suits + women's suits = 3); public showroom by old/new slug 5/5, 3/3.
  Capability detection on the demo price rows: Hem → hemming; Take In / Let Out Waist → waist; Zipper → zipper;
  Sleeve Shortening → sleeve only; Small Logo Embroidery → logo; Team Name Embroidery → name; "Patch Embroidery" and
  "Logo Digitizing" → none (owner ticks); "Complete Set with PE Uniform" → cut-and-sew jersey (the prompt's alias — review).
  tsc exit 0; pint passed (CatalogController fails on the same fixers as the committed file).

## Phase 2 — reversible data migration (then STOP for review)
- [x] M1. Migration `2026_10_14_150000_consolidate_garments_and_service_groups` (additive): `catalog_items.legacy_garment_type`; `services.garment_types` (json), `services.capabilities`
  (json), `services.legacy_service_category`; `service_packages.legacy_service_category`.
- [x] M2. Data: designs → canonical slug (old kept in `legacy_garment_type`); services in *Printing & Sublimation* →
  *Garment Customization* if it is an embroidery service, else *Uniform, Jersey & Teamwear*; *Custom Costume Creation* →
  *Custom Tailoring* (old kept in `legacy_service_category`); each service's garments pre-filled from its designs,
  capabilities pre-filled from its old sub-type and its price rows. `down()` puts every value back and drops the columns.
- [x] M3. Ran on the local DB (snapshot of every touched value taken first; the backup command was not used because
  it also deletes backups older than 30 days). Result: 41 of 45 designs moved (the other 4 already had the same slug);
  every stored garment is now one of the 54; services 1, 7, 33 (jerseys/printing) → Uniform, Jersey & Teamwear;
  8 (Embroidery & Logo Digitizing) → Garment Customization; 13 (costumes) → Custom Tailoring with the 3 costume garments;
  6 services got garments from their designs, 7 got capabilities (e.g. Alterations: hemming, waist, sleeve, zipper,
  mending; Embroidery: logo, name; Bridal: embroidery/beadwork from "Ball Gown with Beadwork"; jerseys: bulk orders).
  Rolled back → designs, services and the combo **identical to the snapshot**, new columns gone. Ran again → same result.
  Pages /store/thread-needle, a design page, /search?q=barong, /categories, /dashboard/catalog, /dashboard/services → 200;
  the public APIs → 200. Undo any time: `php artisan migrate:rollback --path=database/migrations/2026_10_14_150000_consolidate_garments_and_service_groups.php`.
- [x] **STOP — owner reviews** (answered 2026-10-14, see below; phases 5–6 then done). Until phase 5 the old screens are still on: the design form still shows
  Department / Subcategory / Structure (a moved garment shows as its new name), the header still has Men / Women / Kids,
  and the Alterations service has **no garments yet** (it has no designs) — strict search in phase 4 will need them.

**Owner's review answers (2026-10-14):** "fully fix" — finish every phase so nothing conflicts. Shops may name a
service with "sublimation"/"printing" as long as the tracker reads as sewing (Cutting, Sewing, QC — done in step A).
Points 1 and 2 left to me:
1. The auto "Cut-and-Sew Sports Jersey" (from the alias "PE uniform") is **not** pre-filled — a capability that says the
   shop sews jerseys is only set by the owner. (Migration adjusted and re-run.)
2. An **Alterations & Repairs** or **Garment Customization** service with no garments ticked works on **any garment**
   ("globally"); ticking garments narrows it.
What the customer must see (owner's words, turned into rules):
- Search "Barong" → click → the shop's services **with their add-on prices**; on the service, whether the shop also
  **alters / fixes / repairs** a barong.
- A bulk service shows its **minimum order** and its **add-on prices** (e.g. "With collar + jacket").
- Any service can list add-ons; a row with no amount reads **"Depends — quotation, or walk in with the item"**.
- Every shop shows **whether it alters / fixes / repairs at all**.

## Phase 3 — server rules
- [x] S1. Migration: never pre-fill `cut_and_sew_jersey`; roll back + run again; snapshot check.
- [x] S2. Service save: `service_category` one of the 4; `garment_types` = garments (old slugs saved as the new one);
  `capabilities` must belong to the service's group; `fillable`.
- [x] S3. Order types derived on save (`Service::deriveOrderTypes`): Alterations → repair; Uniform + bulk orders → bulk;
  Custom Tailoring + barong / traditional / gown garments → bridal (two fittings); else custom tailoring.
- [x] S4. Design save: garment saved as its new slug; department / subcategory / structure no longer needed (kept if sent);
  a typed name not on the list still goes to admin review.
- [x] S5. Combos: category one of the 4. Store tags: Men / Women / Kids no longer offered (old values still accepted).
- [x] S6. Checked through the API in rolled-back transactions (services, designs and custom names identical afterwards):
  a logo capability on an alteration service → 422; old slug `casual_pants` saved as `casual_pants_jeans`; a sent
  `service_types` is ignored and worked out instead (alterations → repair; barong → bridal; uniform + bulk orders → bulk;
  uniform without → custom); `printing_sublimation` → 422; unknown garment → 422; design with old slug
  `basketball_jerseys` → saved `basketball_jersey`, no review; a typed name → custom name pending review; back to a listed
  garment → review cleared; combo with `printing_sublimation` → 422; staff editing a service → 403.
  Order types worked out from the real data match what is stored for 9 of 10 services; the embroidery service goes
  from bulk to custom on its next save (customization has no bulk capability in the approved list).
  S1: migration re-run after the change, rollback identical to the snapshot; service 5 now only `bulk_orders`.
  pint: same as the committed files; the new migration passes.

## Phase 4 — search intent
- [x] Q1. `App\Support\SearchIntent`: words → intent (make / alter & fix / customize), capabilities, garments
  (labels + aliases + category aliases); stop words dropped.
- [x] Q2. Shop search + `matching_service_ids`, service search, design search use it; plain text match stays as fallback.
- [x] Q3. Checked through the public API with 3 test shops added in a rolled-back transaction (B only makes pants,
  C only embroiders, any garment; D only alters jeans — hemming). Shops/services/branches 1/10/2 before and after.
  - "barong" → Thread & Needle [Barong Tagalog Tailoring; Garment Alterations & Repair] (makes it + alters it)
  - "make a Barong Tagalog" → only Barong Tagalog Tailoring
  - "fix my pants", "shorten my trousers", "repair my clothes", "maong putol" → only alteration services (T&N, D);
    **B (only makes pants) is never returned**
  - "add a logo to my school uniform" → only embroidery services (T&N Embroidery, C); the school uniform service
    (no embroidery capability) is not
  - "embroider a name" → embroidery services + the bridal service (it ticked "embroidery/beadwork", per the prompt's rule)
  - "put a badge on my uniform" → no shop (nobody ticked Badge & Patch — strict, as asked)
  - "jersey" / "tuxedo" / "gown" → the making service + the alteration service; the embroidery-only shop is not shown
  - "palit zipper" → alteration services with zipper replacement; "Thread" / "Test B" → shop name, plain text match
  - Services tab and Designs tab follow the same reading ("fix my pants" → 0 designs; "tailor" → plain text, 16).
  An earlier run hung once while MySQL restarted; re-run cleanly. pint: the new file passes after formatting;
  the others match the committed files.

## Phase 5 — screens
- [x] U1. Design form (`GarmentPicker` in the new-design form and the edit box; old 4-field component and `catalogCategories.ts` removed; owner Designs filter + revenue pie by garment category): Category → Garment (grouped), or a typed name; no Department / Subcategory / Structure.
- [x] U2. Service form (`ServiceWorkEditors.tsx`: Kind of work → Garments → What you do (+ minimum order when "Bulk / Batch Orders" is ticked) → Prices & add-ons; order types worked out client-side the same way as the server): Step 1 service type (4) → Step 2 garments by category (+ "Select all in category") →
  Step 3 capabilities → minimum order (bulk) and prices & add-ons. No order-type checkboxes.
- [x] U3. Service page (`ServiceWorkBlock`, `ServicePricesBlock`, "This shop also alters & repairs it" link; header says "From ₱…" or "Depends on the item" + minimum order): works on (garments or "any garment"), what they do (capabilities), minimum order, prices & add-ons
  ("Depends — quotation, or walk in with the item" for no amount), "This shop also alters & repairs it" link.
- [x] U4. Shop cards / storefront (search shop rows and the shop header): "Alters & repairs" when the shop has that service.
- [x] U5. All Categories (+ server `capability` filter for the chips, `garment_category` filter on designs/shops/services): 10 categories with garment tags, 4 services with capability chips, A–Z of 54 garments
  ("Barong > Barong Tagalog").
- [x] U6. Header (`navData`/`navColumns`: Garments / Services / Discover), breadcrumbs, spec tables, service cards, home category grid, Ask Sutura, context chips, shop tags (old Men/Women/Kids hidden); search no longer sends gender/subcategory/structure. Garments / Services / Discover. Search filters and breadcrumbs: no Men / Women / Kids, no top/bottom.

## Phase 6 — final checks + docs
- [x] F1. Seeders write the new garments and service groups; generators kept as `scripts/gen-garment-taxonomy.mjs` and `scripts/gen-davao-locations.mjs` (re-run produced identical files); docs: STATUS, ARCHITECTURE, `analysis/codebase/GARMENT-TAXONOMY.md`.
- [x] F2. Full pass on the final code: tsc exit 0; pint — every new server file passes, every changed file has the same
  result as its committed version; the S6 save checks and the Q3 searches re-run with the same results (rolled back);
  pages /, /categories, /search?q=barong, the capability link, /store/thread-needle, two service pages, a design page,
  /dashboard/services, /dashboard/services/new, /dashboard/catalog, /dashboard/catalog/new, /dashboard/catalog/64,
  combo create → 200.
  **Not checked:** `/dashboard/services/[id]` — the running `next dev` (started 4 days ago) can no longer compile a page it
  has not compiled yet: Homebrew moved Node from 26.8.2 to 26.11.1 under it (log: `spawn …/node/26.8.2/bin/node ENOENT`).
  Restart `npm run dev`, then open a service in the dashboard.
  **Unused, left as they were:** `SearchFilterDrawer.tsx`, `SearchWebFilterSidebar.tsx`, `StoreCatalogFilterSidebar.tsx`
  (no page imports them; they still use the old tree).
- [x] F3. Missed in U6, found by the owner: the landing page's **Categories** row (`home/HomeCategories.tsx`) was a
  hard-coded Men / Women / Kids / Services list. Now the 10 garment categories (scroll row on phones, 5-column grid
  from 600px), each opening a search for that category. Checked: tsc exit 0; landing page 200 and its HTML has the
  new tiles and no "Men" / "Women" / "Kids" / `department=`; each tile's search returns the shop (designs: barong 2,
  traditional 2, uniform 3, jersey 19, dress 8, formal 13, shirt 1, pants 2, jacket 1, costume 0 — no costume designs in
  the demo, the costume service still shows).
- [x] F4. Landing page loading + Featured (owner's ask, 2026-10-14):
  - Skeletons (`home/HomeSkeletons.tsx`) with the same size and blocks as the real cards: Featured (it used to pop in
    and push the page down — nothing showed while loading), Near Shops, Services; pulsing off for reduced motion.
  - Featured: **Signature works only shows the shop's own designs** (it used to fill empty slots with other shops'
    best-sellers, linked under this shop's URL → the wrong page); each shows its price. New lines: **What they do**
    (the shop's kinds of work) and **Works on** (garment categories from its services and designs).
  - Service cards (landing, search, storefront): "From ₱…" and "Depends on the item" instead of a bare price / "Custom Quote".
  - Checked: tsc exit 0; landing, store and search pages 200; the landing HTML now carries the Featured placeholder;
    for the one featured shop the content works out to 4 kinds of work, 10 garment categories (4 shown +6 more) and
    4 of its 10 designs.
- [x] F5. Landing opening screen (owner's ask, 2026-10-14, modelled on the coffee-finder screens they showed):
  - `home/gate/useLocationGate.ts` + `LocationGate.tsx` + `SpinningPin.tsx`: "Pinpointing your location…" (a 3D
    spinning SUTURA pin, drawn in code) → after 8 s unanswered, or a closed/blocked prompt, "Location Permission
    Required" / "Location Is Blocked" (Allow Location / Retry, Choose on map, Skip for now) → "Finding tailoring
    shops…" (at least 1 s) → the page; nearest shop over 50 km → "No Tailoring Shops Nearby" (Nearest is … km · Show
    anyway, Search shops on the map). Shown once per page load; going back to `/` inside the app skips it.
  - Checked: tsc exit 0; landing 200 and its HTML opens on the pin (11 layers); nearest-shop rule against the API:
    Davao 0.6 km → page, Cebu 407.5 km and Manila 977.5 km → "No Tailoring Shops Nearby". Not checked in a browser.
- [x] F6. SUTURA logo (owner's brief, 2026-10-14): 4 concepts compared, **Seam S** chosen — files in `public/brand/`,
  favicon/icon/apple-icon in `src/app/`, components `brand/SuturaMark.tsx` + `SuturaLogo.tsx`; in the header,
  brand row, footer, Ask SUTURA badge and the spinning pin. Provenance, concept scores and sizes checked:
  `docs/brand/MANIFEST.md`. Checked: tsc exit 0; `/`, `/ask`, `/search`, `/store/thread-needle` 200; `/favicon.ico`,
  `/icon.svg`, `/apple-icon.png` served and linked in the page head.
- [x] F7. Sign In and Create Account show the logo block on top (`auth/AuthBrand.tsx`: S, wordmark, "Discover · Book ·
  Track"). Checked: `/login`, `/register` 200 with the block in the HTML.
- [x] F8. Ask SUTURA polish (Bongo's `/ask`, owner's ask 2026-10-14): numbered question buttons instead of typing, so
  every question has an answer; signed-in users only (guests get Sign In / Create an Account). Menu
  (`ask/askQuestions.ts`): find by garment (10 categories) or by service (4), open now, near me, top rated, **Where is my
  order?**, **My next appointment**, how ordering works. Kept Bongo's shop rows, shop fetch and location retry; the
  free-text reader `lib/askSutura.ts` was removed (nothing typed any more). Server: `GET /my-orders?active=1` and
  `GET /my-appointments?upcoming=1` (opt-in filters, so totals are never cut off by the page size).
  - Checked: tsc exit 0; `/ask` 200; all 18 shop questions against the API (each garment and service finds Thread &
    Needle; "open now" 0 in the evening → the "no shop open" reply); demo customer: 4 orders → 3 active, 5 appointments
    → 2 upcoming, soonest first. Pint: same 5 pre-existing rules fail before and after on both controllers.
- [x] F9. About page from the thesis (`about/*`): title, plain-words general objective, the 7 specific objectives, "made
  by BSIT students of STI College Davao for Davao's tailoring shops", the four members (names only) and the adviser.
  Checked: `/about` 200 with every section in the HTML.
- [x] F10. Logo replaced by the owner's "S-Tape & Needle" concept (Gemini board, 2026-10-15): cropped, traced by hand
  into SVG (`scripts/brand/tapeMark.js`, 3 overlay passes against `docs/brand/concept-reference.png`), three detail
  levels by size, light / dark / one-colour files, favicon tile, Apple icon. Components `SuturaMark` (`detail`, `halo`)
  and `SuturaLogo` now draw it from `suturaMarkup.ts`; the Seam S round moved to `docs/brand/round-1/`.
  Checked: tsc exit 0; `/`, `/about`, `/login`, `/register`, `/ask`, `/search` 200 with the new mark in the HTML;
  `/favicon.ico`, `/icon.svg`, `/apple-icon.png`, `/brand/*.svg` served; QA sheet and in-app stills inspected.
- [x] F11. Logo the same everywhere (owner: tab, header, login and sign-up didn't match): one drawing at two weights
  (full ≥ 48px, small < 48px keeps the needle, thread and bow), no middle level; the sign-in pop-up (tablet/desktop)
  now has the same logo block as `/login` and `/register`. Checked: tsc exit 0; `/`, `/login`, `/register`, `/about`,
  `/ask` 200; side-by-side render of tab, header, pin and sign-in block. A tab still showing an old icon is the
  browser's favicon cache (the link hash changed) — a hard refresh clears it.
- [x] F12. Log In / Sign Up keep the Profile tab's layout (no header, bottom nav, Profile lit — `AUTH_PATHS`); the sign-in
  tagline is "Find · Fit · Track · Pick Up" (a customer's four steps); **Ask SUTURA is in the bottom nav** (between Map
  and About, "Ask" under 360px wide) and `/ask` is a bottom-nav page. Checked: tsc exit 0; `/ask`, `/login`,
  `/register` 200 with the header hidden; the new tagline on both auth pages, the old one gone.
- [x] F13. Place filter (owner, 2026-10-15): District (grouped 1st / 2nd / 3rd Congressional District) → official
  Barangay → the district's **streets & landmarks** (`src/lib/davaoAreas.ts`, 45 from the team's research table, e.g.
  Anda Street, SM Lanang, Matina Crossing is a barangay so it is in the barangay list). A street is never a district value:
  `area` searches the branch address / landmark / barangay. Server: one `StoreBranch::placeFilter()` used by shops,
  designs, services and combo packages (`district`, `barangay`, `area`; live branches only). Client: `FilterPlace.tsx`,
  URL params `barangay` / `area`. Checked: tsc exit 0; Pint same before/after; API — Poblacion 1 shop, Talomo 0, a
  barangay with no saved branch 0, `area=rizal` finds the "123 Rizal Avenue" branch, the pending Ubalde branch stays
  hidden; `/search` 200 with each new param; no landmark name repeats an official barangay. Marilog has no landmarks
  yet (the research marks them "to identify").
- [x] F14. Map pin the simple way (owner, 2026-10-15): branch form and shop application share `shared/PinPaste.tsx` —
  paste the coordinates Google Maps copies (decimal, "° N/E", or degrees-minutes-seconds; `src/lib/coordinates.ts`), or a
  Maps share link (branch form, read by the server), **Use my current location** (phone GPS, warns when it's rough), or
  Pick on map; shows the pin with "Check in Google Maps" and warns when it's outside Davao City. A new or moved pin
  still waits for the admin's location check before it shows on the map search (thesis: admin verifies branch
  locations). Checked: tsc exit 0; parser on 10 inputs (all copied formats read, Manila flagged outside Davao, links /
  text / out-of-range → none); `/dashboard/branches`, `/register/store`, `/search` 200.
