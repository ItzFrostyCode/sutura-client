'use client';

import { Suspense, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useFullPage } from '@/hooks/useFullPage';
import { useGarmentWork, type GarmentWorkState } from '@/components/garment-work/useGarmentWork';
import GarmentWorkForm from '@/components/garment-work/GarmentWorkForm';
import GarmentWorkSummary from '@/components/garment-work/GarmentWorkSummary';
import GarmentWorkPlaced from '@/components/garment-work/GarmentWorkPlaced';
import { peso } from '@/components/service-order/orderMath';
import { Alert } from '@/components/service-order/orderUi';

const Spinner = () => (
  <div className="flex min-h-dvh items-center justify-center bg-canvas"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>
);

function SendButton({ w, full = false }: Readonly<{ w: GarmentWorkState; full?: boolean }>) {
  return (
    <button type="button" onClick={w.submit} disabled={w.busy}
      className={`flex h-[52px] items-center justify-center gap-2 rounded-xl bg-ink px-5 text-base font-semibold text-white disabled:opacity-60 ${full ? 'w-full' : 'flex-1'}`}>
      {w.busy && <Loader2 size={18} className="animate-spin" aria-hidden />}
      {w.busy ? 'Sending…' : w.copy.submit}
    </button>
  );
}

/** Repair, alteration or embroidery on the customer's own garment: one page, itemized service price, paid at pick-up. */
function GarmentWorkContent({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  const { store_id: storeId } = use(params);
  // A flow always fills the whole window, even when it was opened inside the search map's panel.
  useFullPage();
  const w = useGarmentWork(storeId);

  if (w.loading) return <Spinner />;
  if (w.placed) return <GarmentWorkPlaced w={w} />;
  if (!w.service) {
    return (
      <main className="mobile-screen-margins flex min-h-dvh flex-col items-center justify-center bg-canvas text-center">
        <h1 className="mobile-h2 text-ink">This service can&apos;t be requested right now</h1>
        <p className="mobile-body-sm mt-1 text-ink-muted">The shop may have paused it. Its other services are still open.</p>
        <Link href={`/store/${storeId}?tab=services`} className="mt-6 flex h-12 items-center rounded-xl bg-ink px-5 text-base font-semibold text-white">See the shop&apos;s services</Link>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas pb-32 lg:pb-12">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mobile-screen-margins mx-auto flex h-14 max-w-5xl items-center gap-2">
          <button type="button" onClick={() => w.router.back()} aria-label="Back" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-sunken">
            <ArrowLeft size={20} />
          </button>
          <p className="min-w-0 truncate text-base font-semibold text-ink">{w.storeName || w.service.name}</p>
        </div>
      </header>

      <main className="mobile-screen-margins mx-auto max-w-5xl pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
        <div className="min-w-0 space-y-8">
          <div className="space-y-2">
            <p className="mobile-overline text-ink-muted">{w.service.name}</p>
            <h1 className="mobile-h1 text-ink">{w.copy.title}</h1>
            <p className="mobile-body-md text-ink-muted">{w.copy.intro}</p>
          </div>
          <GarmentWorkForm w={w} />
          <div className="lg:hidden"><GarmentWorkSummary w={w} /></div>
          {w.error && <Alert>{w.error}</Alert>}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <GarmentWorkSummary w={w} />
            <SendButton w={w} full />
          </div>
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="mx-auto flex max-w-[599px] items-center gap-3 border-x border-t border-line bg-surface px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] min-[481px]:px-6">
          <div className="min-w-0">
            <p className="mobile-caption text-ink-muted">Pay at pick-up</p>
            <p className="truncate text-lg font-bold tabular-nums text-ink">{w.quoted ? 'Quoted' : `${w.startingPrice && w.subtotal ? 'from ' : ''}${peso(w.subtotal)}`}</p>
          </div>
          <SendButton w={w} />
        </div>
      </div>
    </div>
  );
}

export default function GarmentWorkPage({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  return (
    <Suspense fallback={<Spinner />}>
      <GarmentWorkContent params={params} />
    </Suspense>
  );
}
