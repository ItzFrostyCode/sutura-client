import { rowArea, type OrderForm, type RosterRow } from './useOrderForm';
import type { Area } from './orderPoints';

/**
 * Shop questions that ask again for something the order already knows. They are answered for the customer instead of
 * being typed twice:
 *   team / organization  ← the group's team name
 *   names / roster       ← the group's names (and jersey numbers…)
 *   size breakdown       ← the group's size count
 *   fabric / material    ← "I'll bring my own fabric" and its description, or the option when it names a fabric
 */
type Kind = 'team' | 'roster' | 'sizes' | 'fabric';

const FABRIC_WORDS = /\b(mesh|honeycomb|cotton|dri[- ]?fit|polyester|poly|spandex|linen|silk|jusi|pi[ñn]a|twill|denim|lacoste|interlock|microfiber|chiffon|satin|gabardine|fabric)\b/i;

function kindOf(label: string): Kind | null {
  const l = label.toLowerCase();
  if (/size\s*(breakdown|count|list|run)|how many (of each|per) size|sizes? needed/.test(l)) return 'sizes';
  if (/roster|player|names?\b|list of (names|people|members)|jersey (name|number)/.test(l)) return 'roster';
  if (/team|organi[sz]ation|school|company|group name|club/.test(l)) return 'team';
  if (/fabric|material|cloth|tela/.test(l)) return 'fabric';
  return null;
}

/** "M × 4 · L × 3" from a list of sizes. */
export function tally(values: string[]): string {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()].map(([s, n]) => `${s} × ${n}`).join(' · ');
}

const rosterLine = (roster: RosterRow[]) => roster
  .filter((r) => r.name.trim())
  .map((r) => {
    const extras = Object.values(r.extra).map((v) => v.trim()).filter(Boolean);
    return extras.length ? `${r.name.trim()} (${extras.join(', ')})` : r.name.trim();
  })
  .join('; ');

export interface AnswerContext {
  area: Area | '';
  areaLocked: boolean;
  /** The option picked, e.g. "Mesh Fabric Jersey Set". */
  optionLabel: string;
  /** The signed-in customer, who wears it when no other wearer is named. */
  customerName: string;
}

const SOURCE_LINE: Record<string, string> = {
  saved: 'Measurements on file with the shop',
  own: 'Body measurements sent with this order',
  shop: 'The shop measures at the visit',
};

/** One person's size, as a line for the shop ("M × 2", "M / L × 1", or how the size will be known). */
function oneSize(f: OrderForm, c: AnswerContext): string {
  const size = [f.size, c.area === 'both' ? f.sizeBottom : ''].filter(Boolean).join(' / ');
  return size ? `${size} × ${f.quantity}` : SOURCE_LINE[f.source] ?? '';
}

/** A group typed in the measurement table (no letter sizes): how many people have numbers. */
export function measuredLine(f: OrderForm): string {
  const typed = f.roster.filter((r) => Object.values(r.fit).some((v) => v.trim())).length;
  const total = f.roster.length;
  if (typed === 0) return `${total} people, all measured by the shop`;
  return typed === total ? `Measurements typed for all ${total} people` : `Measurements typed for ${typed} of ${total} people; the shop measures the rest`;
}

/** The answers the order already gives, keyed by the shop's question label. Questions not listed here are asked. */
export function autoAnswers(f: OrderForm, questions: { label?: string }[], c: AnswerContext): Record<string, string> {
  const group = f.mode === 'group';
  const sizes = tally(f.roster.flatMap((r) => (rowArea(r, c.area, c.areaLocked) === 'both' ? [r.size, r.bottomSize] : [r.size])));
  const out: Record<string, string> = {};
  for (const q of questions) {
    const label = q.label?.trim();
    const kind = label ? kindOf(label) : null;
    if (!label || !kind) continue;
    let answer = '';
    // Team, names and sizes always come from the order itself: a group's list, or the one person's order.
    if (kind === 'team') answer = group ? f.teamName.trim() : 'Individual order (not a team)';
    if (kind === 'roster') answer = group ? rosterLine(f.roster) : f.wearer.trim() || c.customerName;
    if (kind === 'sizes') answer = group ? sizes || measuredLine(f) : oneSize(f, c);
    if (kind === 'fabric') {
      if (f.material === 'own') answer = `My own fabric${f.materialNote.trim() ? `: ${f.materialNote.trim()}` : ''}`;
      else if (FABRIC_WORDS.test(c.optionLabel)) answer = c.optionLabel;
    }
    if (answer) out[label] = answer;
  }
  return out;
}

/** The answers sent with the order: what the customer typed, with the ones the order already gives filled in. */
export function answersFor(f: OrderForm, questions: { label?: string }[], c: AnswerContext): Record<string, string> {
  return { ...f.answers, ...autoAnswers(f, questions, c) };
}

/** Choices to tap for a fabric question: the fabrics the shop's own options name ("Mesh", "Honeycomb"…). */
export function fabricSuggestions(optionLabels: string[]): string[] {
  const found = new Set<string>();
  for (const l of optionLabels) {
    const m = l.match(new RegExp(FABRIC_WORDS.source, 'gi')) ?? [];
    m.filter((w) => w.toLowerCase() !== 'fabric').forEach((w) => found.add(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()));
  }
  return [...found];
}

export const isFabricQuestion = (label: string) => kindOf(label) === 'fabric';
export const NOT_SURE = 'Not sure — please suggest one';
