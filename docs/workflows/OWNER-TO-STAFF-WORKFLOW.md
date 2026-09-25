# Owner → Staff Relationship

How Owner/Branch configuration is consumed by Staff — no duplicated Staff copies of Owner configuration.

```
Owner manages Services
    → Staff uses available Service rows in operational workflows
      (GET /services, shared-staff read, used as a picker when creating
      appointments/job orders)
      CURRENTLY WORKING — same Service table, Staff has read-only access.

Owner configures Store Size Chart
    → Staff uses it as a shop-specific measurement reference
      NOT YET POSSIBLE — the Store Size Chart entity does not exist yet
      (confirmed, see SOURCE-OF-TRUTH-MATRIX.md). Staff's current
      measurement capture (SizeChartEditor in single-row mode) works
      entirely independently of any Owner-configured reference —
      Staff manually decides which fields to add per customer, with
      no suggested/default field set. This is the gap the Owner/Branch
      phase is meant to close.

Owner manages Staff
    → Staff access is controlled by Owner/Branch permissions
      CURRENTLY WORKING — Owner creates/edits/removes StaffProfile rows
      (role:store_owner only, branch_manager excluded — see
      MODULE-DEPENDENCIES.md risk #1); Staff's own dashboard nav and
      backend route access derive from that StaffProfile + Role.

Owner manages Shop/Branch information
    → Staff operates within that shop/branch context
      CURRENTLY WORKING — every Staff-facing endpoint is store-scoped
      (route model binding on Store), and branch-scoped where relevant
      (assigned_staff/store_branch_id checks in AppointmentController
      and JobOrderController).
```

## What's real today vs. what's blocked on Owner/Branch implementation

| Owner configuration | Staff consumption | Status |
|---|---|---|
| Services | Read-only picker | **WORKING** |
| Staff roster/permissions | Staff's own access scope | **WORKING** |
| Shop/Branch context | Every Staff action is store/branch-scoped | **WORKING** |
| Store Size Chart | Measurement reference | **BLOCKED** — entity doesn't exist |

## The no-duplication rule applied here

Staff does not, and must not, get its own copy of Service/Catalog/Branch/Staff-roster data — every Staff-facing screen documented in `docs/modules/STAFF-MODULE.md` reads the exact Owner-owned tables listed in `SOURCE-OF-TRUTH-MATRIX.md`, scoped by the shared-staff role-gate group. When Store Size Chart is eventually implemented, Staff's consumption of it must follow the same pattern: read the Owner's one chart, select relevant fields, write only those into a `Measurement` row — never copy the whole chart into the customer record.
