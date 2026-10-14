import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS, SERVICE_GROUPS, SERVICE_GROUP_KEYS } from '@/lib/garmentTaxonomy';
import { categoryHref, serviceHref } from '@/components/categories/categoriesDirectoryData';

/**
 * Ask SUTURA's questions (adviser's ask, 2026-10-14): a numbered menu the customer taps, like a basic menu-driven
 * chatbot — no typing and no AI service, so every question has an answer. Each answer is read live from SUTURA's
 * own data (the shop list, the customer's orders and appointments).
 */

/** Filters `/public/stores` already supports (StoreController::publicIndex). */
export type AskParams = { garment_category?: string; specialization?: string; open_now?: 1; sort_by?: string };

export type MenuKey = 'main' | 'garments' | 'services';

export type AskAction =
  | { kind: 'menu'; menu: MenuKey; prompt: string }
  /** `about` finishes "I found 3 shops …"; `empty` is the reply when none match; `nearby` needs the location. */
  | { kind: 'shops'; params: AskParams; about: string; empty: string; seeAllHref: string; nearby?: boolean }
  | { kind: 'orders' }
  | { kind: 'appointments' }
  | { kind: 'steps' };

export interface AskOption {
  readonly id: string;
  readonly label: string;
  readonly action: AskAction;
}

const MAIN: AskOption[] = [
  { id: 'garment', label: 'Find a tailor by garment', action: { kind: 'menu', menu: 'garments', prompt: 'Which garment? Pick one.' } },
  { id: 'service', label: 'Find a tailor by service', action: { kind: 'menu', menu: 'services', prompt: 'What do you need done? Pick one.' } },
  { id: 'open', label: 'Who’s open right now?', action: { kind: 'shops', params: { open_now: 1 }, about: 'open right now', empty: 'No verified shop is open right now. Each shop’s hours are on its page — try again later.', seeAllHref: '/search?tab=store&open=open' } },
  { id: 'near', label: 'Shops near me', action: { kind: 'shops', params: {}, about: 'nearest to you', empty: 'No verified shops are listed yet.', seeAllHref: '/search?tab=store&sortBy=distance', nearby: true } },
  { id: 'top', label: 'Top-rated shops', action: { kind: 'shops', params: { sort_by: 'rating' }, about: 'with the best ratings', empty: 'No verified shops are listed yet.', seeAllHref: '/search?tab=store' } },
  { id: 'orders', label: 'Where is my order?', action: { kind: 'orders' } },
  { id: 'appointments', label: 'My next appointment', action: { kind: 'appointments' } },
  { id: 'steps', label: 'How does ordering work?', action: { kind: 'steps' } },
];

const GARMENTS: AskOption[] = GARMENT_CATEGORY_KEYS.filter((c) => c !== 'other').map((c) => ({
  id: `garment:${c}`,
  label: GARMENT_CATEGORIES[c].label,
  action: {
    kind: 'shops',
    params: { garment_category: c },
    about: `for ${GARMENT_CATEGORIES[c].label}`,
    empty: `No verified shop works on ${GARMENT_CATEGORIES[c].label} yet.`,
    seeAllHref: categoryHref(c),
  },
}));

const SERVICES: AskOption[] = SERVICE_GROUP_KEYS.map((g) => ({
  id: `service:${g}`,
  label: SERVICE_GROUPS[g].label,
  action: {
    kind: 'shops',
    params: { specialization: g },
    about: `for ${SERVICE_GROUPS[g].label}`,
    empty: `No verified shop offers ${SERVICE_GROUPS[g].label} yet.`,
    seeAllHref: serviceHref(g),
  },
}));

export const MENUS: Record<MenuKey, AskOption[]> = { main: MAIN, garments: GARMENTS, services: SERVICES };

/** Choice 0 in a sub-menu. */
export const BACK: AskOption = { id: 'back', label: 'Back to the main menu', action: { kind: 'menu', menu: 'main', prompt: 'What else would you like to know?' } };

const ALL = [...MAIN, ...GARMENTS, ...SERVICES, BACK];
export const optionById = (id: string): AskOption | undefined => ALL.find((o) => o.id === id);
