import {
  GARMENT_CATEGORIES,
  GARMENTS,
  SERVICE_GROUPS,
  SERVICE_GROUP_KEYS,
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

export interface VisualCategory {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const VISUAL_CATEGORIES: VisualCategory[] = [
  // Row 1 (7 items)
  { id: 'barong', label: 'Barong', href: '/search?q=barong', icon: Sparkles },
  { id: 'traditional', label: 'Traditional Filipino Wear', href: '/search?q=traditional', icon: Flower2 },
  { id: 'uniforms', label: 'Uniforms & Workwear', href: '/search?q=uniform', icon: GraduationCap },
  { id: 'jerseys_sportswear', label: 'Jerseys & Sportswear', href: '/search?q=jersey', icon: Trophy },
  { id: 'dresses_gowns', label: 'Dresses & Gowns', href: '/search?q=dress', icon: Crown },
  { id: 'alterations', label: 'Alterations & Repairs', href: '/search?tab=services&service_category=alterations_repairs', icon: Scissors },
  { id: 'bespoke', label: 'Bespoke Tailoring', href: '/search?tab=services&service_category=made_to_measure', icon: Compass },

  // Row 2 (7 items)
  { id: 'formal_wear', label: 'Formal Wear', href: '/search?q=formal', icon: BriefcaseBusiness },
  { id: 'shirts_tops', label: 'Shirts & Tops', href: '/search?q=shirt', icon: Shirt },
  { id: 'pants_bottoms', label: 'Pants & Bottoms', href: '/search?q=pants', icon: Ruler },
  { id: 'outerwear', label: 'Jackets & Outerwear', href: '/search?q=jacket', icon: Wind },
  { id: 'costumes', label: 'Costumes & Performance', href: '/search?q=costume', icon: Drama },
  { id: 'embroidery', label: 'Embroidery & Printing', href: '/search?tab=services&service_category=embroidery_printing', icon: Layers },
  { id: 'bulk_teamwear', label: 'Bulk Production', href: '/search?tab=services&service_category=uniforms_bulk', icon: Users },
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

/** Rich 4-column directory data for All Categories page (Shopee style) */
export const SHOPEE_ALPHABET_DIRECTORY: AlphabetGroup[] = [
  {
    letter: 'A',
    categories: [
      {
        title: 'Alterations & Repairs',
        categoryHref: '/search?tab=services&service_category=alterations_repairs',
        subCategories: [
          { label: 'Pants & Slacks Hemming', href: '/search?q=hemming' },
          { label: 'Waist In & Out Adjustment', href: '/search?q=waist+adjustment' },
          { label: 'Zipper Repair & Replacement', href: '/search?q=zipper+replacement' },
          { label: 'Sleeve Shortening & Lengthening', href: '/search?q=sleeve+shortening' },
          { label: 'Shoulder & Taper Restyling', href: '/search?q=taper+restyling' },
          { label: 'Garment Resizing & Fitting', href: '/search?q=garment+fitting' },
          { label: 'Suit & Jacket Lining Repair', href: '/search?q=lining+repair' },
          { label: 'Patching, Darning & Mending', href: '/search?q=patching+mending' },
        ],
      },
    ],
  },
  {
    letter: 'B',
    categories: [
      {
        title: 'Barong',
        categoryHref: '/search?q=barong',
        subCategories: [
          { label: 'Barong Tagalog (Long Sleeve)', href: '/search?q=Barong+Tagalog' },
          { label: 'Modern Coat Barong', href: '/search?q=Modern+Barong' },
          { label: 'Short-Sleeve Polo Barong', href: '/search?q=Polo+Barong' },
          { label: 'Piña Cocoon Barong', href: '/search?q=Pina+Barong' },
          { label: 'Jusi Handcrafted Barong', href: '/search?q=Jusi+Barong' },
          { label: 'Wedding & Groom Barong', href: '/search?q=Wedding+Barong' },
          { label: 'Monogrammed Office Barong', href: '/search?q=Office+Barong' },
          { label: 'Organza Embroidery Barong', href: '/search?q=Organza+Barong' },
        ],
      },
    ],
  },
  {
    letter: 'C',
    categories: [
      {
        title: 'Costumes & Performance Wear',
        categoryHref: '/search?q=costume',
        subCategories: [
          { label: 'Festival & Dance Costumes', href: '/search?q=Dance+Costume' },
          { label: 'Theater & Drama Attire', href: '/search?q=Theater+Costume' },
          { label: 'Cosplay & Anime Outfits', href: '/search?q=Cosplay' },
          { label: 'Mascot & Character Suits', href: '/search?q=Mascot+Suit' },
          { label: 'Cheer Dance & Pep Uniforms', href: '/search?q=Cheer+Uniform' },
          { label: 'Pageant Gowns & National Costumes', href: '/search?q=Pageant+Costume' },
          { label: 'Historical & Period Reenactment', href: '/search?q=Historical+Costume' },
          { label: 'Buwan ng Wika School Costumes', href: '/search?q=Buwan+ng+Wika' },
        ],
      },
      {
        title: 'Custom Tailoring & Made-to-Order',
        categoryHref: '/search?tab=services&service_category=made_to_measure',
        subCategories: [
          { label: 'Bespoke Suit Pattern Drafting', href: '/search?q=pattern+drafting' },
          { label: 'First & Second Fitting Sessions', href: '/search?q=fitting+session' },
          { label: 'Personalized Tailoring Consultation', href: '/search?q=tailoring+consultation' },
          { label: 'Fabric Sourcing & Swatch Selection', href: '/search?q=fabric+sourcing' },
        ],
      },
    ],
  },
  {
    letter: 'D',
    categories: [
      {
        title: 'Dresses & Gowns',
        categoryHref: '/search?q=dress',
        subCategories: [
          { label: 'Custom Bridal & Wedding Gowns', href: '/search?q=Bridal+Gown' },
          { label: 'Evening Gowns & Gala Attire', href: '/search?q=Evening+Gown' },
          { label: 'Debutante 18th Birthday Gowns', href: '/search?q=Debut+Gown' },
          { label: 'Cocktail & Semi-Formal Dresses', href: '/search?q=Cocktail+Dress' },
          { label: 'Casual Day & Sundresses', href: '/search?q=Casual+Dress' },
          { label: 'Bridesmaid & Entourage Dresses', href: '/search?q=Bridesmaid+Dress' },
          { label: 'Prom & Graduation Ball Gowns', href: '/search?q=Prom+Gown' },
          { label: 'Civil Wedding Dresses', href: '/search?q=Civil+Wedding+Dress' },
        ],
      },
    ],
  },
  {
    letter: 'E',
    categories: [
      {
        title: 'Embroidery & Custom Printing',
        categoryHref: '/search?tab=services&service_category=embroidery_printing',
        subCategories: [
          { label: 'Name & Monogram Embroidery', href: '/search?q=monogram+embroidery' },
          { label: 'Corporate Company Logo Embroidery', href: '/search?q=logo+embroidery' },
          { label: 'Intricate Barong Handwork', href: '/search?q=barong+embroidery' },
          { label: 'School Crest & Uniform Badges', href: '/search?q=school+patches' },
          { label: 'Full Dye-Sublimation Jersey Printing', href: '/search?q=sublimation+printing' },
          { label: 'Vinyl Heat Transfer & Numbering', href: '/search?q=heat+transfer' },
          { label: 'Silkscreen Batch Printing', href: '/search?q=silkscreen+printing' },
          { label: 'Custom Beading & Sequins', href: '/search?q=beading+sequins' },
        ],
      },
    ],
  },
  {
    letter: 'F',
    categories: [
      {
        title: 'Formal Wear',
        categoryHref: '/search?q=formal',
        subCategories: [
          { label: 'Bespoke Two-Piece Suits', href: '/search?q=Suit' },
          { label: 'Three-Piece Tuxedos & Black Tie', href: '/search?q=Tuxedo' },
          { label: 'Formal Tailored Blazers', href: '/search?q=Blazer' },
          { label: 'Suit Vests & Waistcoats', href: '/search?q=Formal+Vest' },
          { label: 'French-Cuff Dress Shirts', href: '/search?q=Dress+Shirt' },
          { label: 'Tailored Formal Slacks & Trousers', href: '/search?q=Trousers' },
          { label: 'Formal Boleros & Shrugs', href: '/search?q=Formal+Bolero' },
          { label: 'Executive Pantsuits for Women', href: '/search?q=Pantsuit' },
        ],
      },
    ],
  },
  {
    letter: 'J',
    categories: [
      {
        title: 'Jackets & Outerwear',
        categoryHref: '/search?q=jacket',
        subCategories: [
          { label: 'Tailored Blazers & Sport Coats', href: '/search?q=Blazer' },
          { label: 'Varsity & Letterman Jackets', href: '/search?q=Varsity+Jacket' },
          { label: 'Windbreakers & Light Outerwear', href: '/search?q=Windbreaker' },
          { label: 'Bombers & Flight Jackets', href: '/search?q=Bomber+Jacket' },
          { label: 'Trench Coats & Overcoats', href: '/search?q=Trench+Coat' },
          { label: 'Custom Hoodies & Sweatshirts', href: '/search?q=Hoodie' },
          { label: 'Safari & Utility Field Jackets', href: '/search?q=Safari+Jacket' },
          { label: 'Boleros & Tailored Capes', href: '/search?q=Bolero' },
        ],
      },
      {
        title: 'Jerseys & Sportswear',
        categoryHref: '/search?q=jersey',
        subCategories: [
          { label: 'Sublimation Basketball Jerseys', href: '/search?q=Basketball+Jersey' },
          { label: 'Basketball Uniform Shorts', href: '/search?q=Basketball+Shorts' },
          { label: 'Volleyball Spandex Jersey Sets', href: '/search?q=Volleyball+Jersey' },
          { label: 'Volleyball Spandex Shorts', href: '/search?q=Volleyball+Shorts' },
          { label: 'Cycling & Motor Rider Jerseys', href: '/search?q=Cycling+Jersey' },
          { label: 'Esports Team Collared Jerseys', href: '/search?q=Esports+Jersey' },
          { label: 'Custom Team Uniforms & Warmups', href: '/search?q=Custom+Team+Uniform' },
          { label: 'Athletic Training Shorts & Singlets', href: '/search?q=Team+Shorts' },
        ],
      },
    ],
  },
  {
    letter: 'P',
    categories: [
      {
        title: 'Pants & Bottoms',
        categoryHref: '/search?q=pants',
        subCategories: [
          { label: 'Tailored Slacks & Dress Trousers', href: '/search?q=Slacks' },
          { label: 'Custom Chino Pants & Khakis', href: '/search?q=Chinos' },
          { label: 'Formal Skirts & Pencil Skirts', href: '/search?q=Pencil+Skirt' },
          { label: 'Pleated School & Maxi Skirts', href: '/search?q=Pleated+Skirt' },
          { label: 'Dress Shorts & Bermudas', href: '/search?q=Dress+Shorts' },
          { label: 'High-Waisted Wide Leg Pants', href: '/search?q=Wide+Leg+Pants' },
          { label: 'Tailored Cargo Pants', href: '/search?q=Cargo+Pants' },
          { label: 'Culottes & Cropped Trousers', href: '/search?q=Culottes' },
        ],
      },
    ],
  },
  {
    letter: 'S',
    categories: [
      {
        title: 'Shirts & Tops',
        categoryHref: '/search?q=shirt',
        subCategories: [
          { label: 'Custom Button-Down Dress Shirts', href: '/search?q=Button+Down+Shirt' },
          { label: 'Casual Tailored Linen Shirts', href: '/search?q=Linen+Shirt' },
          { label: 'Corporate Pique Polo Shirts', href: '/search?q=Polo+Shirt' },
          { label: 'Formal Blouses & Silk Tops', href: '/search?q=Formal+Blouse' },
          { label: 'Mandarin Collar Dress Shirts', href: '/search?q=Mandarin+Shirt' },
          { label: 'Camisa de Chino Undershirts', href: '/search?q=Camisa+de+Chino' },
          { label: 'Camp Collar Hawaiian Tops', href: '/search?q=Camp+Collar' },
          { label: 'Tailored T-Shirts with Monogram', href: '/search?q=Custom+T+Shirt' },
        ],
      },
    ],
  },
  {
    letter: 'T',
    categories: [
      {
        title: 'Traditional Filipino Wear',
        categoryHref: '/search?q=traditional',
        subCategories: [
          { label: 'Filipiniana Gowns & Modern Sets', href: '/search?q=Filipiniana' },
          { label: 'Terno with Butterfly Sleeves', href: '/search?q=Terno' },
          { label: 'Baro’t Saya Folkloric Sets', href: '/search?q=Barot+Saya' },
          { label: 'Maria Clara Traditional Ensembles', href: '/search?q=Maria+Clara' },
          { label: 'Modern Filipiniana Bolero & Tops', href: '/search?q=Modern+Filipiniana' },
          { label: 'Indigenous Mindanao Weave Attire', href: '/search?q=Mindanao+Weave' },
          { label: 'Yakan & Inabel Inspired Vests', href: '/search?q=Yakan+Attire' },
          { label: 'Traditional Skirts & Wrap Malongs', href: '/search?q=Cultural+Skirt' },
        ],
      },
    ],
  },
  {
    letter: 'U',
    categories: [
      {
        title: 'Uniforms & Workwear',
        categoryHref: '/search?q=uniform',
        subCategories: [
          { label: 'Elementary & High School Uniforms', href: '/search?q=School+Uniform' },
          { label: 'School Uniform Pants & Slacks', href: '/search?q=School+Uniform+Pants' },
          { label: 'School Uniform Pleated Skirts', href: '/search?q=School+Uniform+Skirt' },
          { label: 'Corporate Office Uniform Sets', href: '/search?q=Corporate+Uniform' },
          { label: 'Medical Scrubs & Doctor Lab Coats', href: '/search?q=Medical+Uniform' },
          { label: 'Hospitality & Chef Jackets', href: '/search?q=Hospitality+Uniform' },
          { label: 'Security & Institutional Uniforms', href: '/search?q=Security+Uniform' },
          { label: 'Industrial Coveralls & Work Overalls', href: '/search?q=Industrial+Coveralls' },
        ],
      },
      {
        title: 'Uniform, Jersey & Teamwear Production',
        categoryHref: '/search?tab=services&service_category=uniforms_bulk',
        subCategories: [
          { label: 'Bulk School Uniform Contract Batching', href: '/search?q=bulk+uniforms' },
          { label: 'Corporate Apparel Package Production', href: '/search?q=corporate+apparel' },
          { label: 'Tournament Team Jersey Sublimation', href: '/search?q=team+sublimation' },
          { label: 'Company Workwear & Safety Apparel', href: '/search?q=company+workwear' },
        ],
      },
    ],
  },
];

export interface DirectoryEntry {
  letter: string;
  label: string;
  breadcrumb: string;
  href: string;
}

/** Searching a garment shows the shops that make it, the ones that alter or fix it, and its designs. */
export const garmentHref = (slug: string) => `/search?q=${encodeURIComponent(GARMENTS[slug]?.label.split(' / ')[0] ?? slug)}`;

/** A category searches by its own name (its first alias, e.g. "barong", "uniform", "pants"). */
export const categoryHref = (cat: GarmentCategory) =>
  `/search?q=${encodeURIComponent(GARMENT_CATEGORIES[cat]?.aliases[0] ?? GARMENT_CATEGORIES[cat]?.label ?? cat)}`;

/** The Services tab, limited to one service — and to the services that ticked one task. */
export const serviceHref = (group: ServiceGroupKey, capability?: string) =>
  `/search?tab=services&service_category=${group}${capability ? `&service_type=${capability}` : ''}`;

/** The A–Z directory: individual garment entries for fallback searches */
export function buildDirectoryEntries(): DirectoryEntry[] {
  return Object.entries(GARMENTS)
    .map(([slug, g]) => ({
      letter: g.label.charAt(0).toUpperCase(),
      label: g.label,
      breadcrumb: `${GARMENT_CATEGORIES[g.category]?.label ?? ''} > ${g.label}`,
      href: garmentHref(slug),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function serviceEntries(): { group: ServiceGroupKey; label: string; description: string; capabilities: { slug: string; label: string }[] }[] {
  return SERVICE_GROUP_KEYS.map((group) => ({
    group,
    label: SERVICE_GROUPS[group].label,
    description: SERVICE_GROUPS[group].description,
    capabilities: Object.entries(SERVICE_GROUPS[group].capabilities).map(([slug, c]) => ({ slug, label: c.label })),
  }));
}

export function groupByLetter(entries: DirectoryEntry[]): Map<string, DirectoryEntry[]> {
  const map = new Map<string, DirectoryEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.letter) ?? [];
    list.push(entry);
    map.set(entry.letter, list);
  }
  return map;
}

export const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
