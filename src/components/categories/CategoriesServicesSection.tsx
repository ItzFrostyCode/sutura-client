import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { serviceEntries, serviceHref } from './categoriesDirectoryData';

// The 4 approved tailoring services ("what work can you do?"), each with its tasks as chips. A garment is a
// different thing ("what clothing?"), so services are their own section, not mixed into the garment grid.
export default function CategoriesServicesSection() {
  return (
    <section className="mb-10">
      <h2 className="mobile-h2 sm:tablet-h2 text-ink mb-1">Services</h2>
      <p className="mobile-body-sm text-ink-muted max-w-2xl mb-4">
        Garment making, uniforms and jerseys, alterations and repairs, and embroidery from local tailoring shops.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {serviceEntries().map((svc) => (
          <div key={svc.group} className="bg-surface border border-line p-4 flex flex-col">
            <Link href={serviceHref(svc.group)} className="flex items-center justify-between gap-2 group">
              <span className="mobile-h4 text-ink group-hover:text-taupe transition-colors">{svc.label}</span>
              <ChevronRight size={16} className="text-ink-faint group-hover:text-taupe transition-colors shrink-0" />
            </Link>
            <p className="mobile-caption text-ink-muted mt-1 mb-3">{svc.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {svc.capabilities.map((cap) => (
                <Link
                  key={cap.slug}
                  href={serviceHref(svc.group, cap.slug)}
                  className="mobile-caption min-h-8 inline-flex items-center px-2.5 py-1 bg-canvas border border-line hover:border-taupe hover:text-taupe transition-colors text-ink-muted"
                >
                  {cap.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
