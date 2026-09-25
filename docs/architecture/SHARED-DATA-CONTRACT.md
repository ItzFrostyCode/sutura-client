# Shared Data Contract

The rule this entire documentation set exists to protect: **SUTURA maintains one shared source of truth per domain entity. Different modules consume the same underlying data according to permission — they do not get their own duplicate copy.**

This is not aspirational — it is already how the system is built. This document names the contract explicitly per entity so the Owner/Branch implementation phase has no excuse to break it.

## The contract, per entity

| Entity | Single source of truth | Who writes | Who reads (never a copy) |
|---|---|---|---|
| `Store` | `stores` table | Owner (profile), Admin (approval fields only) | Customer, Staff, Owner, Admin — all read the SAME row, scoped by endpoint |
| `Service` / `CatalogItem` | `services` / `catalog_items` tables | Owner | Customer (public storefront), Staff (pickers), Owner — same rows |
| `Appointment` | `appointments` table | Customer (booking), Owner/Manager (walk-in), Staff (follow-up, checked_in_at) | Customer (`/my-appointments`), Staff, Owner — same rows, different endpoints/field subsets |
| `JobOrder` | `job_orders` table | Owner/Manager (create), Customer (repair-request path) | Customer (`/my-orders`, `/track/{code}`), Staff, Owner — same row; public tracking uses a safe field subset of the SAME row, not a copy |
| `Measurement` | `measurements` table | Staff or Owner | Customer (own, post-claim, via `/my-measurements`), Staff/Owner (store-scoped, includes unclaimed guests) — same table, never a per-role duplicate |
| `Payment` | `payments` table (+ flat fields on `Appointment`/`CatalogOrder` for those two payment paths) | Owner/Manager only | Customer (own, read-only) |
| **Store Size Chart** (future) | Must be ONE table, Owner-owned | Owner only | Staff reads it as reference; Customer never edits it; it must NOT be copied wholesale into `Measurement` rows |

## What "reflection" means in this system (and what it does NOT mean)

"Owner → Customer reflection" does **not** mean syncing data from an Owner table into a separate Customer table. It means: the Customer-facing screen queries the same Owner-owned table through a Customer-scoped (often public) endpoint. The clearest existing proof of this: `/store/[store_id]` is **literally the same route and component** for a public customer viewing a shop profile and the Owner viewing/editing their own storefront inline — not two implementations of "show shop profile," one implementation with a permission-gated edit affordance layered on top.

## Explicit anti-patterns (confirmed NOT present today — keep it that way)

- No `CustomerProfile` model — customers are `User` rows with a `customer` `Role`
- No duplicate Catalog/Service tables per role
- No duplicate Shop/Store tables per role
- No per-role copy of Appointment or JobOrder
- `Measurement` does not duplicate per claim-state — a guest's measurement and a claimed customer's measurement are the same row, same `customer_id`, before and after registration (see `docs/workflows/OWNER-TO-CUSTOMER-REFLECTION.md`)

## The one rule for whatever gets built in the Owner/Branch phase

If a new Owner-facing feature (Store Size Chart, Payment Part B, anything else) is about to create a second copy of data that already exists elsewhere in the system — stop. The correct design links to the existing entity via a foreign key and a permission-scoped read, exactly like every entity in the table above already does. This document is the checklist to hold that design against.
