import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_TYPE_LABELS,
  serviceTypesFor,
  serviceSearchHref,
} from '@/lib/canonicalTaxonomy';

// A service is a different kind of thing than a garment — kept as its own
// section (not folded into the apparel showcase grid or A-Z directory) so
// it can actually be browsed as a group: one card per service category,
// listing that category's own service types as the "kinds of service" a
// customer can search for directly.
export default function CategoriesServicesSection() {
  return (
    <section className="mb-10">
      <h2 className="mobile-h2 sm:tablet-h2 text-ink mb-1">Services</h2>
      <p className="mobile-body-sm text-ink-muted max-w-2xl mb-4">
        Professional tailoring, alterations, uniform production, printing, and custom garment
        creation from local tailoring shops.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SERVICE_CATEGORIES.filter((cat) => cat !== 'others').map((cat) => (
          <div key={cat} className="bg-surface border border-line p-4 flex flex-col">
            <Link
              href={serviceSearchHref(cat)}
              className="flex items-center justify-between gap-2 mb-3 group"
            >
              <span className="mobile-h4 text-ink group-hover:text-taupe transition-colors">
                {SERVICE_CATEGORY_LABELS[cat]}
              </span>
              <ChevronRight size={16} className="text-ink-faint group-hover:text-taupe transition-colors shrink-0" />
            </Link>

            <div className="flex flex-wrap gap-1.5">
              {serviceTypesFor(cat).map((type) => (
                <Link
                  key={type}
                  href={serviceSearchHref(cat, type)}
                  className="mobile-caption px-2.5 py-1 bg-canvas border border-line hover:border-taupe hover:text-taupe transition-colors text-ink-muted"
                >
                  {SERVICE_TYPE_LABELS[type] ?? type}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
