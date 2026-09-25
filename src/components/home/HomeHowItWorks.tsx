import { HOW_IT_WORKS } from './homeTypes';

// 5-card grid (icon, step label, title, description) — one card per real
// stage in the thesis's own approved Order Tracking and Measurement
// sequence (search → order+pay → store approval → production → fitting/
// pickup), not a generic icon list. Mirrors the "5 Easy Steps" editorial
// rhythm without inventing or compressing away any step the approved
// diagrams call out.
export default function HomeHowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title" className="max-w-7xl mx-auto mobile-screen-margins mt-10 sm:mt-14">
      <div className="text-center mb-6 sm:mb-8">
        <p className="mobile-overline sm:tablet-overline text-taupe mb-1">How SUTURA Works</p>
        <h2 id="how-it-works-title" className="mobile-h2 sm:tablet-h2 text-ink">
          From Search to Pickup
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6">
        {HOW_IT_WORKS.map(({ step, Icon, title, desc }) => (
          <div key={step} className="flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-sunken border border-line flex items-center justify-center text-taupe mb-3">
              <Icon size={24} />
            </div>
            <p className="text-[11px] font-semibold text-ink-faint tracking-wider mb-1">STEP {step}</p>
            <h3 className="mobile-h4 sm:tablet-h4 text-ink mb-1.5">{title}</h3>
            <p className="mobile-body-sm sm:tablet-body-sm text-ink-body font-normal leading-relaxed max-w-[220px]">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
