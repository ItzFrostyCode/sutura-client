# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Davao City tailoring shop owners (and their branch managers/staff, who share the same dashboard role-gated) — small-to-mid custom tailoring, uniform, and formal-wear businesses currently running on a manual, walk-in + Facebook-Messenger workflow with no centralized tracking. Subscribed at Basic, Pro, or Premium tiers, which gate staff-count and multi-branch access.

Secondary (separate modules, out of scope for this repo's Shop Owner work): customers discovering/tracking orders, and a platform System Admin approving shop registrations.

This PRODUCT.md and any future `impeccable` design work in this repo should stay scoped to the **Shop Owner Module** — the `/dashboard/*` owner-facing surface — not the customer-facing storefront/booking flow or the (not-yet-built) admin frontend.

## Product Purpose

Centralize and digitize tailoring business operations: real-time job order tracking from inquiry through pickup, secure digital measurement storage, automated notifications, subscription-tiered multi-branch shop management, and business analytics. Directly replaces a paper job-ticket-card-pinned-to-fabric workflow and vague "*on going pa po*" Messenger replies with a real production pipeline the owner updates and the customer can see.

## Positioning

Not inventory or accounting software, and not a payment gateway — it answers exactly one question neither a notebook nor Messenger can: "where is this order right now, and who's paying what." The interaction patterns are deliberately borrowed from systems people already use daily (e-commerce order-status steppers, courier tracking-number lookup, SaaS pricing tiers, lightweight ticketing, map-based discovery) rather than invented from scratch — applying proven, familiar UX to an underserved manual process is the actual pitch, not novelty.

## Operating Context

Real shop floor, not a back office: an owner or staff member is running production and taking measurements *while* using this, often mid-fitting — every extra tap during a fitting is a real cost. Peak season (uniform batches, school orders) creates real chaos the paper-ticket system already fails at (lost tickets, double appointments, no proof of progress). Payments happen via GCash or bank transfer, tracked for status only — the system never moves money itself. Multi-branch shops need branch-scoped views everywhere (jobs, staff, appointments, analytics), not just on a dedicated branches page.

## Capabilities and Constraints

- Real production pipeline (not the thesis paper's idealized version): `pending → design → pattern_making (or mass_cutting_printing for bulk/team-roster orders) → cutting → sewing → ready_for_fitting → final_adjustments → qc_ironing → ready_for_pickup → completed`, plus `on_hold`/`cancelled`/`rejected`.
- Subscription tiers (Basic/Pro/Premium) gate staff count and multi-branch access; downgrades are blocked if they'd leave current usage over the new limit, but day-to-day operations (bookings, orders) are never gated by plan quota.
- Store pickup only — no logistics/courier/delivery management (explicitly out of the approved thesis scope).
- No inventory/material stock tracking, no payroll/utility-cost tracking, no AI-driven forecasting, no hardware integration (measurements always manually entered), no native payment gateway (status/amount tracking only).
- A public `tracking_code` lookup exists backend-side (no-login order status check) but has no frontend page yet.
- Backend: Laravel API. Frontend: this repo, Next.js/React/TypeScript/Tailwind.

## Brand Commitments

Name: **SUTURA**. Established visual identity (do not replace without explicit direction): a warm, muted taupe-and-cream palette — `#9A8073` (taupe, primary accent), `#FAF6F3` (cream background), `#EBE6E0` (border), `#2D2A26` (primary text), `#827A73`/`#524A44` (secondary text), `#B26959` (danger/accent), `#7A8B76` (success/sage). Recently deliberately flattened to a clean, shadow-free, no-glassmorphism aesthetic — flat cards (border only, no drop shadow), no `backdrop-blur` anywhere, one accent color per surface. Printed materials (job tickets, receipts) are strictly black/white/grayscale, sharp corners, no icons — ink-economy by design, not a stylistic accident.

## Evidence on Hand

Real interview research behind this thesis (not fabricated personas): Davao City tailoring shop owner interviews documented in `Tailorshop,Sublimationshop,FashionShop.txt` (customer pain points, current manual workflow, proposed tracking stages) and the approved capstone proposal (`Title&Objectives.md`, `suturathesisapproved.txt`). No real customer testimonials, benchmarks, or pricing case studies exist or should be fabricated — all seed/demo data in local dev is synthetic (`LocalTestSeeder.php`), not real shop data.

## Product Principles

1. Minimize clicks for the shop floor — single-tap stage updates, inline edits, batch actions for bulk orders — the owner/staff are running the shop and the software at once.
2. Every customer-facing order view answers three questions without extra taps: *ano ang ginatahi* (what), *saan na ang order* (stage), *magkano na ang nabayad* (payment) — a visible progress indicator, not a bare status word.
3. Desktop-first, data-dense for the shop floor; the customer-facing side is the mobile-first, card-layout counterpart — don't cross the two patterns.
4. Multi-branch is first-class, not an afterthought — any new list/dashboard view needs a branch filter.
5. Borrow proven interaction patterns (order tracking, tiered pricing, ticketing, map discovery) over inventing new ones; the value is applying familiar UX to an underserved manual workflow, not novelty for its own sake.

## Accessibility & Inclusion

No project-specific accessibility requirement has been established yet; standard web accessibility practice applies by default.
