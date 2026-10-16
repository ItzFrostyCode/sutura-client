import Link from 'next/link';
import { MapPin, Map as MapIcon, Scissors } from 'lucide-react';
import SpinningPin from './SpinningPin';
import { NEARBY_KM, type GatePhase } from './useLocationGate';

const CHOOSE_ON_MAP = '/map?select=1&returnTo=/&continueTo=/';
const primary = 'flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-taupe-dark px-6 text-base font-semibold text-white transition-colors hover:bg-nav-bar active:opacity-80';
const secondary = 'flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-line-strong px-6 text-base font-medium text-taupe-dark transition-colors hover:border-taupe-dark';

interface LocationGateProps {
  readonly phase: Exclude<GatePhase, 'done'>;
  readonly denied: boolean;
  readonly farKm: number | null;
  readonly onRetry: () => void;
  readonly onEnter: () => void;
}

/** The landing page's main panel while it finds the visitor: the spinning pin, a permission ask, or "too far". */
export default function LocationGate({ phase, denied, farKm, onRetry, onEnter }: LocationGateProps) {
  return (
    <main className="mobile-screen-margins flex flex-1 flex-col items-center justify-center py-12 text-center">
      {phase === 'pinpointing' || phase === 'finding' ? (
        <>
          <h1 className="sr-only">Find a tailor in Davao City</h1>
          <SpinningPin />
          <p role="status" aria-live="polite" className="mt-6 text-xl font-semibold text-ink sm:text-2xl">
            {phase === 'pinpointing' ? 'Pinpointing your location…' : 'Finding tailoring shops…'}
          </p>
        </>
      ) : phase === 'permission' ? (
        <>
          <MapPin size={64} strokeWidth={1.75} className="text-taupe-dark" aria-hidden />
          <h1 className="mobile-h1 mt-6 text-ink">{denied ? 'Location Is Blocked' : 'Location Permission Required'}</h1>
          <p className="mobile-body-md mt-3 max-w-md text-ink-muted">
            {denied
              ? 'Location is turned off for SUTURA in your browser settings. Turn it on there, or choose your area on the map to see tailoring shops near you.'
              : 'SUTURA needs your location to show tailoring shops near you and how far each one is.'}
          </p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            {denied ? (
              <>
                <Link href={CHOOSE_ON_MAP} className={primary}><MapIcon size={18} aria-hidden />Choose on map</Link>
                <button type="button" onClick={onRetry} className={secondary}>Try again</button>
              </>
            ) : (
              <>
                <button type="button" onClick={onRetry} className={primary}>Allow Location / Retry</button>
                <Link href={CHOOSE_ON_MAP} className={secondary}><MapIcon size={18} aria-hidden />Choose on map</Link>
              </>
            )}
            <button type="button" onClick={onEnter} className="h-11 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              Skip for now
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-sunken" aria-hidden>
            <Scissors size={40} strokeWidth={1.75} className="text-nav-bar" />
          </span>
          <h1 className="mobile-h1 mt-6 text-ink">No Tailoring Shops Nearby</h1>
          <p className="mobile-body-md mt-3 max-w-md text-ink-muted">
            Nothing within {NEARBY_KM} km of you. SUTURA lists tailoring shops in Davao City — you can still look around and search them on the map.
          </p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <button type="button" onClick={onEnter} className={primary}>
              <MapPin size={18} aria-hidden />
              Nearest is {farKm !== null ? farKm.toFixed(1) : '—'} km · Show anyway
            </button>
            <Link href="/search" className={secondary}><MapIcon size={18} aria-hidden />Search shops on the map</Link>
          </div>
        </>
      )}
    </main>
  );
}
