# Cross-Module Data / API Dependency Map

Frontend page → API endpoint → backend controller → database entity, for every significant surface across all four modules. Verified against actual code. Where an Owner API does not exist yet, it says so explicitly rather than fabricating a path.

---

## Customer / Guest

| Frontend page | API | Controller | Entity |
|---|---|---|---|
| `/` , `/search`, `/stores` | `GET /public/stores`, `/public/catalog-items`, `/public/services` | `StoreController::publicIndex`, `CatalogController::publicShowroom/publicIndex`, `ServiceController::publicIndex` | `Store`, `CatalogItem`, `Service` |
| `/store/[store_id]` | `GET /public/stores/{slug}` (+ services/packages/posts/reviews) | `StoreController::publicProfile` + siblings | `Store`, `Service`, `ServicePackage`, `StorePost`, `StoreReview` |
| `/store/[store_id]/catalog/[item_id]` | `GET /catalog/{storeId}/{itemId}` | `CatalogController::show` | `CatalogItem`, `CatalogImage` |
| `/store/[store_id]/book` | `POST /catalog/{store:slug}/book` | `PublicBookingController::submit` | `Appointment` (+ shadow `User` if new) |
| `/store/[store_id]/repair-request` | `POST /stores/{slug}/repair-requests` | `JobOrderController::customerRepairRequest` | `JobOrder` |
| `/track/[code]` | `GET /track/{trackingCode}` | `JobOrderTrackingController::show` | `JobOrder` (safe field subset) |
| `/account/orders/[id]` | `GET /my-orders/{id}` | `JobOrderTrackingController::myOrderDetail` | `JobOrder`, `Measurement` (via `measurement_id`) |
| `/account/appointments` | `GET /my-appointments` | `AppointmentController::myAppointments` | `Appointment` |
| `/account/measurements` | `GET /my-measurements` | `MeasurementController::myMeasurements` | `Measurement` (own `customer_id` only) |

## Staff (shared `/dashboard`, narrower authority)

| Frontend page | API | Controller | Entity |
|---|---|---|---|
| `/dashboard/appointments` (check-in) | `PUT /stores/{id}/appointments/{id}` `{checked_in_at}` | `AppointmentController::update` | `Appointment` |
| `/dashboard/appointments` (follow-up) | `POST /stores/{id}/appointments/follow-up` | `AppointmentController::createFollowUp` | `Appointment` |
| `/dashboard/jobs/[id]` (production/ETA/material status) | `PUT /stores/{id}/jobs/{id}` | `JobOrderController::update` | `JobOrder` |
| `/dashboard/measurements` | `POST/PUT /stores/{id}/measurements` | `MeasurementController::store/update` | `Measurement` |
| `/dashboard/customers` | full CRUD `/stores/{id}/customers` | `CustomerController` | `User` (customer role) |

## Owner / Branch Manager (existing, pre-dating this phase)

| Frontend page | API | Controller | Entity |
|---|---|---|---|
| `/dashboard/profile` | `PUT /stores/{id}` | `StoreController::update` | `Store` |
| `/dashboard/branches` | `POST/PUT/DELETE /stores/{id}/branches` | `StoreBranchController` | `StoreBranch` |
| `/dashboard/services` | `POST/PUT/DELETE /stores/{id}/services` | `ServiceController` | `Service`, `ServicePricing` |
| `/dashboard/catalog` | `POST/PUT/DELETE /stores/{id}/catalog` | `CatalogController` | `CatalogItem`, `CatalogImage` |
| `/dashboard/staff` | `POST/PUT/DELETE /stores/{id}/staff` | `StaffController` | `StaffProfile`, `User` |
| `/dashboard/payments` | `POST /jobs/{id}/pay`, `PUT .../verify-payment` | `JobOrderController::pay`, `AppointmentController::verifyPayment`, `CatalogOrderController::verifyPayment` | `Payment`, `Appointment`, `CatalogOrder` |
| `/dashboard/billing` | `POST /stores/{id}/subscription` | `SubscriptionController::subscribe` | `StoreSubscription` |
| **Store Size Chart** | — | — | **OWNER API — NOT YET IMPLEMENTED** (no route, no controller, no table) |
| **Payment capture/verify (Part B two-step)** | — | — | **OWNER API — NOT YET IMPLEMENTED** (`Payment` model lacks `verified_by`/`verified_at`/`status`) |

## System Admin (backend only, no frontend consumer)

| Would-be frontend page | API | Controller | Entity |
|---|---|---|---|
| (none exists) | `GET /admin/stores`, `PUT .../approve`, `PUT .../reject` | `Admin\StoreController` | `Store` |
| (none exists) | `GET/POST /admin/subscription-plans` | `Admin\SubscriptionPlanController` | `SubscriptionPlan` |
| (none exists) | `GET /admin/tickets`, reply, status | `Admin\SupportTicketAdminController` | `SupportTicket`, `SupportTicketReply` |

---

## Shared entities (accessed by 3+ modules through role-scoped views of the SAME table, never duplicated)

- `Store` — Owner writes, Customer/Staff/Admin all read (scoped differently)
- `Service`, `CatalogItem` — Owner writes, Customer/Staff read
- `Appointment`, `JobOrder` — written by whichever role has current authority (Customer/Owner/Staff, each narrower than the last), read by all three plus a public tracking subset
- `Measurement` — Staff/Owner write, Customer reads own (post-claim), same table serves guest-shop-side and claimed-customer states
- `Payment` — Owner/Manager write, Customer reads own, Admin has zero access

## Shared APIs (one endpoint, multiple roles, response/authority varies)

- `GET/PUT /stores/{id}/appointments/{id}` — Customer (own, via `/my-appointments/{id}` — a distinct endpoint, not the same route), Staff (checked_in_at + 2 transitions), Owner/Manager (full)
- `GET/PUT /stores/{id}/jobs/{id}` — Staff (status/notes/ETA/material), Owner/Manager (everything Staff has plus pay/discount/reject/assign)

## Missing backend support (confirmed, not fabricated)

- Store Size Chart — no route, no controller, no table
- Payment Part B (two-step capture→verify with receipt metadata) — schema doesn't support it
- Branch/location verification, apparel-category validation — no `/admin/*` route found for either
- `SubscriptionPlanController::update/destroy` — do not exist

## Duplicated-logic / duplicated-data risks (found, not yet occurred)

- If Store Size Chart is implemented as a *new* `store_size_charts` table, the risk is copying the whole chart into every `Measurement` row at capture time instead of Staff selecting relevant fields from it — this was explicitly the mistake to avoid per prior session guidance. The chart should be a *reference Staff reads from*, not data duplicated into each `Measurement`.
- `Service` and `CatalogItem` each carry independent `size_chart_*` fields today — if a shop-wide chart is introduced, decide whether these per-item charts are deprecated, kept as overrides, or left alone. Not decided here.
