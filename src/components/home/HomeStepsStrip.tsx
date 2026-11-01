import Link from 'next/link';
import { HOW_IT_WORKS } from './homeTypes';

/**
 * "How SUTURA works" as a flat list of the five approved stages. A phone gets title-only rows (short); from 768px it is
 * two columns with the full sentence under each title. It is deliberately NOT five columns: the Discover column is
 * capped at 960px, so five columns are ~190px wide and the sentences would wrap to 5 lines or be cut off.
 * The long-form version stays on /about (HomeHowItWorks).
 */
export default function HomeStepsStrip() {
  return (
    <section aria-labelledby="home-steps-title">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id="home-steps-title" className="text-base font-semibold text-ink sm:text-lg">How SUTURA works</h2>
        <Link href="/about" className="flex min-h-11 items-center text-sm font-semibold text-taupe hover:text-ink">Full details</Link>
      </div>
      <ol className="grid border-b border-line md:grid-cols-2 md:gap-x-10">
        {HOW_IT_WORKS.map(({ step, Icon, title, desc }) => (
          <li key={step} className="flex items-start gap-3 border-t border-line py-3 md:py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-taupe"><Icon size={20} /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink md:text-base"><span className="mr-2 tabular-nums text-ink-muted">{step}</span>{title}</p>
              <p className="mobile-body-sm mt-1 hidden text-ink-muted md:block">{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
