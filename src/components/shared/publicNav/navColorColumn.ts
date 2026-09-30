// nav group key -> ?department= value. Wedding/Office no longer exist as
// departments (Categories.md demotes both to filters/attributes), and
// 'services'/'discover' deliberately have no entry — those groups don't
// filter by garment department at all.
export const DEPARTMENT_KEY_MAP: Record<string, string> = {
  men: 'men',
  women: 'women',
  children: 'children',
};
