import { CATEGORY_CHIP_SETS } from '@/lib/categoryChipSets';
import type { AccordionSectionDef, TopGroup } from './navTypes';

export function chipSetSection(key: keyof typeof CATEGORY_CHIP_SETS): AccordionSectionDef[] {
  const set = CATEGORY_CHIP_SETS[key];
  return [
    {
      key: 'flat',
      label: set.title,
      flat: true,
      items: set.chips.map((c) => ({
        label: c.label,
        href: c.q ? `/search?q=${encodeURIComponent(c.q)}` : undefined,
      })),
    },
  ];
}

export const WEDDING_MEN_SECTIONS: AccordionSectionDef[] = [
  {
    key: 'attire',
    label: 'Wedding Attire',
    items: [
      { label: 'Browse All Wedding Suits', href: '/search?category=suit' },
      { label: 'Wedding Barong Tagalog', href: '/search?category=barong' },
      { label: 'Bespoke Tuxedos', href: '/search?q=tuxedo' },
      { label: 'Classic Barong', href: '/search?q=pina+barong' },
    ],
  },
  {
    key: 'role',
    label: 'Wedding Role',
    items: [
      { label: 'Groom', href: '/search?q=groom' },
      { label: 'Groomsmen', href: '/search?q=groomsmen' },
      { label: 'Father of the Bride', href: '/search?q=father+of+the+bride' },
      { label: 'Wedding Guest', href: '/search?q=wedding+guest' },
    ],
  },
  {
    key: 'accessories',
    label: 'Accessories',
    items: [
      { label: 'Dress Shirts', href: '/search?q=dress+shirt' },
      { label: 'Ties & Bowties', href: '/search?q=tie' },
      { label: 'Pocket Squares', href: '/search?q=pocket' },
      { label: 'Cufflinks', href: '/search?q=cufflink' },
    ],
  },
];

export const WEDDING_WOMEN_SECTIONS: AccordionSectionDef[] = [
  {
    key: 'bridal',
    label: 'Bridal & Formal Wear',
    items: [
      { label: 'Browse All Wedding Gowns', href: '/search?category=gown' },
      { label: 'Custom Bridal Gowns', href: '/search?q=bridal+gown' },
      { label: 'Modern Terno & Filipiniana', href: '/search?category=filipiniana' },
      { label: 'Reception & Evening Dresses', href: '/search?q=evening+dress' },
    ],
  },
  {
    key: 'role',
    label: 'Entourage & Role',
    items: [
      { label: 'Bride', href: '/search?q=bride' },
      { label: 'Bridesmaids', href: '/search?q=bridesmaids' },
      { label: 'Mother of the Bride / Groom', href: '/search?q=mother+of+the+bride' },
      { label: 'Wedding Guest', href: '/search?q=wedding+guest' },
    ],
  },
  {
    key: 'accessories',
    label: 'Accessories',
    items: [
      { label: 'Bolero & Shawls', href: '/search?q=bolero' },
      { label: 'Bridal Veils', href: '/search?q=veil' },
      { label: 'Formal Wedding Accessories', href: '/search?q=accessories' },
    ],
  },
];

export const TOP_GROUPS: TopGroup[] = [
  {
    key: 'men',
    label: 'Men',
    categories: [
      { label: 'Suits', sections: chipSetSection('suit') },
      { label: 'Tuxedos', sections: chipSetSection('tuxedo') },
      { label: 'Shirts', sections: chipSetSection('shirt') },
      { label: 'Blazers', sections: chipSetSection('blazer') },
      { label: 'Pants', sections: chipSetSection('pant') },
      { label: 'Casual Wear', query: 'casual' },
      { label: 'Outerwear', sections: chipSetSection('jacket') },
      { label: 'Accessories', sections: chipSetSection('accessories') },
      { label: 'Barong', garmentType: 'barong' },
    ],
  },
  {
    key: 'women',
    label: 'Women',
    categories: [
      { label: 'Suits', sections: chipSetSection('suit') },
      { label: 'Blazers', sections: chipSetSection('blazer') },
      { label: 'Pants', sections: chipSetSection('pant') },
      { label: 'Filipiniana', garmentType: 'filipiniana' },
    ],
  },
  {
    key: 'wedding',
    label: 'Wedding',
    categories: [
      { label: 'Men', sections: WEDDING_MEN_SECTIONS },
      { label: 'Women', sections: WEDDING_WOMEN_SECTIONS },
    ],
  },
  {
    key: 'corporate_teams',
    label: 'Office',
    categories: [
      { label: 'Corporate Uniforms', garmentType: 'uniform' },
      { label: 'Team Jerseys', sections: chipSetSection('jersey') },
    ],
  },
  {
    key: 'discover',
    label: 'Discover',
    categories: [],
    links: [
      { href: '/map', label: 'Browse Map' },
      { href: '/account', label: 'My Account' },
      { href: '/register', label: 'Register a Store' },
      { href: '/#about', label: 'About Sutura' },
      { href: '/search?q=alteration', label: 'Alterations & Repairs' },
    ],
  },
];
