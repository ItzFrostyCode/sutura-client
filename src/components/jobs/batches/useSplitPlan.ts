import { useMemo, useState } from 'react';

export interface Person { index: number; name: string; detail: string }

/** Where each person goes: 1 = stays in this order, 2+ = a new batch. Amounts start as an equal share and can be typed over. */
export function useSplitPlan(people: Person[], total: number, discount: number) {
  const [batchOf, setBatchOf] = useState<Record<number, number>>({});
  const [paidBy, setPaidBy] = useState<Record<number, string>>({});
  const [price, setPrice] = useState<Record<number, string>>({});
  const [off, setOff] = useState<Record<number, string>>({});

  const placeOf = (i: number) => batchOf[i] ?? 1;
  const batches = useMemo(
    () => Array.from(new Set(people.map((p) => batchOf[p.index] ?? 1))).filter((b) => b > 1).sort((a, b) => a - b),
    [people, batchOf],
  );
  const members = (b: number) => people.filter((p) => placeOf(p.index) === b);
  const share = (b: number) => (people.length > 0 ? (total * members(b).length) / people.length : 0);
  const priceOf = (b: number) => (price[b] !== undefined ? Number(price[b]) || 0 : Math.round(share(b) * 100) / 100);
  const discountOf = (b: number) => (off[b] !== undefined ? Number(off[b]) || 0 : total > 0 ? Math.round(discount * (priceOf(b) / total) * 100) / 100 : 0);
  const movedTotal = batches.reduce((s, b) => s + priceOf(b), 0);
  const movedDiscount = batches.reduce((s, b) => s + discountOf(b), 0);

  return {
    placeOf, batches, members,
    stays: people.filter((p) => placeOf(p.index) === 1),
    move: (i: number, b: number) => setBatchOf((cur) => ({ ...cur, [i]: b })),
    separately: () => setBatchOf(Object.fromEntries(people.slice(1).map((p, k) => [p.index, k + 2]))),
    reset: () => { setBatchOf({}); setPrice({}); setOff({}); },
    paidBy, setPaidBy: (b: number, v: string) => setPaidBy((c) => ({ ...c, [b]: v })),
    priceOf, discountOf,
    setPrice: (b: number, v: string) => setPrice((c) => ({ ...c, [b]: v })),
    setDiscount: (b: number, v: string) => setOff((c) => ({ ...c, [b]: v })),
    left: { total: Math.round((total - movedTotal) * 100) / 100, discount: Math.round((discount - movedDiscount) * 100) / 100 },
    groups: () => batches.map((b) => ({
      people: members(b).map((p) => p.index),
      paid_by_name: paidBy[b]?.trim() || undefined,
      total_amount: priceOf(b),
      discount_amount: discountOf(b),
    })),
  };
}

export type SplitPlan = ReturnType<typeof useSplitPlan>;
