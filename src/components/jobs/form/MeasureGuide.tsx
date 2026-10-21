import Link from 'next/link';
import { Ruler } from 'lucide-react';
import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import GuideImage from '@/components/shared/GuideImage';
import { getMediaUrl } from '@/lib/media';
import { parseTextAndImage, SizeChartBlock } from '@/components/store-catalog-detail/CatalogGuideBlocks';
import type { CatalogItem as PublicCatalogItem } from '@/components/store-catalog-detail/types';
import type { ServiceData } from './types';

/**
 * How to take this garment's measurements and its size chart, as the shop wrote them on the design (or the service).
 * Opens and closes in place; nothing is made up — when the shop has not written one, it says so and points to where.
 */
export default function MeasureGuide({ design, service }: Readonly<{ design: CatalogItem | null; service: ServiceData | undefined }>) {
  const guide = parseTextAndImage(typeof design?.measurement_guide === 'string' ? design.measurement_guide : null);
  const chartSource = (design?.size_chart_columns?.length || design?.size_chart_image_url) ? design : service;
  const chart = chartSource
    ? ({ size_chart_columns: chartSource.size_chart_columns ?? [], size_chart_rows: chartSource.size_chart_rows ?? [], size_chart_image_url: chartSource.size_chart_image_url ?? '' } as unknown as PublicCatalogItem)
    : null;
  const hasChart = Boolean(chart && (chart.size_chart_columns?.length || chart.size_chart_image_url));

  return (
    <details className="group rounded-lg border border-espresso/30 bg-espresso/[0.04]/60">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        <Ruler size={15} className="text-espresso" />
        How to take measurements
        <span className="ml-auto text-[13px] font-normal text-ink-muted group-open:hidden">Show</span>
        <span className="ml-auto hidden text-[13px] font-normal text-ink-muted group-open:inline">Hide</span>
      </summary>
      <div className="space-y-4 border-t border-espresso/30 p-3">
        {guide.imageUrl && <GuideImage src={getMediaUrl(guide.imageUrl)} alt="How to measure" />}
        {guide.text && <p className="whitespace-pre-wrap text-sm text-ink-body">{guide.text}</p>}
        {hasChart && chart && <SizeChartBlock item={chart} hideLabel />}
        {!guide.text && !guide.imageUrl && !hasChart && (
          <p className="text-sm text-ink-muted">
            No measuring guide has been written{design ? ' for this design' : ' for this service'} yet.{' '}
            {design && <Link href={`/dashboard/catalog/${design.id}`} className="inline-flex h-9 items-center rounded-md border border-espresso/25 px-3 text-sm font-medium text-espresso hover:bg-espresso/[0.06]">Add one on the design’s page</Link>}
          </p>
        )}
      </div>
    </details>
  );
}
