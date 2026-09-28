# Module 1: Customer & Guest

**Formal owner:** Bulotano, Renalyn C. · **Built by:** Arabejo, Joshua Wayman A.

## Objectives it answers

> **Shop Discovery and Map-Based Navigation Module** for location and garment-based search, the customer will search for tailoring services by specific garment type, filter results by area, specialization, and real-time branch availability, view pinned geolocation coordinates of verified tailoring shops within Davao City, and access complete storefront profiles and route directions.

> **Order Tracking and Measurement Module** … while customers monitor their order progress from placement to pickup.

## Guest vs Customer

| | Guest (no account) | Customer (logged in) |
|---|---|---|
| Search, filter, map, store directory | ✅ | ✅ |
| View shop profile, catalog designs, services | ✅ | ✅ |
| Track an order with a tracking code (`/track`) | ✅ | ✅ |
| Book an appointment / Bulk Order | ❌ asked to log in | ✅ |
| Save, rate, report a listing | ❌ asked to log in | ✅ |
| My Orders, Appointments, Measurements, History | ❌ | ✅ |

## The customer journey, step by step

1. **Search** from the landing page, e.g. "Barong".
2. **Allow location** (optional). Results can then be sorted by nearest shop, computed on the server from real coordinates.
3. **Browse three tabs:** Stores, Services, Catalog. Filters: garment type, specialization, district, open now, color, price.
4. **Pick a shop or a specific design.**
   - **Shop profile tabs:** Catalog, Services, About (description, social links, opening hours), Branches (each with a map), Ratings.
   - **Catalog design detail:** price, service, color, fabric, sizing, size guide, specs, care, ratings, and a ⋯ menu (Back to Homepage, Report this product, Need help?).
   - **Service detail:** description, the list of **pricing options** (e.g. Pants Hemming ₱150, Zipper Replacement ₱200), and Book Appointment.
5. **Choose an action:**
   - **Book a Fitting** for single custom pieces (Barong, gown, suit).
   - **Bulk Order** for bulk-type services (jerseys, uniforms): team name plus a roster of names and sizes.
   - **Find Branch** to see branch locations and get directions.
6. **Booking wizard** (3 steps: Purpose → Schedule → Review). The customer can attach reference photos, a Google Drive link, say whether they'll bring their own fabric, and answer the shop's own questions. A notice at the top says this is **an in-person visit, not a delivery**.
7. **Wait for approval.** The appointment starts as **pending**. The customer immediately gets an "Appointment Request Sent" notification with the purpose, shop, date and time.
8. **Shop confirms.** Once confirmed, a slim reminder bar appears at the top of the landing page (collapsible) until the date.
9. **In person:** the customer and shop discuss details; staff take measurements and create the job order.
10. **Track:** My Orders shows a 6-phase progress view (simplified from the shop's 10 internal stages), payment status, balance, estimated ready time, and any linked appointments.

**Why appointment-first, not add-to-cart:** SUTURA tracks made-to-order work. Nothing exists in stock yet, so the exact fabric, fit and price are settled in person. This matches the thesis scope line: *"appointment-based order intake where tailoring staff can create job orders directly from scheduled fittings."*

## Rules worth knowing

| Rule | Why |
|---|---|
| One active appointment per shop per customer | Anti-spam. Cancel the old one to rebook at the same shop. |
| No overlapping times across different shops | A person can't be in two shops at once. Different times the same day are fine. |
| Appointment updates are in-app only (no email) | Emails for every status change were too noisy. |
| Measurements are read-only for customers | Thesis: measurements are "manually encoded by authorized users." |
| Customer's own fabric: recorded, never measured | See "Customer-supplied material" below. |

## Customer-supplied material

If the customer brings their own fabric, the order records only:

- **Who supplied it** (shop or customer): a Yes/No.
- **A short description** so staff can recognize it ("beige piña, about 2 yards").
- **Its condition**, set by the shop: safe, damaged, lost, or returned. The customer sees this on their tracker **only when it's not "safe."**

No quantities, no cost, no deduction. That keeps it out of inventory tracking. Full explanation in [3-STAFF-MODULE.md](3-STAFF-MODULE.md).

## Deliberately out of scope

- Shopping cart, color/size variants, stock counts. Made-to-order; no inventory.
- Delivery or courier. Pickup at the shop only.
- Online payment. The customer can upload a receipt or reference number; the shop records it.
- SMS. In-app notifications only.
- Rental.
- Buying through Shopee. The system can collect the same details, but it doesn't connect to Shopee.

## Likely panel questions

**Q: Can I buy directly without an appointment, like Shopee?**
A: No, by design. These garments don't exist yet; they're made to the customer's body. Shopee sells stock with known sizes. SUTURA books the fitting, and the shop finalizes fabric, measurements and price in person. Bulk orders for standard sizes (jerseys, uniforms) can be submitted directly with a roster.

**Q: What if I want different colors or sizes?**
A: Each color is its own catalog design, and the specific one is confirmed at the fitting. For groups, the Bulk Order roster records each person's size.

**Q: How does the map work?**
A: Each branch has saved coordinates. The customer's location (if allowed) is used to compute distance on the server, so results can be sorted by nearest shop. Find Branch opens directions.

**Q: How do I know my order's status without logging in?**
A: Every job order gets a tracking code. Entering it at `/track` shows the stage, like a courier tracking number, with no personal data.

**Q: What if I forget my appointment?**
A: The confirmation is in the notification bell, the full list is in My Appointments, and a confirmed upcoming appointment shows as a reminder bar on the landing page.

**Q: What stops me from booking two shops at the same time?**
A: The system checks all your active appointments across every shop and blocks any overlapping time.

**Q: Can customers report a bad listing?**
A: Yes. "Report this product" sends a ticket to the System Administrator, who can warn the shop, hide that design, or hide the shop. See [4-ADMIN-MODULE.md](4-ADMIN-MODULE.md).

## Known gaps (be honest if asked)

- **Same person, several identical pieces:** there's no quantity field on a single custom order yet. Quantity typed in the booking form is only saved as a note.
- **Bulk roster columns are fixed** to Name and Size. Jersey numbers or positions can't be entered by the customer yet.
- **Repair Request page** doesn't ask a guest to log in first; submitting as a guest shows a generic error.
- **"Repair" has no filter chip.** Typing "repair" in search does find shops with repair services.
- **"No specific design" consultation path** has no dedicated button; customers use a Service's Book Appointment instead.

## Thesis paper vs system

- The paper promises **SMS** confirmations. The system uses in-app notifications.
- The paper's ERD has a **CustomerProfile** table. Customers are `User` records with the customer role.
- The paper's customer tracker shows "Accepted, Cutting, Stitching, Ready for Pickup." The system shows 6 phases mapped from 10 real production stages.
