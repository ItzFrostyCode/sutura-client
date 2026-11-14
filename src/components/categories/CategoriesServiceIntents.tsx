import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SERVICE_GROUPS } from '@/lib/garmentTaxonomy';
import { SERVICE_INTENTS, SERVICE_INTENT_KEYS, customerTaskLabel } from '@/lib/customerTaxonomy';
import { SERVICE_TILE_ICONS, serviceHref } from './categoriesDirectoryData';

/**
 * "What do you need?": the 4 services as the job a customer wants done, each with its tasks in the customer's words
 * (never the shop's settings like "Bulk / Batch Orders Accepted"). One column on a phone, two from 600px, four on a desktop.
 */
export default function CategoriesServiceIntents() {
  return (
    <section aria-labelledby="needs-title" className="mb-12">
      <h2 id="needs-title" className="mobile-h2 sm:tablet-h2 text-ink">What do you need?</h2>
      <p className="mobile-body-sm mt-1 mb-4 text-ink-muted">Pick the kind of work. Each one opens the shops that do it.</p>
      <ul className="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2 lg:grid-cols-4">
        {SERVICE_INTENT_KEYS.map((group) => {
          const Icon = SERVICE_TILE_ICONS[group];
          const intent = SERVICE_INTENTS[group];
          const tasks = Object.keys(SERVICE_GROUPS[group].capabilities);
          return (
            <li key={group} className="flex flex-col rounded-2xl border border-line bg-surface p-4">
              <Link href={serviceHref(group)} className="group flex items-start gap-3 rounded-xl">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunken text-ink">
                  <Icon size={20} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mobile-h4 flex items-center gap-1 text-ink group-hover:underline">
                    {intent.title}
                    <ArrowRight size={16} className="shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <span className="mobile-body-sm mt-0.5 block text-ink-muted">{intent.line}</span>
                </span>
              </Link>
              <ul className="mt-3 border-t border-line pt-2">
                {tasks.map((task) => (
                  <li key={task}>
                    <Link href={serviceHref(group, task)} className="flex min-h-11 items-center text-sm text-ink-body hover:text-ink hover:underline">
                      {customerTaskLabel(group, task)}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
