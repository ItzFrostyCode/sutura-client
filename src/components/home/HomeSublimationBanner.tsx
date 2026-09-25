import Image from 'next/image';
import Link from 'next/link';

export default function HomeSublimationBanner() {
  return (
    <section className="relative h-[340px] sm:h-[440px] lg:h-[500px] mt-8 sm:mt-12 overflow-hidden border-b border-line">
      <Image
        src="/images/tailor_at_work.jpg"
        alt="Custom Sublimation Team & Sports Apparel"
        fill
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/55 to-ink/30 flex flex-col items-center justify-center text-center mobile-screen-margins">
        <p className="mobile-overline sm:tablet-overline text-white/80 mb-2 uppercase tracking-wider">
          For Teams, Schools &amp; Organizations
        </p>
        <h2 className="mobile-h2 sm:tablet-h2 text-white mb-4 max-w-sm sm:max-w-xl drop-shadow-xs">
          Custom Sublimation &amp; Sports Apparel
        </h2>
        <Link
          href="/search?q=sublimation"
          className="min-h-[44px] h-[48px] px-7 bg-white text-ink text-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center rounded-xl active:scale-95 cursor-pointer shadow-md"
        >
          Browse Sublimation
        </Link>
      </div>
    </section>
  );
}
