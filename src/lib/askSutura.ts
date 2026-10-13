import { DISTRICTS } from '@/components/map/mapTypes';

/**
 * Ask SUTURA's question reader. No AI service: it picks out the words a
 * customer uses for garments, services, timing, rating, budget and place,
 * and turns them into the filters /public/stores already supports
 * (StoreController::publicIndex). What it understood is shown back to the
 * customer, so a wrong guess is visible instead of silent.
 */

export type AskParams = {
  q?: string;
  specialization?: string;
  department?: string;
  open_now?: 1;
  min_rating?: number;
  max_price?: number;
  district?: string;
  radius_km?: number;
  sort_by?: string;
};

/** One filter the reader picked out, in words the customer can check. */
export type AskTerm = { key: keyof AskParams; label: string };

export type AskIntent =
  | { kind: 'search'; params: AskParams; terms: AskTerm[]; wantsNearby: boolean }
  | { kind: 'link'; reply: string; href: string; cta: string };

// Garment words → the free-text search (matches catalog names, garment
// types, services and shop names). Longest phrases first so "barong
// tagalog" wins over "barong".
const GARMENTS: [RegExp, string, string][] = [
  [/\bbarong\b/, 'barong', 'Barong'],
  [/\bfilipiniana\b|\bmaria clara\b/, 'filipiniana', 'Filipiniana'],
  [/\bterno\b/, 'terno', 'Terno'],
  [/\bbaro'?t saya\b|\bsaya\b/, 'saya', "Baro't Saya"],
  [/\b(debut|ball|wedding|evening)?\s*gowns?\b/, 'gown', 'Gowns'],
  [/\bdress(es)?\b/, 'dress', 'Dresses'],
  [/\btuxedos?\b/, 'tuxedo', 'Tuxedo'],
  [/\bsuits?\b/, 'suit', 'Suits'],
  [/\bblazers?\b/, 'blazer', 'Blazers'],
  [/\b(jackets?|coats?)\b/, 'jacket', 'Jackets & Coats'],
  [/\bpolo\b/, 'polo', 'Polo'],
  [/\b(t-?shirts?|tees?)\b/, 'shirt', 'T-Shirts'],
  [/\buniforms?\b/, 'uniform', 'Uniforms'],
  [/\bjerseys?\b/, 'jersey', 'Jerseys'],
  [/\b(costumes?|cosplay)\b/, 'costume', 'Costumes'],
  [/\b(pants|trousers|slacks)\b/, 'pants', 'Pants'],
  [/\bskirts?\b/, 'skirt', 'Skirts'],
];

// Service words → a store specialization tag (CanonicalTaxonomy::STORE_SERVICE_TAGS).
const SERVICES: [RegExp, string, string][] = [
  [/\b(alter(ed|ing|ations?)?|repair(ed|ing|s)?|fix(ed|ing)?|hem(med|ming|s)?|resiz(e|ed|ing)|tapered?|zippers?|tahi|patahi)\b/, 'alterations_repairs', 'Alterations & Repairs'],
  [/\b(custom|made[- ]to[- ]measure|bespoke|tailor[- ]made)\b/, 'custom_tailoring', 'Custom Tailoring'],
  [/\bschool\b/, 'school', 'School'],
  [/\b(office|corporate)\b/, 'office', 'Office'],
  [/\b(medical|nurse|nursing|scrubs?|hospital)\b/, 'medical', 'Medical'],
  [/\b(maritime|seaman|seafarer|marine)\b/, 'maritime', 'Maritime'],
  [/\b(sports?|team|basketball|volleyball|esports?)\b/, 'sports', 'Sports'],
  [/\b(embroider(y|ed)?|logo)\b/, 'embroidery', 'Embroidery'],
  [/\bformal\b/, 'formal', 'Formal'],
  [/\bcasual\b/, 'casual', 'Casual'],
];

const DEPARTMENTS: [RegExp, string, string][] = [
  [/\b(women'?s?|ladies|female|girls?)\b/, 'women', 'Women'],
  [/\b(kids?|children|child|boys?)\b/, 'children', 'Kids'],
  [/\b(men'?s?|male|gents?)\b/, 'men', 'Men'],
];

const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

export function readQuestion(raw: string): AskIntent {
  const text = ` ${raw.toLowerCase().replace(/\s+/g, ' ').trim()} `;

  // Questions about the customer's own order or measurements aren't shop searches.
  if (/\b(track|tracking|status|where is my|order code)\b/.test(text) && !/\bshops?\b/.test(text)) {
    return { kind: 'link', reply: 'Use the tracking code the shop gave you at the counter to see where your garment is, from cutting to pickup.', href: '/track', cta: 'Track an order' };
  }
  if (/\b(my )?measurements?\b/.test(text) && !/\b(shops?|tailors?)\b/.test(text)) {
    return { kind: 'link', reply: 'Your saved measurements live in your account, so any shop you order from can use them.', href: '/account/measurements', cta: 'Open my measurements' };
  }

  const params: AskParams = {};
  const terms: AskTerm[] = [];
  let rest = text;
  const take = (re: RegExp) => { rest = rest.replace(new RegExp(re.source, 'g'), ' '); };

  const garment = GARMENTS.find(([re]) => re.test(text));
  if (garment) {
    params.q = garment[1];
    terms.push({ key: 'q', label: garment[2] });
    take(garment[0]);
  }

  const service = SERVICES.find(([re]) => re.test(rest));
  if (service) {
    params.specialization = service[1];
    terms.push({ key: 'specialization', label: service[2] });
    take(service[0]);
  }

  const department = DEPARTMENTS.find(([re]) => re.test(rest));
  if (department) {
    params.department = department[1];
    terms.push({ key: 'department', label: department[2] });
    take(department[0]);
  }

  if (/\b(open|bukas|right now|now|today|tonight)\b/.test(text)) {
    params.open_now = 1;
    terms.push({ key: 'open_now', label: 'Open now' });
    take(/\b(open|bukas|right now|now|today|tonight)\b/);
  }

  const stars = text.match(/\b([345])\s*(\+|stars?|★)/);
  if (stars) {
    params.min_rating = Number(stars[1]);
    terms.push({ key: 'min_rating', label: `${stars[1]}★ & up` });
    take(/\b[345]\s*(\+|stars?|★)/);
  } else if (/\b(best|top|top[- ]rated|highly rated|recommended|trusted)\b/.test(text)) {
    params.min_rating = 4;
    terms.push({ key: 'min_rating', label: '4★ & up' });
    take(/\b(best|top|top[- ]rated|highly rated|recommended|trusted)\b/);
  }

  const budget = text.match(/\b(under|below|less than|max(imum)?|budget( of)?|up to|within)\s*(php|₱|p)?\s*([\d,]{3,})/);
  if (budget) {
    const amount = Number(budget[5].replace(/,/g, ''));
    if (amount > 0) {
      params.max_price = amount;
      terms.push({ key: 'max_price', label: `Under ${peso(amount)}` });
    }
    take(/\b(under|below|less than|max(imum)?|budget( of)?|up to|within)\s*(php|₱|p)?\s*[\d,]{3,}/);
  } else if (/\b(cheap|cheapest|affordable|budget|mura|low[- ]cost)\b/.test(text)) {
    params.sort_by = 'price_asc';
    terms.push({ key: 'sort_by', label: 'Lowest price first' });
    take(/\b(cheap|cheapest|affordable|budget|mura|low[- ]cost)\b/);
  }

  const district = DISTRICTS.find((d) => text.includes(` ${d.toLowerCase()}`));
  if (district) {
    params.district = district;
    terms.push({ key: 'district', label: district });
    take(new RegExp(`\\b${district.toLowerCase()}\\b`));
  }

  const km = text.match(/\b(\d{1,2})\s*(km|kilometers?)\b/);
  const wantsNearby = !!km || /\b(near|nearby|nearest|close|closest|around|malapit|walking distance)\b/.test(text);
  if (km) {
    params.radius_km = Number(km[1]);
    terms.push({ key: 'radius_km', label: `Within ${km[1]} km` });
    take(/\b\d{1,2}\s*(km|kilometers?)\b/);
  } else if (wantsNearby) {
    params.radius_km = 10;
    terms.push({ key: 'radius_km', label: 'Near you' });
  }

  // Whatever is left that isn't filler is probably a shop or street name
  // ("Big Bang Tailoring", "Jacinto") — search it as typed.
  if (!params.q) {
    const leftover = rest
      .replace(/[^a-z0-9ñ' -]/g, ' ')
      .split(' ')
      .filter((w) => w.length > 1 && !FILLER.has(w))
      .slice(0, 4)
      .join(' ');
    if (leftover) {
      params.q = leftover;
      terms.push({ key: 'q', label: `“${leftover}”` });
    }
  }

  return { kind: 'search', params, terms, wantsNearby };
}

const FILLER = new Set([
  'a', 'an', 'the', 'me', 'my', 'i', 'im', "i'm", 'we', 'you', 'is', 'are', 'am', 'be', 'it', 'of', 'to', 'for', 'in', 'on', 'at', 'by',
  'and', 'or', 'with', 'that', 'this', 'there', 'any', 'some', 'can', 'could', 'would', 'will', 'do', 'does', 'did', 'get', 'got',
  'find', 'show', 'need', 'want', 'looking', 'look', 'search', 'please', 'pls', 'help', 'where', 'what', 'which', 'who', 'how',
  'shop', 'shops', 'store', 'stores', 'tailor', 'tailors', 'tailoring', 'sastre', 'mananahi', 'make', 'makes', 'making', 'made', 'sew', 'sews',
  'near', 'nearby', 'nearest', 'close', 'closest', 'around', 'malapit', 'place', 'places', 'one', 'ones', 'davao', 'city',
  'po', 'sa', 'ng', 'nga', 'na', 'ba', 'ang', 'mga', 'ko', 'ug', 'asa', 'naa', 'unsa', 'hi', 'hello', 'hey', 'good', 'morning', 'afternoon', 'evening',
  'km', 'php', 'price', 'prices', 'peso', 'pesos', 'also', 'just', 'like', 'have', 'has',
]);

/**
 * When nothing matches everything, loosen one filter at a time in the order
 * a customer would most likely give up first, and say which one went.
 */
export const RELAX_ORDER: { key: keyof AskParams; label: string }[] = [
  { key: 'open_now', label: 'Open now' },
  { key: 'min_rating', label: 'the rating' },
  { key: 'radius_km', label: 'the distance' },
  { key: 'max_price', label: 'the budget' },
  { key: 'district', label: 'the district' },
  { key: 'department', label: 'Men/Women/Kids' },
  { key: 'specialization', label: 'the service' },
];
