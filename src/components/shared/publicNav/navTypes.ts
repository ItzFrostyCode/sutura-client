export interface CategoryLeaf {
  label: string;
  /**
   * The canonical taxonomy key for this leaf — a subcategory slug (men/
   * women/children groups) or a service_category slug (services group).
   * Passed to getTaxonomyColumns()/getServiceColumns() instead of
   * label-string-matching.
   */
  key?: string;
  garmentType?: string;
  query?: string;
}

export interface TopGroup {
  key: string;
  label: string;
  categories: CategoryLeaf[];
  links?: { href: string; label: string }[];
}

export type MenuScreen =
  | { level: 0 }
  | { level: 1; group: TopGroup }
  | { level: 2; group: TopGroup; category: CategoryLeaf };

export function leafSearchHref(leaf: CategoryLeaf): string {
  const params = new URLSearchParams();
  if (leaf.garmentType) params.set('category', leaf.garmentType);
  else if (leaf.query) params.set('q', leaf.query);
  return `/search?${params.toString()}`;
}
