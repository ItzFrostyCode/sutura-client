/**
 * Loading placeholder matching CatalogItemCard's exact shape (aspect-3/4
 * image, rating row, 2-line name, price, order-count line) — same grid
 * dimensions as the real card, so nothing jumps/reflows once data arrives.
 */
export default function CatalogItemCardSkeleton() {
  return (
    <div className="bg-surface border border-line overflow-hidden animate-pulse">
      <div className="aspect-3/4 bg-sunken" />
      <div className="p-[5px] space-y-1.5">
        <div className="h-3 w-14 bg-sunken rounded" />
        <div className="h-3 w-full bg-sunken rounded" />
        <div className="h-3 w-3/4 bg-sunken rounded" />
        <div className="h-4 w-12 bg-sunken rounded mt-1" />
      </div>
    </div>
  );
}
