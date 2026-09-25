export interface AccordionItem {
  label: string;
  href?: string;
  hex?: string;
}

export interface AccordionSectionDef {
  key: string;
  label: string;
  swatches?: boolean;
  flat?: boolean;
  items: AccordionItem[];
}

export interface CategoryLeaf {
  label: string;
  garmentType?: string;
  query?: string;
  sections?: AccordionSectionDef[];
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
