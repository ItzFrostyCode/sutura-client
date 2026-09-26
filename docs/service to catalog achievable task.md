# SUTURA Task Roadmap & Cross-Module Architecture: Service → Catalog Design

**Document Version:** 2.0 (Production Verified)  
**Target Systems:** `sutura-server` (Laravel 11 REST API) & `sutura-client` (Next.js 14 App Router)  
**Companion Architecture:** `service to catalog design.md`  

---

## 1. Executive Purpose & Architectural Principles

This document defines the actionable implementation tasks, technical data contracts, and cross-module data flows connecting **Owner Configuration**, **Customer Discovery**, **Appointment Scheduling**, and **Staff Job Order Creation**.

### Fundamental Rules
1. **Source of Truth Rule:** Use existing database schemas, API routes, and React components. Do not invent non-existent database tables, redundant columns, or hypothetical order subsystems.
2. **Entity Boundary Rule:**
   - **Catalog Design (`catalog_items`)**: Visual garment artifact & design reference price.
   - **Service (`services`)**: Shop capability, functional taxonomy, & base labor rate.
   - **Order Context**: Ephemeral transaction parameter (`Individual/Custom`, `Bulk/Team`, `Entourage`) specified at checkout or booking.
   - **Job Order (`job_orders`)**: Final binding production contract establishing true total amount, balance, and deadlines.
3. **Appointment Stability Rule:** Preserve the existing 3-step appointment wizard workflow. Enhance context passing and field gating without breaking the existing booking mechanics.

---

## 2. Cross-Module Data Flow & System Integration

The lifecycle of a tailoring engagement flows across four core modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. OWNER / BRANCH MODULE                                               │
│    • Owner creates Services (e.g., Bespoke Suit, Barong, Sublimation)  │
│    • Owner creates Catalog Items and links `service_id` via FK         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Exposed via Public API
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 2. CUSTOMER DISCOVERY & STOREFRONT                                     │
│    • Search & Showroom queries join `catalog_items` with `services`     │
│    • Catalog Detail renders design price (₱4,500) and Service Name     │
│    • Price Separation: Does NOT add service base labor to design price │
│    • CTA toggles: "Bulk Order" (if bulk_sublimation) vs "Book Fitting" │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Context parameters in URL (?ref, ?service_id)
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 3. APPOINTMENT BOOKING WIZARD (3-STEP)                                 │
│    • Auth Gate: Enforced before Step 1, redirects back with query params│
│    • Step 1: Purpose dynamically filtered by design/service context    │
│    • Step 2: Redundant service picker suppressed (`needsServicePicker`) │
│              Branch, slot, material source, & quantity collected       │
│    • Step 3: Read-only review with backward-editable steps             │
│    • Backend stores structured tags in `appointments.notes`            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Appointment accepted by Staff
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 4. STAFF / RECEPTION & JOB ORDER ISSUANCE                              │
│    • Staff views pending appointment with attached design notes & specs│
│    • Staff converts appointment to Job Order:                          │
│      - Auto-populates `customer_id`, `service_id`, and `catalog_item_id`│
│      - Sets finalized custom specs, fabric, measurements/roster, price │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Verified Codebase Implementation Status

The following matrix documents the exact technical state of the SUTURA codebase:

### 3.1 Backend Schema & Endpoints (`sutura-server`)

| Layer / Feature | Component / File | Implementation Status | Technical Details |
| :--- | :--- | :---: | :--- |
| **Catalog Foreign Key** | Migration `2026_09_17_165104_add_service_id_to_catalog_items_table.php` | **Active / Verified** | `catalog_items.service_id` nullable FK constrained to `services.id` with `nullOnDelete()`. |
| **Catalog Model** | `app/Models/CatalogItem.php` | **Active / Verified** | Defines `belongsTo(Service::class)` and `belongsTo(Store::class)`. |
| **Owner Catalog CRUD** | `CatalogController.php::store`, `::update` | **Active / Verified** | Validates `service_id` via `Rule::exists('services', 'id')->where('store_id', $store->id)`. |
| **Catalog Show Query** | `CatalogController.php::show` | **Active / Verified** | Loads `service:id,name,service_types,min_order_qty` and `store.branches`. |
| **Public Showroom** | `CatalogController.php::publicShowroom` | **Active / Verified** | Joins active catalog items with store branches and Haversine distance calculations. |
| **Appointment Booking** | `PublicBookingController.php::book` | **Active / Verified** | Validates `service_id` existence, checks customer auth, and writes structured notes. |
| **Bulk Order API** | `JobOrderController.php::bulkOrder` | **Active / Verified** | Accepts `catalog_item_id`, `store_branch_id`, `organization_name`, and `roster` array. |

---

### 3.2 Customer Frontend Architecture (`sutura-client`)

| Screen / Component | File Path | Implementation Status | Technical Details |
| :--- | :--- | :---: | :--- |
| **Catalog Detail Hook** | `src/components/store-catalog-detail/hooks/useCatalogItemDetail.ts` | **Active / Verified** | • Detects bulk: `isBulkItem = service.service_types.includes('bulk_sublimation')`<br>• Constructs `bookHref`: `/store/${storeId}/book?ref=...&service_id=...&ref_price=...`<br>• Controls `BulkOrderSheet` for team rosters. |
| **Catalog Product Info** | `src/components/store-catalog-detail/CatalogProductInfo.tsx` | **Active / Verified** | Enforces **Price Separation Principle**: Displays `item.price` prominently; does not display additive service base labor. |
| **Booking Wizard Hook** | `src/components/booking/hooks/useBookingWizard.ts` | **Active / Verified** | • Auth gate redirects unauthenticated guests before Step 1.<br>• Purpose gating: restricts purposes to `Consultation` & `Measurement` for catalog designs.<br>• `hasServiceContext = !!serviceIdParam || !!refName`.<br>• `needsServicePicker = false` when context is known. |
| **Step 1: Purpose** | `src/components/booking/steps/BookingStep1Purpose.tsx` | **Active / Verified** | Renders context-gated cards (`consultation`, `measurement`, `alteration`, `fitting`, `pickup`). |
| **Step 2: Schedule** | `src/components/booking/steps/BookingStep2Schedule.tsx` | **Active / Verified** | Branch selector with distance, date/time picker, material source (`own` vs `shop`), and quantity. |
| **Step 3: Review** | `src/components/booking/steps/BookingStep3Review.tsx` | **Active / Verified** | Read-only summary card with direct `[Edit]` triggers returning to Step 1 or 2 without data loss. |
| **Bulk Order Sheet** | `src/components/booking/sheets/BulkOrderSheet.tsx` | **Active / Verified** | Form for Organization Name, Branch Picker, and player roster (`name`, `size`). Validates `min_order_qty`. |

---

### 3.3 Owner & Staff Management Modules

| Screen / Component | File Path | Implementation Status | Technical Details |
| :--- | :--- | :---: | :--- |
| **Owner Catalog Form** | `src/components/catalog/form/BasicInfoSection.tsx` | **Active / Verified** | Form input allowing Store Owner to select parent `service_id` for catalog garments. |
| **Staff Job Creation** | `src/components/jobs/form/useJobCreateForm.ts` | **Active / Verified** | Auto-resolves `service_id` from selected `catalog_item_id`. |
| **Customer Service Form** | `src/components/jobs/form/CustomerServiceSection.tsx` | **Active / Verified** | Links job orders to catalog items and services with auto-filled defaults. |

---

## 4. Canonical 50 Catalog Designs Mapping (Store 1)

All 50 catalog designs in Store 1 (`Thread & Needle Tailoring`) are systematically organized under the 4 primary production services:

```
Store 1: Thread & Needle Tailoring (8 Total Services)
├── Service 4: Bridal & Wedding Gown Design (15 Catalog Designs)
│   └── IDs: 1, 2, 4, 5, 9, 12, 15, 23, 28, 41, 42, 44, 47, 49, 50
│
├── Service 1: Custom Sublimation Team Jerseys (21 Catalog Designs)
│   └── IDs: 3, 6, 7, 8, 11, 17, 18, 20, 21, 22, 24, 29, 30, 31, 33, 35, 36, 38, 43, 46, 48
│
├── Service 2: Bespoke Suit Tailoring (8 Catalog Designs)
│   └── IDs: 13, 14, 19, 25, 26, 27, 34, 39
│
├── Service 3: Barong Tagalog Tailoring (5 Catalog Designs)
│   └── IDs: 16, 32, 37, 40, 45
│
├── Flagged for Data Cleanup (1 Catalog Item)
│   └── ID: 10 (`images` placeholder)
│
└── Services with 0 Direct Catalog Designs (By Architectural Design)
    ├── Service 5: School & Organization Uniform Sewing (Service-level custom quotes)
    ├── Service 6: Garment Alterations & Repair Services (Customer garment labor)
    ├── Service 7: Corporate & Team Jersey Printing (Production workflow; reuses Service 1 designs)
    └── Service 8: Embroidery & Logo Digitizing (Production embellishment add-on)
```

---

## 5. Achievable Implementation & Verification Tasks

To ensure complete production integrity, future developers and AI agents must follow this sequential task roadmap:

### Task 1: Verify Database Mapping Integrity
- **Action:** Ensure all `catalog_items` for Store 1 have their `service_id` foreign key correctly assigned.
- **Verification Rule:**
  - Designs 1, 2, 4, 5, 9, 12, 15, 23, 28, 41, 42, 44, 47, 49, 50 → `service_id = 4` (Bridal & Wedding Gown Design).
  - Designs 3, 6, 7, 8, 11, 17, 18, 20, 21, 22, 24, 29, 30, 31, 33, 35, 36, 38, 43, 46, 48 → `service_id = 1` (Custom Sublimation Team Jerseys).
  - Designs 13, 14, 19, 25, 26, 27, 34, 39 → `service_id = 2` (Bespoke Suit Tailoring).
  - Designs 16, 32, 37, 40, 45 → `service_id = 3` (Barong Tagalog Tailoring).
  - Item 10 (`images`) → Flagged for catalog cleanup; do not invent a service for raw filename artifacts.
- **Backend Integrity Check:**
  ```bash
  php artisan tinker --execute="\App\Models\CatalogItem::where('store_id', 1)->whereNull('service_id')->count();"
  ```

---

### Task 2: Validate Price Separation Across Customer Views
- **Action:** Verify that no customer-facing view adds `catalog_items.price` and `services.base_price`.
- **Verification Rule:**
  - Catalog Detail Page must display only `item.price` as the primary garment price.
  - The linked service name must appear as descriptive metadata (e.g., *"Service: Barong Tagalog Tailoring"*).
  - Service directory cards display *"Starting at ₱X,XXX"*.
  - Final binding total is determined exclusively in the Job Order contract.

---

### Task 3: Maintain Appointment Context & Purpose Gating
- **Action:** Ensure the 3-step booking wizard dynamically responds to entry context without altering the underlying appointment system.
- **Verification Rule:**
  - **Auth Gating:** Unauthenticated visitors tapping "Book Appointment" must be redirected to `/login?redirect=...`, returning to the exact booking URL with all query parameters intact upon login.
  - **Purpose Restriction:** Catalog design entries (`?ref=...`) must restrict Step 1 options to `Consultation` and `Measurement` (suppressing `Alteration` and unlinked `Pickup`).
  - **No Duplicate Service Picker:** When `ref` or `service_id` is present in the query string, Step 2 must hide the service dropdown selector (`needsServicePicker = false`).
  - **Material Responsibility:** Step 2 must provide a clear option for material sourcing:
    - *"I'll bring my own fabric / sample"*
    - *"I'll use the shop's material"*
  - **Structured Persistence:** On submission, appointment notes must store structured context tags:
    ```text
    [Design Reference: {name} (₱{price}) — Size {size} — {color}]
    [Material: Customer will bring own fabric/sample — {details}]
    [Quantity: {qty} people/items]
    ```

---

### Task 4: Preserve Bulk vs Individual Order Distinction
- **Action:** Ensure that bulk ordering is handled as an order context, not by duplicating catalog designs.
- **Verification Rule:**
  - Catalog designs whose linked service carries `bulk_sublimation` must provide the `Bulk Order` action button opening `BulkOrderSheet`.
  - Submitting `BulkOrderSheet` calls `POST /stores/{store_id}/bulk-orders` with `roster: [{name, size}]` and validates `min_order_qty`.
  - Customers ordering a single jersey can still use the regular appointment flow with Order Context = `Individual / Custom`.
  - Entourage gown orders and group suits utilize the appointment flow with quantity specifications, maintaining a single catalog design record.

---

## 6. Documentation Alignment & Cross-Reference Matrix

This roadmap is fully synchronized with the following core architectural documents:

| Reference Document | Synchronized Topics |
| :--- | :--- |
| `service to catalog design.md` | Canonical 1-to-50 design mapping, Store 1 service catalog, pricing separation, and panel defense arguments. |
| `sutura-client/docs/CUSTOMER-WORKFLOW.md` | Customer showroom browsing, catalog detail interactions, and booking wizard specifications. |
| `sutura-client/docs/OWNER-BRANCH-MODULE.md` | Store owner service creation, catalog design management, and branch assignments. |
| `sutura-client/docs/STAFF-WORKFLOW.md` | Staff appointment intake, measurement card recording, and Job Order generation. |
| `sutura-client/docs/PAYMENT-WORKFLOW.md` | Downpayment calculation, deposit handling, and balance tracking on Job Orders. |
| `sutura-client/docs/architecture/CROSS-MODULE-DATA-FLOW.md` | End-to-end data flow from public storefront to workshop execution. |
| `sutura-client/docs/architecture/SOURCE-OF-TRUTH-MATRIX.md` | Database ownership: `catalog_items` owns design specs; `services` owns craft types; `job_orders` owns binding price. |
