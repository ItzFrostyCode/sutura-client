import React from 'react';

interface CatalogDetailGridProps {
  readonly gallery: React.ReactNode;
  readonly buyZone: React.ReactNode;
}

// The Catalog Design Detail hero layout, shared by the customer page and the
// owner's editable page so the two resize identically: one column below
// 600px (photos on top, details under), 7/5 split from 600px up.
export default function CatalogDetailGrid({ gallery, buyZone }: CatalogDetailGridProps) {
  return (
    <div className="min-[600px]:grid min-[600px]:grid-cols-12 min-[600px]:gap-2.5 md:gap-10 min-[600px]:items-start">
      <div className="min-[600px]:col-span-7">{gallery}</div>
      <div className="min-[600px]:col-span-5 mt-4 min-[600px]:mt-0">{buyZone}</div>
    </div>
  );
}
