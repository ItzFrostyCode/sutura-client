# SUTURA Architecture Specification: Service → Catalog Design Relationship

**Document Version:** 2.0 (Production Verified)  
**Target Systems:** `sutura-server` (Laravel 11 REST API) & `sutura-client` (Next.js 14 App Router)  
**Primary Store Reference:** Store 1 (`Thread & Needle Tailoring`)  

---

## 1. Executive Summary & Core Architectural Taxonomy

In the SUTURA platform, garment production, customer storefront exploration, appointment scheduling, and order execution are decoupled across four distinct architectural layers. Confusing design assets with shop capabilities or order contexts leads to schema bloat and rigid user workflows.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Catalog Design (catalog_items)                                      │
│    • Visual garment prototype, silhouette, fabric, & design price      │
│    • Answers: "What specific garment / design is the customer viewing?"│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ belongsTo (service_id FK)
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 2. Service (services)                                                  │
│    • Shop production capability, category, functional taxonomy, & SLA  │
│    • Answers: "What tailoring/production work does the shop perform?"  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ evaluated at order / booking time
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 3. Order Context (Customer Transaction Parameter)                      │
│    • Quantity, Roster/Entourage participants, Material sourcing        │
│    • Options: Individual/Custom, Bulk/Team, School/Org, Entourage      │
│    • Answers: "How and for how many people is this being ordered?"     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ formalized in shop management
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 4. Job Order (job_orders)                                              │
│    • Final binding contract: exact pricing, balance, measurements, due │
│    • Answers: "What is the agreed production agreement and milestone?" │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Entity Definitions

1. **Catalog Design (`catalog_items`)**:
   - Represents a specific finished or showcase garment design (e.g., *"Andrea & Leo A-Line Gown"*, *"Lakers Basketball Jersey"*, *"Traditional Ivory Barong Tagalog"*, *"Bespoke Groom Tuxedos"*).
   - Carries design-specific attributes: `name`, `garment_type`, `price` (design reference price), `estimated_days`, `material`, `color`, `fabric_image_url`, `sizes`, `description`, `features`, and gallery images.
   - **Crucial Rule:** A Catalog Design is **never permanently locked** to "bulk-only" or "solo-only". A basketball jersey design can be ordered as a single custom piece or for a 30-player team roster.

2. **Tailoring Service (`services`)**:
   - Represents the store's overarching capability, workshop machinery, and craft labor (e.g., *"Bridal & Wedding Gown Design"*, *"Custom Sublimation Team Jerseys"*, *"Bespoke Suit Tailoring"*, *"Barong Tagalog Tailoring"*).
   - Governed by `service_types` (`custom_tailoring`, `bulk_sublimation`, `fashion_bridal`, `alteration_repair`).
   - Carries base labor guidance (`base_price`), turn-around SLA (`estimated_days`), and order constraints (`min_order_qty`).

3. **Order Context (`Individual / Custom` vs `Bulk / Team` / `School / Org` / `Entourage`)**:
   - An ephemeral transaction property specified during customer engagement (via appointment booking or bulk roster submission).
   - Determines whether the order is for a single individual's body measurements or requires a participant roster (player names, jersey numbers, sizes).

4. **Job Order (`job_orders`)**:
   - The definitive transactional contract established by the store/staff.
   - Codifies the true final amount (`total_amount`), customer deposit (`deposit_amount`), balance, measurement cards, fabric notes, branch assignment, and production due date.

---

## 2. Store 1 (`Thread & Needle Tailoring`): Canonical Services

Store 1 features exactly **8 configured tailoring services** within the database:

| Service ID | Service Name | Functional Types (`service_types`) | Base Price (`base_price`) | Turnaround (`estimated_days`) | Catalog Role |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | Custom Sublimation Team Jerseys | `["bulk_sublimation"]` | ₱1,000.00 | 14 days | Parent service for all sublimation/sports designs |
| **2** | Bespoke Suit Tailoring | `["custom_tailoring"]` | ₱3,500.00 | 15 days | Parent service for bespoke suits and tuxedos |
| **3** | Barong Tagalog Tailoring | `["fashion_bridal"]` | ₱1,500.00 | 10 days | Parent service for formal and modern Barongs |
| **4** | Bridal & Wedding Gown Design | `["fashion_bridal"]` | ₱8,000.00 | 30 days | Parent service for wedding, bridal, and entourage gowns |
| **5** | School & Organization Uniform Sewing | `["bulk_sublimation"]` | *Variable / Quote* | 20 days | Service-level custom tailoring; no static designs |
| **6** | Garment Alterations & Repair Services | `["alteration_repair"]` | *Itemized / Tiered* | 3 days | Non-design labor service; customer brings own garment |
| **7** | Corporate & Team Jersey Printing | `["bulk_sublimation"]` | *Variable / Quote* | 12 days | Production printing workflow; reuses jersey designs |
| **8** | Embroidery & Logo Digitizing | `["bulk_sublimation"]` | *Variable / Quote* | 4 days | Production add-on / embellishment service |

> [!NOTE]
> **Promotional Service Packages (e.g., "Groom & Entourage Package"):**  
> Packages are defined in `service_packages` and `service_package_items`, which bundle multiple underlying services (e.g., Suits + Barongs). They do not exist as single rows in `services`, nor do they hold direct catalog designs.

---

## 3. Comprehensive 50 Catalog Designs Mapping (Store 1)

Every active catalog design in Store 1 (IDs 1 through 50) maps strictly to one primary service according to craft discipline:

### Group A: Bridal & Wedding Gown Design (Service ID 4) — 15 Designs
*Parent Service: Bridal & Wedding Gown Design | Category: `fashion_bridal` | Turnaround: 30d*

| Catalog ID | Design Name | Garment Type | Reference Price | Order Context Supported |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Andrea & Leo A1237 Off Shoulder Slit Leg Floral Tulle A Line Gown | `gown` | ₱4,500.00 | Custom Solo / Entourage |
| **2** | Long Maid Of Honour Dresses Leia Modest Sweetheart Pleated Chiffon | `gown` | ₱4,500.00 | Entourage / Group |
| **4** | Shop Long Tail Wedding Gown | `gown` | ₱4,500.00 | Custom Solo |
| **5** | Emerald Green Multiway Convertible Bridesmaid Gown | `gown` | ₱4,500.00 | Entourage / Group |
| **9** | Pink Chiffon Mother of the Bride Dresses Simple Scoop Neck | `gown` | ₱4,500.00 | Custom Solo / Entourage |
| **12** | Greed Regal A-line Flower Floor-Length Satin Corset Mother of Bride Dress | `other` (`gown`) | ₱1,500.00 | Custom Solo / Entourage |
| **15** | Buy Luxury White Tail Wedding Gown with Champagne-Gold Embroidery | `gown` | ₱4,500.00 | Custom Solo |
| **23** | Vintage Dark Teal Mother Gowns for Wedding Women 2024 Lace | `gown` | ₱4,500.00 | Custom Solo / Entourage |
| **28** | Luxury_Bridal_Gowns_Long_Tail | `gown` | ₱4,500.00 | Custom Solo |
| **41** | 9 Luxury Designer Bridesmaid Dresses for the Bridal Crew | `gown` | ₱4,500.00 | Entourage / Group |
| **42** | Red Regal A-line Flower Floor-Length Satin Corset Mother of Bride Dress | `other` (`gown`) | ₱1,500.00 | Custom Solo / Entourage |
| **44** | Light Pink Regal A-line Flower Floor-Length Satin Corset Mother of Bride | `other` (`gown`) | ₱1,500.00 | Custom Solo / Entourage |
| **47** | Elegant Sequined Off White Wedding Dresses with Puff Sleeves | `gown` | ₱4,500.00 | Custom Solo |
| **49** | Off-Shoulder Floral Tulle A-Line Gown | `gown` | ₱4,500.00 | Custom Solo |
| **50** | Long-Train Wedding Gown | `gown` | ₱4,500.00 | Custom Solo |

---

### Group B: Custom Sublimation Team Jerseys (Service ID 1) — 21 Designs
*Parent Service: Custom Sublimation Team Jerseys | Category: `bulk_sublimation` | Turnaround: 14d*

| Catalog ID | Design Name | Garment Type | Reference Price | Order Context Supported |
| :---: | :--- | :---: | :---: | :--- |
| **3** | Cycling_Jerseys_1 | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **6** | esport tshirt blue | `uniform` | ₱650.00 | Bulk / Org / Team |
| **7** | Women's Esports Jersey with Customized Design | `uniform` | ₱650.00 | Bulk / Org / Team |
| **8** | Bulls-Basketball-Jersey | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **11** | KobeBryant-Basketball-Jersey | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **17** | Riders_Long_Sleeves | `other` (`uniform`) | ₱1,500.00 | Bulk / Club / Solo |
| **18** | AllStar-Basketball-Jersey | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **20** | Volleyball Jersey_2 | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **21** | Cycling_Jerseys_3 | `uniform` | ₱650.00 | Bulk / Club / Solo |
| **22** | Riders_Long_Sleeves_2 | `other` (`uniform`) | ₱1,500.00 | Bulk / Club / Solo |
| **24** | Cycling_Jerseys_2 | `uniform` | ₱650.00 | Bulk / Club / Solo |
| **29** | Bears-Basketball-Jersey | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **30** | rashguard_1 | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **31** | Lebron James-Lakers-Basketball-Jersey | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **33** | Esports-Jersey-women | `uniform` | ₱650.00 | Bulk / Org / Team |
| **35** | rashguard_3 | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **36** | Arsenal-Jersey | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **38** | esport tshirt | `uniform` | ₱650.00 | Bulk / Org / Team |
| **43** | Lakers-Basketball-Jersey | `uniform` | ₱650.00 | Bulk / Team / Solo |
| **46** | volleyballroundneckSET | `other` (`uniform`) | ₱1,500.00 | Bulk / Team / Solo |
| **48** | VBALL_PRE-2001_800x800 | `other` (`uniform`) | ₱1,500.00 | Bulk / Team / Solo |

---

### Group C: Bespoke Suit Tailoring (Service ID 2) — 8 Designs
*Parent Service: Bespoke Suit Tailoring | Category: `custom_tailoring` | Turnaround: 15d*

| Catalog ID | Design Name | Garment Type | Reference Price | Order Context Supported |
| :---: | :--- | :---: | :---: | :--- |
| **13** | Best Custom Tuxedos in NYC - Bespoke Groom Tuxedos | `suit` | ₱12,000.00 | Custom Solo / Entourage |
| **14** | Bespoke_Suits2 | `suit` | ₱12,000.00 | Custom Solo / Entourage |
| **19** | mens-custom-tuxedos-its-all-about-the-fit | `suit` | ₱12,000.00 | Custom Solo / Entourage |
| **25** | Bespoke_Suits | `suit` | ₱12,000.00 | Custom Solo / Entourage |
| **26** | Tailor Made Suits London - The Bespoke Tailor UK | `suit` | ₱12,000.00 | Custom Solo / Entourage |
| **27** | Custom_Tuxedos_men | `suit` | ₱12,000.00 | Custom Solo / Entourage |
| **34** | Custom Tuxedos for Memorable Events | `suit` | ₱12,000.00 | Custom Solo / Entourage |
| **39** | Blue Tuxedo Belt Tuxedo Blue Suit Brown Belt Core Navy | `suit` | ₱12,000.00 | Custom Solo / Entourage |

---

### Group D: Barong Tagalog Tailoring (Service ID 3) — 5 Designs
*Parent Service: Barong Tagalog Tailoring | Category: `fashion_bridal` | Turnaround: 10d*

| Catalog ID | Design Name | Garment Type | Reference Price | Order Context Supported |
| :---: | :--- | :---: | :---: | :--- |
| **16** | Traditional Ivory Color Barong Tagalog - Formal Fit | `barong` | ₱4,500.00 | Custom Solo / Entourage |
| **32** | Men's - Traditional Barong Tagalog - Page 1 - Barong At Bestida Australia | `barong` | ₱4,500.00 | Custom Solo / Entourage |
| **37** | Traditional Barong Tagalog Polo Shirt for Men | `barong` | ₱4,500.00 | Custom Solo / Entourage |
| **40** | Barong Tagalog For Sale - Traditional and Modern Filipino Attire | `barong` | ₱4,500.00 | Custom Solo / Entourage |
| **45** | Barong Tagalog Cloth- Traditional and Elegant Fabrics | `barong` | ₱4,500.00 | Custom Solo / Entourage |

---

### Group E: Flagged for Data Cleanup — 1 Item
| Catalog ID | Item Name | Current Garment Type | Price | Status & Recommendation |
| :---: | :--- | :---: | :---: | :--- |
| **10** | `images` | `other` | ₱1,500.00 | **Data Cleanup Flag**: Raw filename placeholder artifact. Must be deleted or replaced with valid design metadata rather than assigned to a false service. |

**Distribution Summary:**
- Bridal & Wedding Gowns: **15**
- Custom Sublimation & Sports: **21**
- Bespoke Suits: **8**
- Barong Tagalog: **5**
- Flagged Cleanup: **1**
- **Total Store 1 Catalog Items: 50**

---

## 4. Why Non-Showroom Services Hold Zero Direct Catalog Items

Four services in Store 1 deliberately have no linked catalog items. This is a deliberate, defensible architectural decision:

1. **Service 6: `Garment Alterations & Repair Services`**:
   - **Reason:** Alteration is non-design labor performed on existing garments owned by the customer (e.g., pants tapering, zipper replacement, waist adjustment). Showing pre-made catalog designs for alterations confuses users into thinking they are buying new clothing.
   - **Workflow:** Customer selects the service directly, describes the adjustment needed, and books an appointment or initiates a repair request.

2. **Service 8: `Embroidery & Logo Digitizing`**:
   - **Reason:** Embroidery is an embellishment technique or production add-on applied to uniforms, polos, caps, or jackets. It is not an independent off-the-rack garment.
   - **Workflow:** SUTURA treats embroidery as a custom specification or service add-on during Job Order creation.

3. **Service 5: `School & Organization Uniform Sewing`**:
   - **Reason:** Institutional uniforms are made according to specific institutional handbooks, patches, and fabric swatches provided by schools or corporate entities. They are not showcased as fashion retail pieces.
   - **Workflow:** Handled through service-level quotation and bulk consultation.

4. **Service 7: `Corporate & Team Jersey Printing`**:
   - **Reason:** Sublimation jersey designs are already represented in Service 1 (*Custom Sublimation Team Jerseys*). Re-creating identical jersey catalog items under Service 7 would cause database redundancy.
   - **Workflow:** Corporate clients select the desired jersey design from the catalog, then declare *Corporate / Organization* in the Order Context.

---

## 5. Customer Reflection & UI/UX Principles

### 5.1 The Price Separation Principle
A critical usability rule in SUTURA is that **Catalog Design price** and **Service base price** must never be presented as additive:

```
❌ WRONG (Additive Confusion):
   Catalog Item: ₱4,500
   Service Base: ₱1,500
   Total Displayed: ₱6,000 (Customer assumes double charge!)

✅ CORRECT (SUTURA Standard):
   Primary Display: ₱4,500 (Design Reference Price)
   Service Label: "Service: Barong Tagalog Tailoring"
   Transactional Pricing: Established in Job Order based on final fabric & customization
```

- In `CatalogProductInfo.tsx`, only the specific design reference price (`item.price`) is displayed prominently with the title, fabric, and color tags.
- In `StoreServicesTab.tsx`, service cards display their starting labor rate (e.g., *"Starting at ₱1,500"*).
- The Job Order binds the design price, custom specs, rush fees, and material source into the final binding amount.

### 5.2 Dynamic Action Buttons by Functional Service Type
The customer call-to-action on the catalog detail page responds dynamically to the service taxonomy:

```typescript
// SUTURA Client: useCatalogItemDetail.ts
const isBulkItem = Boolean(item?.service?.service_types?.includes('bulk_sublimation'));
```

1. **If `isBulkItem === true` (Sublimation & Sports)**:
   - Primary Button: **Bulk Order** → Opens `BulkOrderSheet`.
   - Customer inputs: Organization Name, Store Branch, and dynamic Roster (`name`, `size`).
   - Validates minimum quantity (`item.service.min_order_qty`).
   - Submits directly to `POST /stores/{store_id}/bulk-orders`.
   - Secondary Button: **Book a Fitting** / **Book Appointment**.

2. **If `isBulkItem === false` (Suits, Barongs, Gowns, Bespoke)**:
   - Primary Button: **Book a Fitting** → Navigates to `/store/${storeId}/book`.
   - URL parameters carry full design context:
     `?ref=${item.name}&ref_price=${item.price}&service_id=${item.service.id}&ref_color=${color}`.

---

## 6. Appointment Workflow Integration

The SUTURA appointment workflow remains unified across all entry points, while adapting its fields based on the context received.

### 6.1 Authentication Gate
Authentication occurs **before** opening Step 1 of the booking wizard. If a guest user clicks "Book Appointment", they are redirected to `/login?redirect=...`, preserving all query parameters (`ref`, `service_id`, `branch`, `ref_price`). Upon successful login, they are returned directly to the active booking URL.

### 6.2 The 3-Step Booking Wizard

```
┌────────────────────────────────────────────────────────┐
│ Step 1: Purpose Selection                              │
│ • Context-gated appointment types                      │
│ • Restricts invalid options based on design/service    │
└───────────────────────────┬────────────────────────────┘
                            │ Next
┌───────────────────────────▼────────────────────────────┐
│ Step 2: Schedule & Context                             │
│ • Branch selector (with Haversine distance)            │
│ • Date & Time slot picker                              │
│ • Order Context (Solo vs Bulk/Team quantity)           │
│ • Material sourcing (Own fabric vs Shop material)      │
│ • (NO duplicate service picker if context is known)    │
└───────────────────────────┬────────────────────────────┘
                            │ Next
┌───────────────────────────▼────────────────────────────┐
│ Step 3: Review & Confirmation                          │
│ • Read-only summary card                               │
│ • Edit buttons to return to Step 1 or 2                │
│ • Submit → Pending Appointment                         │
└────────────────────────────────────────────────────────┘
```

#### Step 1: Purpose Gating Rules (`useBookingWizard.ts`)
- **From a Specific Catalog Design (`ref` present)**:
  - Allowed: `Consultation` (30 min) and `Measurement` (45 min).
  - `Fitting` and `Pickup` are only enabled if the customer checks *"I already have an existing order"* (`hasExistingOrder === true`).
- **From a Specific Service (`service_id` present)**:
  - If service is *Alterations/Repair*: Purpose is strictly `Alteration / Repair`.
  - If service is *Sublimation/Printing*: Purpose is `Consultation / Order Discussion`.
  - If service is *Custom Tailoring / Gowns*: Purpose is `Consultation` and `Measurement`.
- **From General Store Profile (no reference)**:
  - Purpose choices: `Consultation`, `Measurement`, and `Alteration / Repair`.

#### Step 2: Elimination of Redundant Service Selectors
- `hasServiceContext = !!serviceIdParam || !!refName;`
- When `hasServiceContext === true`, `needsServicePicker` evaluates to `false`.
- The wizard **never** prompts the user with a redundant "Select a Service" dropdown when they arrived from a specific design or service page.

#### Step 3: Structured Context Persistence in Notes
When submitted to `POST /catalog/{storeId}/book`, the backend stores standard bracket tags inside `appointments.notes`:
```text
[Design Reference: Traditional Ivory Color Barong Tagalog (₱4,500) — Size L — Ivory]
[Material: Customer will bring own fabric/sample — Silk Cocoon 3 yards]
[Quantity: 1 people/items]
Notes: Please prepare collar style samples.
```

---

## 7. Panel Defense & Theoretical Justification

### Q1: "Why don't you have separate catalog items for Solo Orders vs Bulk Orders?"
> **Defense:** "Treating bulk vs individual as separate catalog items causes severe data duplication and violates relational normalization. A basketball jersey design remains identical whether 1 player orders it or a 20-player team orders it. In SUTURA, the Catalog Design represents the *aesthetic artifact*, while *Bulk vs Individual* is an *Order Context* parameter established during customer checkout or booking."

### Q2: "Why don't Alteration and Repair services have catalog designs?"
> **Defense:** "Catalog items in SUTURA represent made-to-order garments produced from raw materials. Alterations and repairs are corrective labor services performed on garments the customer already owns. Displaying finished catalog designs for alterations would mislead customers into expecting a new garment rather than a garment adjustment."

### Q3: "If a customer chooses a Barong design priced at ₱4,500 and the service says Starting at ₱1,500, what is the customer billed?"
> **Defense:** "The customer is not billed ₱6,000. SUTURA enforces strict price separation: the ₱1,500 is a baseline shop labor indicator on the service directory, while the ₱4,500 is the reference price for that specific Barong design. The final binding transaction is codified when staff issues the Job Order, accounting for custom measurements, fabric choices, and add-ons."

### Q4: "How does the system ensure a customer booking from a design doesn't accidentally book an Alteration appointment?"
> **Defense:** "Through context-aware purpose gating in `useBookingWizard.ts`. When a user books with a design reference (`?ref=...`), the wizard locks the available purposes to `Consultation` and `Measurement`. Irrelevant purposes like `Alteration` or unlinked `Pickup` are suppressed."
