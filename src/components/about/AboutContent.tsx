import SuturaMark from '@/components/brand/SuturaMark';
import { ABOUT_PILLARS } from '@/components/home/homeTypes';
import PageBrandRow from '@/components/shared/publicNav/PageBrandRow';
import AboutObjectives from './AboutObjectives';
import AboutTeam from './AboutTeam';

/** About SUTURA, from the thesis: what it is, what it does (the objectives) and who made it. */
export default function AboutContent() {
  return (
    <section aria-labelledby="about-sutura-title" className="border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl mobile-screen-margins py-6 sm:py-14">
        <PageBrandRow className="mb-6" />
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <SuturaMark halo="var(--card-bg)" className="mx-auto mb-4 h-20 w-20" />
          <p className="mobile-overline mb-2 uppercase text-taupe">About SUTURA</p>
          <h1 id="about-sutura-title" className="mobile-h1 sm:tablet-h1 mb-3 text-balance text-ink">
            A Web-Based Tailoring Shop Tracker System
          </h1>
          <p className="mobile-body-md text-balance font-normal leading-relaxed text-ink-body">
            SUTURA brings Davao City&rsquo;s tailoring shops online. Customers find verified shops by garment and location,
            book a fitting, and follow their order from placement to pickup. Shops run their storefront, staff,
            measurements, orders and reports in one place — instead of a paper ticket pinned to the fabric.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {ABOUT_PILLARS.map(({ Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-sunken">
                <Icon size={22} className="text-taupe" />
              </div>
              <h2 className="mobile-h4 mb-1.5 text-ink">{title}</h2>
              <p className="mobile-body-sm mx-auto max-w-md font-normal leading-relaxed text-ink-body">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 space-y-14 sm:mt-16 sm:space-y-16">
          <AboutObjectives />
          <AboutTeam />
        </div>
      </div>
    </section>
  );
}
