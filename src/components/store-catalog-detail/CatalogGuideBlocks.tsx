import React from 'react';
import { CatalogItem } from './types';
import GuideImage from '@/components/shared/GuideImage';

// {text, image_url} JSON (or legacy plain text) → parts. Same shape for the
// measurement guide and the care/description block.
export function parseTextAndImage(raw?: string | null): { text: string; imageUrl: string } {
  if (!raw) return { text: '', imageUrl: '' };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && ('text' in parsed || 'image_url' in parsed)) {
      return { text: parsed.text || '', imageUrl: parsed.image_url || '' };
    }
  } catch {
    // plain text
  }
  return { text: raw, imageUrl: '' };
}

export function hasSizeChart(item: CatalogItem): boolean {
  return (item.size_chart_columns?.length ?? 0) > 0 || Boolean(item.size_chart_image_url);
}

export function hasMeasurementGuide(item: CatalogItem): boolean {
  const { text, imageUrl } = parseTextAndImage(item.measurement_guide);
  return Boolean(text || imageUrl);
}

// "1. Size Chart" — reference image (if the shop attached one) first, table
// below it; a table-less item just shows the image, an image-less item just
// shows the table.
export function SizeChartBlock({ item, hideLabel }: Readonly<{ item: CatalogItem; hideLabel?: boolean }>) {
  const columns = item.size_chart_columns || [];
  const rows = item.size_chart_rows || [];
  const image = item.size_chart_image_url || '';

  return (
    <div>
      {!hideLabel && <p className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-2">1. Size Chart</p>}
      {image && (
        <GuideImage src={image} alt="Size Chart visual" />
      )}
      {columns.length > 0 ? (
        // overflow-x-auto so a size chart with many columns scrolls
        // horizontally instead of squeezing/wrapping.
        <div className={`overflow-x-auto border border-line rounded-none ${image ? 'mt-3' : ''}`}>
          <table className="w-full mobile-body-sm">
            <thead>
              <tr className="bg-canvas">
                {/* "Size" is sticky/frozen on the left — without it,
                    scrolling right on a wide chart loses track of
                    which row is which size. */}
                <th className="sticky left-0 z-10 bg-canvas px-3 py-2 text-left font-semibold text-ink-body whitespace-nowrap">Size</th>
                {columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left font-semibold text-ink-body whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.size} className="border-t border-line">
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-semibold text-ink whitespace-nowrap">{row.size}</td>
                  {row.values.map((val, ci) => (
                    <td key={`${row.size}-${ci}`} className="px-3 py-2 text-ink-body font-normal whitespace-nowrap">{val || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {/* Scrollbars are often invisible on mobile/trackpad, so without this
          a table wider than the screen just looks "complete". */}
      {columns.length > 3 && (
        <p className="mt-1.5 text-[11px] text-ink-faint">Swipe to see more sizes →</p>
      )}
      {columns.length === 0 && !image ? (
        <p className="mobile-body-sm text-ink-faint font-normal">No size guide available yet for this item — sizes follow this store&apos;s own standard. Contact the store if you&apos;re unsure.</p>
      ) : null}
    </div>
  );
}

// "2. Measurement Guide" — free-text how-to-measure notes, same
// image-first-then-text ordering as the size chart above.
export function MeasurementGuideBlock({ item, hideLabel }: Readonly<{ item: CatalogItem; hideLabel?: boolean }>) {
  const { text, imageUrl } = parseTextAndImage(item.measurement_guide);

  return (
    <div>
      {!hideLabel && <p className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-2">2. Measurement Guide</p>}
      {imageUrl && (
        <GuideImage src={imageUrl} alt="Measurement Guide visual" />
      )}
      {text && (
        <p className={`mobile-body-sm text-ink-muted font-normal whitespace-pre-wrap ${imageUrl ? 'mt-3' : ''}`}>
          {text}
        </p>
      )}
    </div>
  );
}
