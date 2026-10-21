# SUTURA: Customer Booking Appointment, Add Service & Add Service Design Display Specifications

**Document Version:** 1.0 (Production Verified against Next.js 14 Client & Laravel 11 API)  
**Target Systems:** `sutura-client` (Next.js App Router) & `sutura-server` (Laravel REST API)  
**Audience:** Frontend Developers, Product Designers, Capstone Defense Panel, Shop Operators  

---

## Executive Overview & Architectural Taxonomy

In SUTURA, tailoring engagements flow through three interconnected modules:
1. **Tailoring Services (`services`)**: The workshop’s craft capabilities, equipment, turnaround time, base pricing model, and booking question requirements.
2. **Catalog Service Designs (`catalog_items`)**: Visual showcase prototypes, silhouettes, and fabric styles that belong to a parent service.
3. **Customer Booking Appointment (`appointments`)**: The customer-facing interface where users schedule an in-store consultation, measurement session, or alteration visit, optionally attaching requested services and catalog designs.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Shop Dashboard: ADD SERVICE (/dashboard/services/new)               │
│    • Owner/Manager defines craft category, base price, days, & fields  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ parent to
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 2. Shop Dashboard: ADD SERVICE DESIGN (/dashboard/catalog/new)         │
│    • Owner/Manager links design to service, sets photo, & pricing mode │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ browsed & selected by customer
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 3. Customer Booking Appointment (/store/[id]/book)                     │
│    • Customer books visit, selects branch, date/time, & fabric source  │
│    • Includes "+ Add Service or Design" interactive modal drawer       │
└────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 1: Customer-Facing Booking Appointment (`/store/[store_id]/book`)

The booking interface allows registered customers to book an in-store appointment at a shop branch. In SUTURA, **an appointment is always an in-store visit to the shop**, not a delivery or direct purchase. **No money is collected during appointment booking**; the initial deposit is charged only when a formal Job Order is drafted and approved.

### 1.1 Authentication & Context Preservation Gate
- **Authentication Rule:** Customers must be authenticated (`role: customer`).
- **Guest Gate:** If a guest clicks *"Book Appointment"* or *"Book a Fitting"* anywhere on the site, they are redirected to `/login?redirect=/store/{storeId}/book?...`, preserving all query parameters (`service_id`, `ref`, `ref_price`, `ref_color`, `branch`).
- **Post-Login:** The user is immediately brought back to Step 1 with their pre-selected items intact.

### 1.2 Layout & Global Components

#### A. Header Bar (`BookingHeader.tsx`)
- **Left:** Back button (`<ArrowLeft />`). When on Step 2 or 3, it returns to the previous step; on Step 1, it navigates back to the store profile.
- **Center:** Shop Brand Name and active branch location pill (`<MapPin /> Branch Name`).
- **Right:** Close / Exit action.

#### B. Visual Progress Stepper (`StatusStepper.tsx`)
Instead of a plain text pill, SUTURA displays a 3-stage responsive visual progress bar:
1. **Details** (`<ClipboardList />`): Visit kind, purpose, and requested garment items.
2. **Schedule** (`<CalendarDays />`): Branch selection, calendar date/time picker, material sourcing, phone number, and service questions.
3. **Review** (`<CheckCircle2 />`): Complete read-only summary with inline edit triggers and submission CTA.

#### C. Sticky Action Bar (`BookingActionBar.tsx`)
- Anchored to the bottom viewport (`pb-[calc(16px+env(safe-area-inset-bottom))]`).
- **Step 1 Button:** `"Continue to Schedule"` (Disabled if "Other" purpose has empty text).
- **Step 2 Button:** `"Review Appointment Details"` (Disabled if date, time, valid 7+ digit phone, or required service questions are missing).
- **Step 3 Button:** `"Book Appointment"` (Submits the form to the backend).

---

### 1.3 Requested Services & Garments Section (`RequestedItemsSection.tsx`)

Positioned prominently above the wizard steps, this component tracks all items the customer wants to discuss or have tailored during their visit.

```
┌────────────────────────────────────────────────────────────────────────┐
│ REQUESTED SERVICES & GARMENTS (2 items · 3 pieces total)  [+ Add Item] │
├────────────────────────────────────────────────────────────────────────┤
│ [✂] Bespoke Suit Tailoring                      Qty: [ - 1 + ] [🗑]   │
│     Starting from ₱3,500 · Est. 15d                                    │
│     "Need navy blue Italian wool if available"                         │
├────────────────────────────────────────────────────────────────────────┤
│ [✦] Andrea & Leo Floral Tulle Gown             Qty: [ - 2 + ] [🗑]   │
│     Parent Service: Bridal & Wedding Gown Design                       │
│     Size: M · Color: Emerald Green · Starting from ₱4,500              │
└────────────────────────────────────────────────────────────────────────┘
```

#### States & Display Variations:
1. **Empty State (No preselected services or designs):**
   - No dummy cart or placeholder card is shown. The customer proceeds directly to selecting the visit purpose and booking their appointment.
2. **Compact View (Step 2 Schedule Preview):**
   - When requested items exist, collapses into a summarized preview showing item names, quantities, sizes, and parent service to maximize screen space for the calendar.
3. **Full Interactive View (Step 1 & Step 3):**
   - Item thumbnail (for catalog designs) or craft icon (`<Scissors />` for services).
   - Item name and parent service tag.
   - Quantity stepper (`ItemQuantitySelector` with minimum quantity validation).
   - Size chips and color indicators.
   - Expandable/collapsible custom notes field.
   - Remove item action (`<Trash2 />`).

---

### 1.4 "Add Service or Design" Modal (`AddRequestedItemModal.tsx`)

When the customer clicks `+ Add Item` or `+ Add Service or Design`, a responsive modal sheet opens with two tabs:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Add Service or Design                                              [X] │
│ Select what you want made. The tailor confirms final specs in shop.   │
├────────────────────────────────────────────────────────────────────────┤
│ [  [✂] Tailoring Services (8)  ]  [  [✦] Catalog Designs (50)  ]       │
├────────────────────────────────────────────────────────────────────────┤
│ (Tab 1: Services List)                                                 │
│ ┌─────────────────────────────┐  ┌─────────────────────────────┐       │
│ │ Bespoke Suit Tailoring   [S]│  │ Barong Tagalog Tailoring [S]│       │
│ │ From ₱3,500.00 · Est. 15d   │  │ From ₱1,500.00 · Est. 10d   │       │
│ │ [ Configure & Add ]         │  │ [ Configure & Add ]         │       │
│ └─────────────────────────────┘  └─────────────────────────────┘       │
└────────────────────────────────────────────────────────────────────────┘
```

#### Tab 1: Tailoring Services (`services`)
- **Card Grid:** Displays all active shop services.
  - Service title.
  - Price indicator (`"From ₱X,XXX"` or `"Price on quotation"` via `getServicePriceLabel`).
  - Turnaround time badge (`Est. X days`).
  - Minimum order quantity badge (`Min: X pcs`, shown when `min_order_qty > 1`).
  - Action: `"Configure & Add"` button.
- **Drill-Down Configuration Screen (When a service is clicked):**
  - **Header:** `< Back to all services` button + `"Service Requirement"` badge.
  - **Title & Description:** Service name, starting price, and guidance note: *"No design required. You can discuss custom tailoring, provide your own fabric, or request measurements during the appointment."*
  - **Quantity Selector (Required):** Controlled stepper, strictly enforcing `min_order_qty`.
  - **Custom Details & Tailoring Notes (Optional Textarea):** Placeholder: *"e.g. Preferred fabric, collar style, chest logo embroidery, or specific measurements..."*
  - **Submit Button:** `"+ Add Service (X pieces)"`.

#### Tab 2: Catalog Designs (`designs`)
- **Card Grid:** Displays visual garment showcase items.
  - Garment photo thumbnail.
  - Design title.
  - Parent service attribution (`Service: Bespoke Suit Tailoring`).
  - Price tag (`₱X,XXX.XX`).
  - Filter sync: If user opened the modal from a specific service, designs are automatically pre-filtered to that service.
- **Drill-Down Configuration Screen (When a design is clicked):**
  - **Header:** `< Back to all designs` button + `"Design Specification"` badge.
  - **Garment Card Preview:** High-res image, design title, parent service link, and starting price.
  - **Size Selector (Optional):** Clickable size pills (`XS`, `S`, `M`, `L`, `XL`, `2XL`, etc.) matching the design's available sizes.
  - **Color Field (Optional):** Input field pre-filled with the design's default color (e.g., `"Navy Blue"`), editable by the customer.
  - **Quantity Selector (Required):** Controlled stepper enforcing the parent service's `min_order_qty`.
  - **Custom Details & Tailoring Notes (Optional Textarea):** Placeholder: *"e.g. Specific fabric preference, custom logo embroidery on chest/back, modified length..."*
  - **Submit Button:** `"+ Add Design to Appointment"`.

---

### 1.5 Step-by-Step Customer Booking Walkthrough

#### Step 1: Details & Purpose (`BookingStep1Policy.tsx`)
1. **In-Store Visit Notice Card:**
   - Blue/tan alert box: *"This is a visit to the shop, not a delivery. Once the shop accepts your request, go to the shop on the day. Nothing is paid now."*
2. **Visit Kind Selector (`BookingKindSelector.tsx`):**
   - **Service:** *"A visit for one of the shop's services or designs."* (Pre-selected and locked if user came from a service or design).
   - **Shop:** *"A general visit: talk to the shop, get measured, or something else."*
3. **Purpose Type Selector (`BookingTypeSelector.tsx`):**
   - **Consultation (30 min):** Discuss design ideas, fabric swatches, sizing, and pricing.
   - **Measurement (45 min):** Get body measurements taken in person by staff.
   - **Alteration / Repair (30 min):** Bring an existing garment for fitting adjustment, hem tapering, or repair.
   - **Other:** Freeform purpose (reveals `PurposeLabelField` input, required if chosen).
4. **Store Booking Policy Accordion:**
   - Collapsible drawer showing shop cancellation guidelines, lead-time rules, and grace periods.

#### Step 2: Schedule & Contact (`BookingStep2Schedule.tsx`)
1. **Fallback Service Picker (`BookingServicePicker.tsx`):**
   - Displayed only if `kind = 'service'` and no service/design has been added yet.
2. **Material Sourcing Option (`BookingMaterialSelector.tsx`):**
   - Displayed for custom garments, designs, and alterations.
   - Radio Option A: *"I will bring my own fabric / garment"* -> reveals a text field for fabric type and yardage.
   - Radio Option B: *"I want the shop to provide the material"*.
3. **Branch Selector (`BookingBranchSelector.tsx`):**
   - List of all active branches.
   - Shows branch name, physical address, phone number.
   - **Live Haversine Distance Badge:** Calculates distance from customer’s geolocation (e.g., `"1.4 km away"`).
   - Automatically pre-selects the nearest branch or the branch specified in the URL.
4. **Interactive Calendar & Time Slot Grid (`InteractiveCalendar.tsx`):**
   - Real-time month calendar view.
   - Disables shop closed days and past dates.
   - **Special Holiday Hours Alert:** Warns if a date has temporary closures or custom hours.
   - **Time Slot Grid:** Generates valid slots between opening and closing hours based on appointment duration (30/45/60 min), filtering out booked slots and enforcing 30-minute travel buffers.
5. **Contact Number (Required):**
   - Phone input with validation (`>= 7 digits`). Auto-filled from user profile if available.
6. **Customer Notes (Optional):**
   - Character-counted textarea (`0 / 120` limit).
7. **Service-Specific Booking Questions (`BookingServiceQuestions.tsx`):**
   - Custom fields configured by the shop for this specific service (Text, Number, Dropdown, Yes/No Checkbox).
   - Required questions prevent advancing to Step 3 until answered.

#### Step 3: Review & Book (`BookingStep3Review.tsx`)
- **Customer Identity Banner:** Confirms booking account name, email, and contact number.
- **Purpose Summary Card:** Displays chosen purpose, duration, and edit trigger (`onEditPurpose`).
- **Requested Items Summary:** Comprehensive card listing all services, designs, sizes, colors, and quantities.
- **Date, Time & Branch Card:** Formatted date (e.g., *"Friday, October 24, 2026"*), time slot (e.g., *"2:30 PM - 3:00 PM"*), and full branch address with map icon.
- **Material & Answers Card:** Displays material sourcing choice and all answered questions.
- **Submission Action:** Triggers `api.post('/catalog/{storeId}/appointments', payload)`.

#### Step 4: Success Screen (`BookingSuccessState.tsx`)
- Animated green checkmark badge: `"Appointment Request Sent"`.
- Displays appointment reference code, scheduled date, time, and branch name.
- **"What Happens Next?" Timeline:**
  1. *Shop Review:* Shop reviews schedule within 24 hours.
  2. *Notification:* SMS/Email sent when confirmed or if rescheduling is needed.
  3. *In-Store Visit:* Visit the shop for fitting and consultation.
  4. *Production Quote:* Final price and deposit agreed upon in person.
- CTAs: `"View My Appointments"` (`/account/appointments`) and `"Back to Storefront"`.

---

# SECTION 2: What is Displayed When Adding a Service (`/dashboard/services/new`)

When a `store_owner` or `branch_manager` creates a new tailoring service, SUTURA renders a **10-Step Wizard** (`NewServiceWizard`).

```
┌────────────────────────────────────────────────────────────────────────┐
│ New service · Step 2 of 10                                            │
│ [━━━━━━][━━━━━━][      ][      ][      ][      ][      ][      ][      ]│
│                                                                        │
│ Basics                                                                 │
│ Name, starting price and how long it takes.                            │
├────────────────────────────────────────────────────────────────────────┤
│ Service name *                                                         │
│ [ e.g. Bespoke Suit Tailoring                                        ] │
│                                                                        │
│ Starting price (PHP)                                                   │
│ [ 3500                                                               ] │
│ Leave empty for a custom quote.                                        │
│                                                                        │
│ Production time — from (days) *         To (days)                      │
│ [ 10                                 ]  [ 15                         ] │
│ Minimum days needed.                    Must be 11 or higher.          │
│                                                                        │
│ [ ] It depends                                                         │
│     No fixed time — you tell each customer once you know what they need│
├────────────────────────────────────────────────────────────────────────┤
│ [ Back ]                                                      [ Next ] │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Field Breakdown by Wizard Step

| Step | Step Key | Title | Displayed Fields & UI Controls | Validation / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `photo` | **Photo** *(Optional)* | • Drag-and-drop / click file uploader (`ImageUploadField`)<br>• Image preview thumbnail with replace and remove buttons<br>• Hint: *"The photo customers see first on this service."* | Accepts image formats (`.jpg`, `.png`, `.webp`). Maximum file size: 5MB. |
| **2** | `info` | **Basics** *(Required)* | • **Service Name** (`input text`): Full name of the tailoring service.<br>• **Starting Price (PHP)** (`input number`): Base labor benchmark.<br>• **Production time — from (days)** (`input number`): Minimum turnaround SLA.<br>• **To (days)** (`input number`): Optional upper range.<br>• **"It depends" Checkbox**: Ticking this disables the day inputs and hides fixed turnaround. | • `name` cannot be empty.<br>• If "It depends" is unchecked, `estimated_days` must be >= 1.<br>• If `estimated_days_max` is provided, it must be > `estimated_days`. |
| **3** | `type` | **Kind of work** *(Required)* | 4 Radio Card Selectors (`ServiceTypeEditor`):<br>1. **Made to Order & Custom** (`made_to_order_custom`): Custom gowns, suits, barongs, dresses.<br>2. **Uniforms, Jerseys & Bulk** (`uniforms_jerseys_bulk`): Sports sublimation, corporate polos, school uniforms.<br>3. **Alterations & Repairs** (`alterations_repairs`): Hemming, zipper replacements, resizing.<br>4. **Garment Customization & Embroidery** (`embroidery_digitizing`): Computerized embroidery, patch sewing, logo printing. | Exactly one service category must be selected. Controls available capabilities in Step 5. |
| **4** | `garments` | **Garments** *(Required)* | Categorized checklist across **10 Garment Groups** (`ServiceGarmentsEditor`):<br>• Formal & Bridal (Wedding Gowns, Evening Dresses, Tuxedos, Barongs)<br>• Suits & Tailored (Blazers, Trousers, Vests)<br>• Uniforms & Workwear (Scrubs, Security Uniforms, Polo Shirts)<br>• Sports & Sublimation (Basketball, Volleyball, Cycling Jerseys)<br>• Casual Tops, Bottoms, Outerwear, Costumes, Traditional Attire<br>• **"Other garments" tag input**: For unlisted local garments (e.g. *"Malong"*, *"Kimono"*). | For non-alteration services, at least 1 garment must be selected or added. Alteration services allow selecting none to indicate "Any garment". |
| **5** | `capabilities` | **What you do** *(Required)* | Specific capability checkboxes filtered by the service category chosen in Step 3:<br>• *Custom Pattern Drafting*, *Fabric Sourcing*, *Hand Beading*, *Full Lining*<br>• *Sublimation Printing*, *Screen Printing*, *Embroidery Digitizing*<br>• *Bulk / Batch Orders* (`bulk_orders`)<br>• **Minimum Order Quantity Input**: Revealed when `bulk_orders` is checked (`min_order_qty`, default: `10` pcs). | If `bulk_orders` is checked, `min_order_qty` must be >= 1. |
| **6** | `spec` | **Prices & add-ons** *(Required)* | Dynamic itemized price tier builder (`ServiceSpecEditor`):<br>• Row layout: `[ Label Input ] [ Price Input (₱) ] [ Remove Button ]`<br>• Example rows: *"Jusi Barong" ₱4,500*, *"With collar + jacket" ₱300*<br>• Blank price row indicates: *"Depends — quotation, or walk in with item"*<br>• `+ Add a price or add-on` button. | Must have a starting base price in Step 2 OR at least one labeled price tier in Step 6. Labels cannot be blank if price is entered. |
| **7** | `chart` | **Reference chart** *(Optional)* | Tabbed Size Chart Editor (`SizeChartEditor`):<br>• Mode A: Upload reference chart image.<br>• Mode B: Dynamic tabular table with customizable columns (Chest, Waist, Hips, Length) and rows (S, M, L, XL, Custom). | Optional. Stored as structured JSON columns/rows or image URL. |
| **8** | `description` | **Description** *(Optional)* | Full multiline textarea (`ServiceDescriptionEditor`):<br>• Instructions on what the service covers, fabric requirements, and what the customer should bring to the visit. | Optional freeform text. |
| **9** | `booking` | **Booking form questions** *(Optional)* | Custom question builder for customer bookings (`ServiceBookingEditor`):<br>• Question Label (e.g. *"Preferred Collar Style"*).<br>• Answer Type dropdown: `Short answer`, `Number`, `Pick one (Dropdown)`, `Yes / No (Checkbox)`.<br>• Required checkbox.<br>• Option choices (comma-separated, for dropdowns).<br>• **Team Roster Columns** (shown if service takes bulk orders): Presets for `+ Jersey Number`, `+ Position`, `+ Department`, `+ Section/Grade`. | Pre-fills the Job Order custom fields when the appointment is converted into a job. |
| **10** | `requirements` | **Requirements** *(Optional)* | Deposit & production rules (`RequirementsEditor`):<br>• Radio: *"Use the shop default"* vs *"Set custom requirements"*.<br>• Downpayment percentage requirement (e.g. 50%).<br>• In-person fitting requirement toggle.<br>• Measurement validity period. | Defaults to shop-wide policy if untouched. |

---

# SECTION 3: What is Displayed When Adding a Service Design (`/dashboard/catalog/new`)

When an owner or manager adds a catalog design (a specific showcase garment prototype), SUTURA renders an **8-Step Wizard** (`NewCatalogItemContent`).

```
┌────────────────────────────────────────────────────────────────────────┐
│ New design · Step 2 of 8                                              │
│ [━━━━━━][━━━━━━][      ][      ][      ][      ][      ][      ]        │
│                                                                        │
│ Basics                                                                 │
│ Design name, price and how long it takes to make.                      │
├────────────────────────────────────────────────────────────────────────┤
│ Design name *                                                          │
│ [ Traditional Ivory Barong Tagalog - Formal Fit                      ] │
│                                                                        │
│ Service                                                                │
│ [ Barong Tagalog Tailoring                                       ▼ ] [+]│
│ [✓ Linked: Barong Tagalog Tailoring (Fashion & Bridal · ₱1,500.00)]    │
│                                                                        │
│ Price for this design                                                  │
│ (•) Same as the service (₱1,500.00)                                    │
│     Costs what the service costs. Changes when the service price changes│
│ ( ) Extra charge for this design                                       │
│     Service price plus an amount for this specific design              │
│ ( ) Set a price just for this design                                   │
│     Overrides the service price completely                             │
│ ( ) Ask for a quote                                                    │
│     No fixed price — customer asks for a quotation                     │
│                                                                        │
│ Production time — from (days) *         To (days)                      │
│ [ 7                                  ]  [ 10                         ] │
├────────────────────────────────────────────────────────────────────────┤
│ [ Back ]                                                      [ Next ] │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Field Breakdown by Wizard Step

| Step | Step Key | Title | Displayed Fields & UI Controls | Validation / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `gallery` | **Photos & colors** *(Required)* | • **Multi-Image Uploader (`GalleryEditor`)**: Up to 10 high-resolution photos. Drag to reorder. First image is marked with a primary badge.<br>• **Color Variants List**: Add color names (e.g., *"Ivory White"*, *"Midnight Blue"*), select color swatches, or attach specific variant photos. | At least 1 primary photograph must be uploaded. |
| **2** | `info` | **Basics & Pricing** *(Required)* | • **Design Name** (`input text`): Full title of the garment design.<br>• **Service Dropdown (`select name="service_id"`)**: Lists all shop tailoring services + `[+]` shortcut button to create a new service.<br>• **`ParentServiceCard`**: Visual preview of parent service, base price, and category.<br>• **Pricing Mode Radio Group (`pricing_mode`)** *(2026-10-14 Architecture)*:<br>  1. *Same as the service* (`same`): Inherits parent service base price.<br>  2. *Extra charge for this design* (`extra`): Reveals `extra_charge` input. Formula: `Base Price + Extra = Total`.<br>  3. *Set a price just for this design* (`set`): Overrides parent service with custom base price.<br>  4. *Ask for a quote* (`quote`): Quoted individually.<br>• **Production time — from (days)** (`input number`): Turnaround minimum.<br>• **To (days)** (`input number`): Optional turnaround maximum. | • `name` cannot be empty.<br>• If no service is selected, a standalone price is required.<br>• If `extra` is chosen, `extra_charge` must be > 0.<br>• `estimated_days` must be >= 1. |
| **3** | `sizes` | **Sizes** *(Optional)* | • Size chip selector (`SizesEditor`): Toggle standard sizes (`XS`, `S`, `M`, `L`, `XL`, `2XL`, `3XL`).<br>• Custom size adder input for non-standard sizing.<br>• Skip notice: *"Skip it for fully made-to-measure garments."* | Optional. When skipped, garment displays as Made-to-Measure. |
| **4** | `sizeChart` | **Size chart** *(Optional)* | • Upload design-specific size chart image OR build a structured size & measurement matrix (table with chest, waist, shoulder, sleeve measurements per size). | Optional reference information for customers. |
| **5** | `measurement` | **Measurement guide** *(Optional)* | • Upload illustration/guide image showing customers where and how to measure themselves specifically for this garment silhouette (e.g. Barong collar-to-wrist, Gown bust-waist-floor). | Optional guide. |
| **6** | `spec` | **Specification** *(Optional)* | • **Garment Type**: Dropdown (`gown`, `suit`, `barong`, `uniform`, `pants`, `shirt`, `other`).<br>• **Material / Fabric**: Text input (e.g. *"Piña Organza with Satin Lining"*).<br>• **Design Highlights Editor (`SpecificationBulletsEditor`)**: Bulleted feature list (e.g. *"Hand-embroidered callado"*, *"Semi-mandarin collar"*). | Optional styling details. |
| **7** | `description` | **Description** *(Optional)* | • Detailed garment narrative, occasion recommendations (e.g. Weddings, Gala, Formal Events), and fabric care instructions. | Optional multiline text. |
| **8** | `requirements` | **Requirements** *(Optional)* | • Policy settings: *"Use the service / shop default"* vs custom deposit rules for this specific design. | Inherits parent service policy by default. |

---

# SECTION 4: Data Flow & Entity Relationship Architecture

### 4.1 Relationship Summary

```
                       ┌─────────────────────────┐
                       │   Tailoring Service     │
                       │       (services)        │
                       └────────────┬────────────┘
                                    │ 1 : N
                                    ▼
                       ┌─────────────────────────┐
                       │     Catalog Design      │
                       │     (catalog_items)     │
                       └────────────┬────────────┘
                                    │
                                    │ attached to
                                    ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   Registered Customer   │───►│   Booking Appointment   │
│         (users)         │    │      (appointments)     │
└─────────────────────────┘    └────────────┬────────────┘
                                            │ converts into upon approval
                                            ▼
                               ┌─────────────────────────┐
                               │   Contract Job Order    │
                               │      (job_orders)       │
                               └─────────────────────────┘
```

### 4.2 Key Frontend to Backend API Endpoints

1. **Submit Customer Booking Appointment:**
   - **Method / Route:** `POST /catalog/{store_id}/appointments`
   - **Auth:** Bearer Token (`auth:sanctum`)
   - **Payload Shape:**
     ```json
     {
       "branch_id": 2,
       "service_id": 1,
       "appointment_type": "consultation",
       "scheduled_at": "2026-10-24T14:30:00",
       "customer_phone": "09171234567",
       "material_source": "own",
       "material_description": "Customer will provide 3 yards of navy Italian wool",
       "remarks": "Please have tailor ready for wedding suit consultation",
       "answers": {
         "Preferred Collar Style": "Notch Lapel",
         "Event Date": "2026-12-15"
       },
       "items": [
         {
           "service_id": 1,
           "catalog_item_id": 13,
           "item_name": "Bespoke Groom Tuxedos",
           "quantity": 1,
           "selected_size": "L",
           "selected_color": "Core Navy",
           "notes": "Slim fit cut preferred"
         }
       ]
     }
     ```

2. **Create New Tailoring Service:**
   - **Method / Route:** `POST /stores/{store_id}/services`
   - **Auth:** Bearer Token (`role: store_owner, branch_manager`)
   - **Payload Shape:**
     ```json
     {
       "name": "Bespoke Suit Tailoring",
       "service_category": "made_to_order_custom",
       "base_price": 3500.00,
       "estimated_days": 10,
       "estimated_days_max": 15,
       "garment_types": ["suit", "blazer", "trousers", "vest"],
       "capabilities": ["custom_pattern_drafting", "full_lining", "in_person_fitting"],
       "tiers": [
         { "label": "Standard Two-Piece Suit", "amount": 3500 },
         { "label": "Three-Piece Suit (with Vest)", "amount": 4500 }
       ],
       "custom_fields": [
         { "id": "f_1", "label": "Lapel Style", "type": "select", "options": ["Notch", "Peak", "Shawl"], "required": true }
       ]
     }
     ```

3. **Publish New Service Design (Catalog Item):**
   - **Method / Route:** `POST /stores/{store_id}/catalog`
   - **Auth:** Bearer Token (`role: store_owner, branch_manager`)
   - **Payload Shape:**
     ```json
     {
       "service_id": 2,
       "name": "Traditional Ivory Barong Tagalog - Formal Fit",
       "pricing_mode": "extra",
       "extra_charge": 500.00,
       "estimated_days": 7,
       "estimated_days_max": 10,
       "garment_type": "barong",
       "material": "Piña Organza",
       "sizes": ["S", "M", "L", "XL", "2XL"],
       "colors": [{ "name": "Ivory White", "color_code": "#FFFFF0" }],
       "features": [
         "Hand-embroidered u-shape pechera",
         "Traditional French cuffs",
         "Pointed collar with inner lining"
       ]
     }
     ```

---

# SECTION 5: Quality Checklist & Anti-AI Bold Typography Verification

To comply with SUTURA design guidelines (`AGENTS.md`, `MOBILE_UI_DESIGN_SYSTEM.md`, and `tablet-ui-specs`):
- **Typography:**
  - Display / Hero Title: `36px–40px` Bold (`.mobile-hero-title`).
  - H1 Page Title: `28px–32px` Bold (`.mobile-h1`). Strictly 1 per screen.
  - H2 Section Header: `22px–24px` Semi-Bold (600) — *Never Bold (700)*.
  - H3 Card Titles: `18px–20px` Medium or Semi-Bold.
  - Body Text: `16px` Regular (400) — *Never medium or bold for multiline reading body*.
- **Touch Targets:**
  - All interactive buttons and inputs have minimum height of `48px–56px` (`52px` sweet spot).
  - Form inputs have `>= 16px` font size to prevent iOS Safari auto-zooming.
- **Responsive Layout:**
  - Mobile: Full width within `px-4` / `px-6` screen margins.
  - Desktop: Maximum width bounded by `max-w-xl lg:max-w-5xl mx-auto`.
  - Floating sheets and modals bounded by `max-w-[599px] sm:max-w-2xl mx-auto`.
- **Payment & Scope Integrity:**
  - Zero payment gateway calls.
  - No material inventory / fabric procurement tracking (only a yes/no customer fabric suitability check).
  - Descriptive pricing with explicit quotation workflow.
