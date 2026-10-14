# Audit prompt — run later

**When:** once your research is in `research/`.
**Reads:** everything in `research/`, then `sutura-client` and `sutura-server`.
**Writes:** only one file, `codebase/AUDIT-REPORT.md`. The prompt below says "read-only"; saving its report there is the single exception. It touches nothing else.

---

Act as a Senior Business Analyst, Software Architect, and Full-Stack Codebase Auditor. Analyze my EXISTING SUTURA project to discover its actual end-to-end business logic, role relationships, folder structure, and workflow gaps.

PROJECT
SUTURA: A Web Based Tailoring Shop Tracker System.

PRIMARY OBJECTIVE
I need to understand how my CURRENT frontend, backend, API endpoints, database models, authorization rules, and existing features work together. Do not assume that a feature is fully implemented just because a page, route, model, or controller exists.

IMPORTANT WORKING RULES
1. Inspect the current workspace and discover the actual client and server repositories. Do not assume paths or architecture before inspecting them.
2. Read relevant source code, route definitions, controllers, models, migrations, relationships, validation rules, policies, middleware, frontend pages, components, API clients, types, and existing project documentation.
3. Follow important workflows across frontend, API, backend, and database. Provide actual file paths, function/class names, routes, and line references wherever possible.
4. Distinguish VERIFIED CURRENT BEHAVIOR, PARTIALLY IMPLEMENTED BEHAVIOR, MISSING BEHAVIOR, and RECOMMENDED FUTURE BEHAVIOR.
5. Never invent implementation details. If evidence cannot be found, state that explicitly.
6. This is a READ-ONLY AUDIT. Do not modify, create, delete, or refactor files. Do not run migrations, change database data, install packages, commit changes, or perform deployment.
7. Do not expose secrets from environment files. Inspect variable names only when relevant.
8. Treat the approved thesis objectives and scope documents as constraints. Do not invent new capstone features or replace existing architecture without evidence.

PART 1 — MAP THE EXISTING SYSTEM
Discover and document:
- Frontend and backend architecture.
- Folder structure and key entry points.
- Existing user roles and permissions.
- Database entities, tables, foreign keys, and relationships.
- API endpoints connecting each frontend feature to the backend.
- Existing Service, Catalog Design, Appointment, Order, Measurement, Payment, Branch, Staff, and Production implementations.
- Which code is shared and which code is role-specific.

PART 2 — AUDIT THE THREE CONNECTED BUSINESS AREAS

A. CUSTOMER / GUEST
Trace how a guest or customer discovers a shop, branch, service, and catalog item.
Determine whether shop owners actually create and publish services and catalog items through CRUD, and how those records become visible to customers.
Check active/inactive status, publication status, branch availability, shop verification, and subscription restrictions where implemented.
Determine which actions guests can perform and which require authentication.

B. SHOP OWNER / BRANCH MANAGEMENT
Trace how a shop owner creates and manages services, catalog designs/items, pricing, customization options, measurement requirements, shop profiles, branches, and public visibility.
Determine the actual relationship between shop, branch, service, and catalog item.
Check single-branch versus multi-branch support.
Determine whether catalog items and prices can differ by branch and whether existing code supports owner-level and branch-level configuration.
Identify who is permitted to create, edit, publish, deactivate, and price each entity.

C. BRANCH MANAGER / STAFF OPERATIONS
Trace the permissions and actual workflows of managers and staff assigned to particular branches.
Determine who can review appointments, accept or reject online requests, record walk-in customers, create job orders, record measurements, confirm quotations, record payment status, assign production staff, and update production stages.
Identify how branch-level data access and authorization are enforced by the backend, not just hidden in the frontend.

PART 3 — TRACE THE COMPLETE CUSTOMER-TO-PRODUCTION WORKFLOW

Audit these paths independently. Do not merge them just because they eventually produce a job order.

FLOW A: SERVICE AND CATALOG PUBLICATION
Shop owner or authorized user performs CRUD
→ service and catalog information is saved
→ applicable branch and pricing are configured
→ offering is published and available
→ customer/guest can discover it.

Find the exact implemented logic and identify missing links.

FLOW B: APPOINTMENT
Customer requests an appointment
→ system validates purpose, branch, availability, and required details
→ authorized staff reviews the request
→ appointment is accepted, rejected, rescheduled, completed, or cancelled according to actual supported rules
→ customer visits for consultation, fitting, measurements, or another purpose
→ a job order is created only when the required business conditions are met.

Verify which transitions actually exist. Do not assume booking automatically creates an order.

FLOW C: ONLINE ORDER REQUEST
Customer discovers a published catalog item or eligible service
→ selects the available configuration and quantity
→ provides required measurements or other order information
→ submits an online order request
→ shop reviews the request
→ shop requests missing information, requires consultation, or prepares/confirms a quotation
→ customer approves the requirements and price
→ applicable deposit/payment conditions are satisfied
→ a job order becomes eligible for production.

Determine which of these stages are already implemented, which differ in the current system, and what rules are missing. Do not assume all shops or catalog items allow online ordering.

FLOW D: PHYSICAL WALK-IN
Customer physically visits a branch without a prior appointment
→ authorized staff records or identifies the customer
→ records the requested service/catalog item, configuration, measurements, and other required information
→ shop assesses the request and confirms the quotation and terms
→ job order is created when appropriate conditions are met
→ production tracking begins.

Determine whether this is implemented as a walk-in intake, appointment, job order, or another record in the existing code. Do not treat a walk-in as a customer selecting a website-only booking option.

FLOW E: PRODUCTION AND TRACKING
Confirmed job order
→ appropriate staff/branch assignment
→ production stage updates
→ customer-visible status and notifications
→ ready for pickup and completion
→ final balance or payment status handled according to existing rules.

Trace the actual status enums, transitions, guards, APIs, permissions, and database fields.

PART 4 — CLARIFY SERVICE, CATALOG DESIGN, AND PRICING

Establish from existing code:
- What a Service represents.
- What a Catalog Design or Catalog Item represents.
- Whether an item belongs to one service, multiple services, or another relationship.
- Where prices are stored and which entity owns the pricing rules.
- How standard-size and made-to-measure options are represented.
- How customization, extra materials, labor, bulk quantity, and quotations affect the price.
- Whether the system differentiates fixed prices, starting prices, estimates, and confirmed quotations.
- How inactive or unavailable items are handled.
- Whether a customer can request an unlisted garment or custom design.

Do not assume a service-level price should automatically apply to every catalog item. Determine the current behavior first, then recommend a model appropriate for the thesis.

PART 5 — RECOMMEND A MAINTAINABLE FOLDER ARCHITECTURE

My intended separation is:

1. Customer / Guest
2. Shop Owner / Shop and Branch Management
3. Branch Manager / Staff Operations

Recommend how these should be organized in the existing frontend and backend without prematurely forcing a rewrite.

Distinguish:
- Role-specific pages and dashboard components.
- Shared frontend components and API clients.
- Shared backend business services and domain rules.
- Models/entities and their relationships.
- Authentication, authorization, and branch-level permissions.
- Service, catalog, appointment, order, measurement, payment, and production modules.

Determine whether the current architecture should use role-oriented folders, domain-oriented modules, or a hybrid approach. Explain how the three business areas remain connected without duplicating core logic.

Do not create or move folders. First provide the recommended tree using existing project conventions, with a clear distinction between existing folders and proposed folders.

PART 6 — DELIVERABLES

Produce one consolidated report with these sections:

1. Executive findings: what the current system actually does.
2. Current architecture and important file map.
3. Role and permission matrix.
4. Database entity relationship explanation.
5. Service and Catalog CRUD-to-public-discovery workflow.
6. Appointment workflow audit.
7. Online order request workflow audit.
8. Physical walk-in workflow audit.
9. Job order, measurements, payment, and production tracking audit.
10. Current versus intended behavior comparison.
11. Specific broken links, missing logic, ambiguous statuses, permission risks, and duplicate responsibilities.
12. Recommended frontend/backend folder architecture.
13. Prioritized requirements and implementation gaps, mapped to the approved thesis scope.
14. Unresolved business decisions requiring actual shop-owner validation.
15. A final end-to-end workflow diagram and acceptance criteria for the existing system.

For each major finding, provide evidence from the actual codebase. Use file paths, relevant symbols, routes, and line references when available. If multiple files must be followed to establish a workflow, show the chain rather than citing only one file.

FINAL REQUIREMENT
Do not implement anything. Finish by telling me, precisely and in priority order, what is already working, what is only partially implemented, what is missing, and what decisions must be made before implementation begins.
