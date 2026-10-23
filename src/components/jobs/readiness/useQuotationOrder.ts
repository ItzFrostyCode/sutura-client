import { useState } from 'react';
import { jobPeople, jobPieces } from '@/lib/orderSize';
import type { Job } from '../jobHelpers';
import { countsKey, countsTotal, positiveCounts, readCounts, sizeSummary, type SizeCounts } from './quotationSizes';

export type SizeMode = 'standard' | 'custom';

/**
 * Step 1 of the quotation: how many pieces, how many people, and standard sizes or custom measurements. A team order
 * (it has a team list) is read-only here. `patch()` is what to send to the order before the quotation; null = nothing changed.
 */
export function useQuotationOrder(job: Job) {
  const data = job.custom_order_data ?? {};
  const team = Array.isArray(data.team_roster) && data.team_roster.length > 0;
  const startPieces = jobPieces(job);
  const storedPeople = Number(data.people_count) > 0 ? Number(data.people_count) : 0;
  const startCounts = readCounts(data, startPieces);

  const [pieces, setPieces] = useState(String(startPieces));
  // null = "the same as the pieces", until the shop types a number.
  const [people, setPeople] = useState<string | null>(storedPeople > 0 ? String(storedPeople) : null);
  const [mode, setMode] = useState<SizeMode>(Object.keys(startCounts).length > 0 ? 'standard' : 'custom');
  const [counts, setCounts] = useState<SizeCounts>(startCounts);

  const piecesN = team ? startPieces : Math.max(1, Math.floor(Number(pieces)) || 1);
  const peopleN = team ? jobPeople(job) : mode === 'custom' ? Math.max(1, Math.floor(Number(people ?? piecesN)) || piecesN) : 0;
  const stored = (p: number, ppl: number, m: SizeMode, c: SizeCounts) => JSON.stringify([p, m === 'custom' ? ppl : 0, m, m === 'standard' ? countsKey(c) : '']);
  const [start] = useState(() => stored(startPieces, storedPeople || startPieces, Object.keys(startCounts).length > 0 ? 'standard' : 'custom', startCounts));

  const sized = countsTotal(counts);
  const problem = !team && mode === 'standard' && sized !== piecesN ? `${sized} of ${piecesN} pieces have a size.` : null;
  const dirty = !team && stored(piecesN, peopleN, mode, counts) !== start;

  const setCount = (size: string, value: string) => setCounts((c) => ({ ...c, [size]: value.replace(/\D/g, '') }));

  const patch = (): Record<string, unknown> | null => {
    if (team || !dirty) return null;
    const custom = mode === 'custom';
    return {
      quantity: piecesN,
      custom_order_data: {
        ...(data.total_quantity != null ? { total_quantity: piecesN } : {}),
        people_count: custom && peopleN !== piecesN ? peopleN : null,
        standard_size: custom ? null : sizeSummary(counts),
        // One size for every piece is just a standard size; the tally is for several sizes (it marks the order as a bulk order).
        size_breakdown: !custom && piecesN >= 2 ? positiveCounts(counts) : null,
      },
    };
  };

  return { team, pieces, setPieces, piecesN, people, setPeople, peopleN, mode, setMode, counts, setCount, sized, problem, patch };
}

export type QuotationOrderState = ReturnType<typeof useQuotationOrder>;
