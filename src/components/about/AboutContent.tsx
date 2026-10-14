import { ABOUT_PILLARS } from '@/components/home/homeTypes';
import PageBrandRow from '@/components/shared/publicNav/PageBrandRow';

export default function AboutContent() {
  return (
    <section aria-labelledby="about-sutura-title" className="border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl mobile-screen-margins py-6 sm:py-14">
        <PageBrandRow className="mb-6" />
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mobile-overline mb-2 uppercase text-taupe">About Sutura</p>
          <h1 id="about-sutura-title" className="mobile-h1 sm:tablet-h1 mb-3 text-balance text-ink">
            A Web-Based Tailoring Store Tracker for Davao City
          </h1>
          <p className="mobile-body-md text-balance font-normal leading-relaxed text-ink-body">
            SUTURA centralizes and digitizes the discoverability and service tracking of tailoring stores within Davao City —
            connecting customers to verified stores by garment specialization and location, while giving them real-time
            visibility into their order from placement to pickup.
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
      </div>
    </section>
  );
}
