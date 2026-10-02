# Test accounts — who to open, and how they relate

Password for **every** account: `password`.

**Login pages:** customers, shop owners, branch managers and staff sign in at `/login`. The system admin signs in at `/admin/login`.

> **About the IDs.** They are what a fresh `php artisan migrate:fresh --seed` produces (the same on every clone). An older local database may have different numbers — the **email is the stable key**, so open accounts by email.

Everything below is account-based: pick the row, open that account, and check its pages and history.

---

## 1. System Admin

| User ID | Name | Account | Password | Login |
|---|---|---|---|---|
| 1 | System Admin | `admin@sutura.com` | `password` | `/admin/login` |

Check: shop applications and approvals, subscription plans and upgrades, support tickets (each ticket is tagged with who filed it — Owner / Branch manager / Staff), platform activity.

---

## 2. Shop → Branch → People

There is one demo shop, with one branch.

### Shop and owner

| Shop ID | Shop name | Owner user ID | Owner name | Owner account | Password |
|---|---|---|---|---|---|
| 1 | Thread & Needle Tailoring (`thread-needle`) | 2 | Maria Cruz | `maria.cruz@gmail.com` | `password` |

### Branch

| Branch ID | Shop ID | District | Branch name | Main? |
|---|---|---|---|---|
| 1 | 1 | Poblacion (Davao City) | Poblacion Branch (Main) | Yes |

### Branch manager and staff (all belong to Branch 1 / Shop 1)

| Staff ID | User ID | Branch ID | Name | Role | Account | Password | Access |
|---|---|---|---|---|---|---|---|
| 2 | 4 | 1 | Miguel Manager | Branch manager | `miguel.manager@sutura.com` | `password` | Branch manager: own branch only; no Staff-role limits |
| 1 | 3 | 1 | Juan Dela Cruz | Head tailor + sublimation | `juan.delacruz@sutura.com` | `password` | **Plain staff** (the main staff test account) |
| 3 | 5 | 1 | Ana Santos | Senior designer | `ana.santos@sutura.com` | `password` | Plain staff |
| 4 | 6 | 1 | Pedro Penduko | Cutter / sewer | `pedro.penduko@sutura.com` | `password` | Plain staff |

> Every account is named after its person (no generic `staff@` / `customer@` logins). `juan.delacruz@sutura.com` (staff) and `juan.delacruz@gmail.com` (customer) are two different people with the same name — the domain tells them apart.

What each one has in their history:

| Account | Production history | Other |
|---|---|---|
| `juan.delacruz@sutura.com` | Worked on 4 orders | 1 appointment assigned to them, 1 support ticket (answered by the admin), 2 notifications |
| `ana.santos@sutura.com` | Worked on 5 orders | — |
| `pedro.penduko@sutura.com` | Worked on 1 order | — |
| `miguel.manager@sutura.com` | — | Sees only Branch 1; approves/rejects appointments, verifies payments |
| `maria.cruz@gmail.com` | Everything | Payment methods (GCash, Maya, BPI), requirements, storefront, billing |

---

## 3. Customers (they deal with Shop 1)

| Customer ID | Name | Account | Password | Appointments | Orders | Measurements | Other |
|---|---|---|---|---|---|---|---|
| 7 | Juan dela Cruz | `juan.delacruz@gmail.com` | `password` | 2 (confirmed, cancelled) | 4: ORD-0001, 0004, 0007, 0010 (sewing, completed, final adjustments) | 2 profiles | 3 catalog orders, 1 review |
| 8 | Jose Rizal | `jose.rizal@gmail.com` | `password` | 3 (pending, completed — incl. an *Other — Fabric shopping* visit) | 4: ORD-0002, 0005, 0008, 0011 (cutting, ready for fitting, QC, pending) | — | 2 catalog orders, 1 review |
| 9 | Andres Bonifacio | `andres.b@gmail.com` | `password` | 1 (completed) | 3: ORD-0003, 0006, 0009 (ready for pickup, mass cutting, completed) | 1 (wedding-gown fitting) | 1 review |
| 10 | Maria Clara | `maria.clara@gmail.com` | `password` | — | — | 1 — **Pending fitting** | — |
| 11 | Tess Tester | `tess.tester@gmail.com` | `password` | — | — | — | **Clean account to test booking** (no appointments) |
| — | Pia Santos | `pia.santos@gmail.com` | `password` | — | 8 completed past orders (ORD-H001 … H008) over the last ~8 months | — | **16 receipt images** (GCash / Maya / bank) — use her records with the owner's *Payments → Statements* |
| 12 | Tomas Tester | `tomas.tester@gmail.com` | `password` | 1 — **Rejected** (with the shop's reason) | — | — | Can book again |
| 13 | Liza Fernandez | `liza.fernandez@example.com` | `password` | 1 pending (pays by GCash/bank — receipt waiting) | — | — | 1 catalog order |
| 14 | Mark Villanueva | `mark.villanueva@example.com` | `password` | 1 pending (receipt waiting) | — | — | — |
| 15 | Cristina Ramos | `cristina.ramos@example.com` | `password` | 1 pending (receipt waiting) | — | — | 1 catalog order |

A customer can hold only one active appointment at a time — that is why `booking.tester1` has none.

---

## 4. Which account for which test

| I want to test… | Open |
|---|---|
| Shop approvals, plans, platform tickets | `admin@sutura.com` |
| Approve / reject / assign appointments, **Needs your decision** on Home | `maria.cruz@gmail.com` or `miguel.manager@sutura.com` |
| Payment Methods, verify an e-payment, Requirements (service / design / combo / shop defaults) | `maria.cruz@gmail.com` |
| Staff Home, production queue, Assigned to me, Create Job from an appointment (phone: 320–599px) | `juan.delacruz@sutura.com` |
| Staff report a problem to the admin | `juan.delacruz@sutura.com` → Help (?) → Support tickets, then check as `admin@sutura.com` |
| Measurement *Pending fitting* / *Finalized* | shop side: `juan.delacruz@sutura.com`; customer side: `maria.clara@gmail.com` |
| Book an appointment from scratch | `tess.tester@gmail.com` |
| A rejected request | `tomas.tester@gmail.com` |
| Track an order, pay for it ("Pay for this order"), see its stages | `jose.rizal@gmail.com` (e.g. ORD-0002) |
| A completed order, reviews, history | `juan.delacruz@gmail.com`, `andres.b@gmail.com` |
| Download receipts by week / 2 weeks / month / year / all time (ZIP, CSV, print) | `maria.cruz@gmail.com` → Payments → **Statements** (needs the Premium plan for bulk download; a fresh seed is Premium) |
| Review a text message before it is sent; fix a wrong number | `maria.cruz@gmail.com` → **Text Messages** (test mode: nothing is delivered). A customer turns texts off at *Me → Settings → Text messages* |
| Receipts waiting for the owner to verify | owner side: `maria.cruz@gmail.com` → Collect Payments; customers `liza.fernandez@…`, `mark.villanueva@…`, `cristina.ramos@…` |

---

> **Phone numbers.** Demo customers have made-up mobile numbers (`0900 000 00NN` — the 0900 prefix is not an assigned mobile prefix) and the SMS driver is in **test mode**, so no text can reach a real person. Cristina Ramos deliberately has a broken number so the "fix the number" step can be seen.

## 5. Old generic logins were renamed

An existing database is renamed in place the next time you run `php artisan db:seed` (history is kept):

| Before | Now |
|---|---|
| `staff@sutura.com` | `juan.delacruz@sutura.com` |
| `manager@sutura.com` | `miguel.manager@sutura.com` |
| `customer@sutura.com` | `juan.delacruz@gmail.com` |
| `booking.tester1@sutura.com` | `tess.tester@gmail.com` |
| `booking.tester2@sutura.com` | `tomas.tester@gmail.com` |

An older database may also hold extra hand-made accounts that are not part of the seed (for example `ferdie.marasigan@example.com`); they are not listed here.

---

## 6. Reset / refresh

```bash
cd sutura-server
MAIL_MAILER=log php artisan db:seed --force      # safe to re-run; adds missing demo data
MAIL_MAILER=log php artisan migrate:fresh --seed # wipes the local DB and rebuilds all of the above
```

Seeded by `LocalTestSeeder` (shop, branch, people, customers, orders) and `StaffAndPaymentsDemoSeeder` (payment methods, requirements, the staff ticket, rejected / Other appointments, Pending-fitting measurement, staff notifications).
