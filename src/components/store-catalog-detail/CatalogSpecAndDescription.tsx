import React from 'react';
import { getFabricLabel } from '@/lib/fabricHelper';
import { GARMENT_TYPE_LABELS, catalogCategoryPath } from '@/lib/canonicalTaxonomy';
import { CatalogItem } from './types';
import GuideImage from '@/components/shared/GuideImage';
import { parseTextAndImage } from './CatalogGuideBlocks';
import { formatTurnaround } from '@/lib/formatTurnaround';

interface ExtraRow { label: string; value: string }

// New designs save {rows: [{label, value}]}; older ones saved plain bullet
// strings, which read as a label with no value.
function parseFeatures(item: CatalogItem): { rows: ExtraRow[]; imageUrl: string } {
  const raw: unknown = item.features;
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { rows: [], imageUrl: '' };
    }
  }
  if (Array.isArray(parsed)) return { rows: parsed.map(b => ({ label: String(b), value: '' })).filter(r => r.label.trim()), imageUrl: '' };
  if (parsed && typeof parsed === 'object') {
    const o = parsed as { rows?: { label?: string; value?: string }[]; bullets?: unknown[]; image_url?: string };
    const rows = Array.isArray(o.rows)
      ? o.rows.map(r => ({ label: String(r?.label ?? ''), value: String(r?.value ?? '') }))
      : (o.bullets ?? []).map(b => ({ label: String(b), value: '' }));
    return { rows: rows.filter(r => r.label.trim() !== ''), imageUrl: o.image_url || '' };
  }
  return { rows: [], imageUrl: '' };
}

// Category is always the first row — the same trail the breadcrumb links through.
export function CatalogSpecTable({ item }: Readonly<{ item: CatalogItem }>) {
  const categoryPath = catalogCategoryPath(item);
  const { rows: extraRows, imageUrl } = parseFeatures(item);

  const rows: [string, string][] = [];
  if (categoryPath.length > 0) rows.push(['Category', categoryPath.join(' → ')]);
  if (item.garment_type) rows.push(['Garment Type', GARMENT_TYPE_LABELS[item.garment_type] ?? item.garment_type]);
  if (item.service?.name) rows.push(['Service', item.service.name]);
  rows.push(['Fabric', getFabricLabel(item)]);
  if (item.material) rows.push(['Material', item.material]);
  if (item.color) rows.push(['Color', item.color]);
  if (item.sizes && item.sizes.length > 0) rows.push(['Sizes Available', item.sizes.join(', ')]);
  rows.push(['Estimated Completion', formatTurnaround(item.estimated_days, item.estimated_days_max)]);

  return (
    <div className="space-y-4">
      <table className="w-full mobile-body-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-line last:border-0">
              <td className="py-2 pr-4 text-ink-faint font-medium w-2/5 align-top">{label}</td>
              <td className={label === 'Category' ? 'py-2 text-blue-900 font-normal' : 'py-2 text-ink-body font-normal'}>{value}</td>
            </tr>
          ))}
          {extraRows.map((row, i) => (
            <tr key={`${row.label}-${i}`} className="border-b border-line last:border-0">
              <td className="py-2 pr-4 text-ink-faint font-medium w-2/5 align-top">{row.label}</td>
              <td className="py-2 text-ink-body font-normal">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {imageUrl && (
        <GuideImage src={imageUrl} alt="Specification visual" />
      )}
    </div>
  );
}

export function CatalogDescriptionBlock({ item }: Readonly<{ item: CatalogItem }>) {
  const { text: careText, imageUrl: careImage } = parseTextAndImage(item.care_instructions);

  return (
    <div className="mobile-body-sm text-ink-muted leading-relaxed whitespace-pre-wrap space-y-4 font-normal">
      {item.description && <p>{item.description}</p>}
      <div>{careText || 'Professional dry-clean only. Altered garments are final sale.'}</div>
      {careImage && (
        <GuideImage src={careImage} alt="Description visual" />
      )}
    </div>
  );
}
