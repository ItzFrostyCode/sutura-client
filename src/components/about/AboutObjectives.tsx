import { OBJECTIVES } from './aboutData';

/** What SUTURA does — the thesis' seven specific objectives. */
export default function AboutObjectives() {
  return (
    <section aria-labelledby="about-objectives-title" className="mx-auto max-w-3xl">
      <h2 id="about-objectives-title" className="mobile-h2 sm:tablet-h2 text-ink">What SUTURA does</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {OBJECTIVES.map(({ Icon, title, desc }) => (
          <li key={title} className="flex gap-4 py-4">
            <Icon size={22} className="mt-0.5 shrink-0 text-taupe" aria-hidden="true" />
            <div>
              <h3 className="mobile-h4 text-ink">{title}</h3>
              <p className="mobile-body-md mt-1 text-ink-body">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
