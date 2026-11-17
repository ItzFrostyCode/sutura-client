import { safeHref } from '@/lib/safeHref';
import type { TrackedOrder } from '@/components/shared/OrderTrackingView';

/** The shop's own progress photos, one per production stage: what it looks like while it is being made. */
export default function OrderProgressPhotos({ order }: Readonly<{ order: TrackedOrder }>) {
  const photos = order.progress_photos ?? [];
  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="order-progress-photos-title" className="card-soft p-4">
      <h2 id="order-progress-photos-title" className="mobile-h4 mb-3 text-ink">Progress Photos</h2>
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <a
            key={`${p.url}-${i}`}
            href={safeHref(p.url)}
            target="_blank"
            rel="noopener noreferrer"
            title="Progress photo"
            className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line-strong bg-sunken active:opacity-80"
          >
            <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
          </a>
        ))}
      </div>
    </section>
  );
}
