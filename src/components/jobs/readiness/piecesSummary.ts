import { jobPeople, jobPieces } from '@/lib/orderSize';
import type { Job } from '../jobHelpers';
import { readCounts, sizeRowKeys } from './quotationSizes';

/** The order's pieces, people and sizes in one line: "20 pcs · 20 people · Standard sizes S 5 · M 10 · L 5". */
export function piecesSummary(job: Job): string {
  const data = job.custom_order_data ?? {};
  const pieces = jobPieces(job);
  const people = jobPeople(job);
  const parts = [`${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`];
  if (people > 0) parts.push(`${people} ${people === 1 ? 'person' : 'people'}`);

  if (Array.isArray(data.team_roster) && data.team_roster.length > 0) return [...parts, 'Sizes from the team list'].join(' · ');

  const counts = readCounts(data, pieces);
  const sizes = sizeRowKeys(counts).filter((k) => Number(counts[k]) > 0);
  if (sizes.length === 0) return [...parts, 'Custom measurements'].join(' · ');
  parts.push(sizes.length === 1 ? `Standard size ${sizes[0]}` : `Standard sizes ${sizes.map((k) => `${k} ${counts[k]}`).join(' · ')}`);
  return parts.join(' · ');
}
