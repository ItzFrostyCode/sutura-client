# Ordering — browser check (do this before any new work)

Each scenario says what to click and what must be on screen. A mismatch between the **form** and the **detail** is a bug, not a wording choice: the words below are the only ones used (`src/lib/orderUnits.ts`).

**Words:** field **Covers** = Top · Bottom · Top & Bottom. Field **Sold as** = Garment · Set (top + bottom). Not configured = **Not set**. Ordered quantity is counted in **pieces** or **sets**; **garments** is only the physical count to hand over. The step is **Sizing**; the choice of the service's line is **Option**.

Setup: a service "School Uniform" with three options — *Top only* (Covers Top, Sold as Garment, ₱350), *Bottom only* (Covers Bottom, Garment, ₱380), *Uniform set* (Covers Top & Bottom, Set, ₱600) — and a second service with one plain option (Not set / Not set). Run the migration on dev first.

| # | Do | Form shows | Detail must show |
|---|----|-----------|------------------|
| 1 | Service editor → Prices & add-ons: set the three options | Rows have **Covers** and **Sold as**; a set with Covers ≠ Top & Bottom shows "A set is top + bottom: set Covers to Top & Bottom." | Service page (shop and storefront): under each option, e.g. "Covers Top & Bottom · Sold as Set (top + bottom)"; Not set options show nothing extra |
| 2 | New Job Order → service → **Option** list | Each option: its line + price ("₱600 per set"); required once any option is configured | — |
| 3 | Pick *Uniform set*, quantity 2, one person | Sizing says "Covers Top & Bottom, set by the option you chose"; Top size + Bottom size; Review: "1 person · 2 sets · 4 garments · Uniform set" | Order → "What this order needs": **Option** "Uniform set · Covers Top & Bottom · Sold as Set (top + bottom)"; **Ordered** "2 sets · 4 garments"; chip "2 sets · 4 garments" |
| 4 | Team of 2 people, *Uniform set*, add the **Pieces** column = 2 each | "Covers Top & Bottom, set by the option"; Covers column locked | Team list: 2 people · **4 sets · 8 garments**; price = 4 × ₱600 (never × 8) |
| 5 | Pick *Top only*, quantity 3 | Only Top size / Top points | "3 pieces", no garments line (1 each); Sizing row mentions the top only |
| 6 | Service whose option is Not set, Top & Bottom chosen by hand, quantity 2 | Covers is a choice (not locked) | "2 pieces"; handover 2 (nothing implied) |
| 7 | Service with **no body measurements** (`none`) | "No body measurements are needed… You will still describe the garment and add photos or details" | No Sizing todo; the service's questions, fabric and photos are there; details still need approval |
| 8 | Customer online order, *Uniform set* | **Option** first; then "Covers Top & Bottom, set by the option you chose"; step 4 "Price per set", "Sets × 2", "Garments 4" | My Orders and the shop's order show the same Option / Ordered lines as #3; nothing was charged at request |
| 9 | Hand over: record 3 of 4 garments | — | Remaining 1 garment; Completed is refused until 4 of 4 |
| 10 | Edit the option (rename, change Sold as) after #3 | — | The old order still says "Uniform set", Sold as Set, 4 garments |

Also confirm: the same Top/Bottom/Top & Bottom words appear on the order's measurement badge, the team list badge and the Covers column; Top & Bottom is never "Top and bottom", "Both" or "top Only" anywhere.
