# Module 4: System Administrator

**Owner:** Bongo, Jossua A. (Leader)

## Objectives it answers

> **Administrative Dashboard** for subscription monitoring, the system administrator will manage tailoring shop registration approvals, validate apparel categories, verify branch map locations, and oversee platform-wide activity and system performance.

> **Subscription and Account Management** (admin side): approve registrations and manage the Basic, Pro and Premium plan definitions.

> **Interactive Analytics Dashboard** (admin side): *"Administrators can monitor subscription activity, total registered shops, and platform revenue trends."*

## Current status: read this first

**The admin backend (API) is built. The admin frontend has no pages yet.** Everything below exists as server endpoints, but there is no admin screen to click through. For the demo, the admin screens have to be built (Bongo's module), or these can only be shown through API calls.

## What the backend already does

| Feature | Endpoint | Notes |
|---|---|---|
| List shops (filter by status) | `GET /admin/stores` | pending / approved / rejected |
| **Approve** a shop | `PUT /admin/stores/{id}/approve` | Owner gets an **email + in-app** notice: "Your shop has been approved." |
| **Reject** a shop | `PUT /admin/stores/{id}/reject` | Reason required; owner gets an email + in-app notice with the reason. |
| List / create subscription plans | `GET`, `POST /admin/subscription-plans` | |
| Support tickets | `GET /admin/tickets`, `GET /admin/tickets/{id}`, reply, change status | Includes customer "Report this product" tickets. |
| **Warn** about a catalog design | `POST /admin/catalog-items/{id}/warn` | Listing stays up; owner asked to fix it. |
| **Hide / unhide** a catalog design | `PUT /admin/catalog-items/{id}/hide`, `/unhide` | Reason required to hide. |
| **Hide / unhide** a whole shop | `PUT /admin/stores/{id}/hide`, `/unhide` | Reason required to hide. |

Only registration decisions and moderation notices send **email**. Everything else is in-app only, to avoid inbox spam.

## Post-moderation (how reports are handled)

**Listings go live immediately.** The admin acts afterward, only when there's a report. This matches the paper's Admin Dashboard description: the admin can *"audit merchant profiles, or toggle baseline system visibility constraints if a storefront breaches service rules."*

1. A customer taps **Report this product** (Copyright / Offensive / Illegal / Other, plus an optional note).
2. A **support ticket** is created, linked to the exact catalog design.
3. The admin reviews it and chooses one of three steps:

| Step | When | Effect |
|---|---|---|
| **Warn** | Small issue, e.g. one bad photo | Owner is notified to change it. **The listing stays visible.** |
| **Hide the design** | Not fixed, or serious | Customers can't see it. The owner can still edit it to fix it, but **can't republish it**; the admin reviews and unhides. |
| **Hide the shop** | Repeated or serious violations | The whole shop disappears from search, map and profile. Neither the owner's settings nor a subscription renewal can undo it; only the admin can. |

Every action is **recorded in the audit log** and **notifies the owner** with the reason.

**Deliberately not included:** automated content checks (keyword or AI scanning) and a points/strike penalty system. Moderation is always a human decision, which keeps it inside the thesis scope (no AI) and easy to explain.

## Suggested wording for the paper or Terms

> "Shop posts, services, and catalog designs go live immediately. Customers may report a listing that appears to violate the platform rules. The System Administrator reviews each report and may ask the shop to correct it, hide the listing, or, for repeated or serious violations, restrict the shop's visibility."

## Likely panel questions

**Q: How do you make sure only legitimate shops appear?**
A: New shops start as pending. Only **approved** shops appear in search, the map and public profiles. The admin approves or rejects with a reason, and the owner is notified by email.

**Q: What if a shop posts something offensive?**
A: A customer reports it, and the admin warns, hides the design, or hides the shop. The owner can fix a hidden design, but only the admin can put it back.

**Q: Do you automatically detect bad content?**
A: No. That would need AI or content scanning, which is outside our scope. Moderation is reactive and manual, based on customer reports.

**Q: Can a hidden shop just unhide itself?**
A: No. An admin takedown uses a separate lock that the owner's visibility toggle and subscription renewal can't clear.

**Q: How does the admin monitor subscriptions?**
A: Plans are defined by the admin. Expiry automatically hides a store, and reminders are sent before it. (The admin-wide subscription report screen is still to be built; see gaps.)

## Known gaps (these are the biggest risks for the defense)

1. **No admin frontend pages at all.** Every feature above needs a screen.
2. **Pending shops can still open their dashboard.** The paper says owners must be approved *"before gaining any access to the system or its internal dashboard features."* Right now, approval only controls **public visibility**: search, map, and the shop profile page (a direct-link gap on the profile page was fixed on 2026-09-27). An unapproved owner can still log in and use the dashboard. Either add an approval gate, or reword the paper to "before appearing on the public marketplace."
3. **No platform-wide analytics endpoint** (total users, total shops, active subscriptions, platform revenue). The Analytics objective promises this for the admin.
4. **Validate apparel categories** and **verify branch map locations** (both named in the objective) have no admin action.
5. **Subscription plans** can be listed and created but not edited or deleted.
6. **No admin-wide audit trail screen.** Audit logs exist per shop.
7. **No Community Guidelines page.** If the terms say "violates the platform rules," the panel may ask where the rules are.

## Thesis paper vs system

- The paper sends **temporary credentials by SMS/email** on approval. The system has owners register their own account; approval sends an email + in-app notice.
- The paper includes **"execute an automatic payment refund"** on rejection. There's no payment gateway, so no automatic refund. Reword to "mark as refunded."
