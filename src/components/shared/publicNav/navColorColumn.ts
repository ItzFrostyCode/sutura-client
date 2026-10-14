// nav group key -> ?department= value. Wedding/Office no longer exist as
// departments (Categories.md demotes both to filters/attributes), and
// 'services'/'discover' deliberately have no entry — those groups don't
// filter by garment department at all.
// Since the 2-level taxonomy (2026-10-14) no menu group filters by Men / Women / Kids, so this is empty: a menu
// link opens its own /search URL and never adds ?department=.
export const DEPARTMENT_KEY_MAP: Record<string, string> = {};
