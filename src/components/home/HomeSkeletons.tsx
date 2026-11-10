import HomeSectionHeader from './HomeSectionHeader';

// Loading placeholders for the Discover page. Each one has the same outer size and the same blocks, in the same places,
// as the card it stands in for, so nothing jumps when the real content arrives. Pulsing stops for reduced motion.
const block = 'bg-sunken motion-safe:animate-pulse';

/** One Featured service card: photo (16:10, 2:1 on desktop), name, kind, price, rating line, days. */
function FeaturedServiceSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface" aria-hidden>
      <div className={`aspect-[16/10] w-full lg:aspect-[2/1] ${block}`} />
      <div className="space-y-1.5 p-2.5">
        <div className={`h-3.5 w-4/5 rounded ${block}`} />
        <div className={`h-3 w-3/5 rounded ${block}`} />
        <div className={`h-3 w-2/5 rounded ${block}`} />
        <div className={`h-3 w-3/4 rounded ${block}`} />
        <div className={`h-3 w-1/2 rounded ${block}`} />
      </div>
    </div>
  );
}

/**
 * The Featured card, as HomeFeaturedSpotlight draws it: on a phone and tablet the details only (no photo); from 1024px
 * the photo on the left and the 420px details column on the right, at least 650px tall.
 */
export function FeaturedSkeleton() {
  return (
    <section aria-label="Loading the featured shop" aria-busy="true">
      <HomeSectionHeader id="featured-title-loading" title="Featured Shop" href="/shops" linkLabel="All shops" />
      <div className="overflow-hidden rounded-2xl border border-line bg-white lg:flex lg:min-h-[650px]">
        <div className={`hidden lg:block lg:flex-1 ${block}`} />
        <div className="flex w-full flex-col gap-3 p-4 sm:p-5 lg:w-[420px] lg:shrink-0 lg:border-l lg:border-line">
          <div className={`h-3.5 w-24 rounded ${block}`} />
          <div className="flex items-center gap-3">
            <div className={`h-13 w-13 shrink-0 rounded-full sm:h-14 sm:w-14 ${block}`} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className={`h-5 w-3/4 rounded ${block}`} />
              <div className={`h-3 w-2/3 rounded ${block}`} />
              <div className={`h-3 w-1/3 rounded ${block}`} />
            </div>
          </div>
          <div className={`h-3 w-24 rounded ${block}`} />
          {/* Same grid as the real one: 2 on a phone, 4 in a row on a tablet, 2 × 2 on desktop. */}
          <div className="grid grid-cols-2 content-start gap-2 max-sm:[&>*:nth-child(n+3)]:hidden sm:grid-cols-4 lg:flex-1 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <FeaturedServiceSkeleton key={i} />)}
          </div>
          <div className="border-t border-line pt-3">
            <div className={`h-10 w-full rounded-lg ${block}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** A "Shops near you" card, as HomeShopCard draws it: cover, logo LEFT of a two-line name + "Verified", then place and rating. */
export function ShopCardSkeleton() {
  return (
    <div className="card-soft flex w-[260px] shrink-0 flex-col overflow-hidden" aria-hidden>
      <div className={`h-28 w-full ${block}`} />
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex items-start gap-3">
          <div className={`h-11 w-11 shrink-0 rounded-full ${block}`} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className={`h-4 w-4/5 rounded ${block}`} />
            <div className={`h-4 w-1/2 rounded ${block}`} />
            <div className={`h-3 w-2/5 rounded ${block}`} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line/60 pt-2.5">
          <div className={`h-3 w-28 rounded ${block}`} />
          <div className={`h-3 w-10 rounded ${block}`} />
        </div>
      </div>
    </div>
  );
}

/** A Services card: 4:3 photo, name, kind of work, price and rating — same width rules as SearchServiceCard. */
export function ServiceCardSkeleton() {
  return (
    <div className="card-soft w-[70%] min-w-[220px] max-w-[270px] shrink-0 overflow-hidden sm:w-[250px] md:w-[270px]" aria-hidden>
      <div className={`aspect-4/3 w-full ${block}`} />
      <div className="space-y-1.5 p-2.5">
        <div className={`h-3.5 w-4/5 rounded ${block}`} />
        <div className={`h-3 w-1/2 rounded ${block}`} />
        <div className={`h-3.5 w-1/3 rounded ${block}`} />
        <div className={`h-3 w-2/5 rounded ${block}`} />
      </div>
    </div>
  );
}

/** A row of card skeletons in the same scroller spacing the real carousels use (HomeCarouselRow: gap-3, py-1). */
export function SkeletonRow({ count = 3, children }: Readonly<{ count?: number; children: (i: number) => React.ReactNode }>) {
  return (
    <div className="flex gap-3 overflow-hidden py-1" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => children(i))}
    </div>
  );
}
