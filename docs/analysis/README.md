# SUTURA Analysis — Service, Catalog Design and the Order Flow

This folder holds the business analysis of how SUTURA really works. It covers services, catalog designs and pricing, and how they lead to appointments, orders, job orders and production. It is written as **logic, not code**: what happens, who can do it, and in what order. File paths are given only as evidence.

| Folder / file | What goes in it |
| --- | --- |
| `research/` | Your own research: shop-owner interviews, notes from shop visits, adviser and panel feedback, findings on service vs. design vs. price. The main set is in `../Sutura_Research Analysis/`. |
| `codebase/` | What the current code actually does, explained in plain words (no code). The audit report is saved here. |
| `AUDIT-PROMPT.md` | The prompt for the full audit, to run once `research/` has your material in it. |

## Rules for this folder

- **The code beats the paper.** When `research/` and `codebase/` disagree, write the gap down; don't hide it.
- **The thesis scope is a constraint.** Anything on the out-of-scope list in `../PRD.md` is marked as scope creep, not as a requirement.
- **No secrets.** Never copy values from `.env` files here.

## Already written on this topic (outside this folder)

These belong to the same subject. They were left where they are, and can be moved here later:

- `../service to catalog design.md` — Service → Catalog Design relationship
- `../service to catalog achievable task.md` — task roadmap for the same
- `../architecture/` — cross-module data flow, source-of-truth matrix
- `../workflows/` — owner → customer / staff / admin workflows
- `../research/Complete Business Tailor Shops.txt` — the early raw interview extraction
