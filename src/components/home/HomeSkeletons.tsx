import HomeSectionHeader from './HomeSectionHeader';

// Loading placeholders for the Discover page. Each one has the same outer size and blocks as the card it stands in
// for, so nothing jumps when the real content arrives. Pulsing stops for people who ask for reduced motion.
const block = 'bg-sunken motion-safe:animate-pulse';

/** The Featured card: big photo, then name, rating line, what they do, four works and the button. */
export function FeaturedSkeleton() {
  return (
    <section aria-label="Loading featured shops" aria-busy="true">
      <HomeSectionHeader id="featured-title-loading" title="Featured" />
      <div className="card-soft overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className={`h-[220px] w-full sm:h-[300px] lg:h-auto lg:min-h-[400px] lg:flex-1 ${block}`} />
          <div className="flex w-full shrink-0 flex-col gap-5 p-5 sm:p-6 lg:w-[360px]">
            <div className="space-y-2.5">
              <div className={`h-6 w-3/4 rounded-md ${block}`} />
              <div className={`h-4 w-1/2 rounded-md ${block}`} />
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2].map((i) => <div key={i} className={`h-7 w-24 rounded-full ${block}`} />)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className={`aspect-[16/10] rounded-xl ${block}`} />
                  <div className={`h-3 w-4/5 rounded ${block}`} />
                </div>
              ))}
            </div>
            <div className={`h-12 rounded-full ${block}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** A Near Shops card: banner, the round logo over its edge, name, place and rating. */
export function ShopCardSkeleton() {
  return (
    <div className="card-soft w-[250px] shrink-0 overflow-hidden" aria-hidden>
      <div className="relative h-28">
        <div className={`h-full w-full ${block}`} />
        <div className="absolute -bottom-5 left-3 h-12 w-12 rounded-full bg-surface p-0.5">
          <div className={`h-full w-full rounded-full ${block}`} />
        </div>
      </div>
      <div className="space-y-2 p-3.5 pt-7">
        <div className={`h-4 w-3/4 rounded ${block}`} />
        <div className={`h-3 w-1/2 rounded ${block}`} />
        <div className={`h-3 w-1/3 rounded ${block}`} />
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
        <div className={`h-2.5 w-1/2 rounded ${block}`} />
        <div className={`h-3.5 w-1/3 rounded ${block}`} />
        <div className={`h-2.5 w-2/5 rounded ${block}`} />
      </div>
    </div>
  );
}

/** A row of card skeletons in the same scroller spacing the real carousels use. */
export function SkeletonRow({ count = 3, children }: Readonly<{ count?: number; children: (i: number) => React.ReactNode }>) {
  return (
    <div className="flex gap-3 overflow-hidden py-1" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => children(i))}
    </div>
  );
}
