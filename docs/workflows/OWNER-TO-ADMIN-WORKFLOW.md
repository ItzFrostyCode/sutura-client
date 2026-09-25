# Owner → System Admin Relationship

The distinction between **Owner/Branch business management** (running one shop) and **System Admin platform governance** (overseeing the whole platform). Only what's supported by the current repository is documented — nothing invented.

```
SYSTEM ADMIN
    │  (role:admin — confirmed real, seeded, gates /admin/* only)
    │
    ├── Shop registration approval/rejection
    │     PUT /admin/stores/{store}/approve
    │     PUT /admin/stores/{store}/reject
    │     CURRENTLY IMPLEMENTED (backend only — no admin frontend exists
    │     to actually click these buttons from, see SYSTEM-ADMIN-MODULE.md)
    │
    ├── Subscription plan definitions
    │     GET/POST /admin/subscription-plans (create+list only)
    │     PARTIALLY IMPLEMENTED — no update/destroy exists at all
    │
    ├── Support ticket platform-wide oversight
    │     GET/POST /admin/tickets, reply, status
    │     CURRENTLY IMPLEMENTED (backend), but the code itself admits
    │     ("the admin frontend doesn't exist yet") a store owner won't
    │     see an admin's reply unless they happen to reopen the ticket
    │
    ├── Branch verification
    │     NOT CURRENTLY IMPLEMENTED — no route found
    │
    ├── Location verification
    │     NOT CURRENTLY IMPLEMENTED — no route found
    │
    ├── Apparel category/specialization validation
    │     NOT CURRENTLY IMPLEMENTED — no route found
    │     (STORE_SPECIALIZATIONS is a fixed enum Owner picks from —
    │     there's nothing for Admin to "validate" against today since
    │     it isn't a free-text or Admin-curated list)
    │
    └── Platform activity feed / audit information
          NOT CURRENTLY IMPLEMENTED at the platform level.
          AuditLog exists and is real, but it's OWNER-SCOPED
          (nav-gated isStoreOwner, one store's own log) — there is no
          Admin-facing platform-wide activity view over it.

        ↓ (once approved shops exist)

OWNER / BRANCH
    │  Runs day-to-day business for their own approved store(s) only
    │  Zero visibility into other stores, zero platform-governance actions
    │
    ├── Everything in docs/modules/OWNER-BRANCH-MODULE.md

        ↓

CUSTOMER / STAFF
    │  Consume Owner's business data (see OWNER-TO-CUSTOMER-REFLECTION.md,
    │  OWNER-TO-STAFF-WORKFLOW.md) — never see or touch Admin's platform-
    │  governance layer at all. No route, no page, no data leak found.
```

## Boundary confirmed clean

No overlap was found between Admin's authority and Owner's authority — `role:admin` and `role:store_owner`/`role:branch_manager` are entirely separate middleware groups gating entirely separate route sets. Admin cannot edit a Service/CatalogItem/Appointment/JobOrder/Measurement/Payment for any store (confirmed, no such route exists). Owner cannot approve their own shop, define subscription tiers, or resolve platform support escalations as an Admin action (all `role:admin`-only).

## Status summary

| Admin responsibility | Status |
|---|---|
| Shop registration approval/rejection | Backend implemented, no frontend |
| Subscription tier definitions | Partially implemented (create+list only) |
| Support ticket oversight | Backend implemented, self-admittedly frontend-blind |
| Branch verification | Not currently implemented |
| Location verification | Not currently implemented |
| Apparel category/specialization validation | Not currently implemented |
| Platform-wide activity feed | Not currently implemented |
| Subscription monitoring beyond plan CRUD | Not currently implemented |
