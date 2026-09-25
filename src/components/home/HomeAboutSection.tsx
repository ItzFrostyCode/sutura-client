import { ABOUT_PILLARS } from './homeTypes';

export default function HomeAboutSection() {
  return (
    <section id="about" aria-labelledby="about-sutura-title" className="bg-surface border-b border-line mt-0">
      <div className="max-w-7xl mx-auto mobile-screen-margins py-12 sm:py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="mobile-overline text-taupe mb-2 uppercase">About Sutura</p>
          <h2 id="about-sutura-title" className="mobile-h2 text-ink mb-3 text-balance">
            A Web-Based Tailoring Store Tracker for Davao City
          </h2>
          <p className="mobile-body-md text-ink-body font-normal leading-relaxed text-balance">
            SUTURA centralizes and digitizes the discoverability and service tracking of tailoring stores within Davao City —
            connecting customers to verified stores by garment specialization and location, while giving them real-time
            visibility into their order from placement to pickup.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
          {ABOUT_PILLARS.map(({ Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center mx-auto mb-3 border border-line">
                <Icon size={22} className="text-taupe" />
              </div>
              <h3 className="mobile-h4 text-ink mb-1.5">{title}</h3>
              <p className="mobile-body-sm text-ink-body font-normal leading-relaxed max-w-md mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
