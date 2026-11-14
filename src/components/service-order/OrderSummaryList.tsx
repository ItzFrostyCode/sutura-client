'use client';

import type { ServiceOrderState } from './useServiceOrder';
import { CUSTOM_FIT, rowArea } from './useOrderForm';
import { formatPhone } from './orderPoints';
import { answersFor, measuredLine, tally } from './orderQuestions';

const AREA: Record<string, string> = { top: 'Top', bottom: 'Bottom', both: 'Top & Bottom' };
const SOURCE: Record<string, string> = {
  saved: 'Measurements on file', standard: 'Size from the chart', own: 'My own measurements', shop: 'The shop measures me',
};
const NAMES_SHOWN = 6;

function Section({ title, step, lines, onEdit }: Readonly<{ title: string; step: number; lines: string[]; onEdit: (n: number) => void }>) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="mobile-caption text-ink-muted">{title}</p>
        {lines.filter(Boolean).map((l, i) => <p key={`${i}-${l}`} className="break-words text-base text-ink">{l}</p>)}
      </div>
      <button type="button" onClick={() => onEdit(step)} aria-label={`Edit ${title.toLowerCase()}`}
        className="flex min-h-11 shrink-0 items-center px-1 text-sm font-semibold text-ink underline-offset-4 hover:underline">Edit</button>
    </div>
  );
}

/** Everything the customer chose, one section per step, each with Edit to go back to that step. */
export default function OrderSummaryList({ o }: Readonly<{ o: ServiceOrderState }>) {
  const { f } = o;
  const branch = (o.store?.branches ?? []).find((b) => b.id === f.branchId);
  const group = f.mode === 'group';
  const areaOf = (r: (typeof f.roster)[number]) => rowArea(r, o.area, o.areaLocked);

  const names = f.roster.map((r) => {
    const extra = Object.values(r.extra).map((v) => v.trim()).filter(Boolean).join(', ');
    const size = [r.size, areaOf(r) === 'both' ? r.bottomSize : ''].filter(Boolean).join(' / ');
    return [r.name.trim(), extra && `(${extra})`, size && `· ${size}`, !o.areaLocked && areaOf(r) ? `· ${AREA[areaOf(r) as string]}` : ''].filter(Boolean).join(' ');
  });
  const custom = f.roster.filter((r) => r.size === CUSTOM_FIT || r.bottomSize === CUSTOM_FIT).length;
  const sizeCount = tally(f.roster.flatMap((r) => (areaOf(r) === 'both' ? [r.size, r.bottomSize] : [r.size])));

  const sizes = group
    ? [
        `${f.roster.length} people${f.teamName.trim() ? ` · ${f.teamName.trim()}` : ''}`,
        o.sizesNeeded && o.chartSizes && sizeCount ? `Sizes: ${sizeCount}` : '',
        !o.chartSizes ? measuredLine(f) : '',
        custom ? `${custom} Custom Fit` : '',
        ...names.slice(0, NAMES_SHOWN),
        names.length > NAMES_SHOWN ? `and ${names.length - NAMES_SHOWN} more` : '',
      ]
    : !o.sizesNeeded ? ['No sizes needed']
      : !o.measurementsNeeded ? ['Size from the chart', [f.size, o.area === 'both' ? f.sizeBottom : ''].filter(Boolean).join(' / ')]
        : [SOURCE[f.source], f.source === 'standard' ? [f.size, o.area === 'both' ? f.sizeBottom : ''].filter(Boolean).join(' / ') : '', f.wearer.trim() ? `For ${f.wearer.trim()}` : ''];

  const answers = Object.entries(answersFor(f, o.service?.custom_fields ?? [], o.answerContext))
    .filter(([, v]) => v.trim())
    .map(([q, v]) => `${q}: ${v.length > 90 ? `${v.slice(0, 90)}…` : v}`);

  return (
    <div className="divide-y divide-line">
      <Section title="Details" step={1} onEdit={o.setStep} lines={[o.user?.name ?? '', formatPhone(f.phone), branch?.name ?? '']} />
      <Section title="Order" step={2} onEdit={o.setStep}
        lines={[o.service?.name ?? '', [o.option?.label, !group && o.area ? AREA[o.area] : ''].filter(Boolean).join(' · '), group ? 'Group order' : `${f.quantity} for one person`]} />
      <Section title="Sizes" step={3} onEdit={o.setStep} lines={sizes} />
      <Section title="Style" step={4} onEdit={o.setStep} lines={[
        o.design ? `Design: ${o.design.name}` : 'No design picked',
        f.photos.length ? `${f.photos.length} reference photo${f.photos.length === 1 ? '' : 's'}` : '',
        f.link.trim() ? 'Reference link added' : '',
        f.material === 'own' ? `Bringing my own fabric${f.materialNote.trim() ? `: ${f.materialNote.trim()}` : ''}` : "Shop's fabric",
        ...answers,
        f.notes.trim() ? `Note: ${f.notes.trim().slice(0, 120)}${f.notes.trim().length > 120 ? '…' : ''}` : '',
      ]} />
    </div>
  );
}
