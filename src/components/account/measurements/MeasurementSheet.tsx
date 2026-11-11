import { FileImage } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { convertValue, splitMeasure, unitMark, unitOfMetrics, type MeasureUnit } from '@/lib/measurementUnit';
import { humanizeMetricKey } from '@/components/measurements/measurementHelpers';
import { splitByArea } from '@/components/measurements/measurementAreas';
import type { MeasurementRecord } from '@/components/measurements/measurementTypes';

/**
 * One size in the unit the shop typed it in (each field can be inches or cm by itself), and the same size in the other
 * unit, smaller, so a customer who thinks in either can read it without switching anything. Text (e.g. a style) stays as is.
 */
function SizeValue({ value, recordUnit }: { readonly value: string; readonly recordUnit: MeasureUnit }) {
  const { number, unit } = splitMeasure(value, recordUnit);
  const isNumber = number !== '' && Number.isFinite(Number(number.replace(',', '.')));
  if (!isNumber) return <span className="text-base font-semibold text-ink">{value}</span>;
  const other: MeasureUnit = unit === 'in' ? 'cm' : 'in';
  return (
    <span className="text-right">
      <span className="text-base font-semibold tabular-nums text-ink">{number}{unitMark(unit)}</span>
      <span className="mobile-caption ml-1.5 tabular-nums text-ink-faint">{convertValue(number, unit, other)}{unitMark(other)}</span>
    </span>
  );
}

function AreaList({ title, rows, unit }: { readonly title: string; readonly rows: [string, string][]; readonly unit: MeasureUnit }) {
  return (
    <div>
      <h4 className="mobile-overline mb-1 border-b border-line-strong pb-1.5 text-ink">{title}</h4>
      <dl>
        {rows.map(([key, value]) => (
          <div key={key} className="flex min-h-10 items-center justify-between gap-3 py-1.5">
            <dt className="mobile-body-sm text-ink-body">{humanizeMetricKey(key)}</dt>
            <dd className="shrink-0"><SizeValue value={value} recordUnit={unit} /></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * The sizes exactly as the shop recorded them on the job order: Top and Bottom, each value in the unit the shop typed
 * it in (with the other unit beside it), then the shop's notes and the photos of the paper sheet. Read-only — the shop is the one who records and corrects measurements.
 */
export default function MeasurementSheet({ record }: { readonly record: MeasurementRecord }) {
  const unit = unitOfMetrics(record.metrics);
  const { top, bottom } = splitByArea(record.metrics);
  const photos = record.photo_urls ?? [];

  if (top.length === 0 && bottom.length === 0 && photos.length === 0 && !record.notes) {
    return <p className="mobile-body-sm text-ink-muted">The shop hasn&apos;t typed in any sizes for this yet.</p>;
  }

  return (
    <div className="space-y-4">
      {(top.length > 0 || bottom.length > 0) && (
        <div className={`grid gap-4 ${top.length > 0 && bottom.length > 0 ? 'sm:grid-cols-2' : ''}`}>
          {top.length > 0 && <AreaList title="Top" rows={top} unit={unit} />}
          {bottom.length > 0 && <AreaList title="Bottom" rows={bottom} unit={unit} />}
        </div>
      )}

      {record.notes && (
        <div className="rounded-xl bg-sunken px-3 py-2.5">
          <p className="mobile-caption font-semibold text-ink-muted">Shop&apos;s notes</p>
          <p className="mobile-body-sm mt-0.5 whitespace-pre-wrap text-ink-body">{record.notes}</p>
        </div>
      )}

      {photos.length > 0 && (
        <div>
          <p className="mobile-caption mb-2 font-semibold text-ink-muted">Measurement sheet{photos.length > 1 ? 's' : ''}</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <a key={url} href={getMediaUrl(url)} target="_blank" rel="noopener noreferrer" aria-label={`Open measurement sheet photo ${i + 1}`}
                className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-line bg-sunken text-ink-faint">
                <FileImage size={20} aria-hidden className="absolute" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getMediaUrl(url)} alt="" className="relative h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
