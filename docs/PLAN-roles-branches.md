# Plan: roles, branches and staff accounts (2026-10-22)

Source: the owner's "FULL IMPLEMENTATION FIX: STAFF CRUD, BRANCH MANAGEMENT, ROLE-BASED ACCESS…" brief, with these decisions:

| Question | Decision |
|---|---|
| Staff create Job Orders? | **No** — owner / branch manager only (walk-in and from appointment). |
| Staff at Ready | Fitting, "Needs a fix" (shop's mistake), hand over. Money stays owner / manager. |
| Which orders staff see / update | All orders of their own branch ("My assigned" stays a filter). |
| Services & designs for a branch manager | **View only** — only the shop owner edits them (they are shop-wide). |
| Defaults (not asked) | Owner/manager sets a temporary password → the new account must change it on first login (reuse the existing forced-change flow). An email that already has an account (e.g. a customer) is refused, never converted. A branch manager counts toward the plan's staff limit. |

Plan limits (already in SubscriptionPlanSeeder, enforced on the server): Basic 2 staff / 1 branch · Pro 5 / 1 · Premium unlimited.

Build in order R1 → R2 → R3. Each phase: `npx tsc --noEmit`, `php -l`, `php artisan route:list`. Same UI rules as PLAN-job-board-flow.md (no native dialogs, toasts, hide what a role can't use, visible reasons, no new modals). `php artisan test` only after the owner OKs it.

## R1 Server lock-down (least privilege, branch isolation)

1. **Staff and Job Orders**
   - `POST /jobs` → owner / manager only (move the route out of the shared group; drop the staff path in `store()`).
   - Generic `PUT /jobs/{id}` for staff: only `notes` and `completion_photo_url` (production notes / photo); anything else → 403 "Staff can only update production." Owner/manager unchanged.
   - Staff may use: production next / back / hold / resume, start production, send to QC / QC passed / Needs a fix (shop's mistake only), Fixed, fitting moves, record handover (not release), progress photos. Staff may not: accept, details approval, pieces & sizes, quotation, approval, deposit, confirm, materials, tailor assignment, cancel, archive, discount, payments, refunds, release, customer's-request charges, ETA.
   - Mirror in the client: hide every control a staff member can't use (New Job Order, Create Job Order on consultations, Edit pieces & sizes, materials, Plan tailors, ETA, etc.).
2. **Branch isolation audit**: every jobs / appointments / staff / branches / customers / measurements / payments / reports endpoint — a branch manager or staff is pinned to `staffProfile->store_branch_id`; IDs from the request never widen it; cross-shop already blocked by `CheckRole`. List each endpoint checked and fix any gap.
3. **Services & designs view-only for branch managers**: catalog, service and package write routes back to `role:store_owner`; `StoreServiceRequest::authorize` too; client `useCanManageOfferings` read-only for branch managers.
4. **Role escalation**: staff creation can only produce `staff` (manager creating) or `staff` / `branch_manager` (owner creating); public `/register` only `customer`; never trust a submitted role / shop / branch id.
5. Feature tests for the above (sqlite in-memory per phpunit.xml) — written, run only after the owner OKs.

## R2 Accounts and branches

1. Extract the account fields of the customer Sign Up page into one shared component (Full name, Gender optional, Email, Password, Confirm password — same validation and password rules) and reuse it in Sign Up (unchanged behaviour), Add Staff and Add Branch.
2. **Add Staff**: owner → picks the branch, role staff; branch manager → no branch picker, own branch, role staff. Employment fields (phone, craft roles, hire date, skills, notes/bio) become optional "More details" on the staff profile page, not the create form; columns stay.
3. **Add Branch** (owner, Premium for a 2nd+ branch): branch details as today (name, street, barangay, landmark, city, contact, hours, map pin, verification) + **Branch manager**: create a new account with the shared fields, or pick an existing staff member of the shop. One DB transaction: branch + user + staff profile (branch manager, this branch) + `manager_id`. No new shop, owner or subscription. Branch without a manager stays allowed; "Assign a manager" later.
4. New accounts: forced password change on first login; email already used → 422 "This email already has an account."; staff limit counts managers.

## R3 Menus per role (hidden in the UI and blocked by route/page guards)

- **Shop owner**: unchanged.
- **Branch manager**: Appointments · Orders · Services (view only) · Staff · Reports (own branch) · My Store Profile (own branch details only; shop identity, subscription and shop-wide settings stay owner-only) · Account Settings · Help & Support. Lands on Orders. Payment verification stays inside each order's Payments tab.
- **Staff**: Appointments · Orders · Account Settings · Help & Support. Lands on Orders. (The old Staff Home is retired.)
- Pages outside a role's menu redirect to its landing page; their owner-only endpoints already refuse.

## Built

R1 built 2026-10-22 (code only; tests written, not run).

R2 built 2026-10-22 — server: `app/Support/ShopAccounts.php` (create, promote, staffLimitMessage, emailTaken, syncPlatformRole, passwordRules), `app/Http/Requests/Store/StoreStaffRequest.php` (email/password/branch rules), `app/Http/Controllers/Api/V1/StaffController::store` (branch scoping, manager-flag guard, staff limit, email-taken 422), `app/Http/Controllers/Api/V1/StoreBranchController` (store + assignManager + managerRules + attachManager + managerProblem), `routes/api.php` (POST branches/{branch}/manager), `app/Http/Controllers/Api/V1/CustomerController::destroy` (owner/manager only), `app/Http/Controllers/CatalogOrderController::update` (payment_status restricted). Client: `src/components/auth/AccountFields.tsx` (new, shared name/gender/email/password+confirm with PASSWORD_RULES checklist), `src/components/branches/BranchManagerSection.tsx` (new, 3-way radio: create/pick/none), `src/components/branches/branchHelpers.tsx` (added manager_mode, manager_staff_id, manager_password_confirmation to BranchFormData/EMPTY_FORM), `src/components/branches/BranchCard.tsx` (Assign manager link when no manager), `src/app/dashboard/staff/new/page.tsx` (new full page), `src/app/dashboard/staff/page.tsx` (Add Staff button → /staff/new), `src/app/dashboard/branches/new/page.tsx` (new full page), `src/app/dashboard/branches/page.tsx` (Add Location → /branches/new), `src/app/dashboard/branches/[id]/manager/page.tsx` (new Assign Manager page). Tests: `tests/Feature/Api/V1/StaffAccountTest.php` (new, 9 cases).

Server (`sutura-server`): `routes/api.php` (POST /jobs, specs/approve, measurements/verify, quotation/approve, materials, customer-items moved to owner/manager; services + catalog writes owner-only), `app/Support/StaffJobUpdateGuard.php` (new, staff may only save notes, completion photo and production-stage status moves; else 403 "Staff can only update production."), `app/Support/BranchPin.php` (new), `JobOrderController` (staff create path removed, manager pinned to own branch, update guard, notify-customer branch check), `OrderFlowPresenter` (`permissions.can_prepare`), `StoreServiceRequest` (owner only), `StaffController` (role/branch escalation and account-takeover guards), `AuthController` + `RegisterRequest` (register always `customer`), `CustomerController`, `CustomerTextController` + `SmsController` + `SmsMessage::scopeForBranch`, `MeasurementController`, `CatalogOrderController`, `StoreSpecialHourController`, `StoreBranchController::index`, `AppointmentController::update`. Tests: `tests/Feature/Api/V1/RoleLockdownTest.php` (new), `JobOrderTest` (staff reject via PUT now 403).

Client (`sutura-client`): `hooks/useShopRole.ts` (new), `useCanManageOfferings` (owner only), services page/grid, `CatalogShowcaseShell`, `CatalogGridView`, `JobsPageHeader`, `SimpleBoard`/`BoardLane`, `jobs/new/page.tsx` (staff redirected), `ConsultationActions`, appointments `nextStep.ts`/`FinishVisit`/`VisitDoneModal`, customers `CustomerMeasurementsTab`/`CustomerProfileHeader`/`CustomerQuickActionsCard`/`CustomerActiveJobsCard`, `readiness/StepAction`/`MaterialsStep`/`readinessTypes`, `steps/stepExtras`, `detail/JobMeasurementCard`/`JobOverviewTab`/`JobMoreMenu`/`JobDetailHeader`, `jobs/[id]/page.tsx`, `useJobDetail` (staff save sends notes + photo only).

Branch isolation audit (a branch manager / staff is pinned to `staffProfile->store_branch_id` through `BranchPin` or the per-controller check; request ids never widen it):

| Endpoint group | Scoped before? | Fix |
|---|---|---|
| Jobs list, show, update, pay, discount, payments, reject, photos, delete/restore | Yes (`branchAccessDenied`, list pinned) | none |
| Jobs create (`POST /jobs`) | No: a manager could send another branch's `store_branch_id` or appointment | Pinned to own branch; other branch or appointment 403 |
| Jobs `notify-customer` | No | Branch check added |
| Order flow (readiness, quotation, confirm, delivery, production, cancel, refunds, rules, split) | Yes (`ChecksOrderAccess`, inline checks) | none |
| Appointments list and actions | Yes (rows with no branch stay shared) | `update` can no longer move a visit to another branch |
| Staff list, show, create, update, delete | Yes | Escalation guards (see item 4) |
| Branches list | No: every branch with staff, manager contacts and order counts | Pinned accounts see only their own branch |
| Branches update | Yes (own branch, no `manager_id`) | none |
| Customers list and profile | No: all branches' jobs, visits and spend | Jobs, visits, totals pinned to the branch (the customer list itself stays shop-wide) |
| Measurements | No branch column (follows the customer, shop-wide by design); create read another shop's visit | Visit must belong to this shop and branch |
| Payments (job) | Yes (via the job) | none |
| Payment methods | Yes | none |
| Walk-in catalog orders | List yes; create/update/discount/verify no | Create pinned; update, discount, verify check the branch |
| Receipts and statements | Yes | none |
| Reports/analytics (`index`) | Yes (manager pinned); branch comparison, staff, subscription are owner-only | none |
| SMS outbox | Yes | none |
| SMS per customer (profile) | No: all branches' texts | Same branch scope as the outbox |
| Support tickets | Own tickets only | none |
| Special hours | No: a manager could add, change or delete another branch's or shop-wide schedules | Own branch only; list shows own and shop-wide |
| Decision queue, staff overview | Yes | none |

Open: an account whose staff profile has no branch is unpinned (single-branch shops); posts and `PUT /stores/{store}` are shop-wide for managers (R3); records with no branch (older appointments, walk-in sales) stay visible to the whole shop.
