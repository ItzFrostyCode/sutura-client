# Service, Design and Price — how SUTURA works (2026-10-14)

Plain-language logic, checked against the code. File paths are evidence only.

## 1. The three things

| Thing | What it is | Where the price lives |
| --- | --- | --- |
| **Service** | Work the shop offers (Barong Tagalog Tailoring, Bespoke Suit, Team Jersey, Repairs). The owner creates, edits, pauses and deletes it. | `services.base_price` (+ optional sale). Shown as a **starting price** ("From ₱1,500"). Empty = "Price on quotation". |
| **Design** | A style the shop can make **under** a service (a Barong design under the Barong service). Optional: a customer can also bring their own reference. | **None of its own.** It costs the service's price, unless the shop sets an extra charge or asks for a quote. |
| **Order (job order)** | The real job. Holds the binding total. | `job_orders.total_amount`, set by the **quotation** (estimate → final), which the customer approves. |

Prices are **store-wide**: services and designs have no branch column, so a price cannot differ by branch (verified: no `store_branch_id` on `services` or `catalog_items`).

## 2. The pricing problem (found and fixed)

**Cause:** every design had its own required price (`catalog_items.price`), unrelated to its service, and that price was used everywhere.

- Seed data: Bespoke Suit service ₱3,500, its tuxedo designs ₱12,200–12,800; Barong service ₱1,500, its designs ₱4,500; Team Jersey service ₱1,000, its designs ₱580–1,450.
- The design page, every design card, search, the Find sheet and the booking reference showed the design's price, while the service page showed the service's. Same garment, two prices.
- Customer **Bulk Order** charged design price × pieces, and **Made to Order** charged the design price (`JobOrderController::customerBulkOrder` / `customerMadeToOrder`).
- The owner's job form pre-filled the design price, then a second effect overwrote it with the service price — the total depended on click order (`useJobCreateForm.ts`).
- The owner form forced a price on every design.

**Fix:** one rule, worked out on the server (`App\Support\DesignPricing`) and shown with one client helper (`lib/designPricing.ts`).

| Shop's choice for a design | Customer sees (service ₱1,500) | Order starts at |
| --- | --- | --- |
| Same as the service (default) | From ₱1,500 | ₱1,500 |
| Extra charge ₱500 | From ₱2,000 ("₱1,500 for the service + ₱500 for this design") | ₱2,000 |
| Ask for a quote | Price on quotation | ₱0 — the shop quotes it |
| *(design with no service)* | its own stored price | its own price |

Stored as `catalog_items.pricing_mode` + `extra_charge` (additive migration). The old `price` column is kept: designs with no service still use it, and past orders keep the totals they were saved with.

## 3. Owner → customer, step by step

1. **Owner creates a Service** with a starting price (Dashboard → Services).
2. **Owner adds Designs** (Dashboard → Catalog Designs). In the title box: name → **Service** → **Price for this design** (same / extra / quote). No price to type unless the design has no service.
3. **Published** = shop approved and not hidden, service active, design active and not hidden by the admin (`CatalogItem::listed()`), branch verified (`StoreBranch::live()`).
4. **Customer searches** "barong". A shop shows only if its name, place, service name/category or a listed design matches. Its row lists **only the matching services** (`matching_service_ids`; "tuxedo" → Bespoke Suit via its designs), not every service the shop has.
5. **Customer opens the service**: details, price, and **Designs for this service**. Opening the shop from search keeps the search ("barong" ×) and filters its services by the same rule.
6. **Customer opens a design**: the service's price (or extra / quote) with one plain sentence, then **Book an Appointment** (or **Bulk Order** for team jerseys).

## 4. Three ways an order starts (kept separate)

| Path | What it really is in the code | Becomes a job order when |
| --- | --- | --- |
| **Appointment** | Customer books a visit (`PublicBookingController::submit` → appointment `pending`). Staff confirm, reject (with reason) or reschedule. | Only when staff/owner create a job **from** an approved appointment (`POST /jobs` with `appointment_id`). Never automatically. |
| **Online order request** | Customer-created job orders: Bulk Order (team jerseys), Repair Request (repair services), Made to Order (endpoint exists, no screen). | Created at once as `pending` with the confirmation flow on. |
| **Walk-in** | Owner/manager creates the job directly at the counter (`POST /jobs`, no appointment → `intake_channel = walk_in`). Plain staff must start from an appointment. | At once, as `pending`. |

**Before production (all paths):** the quotation must be **final**, specs approved, the **customer approves** the price (in person or from My Orders), and the required deposit is **verified** (`OrderReadiness::confirmationBlockers`). Starting production also needs materials ready, measurements verified (when needed) and a tailor assigned (`startBlockers`). A changed total after approval clears the approval (`OrderQuotation::apply`).

## 5. Still open / to decide with a real shop owner

1. **Existing designs now show their service's price.** Some were higher (tuxedos), some lower (jerseys ₱580–700 vs service ₱1,000). Decide per shop: lower the service's starting price, or set extra charges on the designs that cost more.
2. **School & Organization Uniforms has no price**, so its designs now say "Price on quotation" (they showed ₱650–850 before). Enter a service price if the shop has one.
3. **No general "order this service online" request** (choose a service + own reference, no design). Only Bulk Order, Repair Request and the unused Made to Order exist. Planned by the leader as "online order same as walk-in".
4. **Walk-in ready-made sale** (`NewWalkInOrderModal` / `WalkInOrdersView`) is not rendered on any page, so it was left unchanged; it still uses the old design price if revived.
5. **Fixed vs starting price** is not a setting: every service price is shown as a starting price. Add a "fixed price" option only if shops ask for it.
