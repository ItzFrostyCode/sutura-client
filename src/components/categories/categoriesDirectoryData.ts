import {
  GARMENT_CATEGORIES,
  GARMENT_CATEGORY_KEYS,
  GARMENTS,
  SERVICE_GROUPS,
  SERVICE_GROUP_KEYS,
  garmentsInCategory,
  type GarmentCategory,
  type ServiceGroupKey,
} from '@/lib/garmentTaxonomy';
import {
  Sparkles,
  Flower2,
  GraduationCap,
  Trophy,
  Crown,
  BriefcaseBusiness,
  Shirt,
  Ruler,
  Wind,
  Drama,
  Scissors,
  Layers,
  Compass,
  Users,
  type LucideIcon,
} from 'lucide-react';

// Everything on All Categories comes from lib/garmentTaxonomy (generated from the server's CanonicalTaxonomy):
// 10 garment categories → their garments, and the 4 services → their tasks. Nothing is typed in by hand here.

/** Searching a garment shows the shops that make it, the ones that alter or fix it, and its designs. */
export const garmentHref = (slug: string) => `/search?q=${encodeURIComponent(GARMENTS[slug]?.label.split(' / ')[0] ?? slug)}`;

/** A category searches by its own name (its first alias, e.g. "barong", "uniform", "pants"). */
export const categoryHref = (cat: GarmentCategory) =>
  `/search?q=${encodeURIComponent(GARMENT_CATEGORIES[cat]?.aliases[0] ?? GARMENT_CATEGORIES[cat]?.label ?? cat)}`;

/** The Services tab, limited to one service — and to the services that ticked one task. */
export const serviceHref = (group: ServiceGroupKey, capability?: string) =>
  `/search?tab=services&service_category=${group}${capability ? `&service_type=${capability}` : ''}`;

/** "Other Garments" holds typed-in names, so it is not a tile. */
const LISTED_CATEGORIES = GARMENT_CATEGORY_KEYS.filter((c) => c !== 'other');

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  barong: Sparkles,
  traditional: Flower2,
  uniforms: GraduationCap,
  jerseys_sportswear: Trophy,
  dresses_gowns: Crown,
  formal_wear: BriefcaseBusiness,
  shirts_tops: Shirt,
  pants_bottoms: Ruler,
  outerwear: Wind,
  costumes: Drama,
};

const SERVICE_ICONS: Record<ServiceGroupKey, LucideIcon> = {
  custom_tailoring: Compass,
  uniform_production: Users,
  alterations_repairs: Scissors,
  garment_customization: Layers,
};

export interface VisualCategory {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

/** The two-row tile strip: the 10 garment categories, then the 4 services. */
export const VISUAL_CATEGORIES: VisualCategory[] = [
  ...LISTED_CATEGORIES.map((cat) => ({
    id: cat,
    label: GARMENT_CATEGORIES[cat].label,
    href: categoryHref(cat),
    icon: CATEGORY_ICONS[cat] ?? Shirt,
  })),
  ...SERVICE_GROUP_KEYS.map((group) => ({
    id: group,
    label: SERVICE_GROUPS[group].label,
    href: serviceHref(group),
    icon: SERVICE_ICONS[group],
  })),
];

export interface SubCategoryLink {
  label: string;
  href: string;
}

export interface AlphabetCategorySection {
  title: string;
  categoryHref: string;
  subCategories: SubCategoryLink[];
}

export interface AlphabetGroup {
  letter: string;
  categories: AlphabetCategorySection[];
}

function buildAlphabetDirectory(): AlphabetGroup[] {
  const sections: AlphabetCategorySection[] = [
    ...LISTED_CATEGORIES.map((cat) => ({
      title: GARMENT_CATEGORIES[cat].label,
      categoryHref: categoryHref(cat),
      subCategories: garmentsInCategory(cat).map((slug) => ({ label: GARMENTS[slug].label, href: garmentHref(slug) })),
    })),
    ...SERVICE_GROUP_KEYS.map((group) => ({
      title: SERVICE_GROUPS[group].label,
      categoryHref: serviceHref(group),
      subCategories: Object.entries(SERVICE_GROUPS[group].capabilities).map(([slug, cap]) => ({
        label: cap.label,
        href: serviceHref(group, slug),
      })),
    })),
  ];

  const byLetter = new Map<string, AlphabetCategorySection[]>();
  for (const section of sections) {
    const letter = section.title.charAt(0).toUpperCase();
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), section]);
  }
  return [...byLetter.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, categories]) => ({ letter, categories }));
}

/** The A–Z directory: each garment category and each service under its first letter, with its garments / tasks. */
export const ALPHABET_DIRECTORY: AlphabetGroup[] = buildAlphabetDirectory();

export const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
