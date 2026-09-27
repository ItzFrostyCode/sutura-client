# Order Flows: Booking, Measurement, and Tracking (Solo vs Bulk)

How an order starts, how sizing is captured, and how production is tracked, each counted **separately** (every case) and **generalized** (the few patterns they reduce to). Checked against the code on 2026-09-27.

## The one decision rule behind everything

```
Specific catalog design chosen?   → use it as context (else use the Service)
Does the job need a visit?        → Appointment
Does the job need measurements?   → Measurement (staff encode it at the shop)
Does the job need a fitting?      → Fitting appointment (automatic at "Ready for Fitting")
```

---

## Part 1: How an order starts (booking cases)

### Separately: 13 cases

**Customer, online, from a Catalog Design**

| # | Case | Button | What the customer can choose | Result |
|---|---|---|---|---|
| B1 | Solo design (Barong, gown, suit) | **Book a Fitting** | Consultation or Measurement | Pending appointment |
| B2 | Bulk-type design (jersey, uniform) | **Bulk Order** | Team name + roster (Name, Size), minimum quantity | Pending job order, **no appointment** |

**Customer, online, from a Service**

| # | Service kind | Purposes offered |
|---|---|---|
| B3 | Custom tailoring | Consultation or Measurement |
| B4 | Alteration / repair | Alteration / Repair |
| B5 | Printing / sublimation / embroidery | Consultation / Order Discussion |
| B6 | Bulk / uniform / team | Consultation / Order Discussion, or Measurement (group) |
| B7 | Service Package (e.g. Barong + Embroidery) | Consultation, Measurement, or Alteration, marked as a package inquiry |

**Customer, online, other entry points**

| # | Case | Result |
|---|---|---|
| B8 | General shop visit, nothing specific chosen | Consultation, Measurement, or Alteration → pending appointment |
| B9 | Already has an order ("I already have an order," or a link from staff) | Adds **Fitting** and **Pickup** → pending appointment |
| B10 | Repair Request page | Pending **repair** job order, **no appointment** |

**Shop side**

| # | Case | Who | Result |
|---|---|---|---|
| B11 | Walk-in appointment | Owner / Branch Manager | Appointment, **auto-confirmed** |
| B12 | Follow-up appointment (next fitting, pickup) | Staff, Owner, Branch Manager | Confirmed appointment; customer notified |
| B13 | Automatic fitting appointment | The system, when a job reaches "Ready for Fitting" | Pending appointment for the shop to confirm with the customer |

A walk-in customer can also get a job order directly, created by the Owner or Branch Manager. Ready-to-wear walk-in sales are a separate record, not a tailoring order.

### Generalized: 3 ways an order starts

| Pattern | Covers | What happens next |
|---|---|---|
| **1. Appointment first** | B1, B3–B9 | `pending` → shop **confirms** → customer visits → staff measure and create the job order |
| **2. Direct request, no appointment** | B2 (bulk), B10 (repair) | Job order starts `pending` → shop **reviews and approves or rejects** |
| **3. At the shop** | B11–B13, walk-in job orders | Created by the shop, confirmed immediately |

**Appointment purposes (5):** Consultation, Measurement, Alteration/Repair, Fitting, Pickup.

**Appointment statuses:** `pending → confirmed → in progress → completed`, or `cancelled` / `no show`.

---

## Part 2: Measurements (after the shop accepts)

**Timing:** measurements are taken **at the in-person appointment, before production**. Payment gates production, not measuring: the job can be in `pending` or `design` with no payment, but it can't enter **pattern making or any later stage** until **50%** is paid ("No DP, No Layout, No Cut").

### Separately: 7 cases

**Solo**

| # | Case | How sizing is recorded |
|---|---|---|
| M1 | Custom fit, new customer | Staff create a **measurement profile** (Upper Body + Lower Body + custom fields). Only filled-in fields display after saving. |
| M2 | Custom fit, returning customer | The latest profile is **preselected**; staff reuse it or save a **new version** (old versions are kept). |
| M3 | Standard size (S, M, L…) | Just the size; tailoring follows standard pattern blocks. No body measurements. |
| M4 | Repair / alteration | **No measurement.** Pre-existing damage notes are **required** instead. |

**Bulk**

| # | Case | How sizing is recorded |
|---|---|---|
| M5 | Named roster (jerseys, SSC) | One row per person: name and size. Staff can also record print name and number; the customer's form has name and size only. |
| M6 | Size count only ("30 pcs department shirts") | A size tally, e.g. 10 S, 15 M, 5 L. No names. |
| M7 | Bulk with some custom-fit people (choir barong) | **Not supported yet.** Proposed: a "Custom" row that staff measure at the shop. |

### Generalized: 3 ways sizing is captured

| Pattern | Cases |
|---|---|
| **Body measurements** (staff-encoded, versioned) | M1, M2 (and M7 once built) |
| **Standard sizes** | M3, M5, M6 |
| **No sizing** | M4 (repair) |

Customers **never type their own measurements**; they can only view them. Thesis: *"manually encoded by authorized users."*

**Customer-supplied fabric** is a separate question from measurement: the order records who supplied the fabric, a short description, and its condition (safe / damaged / lost / returned). No quantities or cost.

---

## Part 3: Tracking

### Separately: 3 production pipelines

| # | Pipeline | Stages | Used by |
|---|---|---|---|
| T1 | **Custom tailoring** | pending → design → pattern making → cutting → sewing → **ready for fitting ⇄ final adjustments** → QC/ironing → ready for pickup → completed | Solo custom orders |
| T2 | **Bulk** | pending → design → **mass cutting/printing** (sublimation) or pattern making (tailored bulk) → cutting → sewing → QC/ironing → ready for pickup → completed | Bulk orders. Fitting only if a custom-bulk sample fitting happens. Named rosters also tick off each person's piece ("12/30 done"). |
| T3 | **Repair** | pending → **queued → in repair → QC check** → ready for pickup → completed | Alterations and repairs |

All three can go to **on hold**, **cancelled**, or **rejected** from most points.

### What the customer sees

- A **step-by-step tracker** matching their pipeline. Fixed 2026-09-27: repairs previously showed no progress at all, and bulk orders showed fitting steps they never go through.
- A simple **phase label**: Order Received → In Production → Fitting / Adjustment → Finalizing → Ready for Pickup → Completed.
- **Payment status** (`unpaid → partial → paid`), balance, estimated ready time, linked appointments, and fabric condition if it's not "safe."
- Guests can do the same with a **tracking code** at `/track`.

### Generalized: 3 production pipelines + 2 side trackers

| What is tracked | States |
|---|---|
| **Production** (one of 3 pipelines above) | stages, shown to the customer as 6 phases |
| **Appointment** | pending → confirmed → in progress → completed (cancelled, no show) |
| **Payment** | unpaid → partial → paid |

---

## Solo vs Bulk, side by side

| | Solo | Bulk |
|---|---|---|
| **Customer button** | Book a Fitting | Bulk Order |
| **Starts as** | Pending appointment | Pending job order |
| **Appointment needed?** | Yes (consultation or measurement) | No, unless a consultation is booked via the Service |
| **Team name** | No | Yes |
| **Sizing** | Body measurements or standard size | Roster of standard sizes, or a size tally |
| **Minimum quantity** | 1 | Set by the shop per Service |
| **50% downpayment before production** | Yes | Yes, for the whole order |
| **Pipeline** | Custom tailoring (T1) | Bulk (T2) |
| **Fitting** | Automatic at "Ready for Fitting," repeatable (fee after the shop's limit) | Only for a custom-bulk sample |
| **Progress detail** | Stage by stage | Stage by stage + per-person checkboxes |
| **Pickup** | At the shop | At the shop |

---

## Known gaps in these flows

1. **Booking purposes come from the service's name, not its type.** The wizard looks for words like "alter," "print," or "uniform" in the service name. A service with an unusual name can be offered the wrong purposes. The catalog page's Bulk Order button correctly uses the real service type.
2. **Staff job form** treats a service as bulk if its type is bulk **or** its name contains "jersey," "sublimation," "uniform," or "esports."
3. **Customer bulk roster** has only Name and Size (staff side also has print name and number).
4. **Custom-fit people inside a bulk order** (M7) aren't supported.
5. **Same person, several identical pieces** has no quantity field on a solo order.
6. **Repairs require 50% before "In Repair,"** though many shops charge repairs at pickup.
7. **Sublimation bulk tracker** shows "Pattern Making" until the job actually reaches "Mass Cutting & Printing," then switches.
