import { ADVISER, TEAM, THESIS_TITLE } from './aboutData';

/** Who made it: the capstone group and their adviser — names only. */
export default function AboutTeam() {
  return (
    <section aria-labelledby="about-team-title" className="mx-auto max-w-3xl">
      <h2 id="about-team-title" className="mobile-h2 sm:tablet-h2 text-ink">Made by students, for Davao&rsquo;s tailors</h2>
      <p className="mobile-body-md mt-2 text-ink-body">
        SUTURA is the capstone project <span className="italic">{THESIS_TITLE}</span> of BSIT students at STI College Davao,
        built for the tailoring shops of Davao City and the customers who rely on them.
      </p>
      <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {TEAM.map((name) => (
          <li key={name} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunken text-sm font-semibold text-taupe-dark" aria-hidden="true">
              {name.split(' ')[0][0]}{name.split(' ').at(-1)?.[0]}
            </span>
            <span className="mobile-body-md text-ink">{name}</span>
          </li>
        ))}
      </ul>
      <p className="mobile-body-md mt-6 border-t border-line pt-4 text-ink-body">
        <span className="mobile-overline mr-2 text-ink-muted">Adviser</span>{ADVISER}
      </p>
    </section>
  );
}
