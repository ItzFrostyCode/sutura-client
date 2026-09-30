// The single source of truth for SUTURA's apparel + services taxonomy,
// transcribed directly from Mocked Layout/Categories.md and Services.md.
// Mirrors app/Support/CanonicalTaxonomy.php on the backend exactly (same
// slugs, same labels) — keep both in sync by hand. This is the file the
// header nav (publicNav/*) and /search now both key off, replacing the
// old garmentCategories.tsx / categoryChipSets.ts / navSearchCategories.ts
// taxonomy files.

export type Department = 'men' | 'women' | 'children';
export function isDepartment(value: string): value is Department {
  return (DEPARTMENTS as string[]).includes(value);
}
// 'other'/'others' are a deliberate safety valve, not doc-defined — every
// department's subcategory list ends in an "Others" entry (see
// TAXONOMY_TREE) so an item that doesn't fit the canonical hierarchy still
// has somewhere to go under the right department.
export type GarmentStructure = 'top_wear' | 'bottom_wear' | 'sets' | 'one_piece' | 'other';

export const DEPARTMENTS: Department[] = ['men', 'women', 'children'];

export const DEPARTMENT_LABELS: Record<Department, string> = {
  men: "Men's Apparel",
  women: "Women's Apparel",
  children: "Children's Apparel",
};

export const GARMENT_STRUCTURES: GarmentStructure[] = ['top_wear', 'bottom_wear', 'sets', 'one_piece', 'other'];

export const GARMENT_STRUCTURE_LABELS: Record<GarmentStructure, string> = {
  top_wear: 'Top Wear',
  bottom_wear: 'Bottom Wear',
  sets: 'Sets',
  one_piece: 'One-Piece',
  other: 'Other',
};

export const SUBCATEGORY_LABELS: Record<string, string> = {
  formal_wear: 'Formal Wear',
  traditional_wear: 'Traditional Wear',
  traditional_cultural_wear: 'Traditional & Cultural Wear',
  dresses_gowns: 'Dresses & Gowns',
  casual_wear: 'Casual Wear',
  uniforms_workwear: 'Uniforms & Workwear',
  sportswear_teamwear: 'Sportswear & Teamwear',
  costumes_performance: 'Costumes & Performance',
  outerwear: 'Outerwear',
  boys_apparel: "Boys' Apparel",
  girls_apparel: "Girls' Apparel",
  others: 'Others',
};

export const GARMENT_TYPE_LABELS: Record<string, string> = {
  // Men — Formal Wear
  dress_shirts: 'Dress Shirts', formal_shirts: 'Formal Shirts', formal_vests: 'Formal Vests',
  formal_trousers: 'Formal Trousers', dress_pants: 'Dress Pants', pleated_trousers: 'Pleated Trousers',
  suits: 'Suits', tuxedo_sets: 'Tuxedo Sets', formal_sets: 'Formal Sets',
  // Men — Traditional Wear
  barong_tagalog: 'Barong Tagalog', modern_barong: 'Modern Barong', short_sleeve_barong: 'Short-Sleeve Barong',
  other_traditional_tops: 'Other Traditional Tops', traditional_trousers: 'Traditional Trousers',
  traditional_pants: 'Traditional Pants', barong_sets: 'Barong Sets', traditional_wear_sets: 'Traditional Wear Sets',
  // Men — Casual Wear
  polo_shirts: 'Polo Shirts', casual_shirts: 'Casual Shirts', button_down_shirts: 'Button-Down Shirts',
  custom_t_shirts: 'Custom T-Shirts', casual_trousers: 'Casual Trousers', chinos: 'Chinos',
  casual_pants: 'Casual Pants', casual_sets: 'Casual Sets',
  // Men/Women — Uniforms & Workwear
  school_uniform_tops: 'School Uniform Tops', corporate_shirts: 'Corporate Shirts',
  office_uniform_tops: 'Office Uniform Tops', hospitality_tops: 'Hospitality Tops', medical_tops: 'Medical Tops',
  school_uniform_pants: 'School Uniform Pants', corporate_trousers: 'Corporate Trousers',
  office_uniform_pants: 'Office Uniform Pants', school_uniform_sets: 'School Uniform Sets',
  corporate_uniform_sets: 'Corporate Uniform Sets', institutional_uniform_sets: 'Institutional Uniform Sets',
  // Men/Women — Sportswear & Teamwear
  basketball_jerseys: 'Basketball Jerseys', volleyball_jerseys: 'Volleyball Jerseys',
  esports_jerseys: 'Esports Jerseys', cycling_jerseys: 'Cycling Jerseys',
  basketball_shorts: 'Basketball Shorts', volleyball_shorts: 'Volleyball Shorts', team_shorts: 'Team Shorts',
  basketball_sets: 'Basketball Sets', volleyball_sets: 'Volleyball Sets', esports_sets: 'Esports Sets',
  custom_team_sets: 'Custom Team Sets',
  // Men — Costumes & Performance
  costume_tops: 'Costume Tops', character_tops: 'Character Tops', stage_tops: 'Stage Tops',
  costume_pants: 'Costume Pants', character_bottoms: 'Character Bottoms', stage_bottoms: 'Stage Bottoms',
  full_costumes: 'Full Costumes', stage_costumes: 'Stage Costumes', cosplay_sets: 'Cosplay Sets',
  // Men — Outerwear
  jackets: 'Jackets', coats: 'Coats', overshirts: 'Overshirts', lightweight_outerwear: 'Lightweight Outerwear',
  // Women — Formal Wear
  formal_blouses: 'Formal Blouses', formal_tops: 'Formal Tops', formal_boleros: 'Formal Boleros',
  formal_skirts: 'Formal Skirts', formal_pants: 'Formal Pants', tailored_trousers: 'Tailored Trousers',
  womens_suits: "Women's Suits",
  // Women — Traditional & Cultural Wear
  filipiniana_tops: 'Filipiniana Tops', terno_tops: 'Terno Tops', baro: 'Baro',
  maria_clara_tops: 'Maria Clara Tops', modern_filipiniana_tops: 'Modern Filipiniana Tops',
  saya: 'Saya', traditional_skirts: 'Traditional Skirts',
  filipiniana_sets: 'Filipiniana Sets', terno_sets: 'Terno Sets', barot_saya_sets: "Baro't Saya Sets",
  // Women — Dresses & Gowns
  casual_dresses: 'Casual Dresses', formal_dresses: 'Formal Dresses', evening_dresses: 'Evening Dresses',
  debut_gowns: 'Debut Gowns', custom_gowns: 'Custom Gowns',
  // Women — Casual Wear
  casual_blouses: 'Casual Blouses', casual_tops: 'Casual Tops', polo_blouses: 'Polo Blouses',
  casual_skirts: 'Casual Skirts', trousers: 'Trousers',
  // Women — Uniforms & Workwear
  corporate_blouses: 'Corporate Blouses', institutional_tops: 'Institutional Tops',
  blazers: 'Blazers',
  school_uniform_skirts: 'School Uniform Skirts', corporate_skirts: 'Corporate Skirts',
};

export const SERVICE_CATEGORIES = [
  'custom_tailoring', 'alterations_repairs', 'uniform_production', 'printing_sublimation', 'custom_costume_creation', 'others',
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  custom_tailoring: 'Custom Tailoring',
  alterations_repairs: 'Alterations & Repairs',
  uniform_production: 'Uniform Production',
  printing_sublimation: 'Printing & Sublimation',
  custom_costume_creation: 'Custom Costume Creation',
  others: 'Others',
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  bespoke_tailoring: 'Bespoke Tailoring', made_to_measure: 'Made-to-Measure',
  custom_pattern_making: 'Custom Pattern Making', formal_wear_tailoring: 'Formal Wear Tailoring',
  traditional_wear_tailoring: 'Traditional Wear Tailoring', custom_garment_construction: 'Custom Garment Construction',
  hemming_length_adjustment: 'Hemming & Length Adjustment', waist_seat_adjustment: 'Waist & Seat Adjustment',
  tapering_resizing: 'Tapering & Resizing', sleeve_adjustment: 'Sleeve Adjustment',
  zipper_replacement: 'Zipper Replacement', button_fastener_replacement: 'Button & Fastener Replacement',
  garment_repair_restoration: 'Garment Repair & Restoration',
  school_uniforms: 'School Uniforms', corporate_uniforms: 'Corporate Uniforms', office_uniforms: 'Office Uniforms',
  medical_uniforms: 'Medical Uniforms', hospitality_uniforms: 'Hospitality Uniforms', institutional_uniforms: 'Institutional Uniforms',
  sports_jersey_printing: 'Sports Jersey Printing', full_sublimation: 'Full Sublimation',
  teamwear_printing: 'Teamwear Printing', corporate_apparel_printing: 'Corporate Apparel Printing',
  custom_apparel_printing: 'Custom Apparel Printing',
  cosplay_costumes: 'Cosplay Costumes', stage_theater_costumes: 'Stage & Theater Costumes',
  event_costumes: 'Event Costumes', character_costumes: 'Character Costumes',
  cultural_dance_costumes: 'Cultural & Dance Costumes',
};

type StructureMap = Partial<Record<GarmentStructure, string[]>>;
type SubcategoryMap = Record<string, StructureMap>;
type Tree = Record<Department, SubcategoryMap>;

export const TAXONOMY_TREE: Tree = {
  men: {
    formal_wear: {
      top_wear: ['dress_shirts', 'formal_shirts', 'formal_vests'],
      bottom_wear: ['formal_trousers', 'dress_pants', 'pleated_trousers'],
      sets: ['suits', 'tuxedo_sets', 'formal_sets'],
      other: [],
    },
    traditional_wear: {
      top_wear: ['barong_tagalog', 'modern_barong', 'short_sleeve_barong', 'other_traditional_tops'],
      bottom_wear: ['traditional_trousers', 'traditional_pants'],
      sets: ['barong_sets', 'traditional_wear_sets'],
      other: [],
    },
    casual_wear: {
      top_wear: ['polo_shirts', 'casual_shirts', 'button_down_shirts', 'custom_t_shirts'],
      bottom_wear: ['casual_trousers', 'chinos', 'casual_pants'],
      sets: ['casual_sets'],
      other: [],
    },
    uniforms_workwear: {
      top_wear: ['school_uniform_tops', 'corporate_shirts', 'office_uniform_tops', 'hospitality_tops', 'medical_tops'],
      bottom_wear: ['school_uniform_pants', 'corporate_trousers', 'office_uniform_pants'],
      sets: ['school_uniform_sets', 'corporate_uniform_sets', 'institutional_uniform_sets'],
      other: [],
    },
    sportswear_teamwear: {
      top_wear: ['basketball_jerseys', 'volleyball_jerseys', 'esports_jerseys', 'cycling_jerseys'],
      bottom_wear: ['basketball_shorts', 'volleyball_shorts', 'team_shorts'],
      sets: ['basketball_sets', 'volleyball_sets', 'esports_sets', 'custom_team_sets'],
      other: [],
    },
    costumes_performance: {
      top_wear: ['costume_tops', 'character_tops', 'stage_tops'],
      bottom_wear: ['costume_pants', 'character_bottoms', 'stage_bottoms'],
      sets: ['full_costumes', 'stage_costumes', 'cosplay_sets'],
      other: [],
    },
    outerwear: {
      top_wear: ['jackets', 'coats', 'overshirts', 'lightweight_outerwear'],
      other: [],
    },
    // Safety valve — not in Categories.md, added so an item that doesn't
    // fit any defined subcategory still has somewhere to go under Men.
    others: { other: [] },
  },
  women: {
    formal_wear: {
      top_wear: ['formal_blouses', 'formal_tops', 'formal_boleros'],
      bottom_wear: ['formal_skirts', 'formal_pants', 'tailored_trousers'],
      sets: ['womens_suits', 'formal_sets'],
      other: [],
    },
    traditional_cultural_wear: {
      top_wear: ['filipiniana_tops', 'terno_tops', 'baro', 'maria_clara_tops', 'modern_filipiniana_tops'],
      bottom_wear: ['saya', 'traditional_skirts', 'traditional_pants'],
      sets: ['filipiniana_sets', 'terno_sets', 'barot_saya_sets'],
      other: [],
    },
    dresses_gowns: {
      one_piece: ['casual_dresses', 'formal_dresses', 'evening_dresses', 'debut_gowns', 'custom_gowns'],
      other: [],
    },
    casual_wear: {
      top_wear: ['casual_blouses', 'casual_tops', 'polo_blouses'],
      bottom_wear: ['casual_skirts', 'casual_pants', 'trousers'],
      sets: ['casual_sets'],
      other: [],
    },
    uniforms_workwear: {
      top_wear: ['school_uniform_tops', 'corporate_blouses', 'office_uniform_tops', 'institutional_tops', 'blazers'],
      bottom_wear: ['school_uniform_skirts', 'corporate_skirts', 'office_uniform_pants'],
      sets: ['school_uniform_sets', 'corporate_uniform_sets', 'institutional_uniform_sets'],
      other: [],
    },
    sportswear_teamwear: {
      top_wear: ['basketball_jerseys', 'volleyball_jerseys', 'esports_jerseys', 'cycling_jerseys'],
      bottom_wear: ['basketball_shorts', 'volleyball_shorts', 'team_shorts'],
      sets: ['custom_team_sets'],
      other: [],
    },
    // Costumes & Performance has no leaf garment types defined in
    // Categories.md yet — structure exists, leaf lists intentionally empty.
    costumes_performance: { top_wear: [], bottom_wear: [], sets: [], other: [] },
    others: { other: [] },
  },
  children: {
    // Boys'/Girls' Apparel have no leaf garment types defined in
    // Categories.md yet either — same gap, not invented data.
    boys_apparel: { top_wear: [], bottom_wear: [], sets: [], other: [] },
    girls_apparel: { top_wear: [], bottom_wear: [], sets: [], other: [] },
    others: { other: [] },
  },
};

export const SERVICES_TREE: Record<ServiceCategory, string[]> = {
  custom_tailoring: [
    'bespoke_tailoring', 'made_to_measure', 'custom_pattern_making',
    'formal_wear_tailoring', 'traditional_wear_tailoring', 'custom_garment_construction',
  ],
  alterations_repairs: [
    'hemming_length_adjustment', 'waist_seat_adjustment', 'tapering_resizing',
    'sleeve_adjustment', 'zipper_replacement', 'button_fastener_replacement', 'garment_repair_restoration',
  ],
  uniform_production: [
    'school_uniforms', 'corporate_uniforms', 'office_uniforms',
    'medical_uniforms', 'hospitality_uniforms', 'institutional_uniforms',
  ],
  printing_sublimation: [
    'sports_jersey_printing', 'full_sublimation', 'teamwear_printing',
    'corporate_apparel_printing', 'custom_apparel_printing',
  ],
  custom_costume_creation: [
    'cosplay_costumes', 'stage_theater_costumes', 'event_costumes',
    'character_costumes', 'cultural_dance_costumes',
  ],
  others: [],
};

export function subcategoriesFor(department: Department): string[] {
  return Object.keys(TAXONOMY_TREE[department] ?? {});
}

export function structuresFor(department: Department, subcategory: string): GarmentStructure[] {
  return Object.keys(TAXONOMY_TREE[department]?.[subcategory] ?? {}) as GarmentStructure[];
}

export function garmentTypesFor(department: Department, subcategory: string, structure: GarmentStructure): string[] {
  return TAXONOMY_TREE[department]?.[subcategory]?.[structure] ?? [];
}

export function serviceTypesFor(serviceCategory: ServiceCategory): string[] {
  return SERVICES_TREE[serviceCategory] ?? [];
}

/**
 * Every garment_type slug that falls under a department, flattened across
 * that department's subcategory -> structure levels. The one source of
 * truth for "does this garment_type belong to Men/Women/Kids" — used both
 * to decide which categories a Department filter should show, and to
 * actually filter catalog items by department (two different call sites
 * that must never compute this mapping independently and drift apart).
 */
export function garmentTypesForDepartment(department: Department): string[] {
  const types = new Set<string>();
  for (const subcategory of subcategoriesFor(department)) {
    for (const structure of structuresFor(department, subcategory)) {
      garmentTypesFor(department, subcategory, structure).forEach((t) => types.add(t));
    }
  }
  return Array.from(types);
}

/** Flat, deduped list of every valid garment_type slug. */
export function allGarmentTypeSlugs(): string[] {
  const slugs = new Set<string>();
  for (const subcats of Object.values(TAXONOMY_TREE)) {
    for (const structures of Object.values(subcats)) {
      for (const types of Object.values(structures)) {
        (types ?? []).forEach((t) => slugs.add(t));
      }
    }
  }
  return Array.from(slugs);
}

export function allSubcategorySlugs(): string[] {
  const slugs = new Set<string>();
  for (const subcats of Object.values(TAXONOMY_TREE)) {
    Object.keys(subcats).forEach((s) => slugs.add(s));
  }
  return Array.from(slugs);
}

export function allServiceTypeSlugs(): string[] {
  const slugs = new Set<string>();
  Object.values(SERVICES_TREE).forEach((types) => types.forEach((t) => slugs.add(t)));
  return Array.from(slugs);
}

/**
 * Department → Subcategory → Garment Structure → Garment Type labels for a
 * catalog design, e.g. ["Men's Apparel", "Traditional Wear", "Top Wear",
 * "Barong Tagalog"]. Only goes as deep as the item's own data does.
 */
export function catalogCategoryPath(item: {
  department?: string | null;
  subcategory?: string | null;
  garment_structure?: string | null;
  garment_type?: string | null;
}): string[] {
  if (!item.department || !isDepartment(item.department)) return [];
  const path = [DEPARTMENT_LABELS[item.department]];
  if (!item.subcategory) return path;
  path.push(SUBCATEGORY_LABELS[item.subcategory] ?? item.subcategory);
  if (item.garment_structure) {
    path.push(GARMENT_STRUCTURE_LABELS[item.garment_structure as GarmentStructure] ?? item.garment_structure);
  }
  if (item.garment_type) path.push(GARMENT_TYPE_LABELS[item.garment_type] ?? item.garment_type);
  return path;
}

/** Service Category → Service Type labels, e.g. ["Custom Tailoring", "Bespoke Tailoring"]. */
export function serviceCategoryPath(service: {
  service_category?: string | null;
  service_leaf_type?: string | null;
}): string[] {
  const category = service.service_category as ServiceCategory | null | undefined;
  if (!category || !SERVICE_CATEGORY_LABELS[category]) return [];
  // Starts at "Services", the way an apparel path starts at its department (Men's / Women's / Children's).
  const path = ['Services', SERVICE_CATEGORY_LABELS[category]];
  if (service.service_leaf_type) path.push(SERVICE_TYPE_LABELS[service.service_leaf_type] ?? service.service_leaf_type);
  return path;
}

/** Builds the /search URL for a garment-type leaf link in the mega-menu. */
export function garmentSearchHref(department: Department, subcategory: string, structure: GarmentStructure, garmentType?: string): string {
  const params = new URLSearchParams({ department, subcategory, structure });
  if (garmentType) params.set('garment_type', garmentType);
  return `/search?tab=catalog&${params.toString()}`;
}

/** Builds the /search URL for a service-type leaf link in the mega-menu. */
export function serviceSearchHref(serviceCategory: ServiceCategory, serviceType?: string): string {
  const params = new URLSearchParams({ tab: 'services', service_category: serviceCategory });
  if (serviceType) params.set('service_type', serviceType);
  return `/search?${params.toString()}`;
}
