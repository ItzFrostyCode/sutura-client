import HomeSectionHeader from './HomeSectionHeader';
import { HOW_IT_WORKS } from './homeTypes';

/**
 * "How SUTURA works": the five approved stages, placement to pickup (the thesis's order-tracking flow). A phone gets
 * title-only rows (short); from 768px it is two columns with the full sentence under each title. Deliberately NOT five
 * columns: the column is capped at 960px, so five ~190px columns would wrap the sentences to 5 lines.
 * The long-form version stays on /about.
 */
export default function HomeStepsStrip() {
  return (
    <section aria-labelledby="home-steps-title">
      <HomeSectionHeader id="home-steps-title" title="How SUTURA works" href="/about" linkLabel="Full details" />
      <ol className="grid border-b border-line md:grid-cols-2 md:gap-x-10">
        {HOW_IT_WORKS.map(({ step, Icon, title, desc }) => (
          <li key={step} className="flex items-start gap-3 border-t border-line py-3 md:py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sunken text-taupe-dark" aria-hidden><Icon size={20} /></span>
            <div className="min-w-0">
              <h3 className="mobile-h4 text-ink"><span className="mr-2 tabular-nums text-ink-muted">{step}</span>{title}</h3>
              <p className="mobile-body-sm mt-1 hidden text-ink-muted md:block">{desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
