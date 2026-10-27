'use client';

import { useEffect, useRef, useState } from 'react';
import SuturaLogo from '@/components/brand/SuturaLogo';
import { startStartupLocation, type SavedLocation } from '@/lib/customerLocation';
import { BOOT_CLASS } from '@/lib/bootSplash';

const MIN_SHOW_MS = 700;    // never a jarring one-frame flash
const SKIP_AFTER_MS = 4000; // then offer "Skip for now" (e.g. prompt ignored)
const FADE_MS = 500;

/**
 * Pre-landing splash, shown from the first paint of every full load of the
 * landing page (BOOT_SPLASH_SCRIPT). It waits for the visitor's answer to the
 * browser's location prompt (the countdown doesn't run while it's open), then
 * for the position; after 4 s it offers "Skip for now". Hands the result to
 * the page before fading, so the hero banner already shows the final location
 * when the splash lifts (no layout shift, no late text change).
 */
export default function LocationSplash({ onResolved }: { readonly onResolved: (loc: SavedLocation) => void }) {
  const [leaving, setLeaving] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const skipRef = useRef<() => void>(() => {});
  // Latest callback without re-running detection when the parent re-renders.
  const onResolvedRef = useRef(onResolved);
  useEffect(() => { onResolvedRef.current = onResolved; });

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains(BOOT_CLASS)) return;
    let cancelled = false;

    const startup = startStartupLocation();
    skipRef.current = startup.skip;
    const skipTimer = setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);

    (async () => {
      const [loc] = await Promise.all([
        startup.result,
        new Promise((r) => setTimeout(r, MIN_SHOW_MS)),
      ]);
      clearTimeout(skipTimer);
      if (cancelled) return;
      onResolvedRef.current(loc);
      setLeaving(true);
      setTimeout(() => root.classList.remove(BOOT_CLASS), FADE_MS);
    })();

    return () => { cancelled = true; clearTimeout(skipTimer); };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`boot-splash fixed inset-0 z-[100] flex-col items-center justify-center gap-8 bg-ink px-6 text-center transition-opacity duration-500 ease-out ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <SuturaLogo variant="mark" tone="dark" className="h-20 sm:h-24" />
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-[#E8D9C9] motion-reduce:animate-none"
      />
      <div className="flex max-w-xs flex-col items-center gap-4">
        <p className="text-sm leading-relaxed text-white/75">
          Detecting your location to find tailoring shops near you…
        </p>
        {/* Reserved height, so the text above doesn't jump when the button appears. */}
        <div className="flex min-h-18 flex-col items-center">
          {canSkip && !leaving && (
            <div className="flex flex-col items-center gap-1 animate-in fade-in duration-300">
              <p className="text-xs text-white/55">If your browser is asking, choose “Allow”.</p>
              <button
                type="button"
                onClick={() => skipRef.current()}
                className="min-h-11 px-4 text-sm font-semibold text-[#E8D9C9] underline underline-offset-4 hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8D9C9]"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
