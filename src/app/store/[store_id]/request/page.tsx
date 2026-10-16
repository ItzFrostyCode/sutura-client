'use client';

import { Suspense, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderRequest } from '@/components/order-request/useOrderRequest';
import OrderRequestForm from '@/components/order-request/OrderRequestForm';

export default function OrderRequestPage({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <OrderRequestContent params={params} />
    </Suspense>
  );
}

function OrderRequestContent({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  const { store_id: storeId } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const form = useOrderRequest(storeId, search.get('service_id'));
  const here = `/store/${storeId}/request${search.toString() ? `?${search.toString()}` : ''}`;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-50 flex h-12 items-center justify-center border-b border-line bg-surface">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="touch-target-44 absolute left-2 flex items-center justify-center text-ink-muted"><ArrowLeft size={20} /></button>
        <h1 className="mobile-h4 text-ink">Request an order</h1>
      </header>

      <main className="mobile-screen-margins mx-auto w-full max-w-[599px] flex-1 py-6">
        {form.loading && <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-ink-faint" /></div>}

        {!form.loading && !isAuthenticated && (
          <div className="py-10 text-center">
            <p className="mobile-body-md text-ink">Sign in to send a request, so the shop can reach you.</p>
            <Link href={`/login?redirect=${encodeURIComponent(here)}`} className="mt-4 inline-flex h-[52px] items-center rounded-full bg-ink px-8 text-base font-semibold text-white">Sign in</Link>
          </div>
        )}

        {!form.loading && isAuthenticated && form.sent && (
          <div className="py-10 text-center">
            <CheckCircle2 size={40} className="mx-auto text-sage" />
            <p className="mobile-h3 mt-3 text-ink">Request sent</p>
            <p className="mobile-body-sm mt-1 text-ink-body">Order {form.sent.order_number}. The shop will look at it and send you a price.</p>
            <button type="button" onClick={() => router.push(`/account/orders/${form.sent?.id}`)} className="mt-5 h-[52px] rounded-full bg-ink px-8 text-base font-semibold text-white">See my order</button>
          </div>
        )}

        {!form.loading && isAuthenticated && !form.sent && <OrderRequestForm form={form} />}
      </main>
    </div>
  );
}
