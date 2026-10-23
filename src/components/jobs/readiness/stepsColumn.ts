import { lineSteps, lineView } from '../productionLine';
import type { Job } from '../jobHelpers';
import type { ReadinessData } from './readinessTypes';

/** The column of the job board the order is in: it decides which Steps-tab section is open and which are folded. */
export type StepsColumn = 'request' | 'getting_ready' | 'being_made' | 'hand_over' | 'done' | 'closed';

export function stepsColumn(data: ReadinessData): StepsColumn {
  const status = data.status;
  if (status === 'cancelled' || status === 'rejected') return 'closed';
  if (status === 'completed') return 'done';
  if (!data.quotation?.production_started_at) return ['confirmed', 'awaiting_materials'].includes(status) ? 'getting_ready' : 'request';
  return ['collection', 'fitting', 'handover'].includes(data.delivery?.current ?? '') ? 'hand_over' : 'being_made';
}

/** "x of y done" for the Being made column: steps of the line already passed (all of them once the order has moved on; a closed order shows where it stopped). */
export function makingProgress(job: Job, column: StepsColumn): { done: number; total: number } {
  const total = lineSteps(job).length;
  if (column !== 'being_made' && column !== 'closed') return { done: total, total };
  return { done: lineView(job).index ?? total, total };
}
