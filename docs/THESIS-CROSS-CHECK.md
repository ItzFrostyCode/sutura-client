# Thesis cross-check — SUTURA (2026-10-02)

> **Update, later the same day — closed since the first version of this report:** durable backups (set `BACKUP_DISK`), appointment confirmations / changes now go by **email**, the word "forecasts" is gone, shop reviews now require a completed order or appointment, Reports-only analytics and exports are **refused by the server** on lower plans (not just locked in the browser), and **SMS** is built (review-before-send, test mode, see below). Still open: the three Admin gaps (custom apparel categories, new-branch verification, system-health panel). Where a table row below still shows the old status, this note wins.

Source: `suturathesisapproved.txt` and `Title&Objectives.md` (title, general objective, six specific objectives, scope, limitations, requirements analysis, use cases, BPMN process models, data model, technical background). The Figma UI design section is excluded, as requested.

Compared against the real code (Laravel API + Next.js client, the four roles: System Admin, Shop Owner / Branch Manager, Tailoring Staff, Customer) and, where it mattered, against a live database. **Legend:** ✅ met · 🟡 partly met · ❌ not built · ➖ intentionally different from the thesis (explained in section 7).

## 1. Verdict

| Part of the thesis | Result |
|---|---|
| Title / general objective | ✅ |
| Objective 1 — Administrative Dashboard | 🟡 approvals, accounts, plans, activity done; **category validation, branch-location verification, "system performance"** missing |
| Objective 2 — Subscription & Account Management | ✅ plans, staff limits, expiry, roles; 🟡 feature gating is mostly UI-only |
| Objective 3 — Shop Discovery & Map | ✅ (map is Leaflet, not Google Maps ➖); 🟡 reviews are not purchase-verified |
| Objective 4 — Tailoring Shop Dashboard | ✅ |
| Objective 5 — Order Tracking & Measurement | ✅ workflow; 🟡 notifications are in-app/email only, **no SMS** |
| Objective 6 — Analytics Dashboard | ✅ (one wording problem: "forecasts") |
| Scope (four modules) | ✅ |
| Limitations | ✅ all five are respected |
| Non-functional requirements | 🟡 backups exist but are not durable; cloud deployment still to be proven |

## 2. Title and general objective

*"SUTURA: A Web-Based Tailoring Shop Tracker System" — digitize discoverability and service tracking of tailoring shops in Davao City through location-based discovery, tier-based subscriptions, real-time order monitoring and analytics.*

✅ All four pillars exist and work end to end: discovery + map, Basic/Pro/Premium subscriptions, the 13-stage order tracker, and the analytics dashboards. Davao City is built in (districts, map defaults).

## 3. Specific objectives

### Objective 1 — Administrative Dashboard
| Thesis requirement | Status | Evidence / gap |
|---|---|---|
| Manage shop registration approvals | ✅ | `/admin/applications`: review documents, approve / reject with reason; approval issues the shop login and emails the temporary credentials |
| Verify business credentials | ✅ | uploaded documents are viewable only by the admin |
| Validate apparel categories | 🟡 | Categories are a fixed list in code (`CanonicalTaxonomy`), so they are "pre-validated". There is an `others` free-text safety valve and **no admin screen to approve a custom category** |
| Verify branch map locations | 🟡 | The admin sees a Maps link while reviewing the application. **Branches added later go live immediately** (`status = active`), with no admin check |
| Oversee platform-wide activity | ✅ | Activity (audit log), accounts (suspend / reactivate), support tickets, moderation (hide a shop or a design) |
| System performance | ❌ | The admin dashboard shows counts and estimated MRR, **no uptime / latency / error indicators** |
| Monitor subscriptions, manage plans | ✅ | Upgrade requests with receipts, subscription report, create / edit plans |

### Objective 2 — Subscription and Account Management
| Requirement | Status | Evidence / gap |
|---|---|---|
| Register and choose Basic / Pro / Premium | ✅ | Public store application with a price quote from the plan row (₱299 / ₱799 / ₱1,999) |
| Subject to admin pre-verification | ✅ | No dashboard access until approved |
| Role-based staff access | ✅ | owner, branch manager, staff; `CheckRole` also enforces the shop boundary (tested: 0 of 53 cross-shop routes leaked) |
| Tier enforcement | 🟡 | **Server-enforced:** staff limit (1 / 5 / unlimited), multi-branch (Premium), featured placement. **UI-only** (`SubscriptionGate`): analytics, gallery, notifications, exports — a Basic shop calling the API directly is not blocked |
| Keep subscription valid for visibility | ✅ | Daily `app:expire-subscriptions` hides expired shops; expiring / expired notices |
| Process subscription payment | ➖ | Manual: the shop uploads a receipt and the admin verifies (no gateway, per the limitation) |

### Objective 3 — Shop Discovery and Map-Based Navigation
| Requirement | Status | Evidence / gap |
|---|---|---|
| Search by garment type | ✅ | garment type, department (Men / Women / Wedding / Office), text |
| Filter by area, specialization | ✅ | Davao district filter, specialization, category |
| Real-time branch availability | ✅ | "Open now" from weekly hours + announced closures (now portable to Postgres) |
| Pinned geolocation of verified shops | ✅ | Only approved shops and active branches appear |
| Complete profiles, schedules, itemized pricing | ✅ | hours, branches, services with price tiers, designs, combos, reviews |
| Route directions | ✅ | "Directions" opens Google Maps navigation to the branch |
| Map technology | ➖ | Leaflet / OpenStreetMap, **not** the Google Maps API shown in the use case |
| Verified customer reviews | 🟡 | Any signed-in customer can review a shop; **no "completed order / appointment" check** |

### Objective 4 — Tailoring Shop Dashboard
✅ Profile and branding, service catalog and design catalog, combos, specializations, itemized pricing (tiers), appointment schedule with special hours / closures, public visibility toggle. All with role gating (owner / manager / staff).

### Objective 5 — Order Tracking and Measurement
| Requirement | Status | Evidence / gap |
|---|---|---|
| Staff record and retrieve digital measurements | ✅ | versioned profiles, paper-sheet photos, Finalized / Pending fitting, manual entry only |
| Appointment-based order intake; staff create job orders from fittings | ✅ | Create Job on an approved appointment (own branch, one per appointment) |
| Update production stages | ✅ | 13-stage pipeline with Kanban, per-stage attribution, a repair lane |
| Customers monitor progress, placement to pickup | ✅ | My Orders (stepper, photos, balance) and the public tracking code |
| Automated notifications at each stage | 🟡 | In-app **and email** at stage transitions and "ready"; **no SMS** |
| Calculate estimated pick-up date | ✅ | Suggested from the service / design turnaround, editable |
| Owner reviews order feasibility → approve / reject | ✅ | Pending job review gate; rejection takes a reason |
| Allocate materials and labor | ➖ | Labor allocation = stage attribution. Materials / stock is **out of scope** in the thesis itself |
| QA check, adjustments, ready for fitting, fitting loop | ✅ | `qc_ironing`, `final_adjustments`, `ready_for_fitting` with an automatic fitting appointment and a fitting-limit rule |
| Settle final balance, digital receipt, rate | ✅ | balance gate before completion, printable receipt, reviews |
| Process payment via a gateway; automatic refund | ➖ | Deposits and payments are **tracked** (cash, GCash, Maya, bank): the customer pays outside SUTURA and sends proof, the owner verifies. No refunds are issued automatically (consistent with the payment limitation) |

### Objective 6 — Interactive Analytics Dashboard
| Requirement | Status | Evidence / gap |
|---|---|---|
| Admin: subscription activity, total shops, platform revenue | ✅ | `admin/dashboard`, `admin/reports/subscriptions` (estimated MRR by plan) |
| Owner: monthly sales, outstanding balances, staff productivity, completion rates | ✅ | `analytics`, `analytics/staff`, `analytics/branches`, `analytics/subscription`; Reports page with outstanding balances, on-hold, unclaimed pick-ups |
| No predictive analytics | 🟡 | None is built, but the Premium plan text for "Advanced dashboard" says **"forecasts"** — wording contradicts the limitation |

## 4. Scope — the four modules and their workflows

| Module | Thesis use cases | Status |
|---|---|---|
| **Administrative** | Login, Monitor Subscription, Manage Accounts (+ Manage Plan), Manage Registration | ✅ (`/admin/*`, separate admin login) |
| **Shop Owner** | Login, Manage Shop Profile, Manage Staff Account (+ Manage Role), View Dashboard Analytics | ✅ |
| **Tailoring Staff** | Login, Manage Measurement, Manage Progress (+ Update Status) | ✅ — staff Home, assigned appointments, create job from a fitting, support tickets. The thesis says "dedicated portal"; staff use the **same `/dashboard`, role-gated** (➖) |
| **Customer** | Login, Search & Filter (+ Track Order), View Map, Book Appointment | ✅ — mobile-responsive 320–599px |

**Appointment BPMN** (customer → system → owner): validate slot ✅ · owner approves or declines with a reason ✅ · reschedule / cancel by the customer ✅ · confirmation to the customer 🟡 (in-app only, no email / SMS).
**Onboarding BPMN** (shop → system → admin): application → admin verifies → credentials issued → forced password change ✅ · reject with refund ➖ (manual).

## 5. Limitations

| Limitation | Respected? |
|---|---|
| No hardware / machinery integration | ✅ |
| Requires internet; no offline mode | ✅ (an offline screen is shown) |
| Measurements entered manually, no scanners / RFID | ✅ |
| Payments tracked, no gateway, no external reconciliation | ✅ (no gateway SDK anywhere in the code) |
| No predictive analytics / AI | ✅ in code; 🟡 the "forecasts" wording above |
| Notifications depend on third parties | ✅ (email via SMTP) |

## 6. Non-functional requirements

| Requirement | Status |
|---|---|
| Reliability / uptime | 🟡 not measurable yet — deployment still to be proven (see `DEPLOYMENT-RAILWAY-SUPABASE.md`) |
| **Automated database backup every 24 hours** | 🟡 `app:backup-database` runs daily, **but writes to the server's local disk**, which is wiped on every Railway redeploy; it also needs the scheduler running |
| Security of customer measurements | ✅ shop-scoped; API audit found no cross-shop or cross-customer access (`API-SECURITY-AUDIT.md`) |
| Usability for non-technical staff | 🟡 usability scoring (SUS) belongs to the testing phase; nothing recorded yet |
| Scalability / multi-tenant | ✅ every record is shop-scoped, branch-scoped for managers and staff |
| Cloud deployment | 🟡 planned Vercel + Railway + Supabase; dry run on Postgres still pending |

## 7. Intentional differences (be ready to explain)

1. **Shared dashboard, not a separate staff portal** — a standalone staff portal was deliberately removed; staff and owners share `/dashboard`, gated by role.
2. **Map = Leaflet / OpenStreetMap**, with directions handed off to Google Maps.
3. **No payment gateway** — in line with the stated limitation; "Process Payment" and "automatic refund" in the diagrams become *record, verify and reconcile manually*.
4. **Database:** thesis says MySQL on PlanetScale; the code runs on MySQL locally and targets **Supabase (Postgres)** for deployment (`DEADLINE.md`).
5. **Materials allocation / inventory** — excluded by the thesis scope; only labor (stage) attribution exists.
6. **Appointment-level and job-level assignment are separate** by design; job attribution happens automatically when staff move a job into a stage.

## 8a. Done on 2026-10-02

| Gap | Now |
|---|---|
| Backups lost on redeploy | `app:backup-database` uploads to the `BACKUP_DISK` disk (e.g. Cloudflare R2) and removes the local copy; the scheduler must be running (cron / `schedule:work`) |
| Appointment confirmation only in-app | Email too, for confirmed / rejected / rescheduled / cancelled (walk-ins excluded) |
| "Forecasts" wording | Removed from the Premium "Advanced dashboard" text |
| Reviews not verified | A shop can be reviewed only after a completed order or appointment with it |
| Plan gating UI-only | `PlanGate`: staff / branch analytics and bulk exports return `403 plan_required` below Premium |
| No SMS | **Text messages**: each text lands in an outbox first and waits for the shop to check the number and wording (or auto-sends if the owner chooses). Only 5 moments are texted by default (reschedule, shop cancellation, day-before reminder, ready for fitting, ready for pick-up); every text is one 160-character SMS. Test mode by default — nothing is delivered. Real delivery needs a provider account (Semaphore driver included, untested live) |
| Receipts could not be downloaded in bulk | Payments → **Statements**: one receipt, the ones you tick, or a whole period (week / 2 weeks / half-month / month / year / all time from the first record) as ZIP of images + CSV, plus a printable statement |

## 8. Gaps to close, ranked

| # | Gap | Why it matters | Effort |
|---|---|---|---|
| 1 | Backups to durable storage (R2 / S3) | Objective-level NFR; right now a redeploy loses them | 1–2 h |
| 2 | Appointment confirmation / reschedule / rejection by **email** (stage changes already email) | Scope: "notifications when a client books" and BPMN confirmations | 1 h |
| 3 | Remove the word **"forecasts"** from the Premium "Advanced dashboard" text | Contradicts the Limitations | 5 min |
| 4 | Reviews only after a completed order / appointment | Thesis calls them "verified customer reviews" | 1 h |
| 5 | Server-side plan gating (analytics, gallery, exports, notifications) | Tier enforcement is only a UI lock today | 2 h |
| 6 | Admin: verify **new branches** before they show on the map | Objective 1: "verify branch map locations" | ½ day |
| 7 | Admin: approve / reject **custom apparel categories** | Objective 1: "validate apparel categories" | ½ day |
| 8 | Admin "system health" panel (database ping, last backup, error count) | Objective 1: "system performance" | 2–3 h |
| 9 | **SMS** notifications | Scope and use cases say "SMS or email"; needs a provider account (Semaphore, Twilio, …) and money | provider-dependent |

Items 1–5 are small and safe before the deadline; 6–8 are the visible Admin gaps; 9 can be defended as "third-party dependent" per the limitations if no provider is available.
