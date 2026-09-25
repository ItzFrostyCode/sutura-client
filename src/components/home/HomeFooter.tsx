import Link from 'next/link';
import { MapPin } from 'lucide-react';

export default function HomeFooter() {
  return (
    <footer className="bg-ink border-t border-ink">
      <div className="max-w-7xl mx-auto mobile-screen-margins py-8">
        <div className="mb-6">
          <span className="font-serif font-bold text-xl text-white">SUTURA</span>
          <p className="mobile-body-sm text-white/60 mt-1.5 leading-relaxed mb-6 font-normal">
            A Web-Based Tailoring Store Tracker System for Davao City.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="mobile-overline sm:tablet-overline text-white font-semibold uppercase tracking-wider mb-2.5">
                Discover
              </p>
              <ul className="space-y-1">
                <li>
                  <Link href="/search" className="mobile-body-sm text-white/60 hover:text-white min-h-[36px] flex items-center font-normal">
                    Search Stores
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="mobile-body-sm text-white/60 hover:text-white min-h-[36px] flex items-center font-normal">
                    Browse Map
                  </Link>
                </li>
                <li>
                  <Link href="/track" className="mobile-body-sm text-white/60 hover:text-white min-h-[36px] flex items-center font-normal">
                    Track an Order
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mobile-overline sm:tablet-overline text-white font-semibold uppercase tracking-wider mb-2.5">
                Account
              </p>
              <ul className="space-y-1">
                <li>
                  <Link href="/login" className="mobile-body-sm text-white/60 hover:text-white min-h-[36px] flex items-center font-normal">
                    Log In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="mobile-body-sm text-white/60 hover:text-white min-h-[36px] flex items-center font-normal">
                    Register a Store
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mobile-overline sm:tablet-overline text-white font-semibold uppercase tracking-wider mb-2.5">
                About
              </p>
              <ul className="space-y-1">
                <li>
                  <a href="#about" className="mobile-body-sm text-white/60 hover:text-white min-h-[36px] flex items-center font-normal">
                    About Sutura
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="mobile-caption text-white/40 font-normal">© {new Date().getFullYear()} SUTURA. All rights reserved.</p>
          <div className="flex items-center gap-1.5 mobile-caption text-white/40 font-normal">
            <MapPin size={13} className="text-taupe" /> Davao City, Philippines
          </div>
        </div>
      </div>
    </footer>
  );
}
