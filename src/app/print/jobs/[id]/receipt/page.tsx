'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintAuthGuard } from '@/hooks/usePrintAuthGuard';
import type { Job } from '@/components/jobs/jobTypes';
import { AcknowledgementReceipt } from '@/components/print/receipt/AcknowledgementReceipt';
import { StatementOfAccount } from '@/components/print/receipt/StatementOfAccount';
import { RECEIPT_CSS } from '@/components/print/receipt/ReceiptParts';
import { receiptFigures, singleFigures } from '@/components/print/receipt/receiptMath';

const Message = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <div className="flex min-h-screen items-center justify-center bg-white"><p className="text-sm text-black">{children}</p></div>
);

export default function PaymentReceiptPage() {
  return (
    <Suspense fallback={<Message>Preparing receipt...</Message>}>
      <PaymentReceiptContent />
    </Suspense>
  );
}

// Printed by the system from the order's own data: `?payment=ID` is that payment's acknowledgement receipt,
// otherwise the order's statement of account. Printed as a till slip (72mm column), black ink only.
function PaymentReceiptContent() {
  usePrintAuthGuard();
  const { id } = useParams<{ id: string }>();
  const paymentId = Number(useSearchParams().get('payment')) || null;
  const { store } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id || !id) return;
    api.get(`/stores/${store.id}/jobs/${id}`)
      .then((res) => { setJob(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [store?.id, id]);

  useEffect(() => {
    if (!loading && job) setTimeout(() => window.print(), 400);
  }, [loading, job]);

  if (loading) return <Message>Preparing receipt...</Message>;
  if (!job) return <Message>Job not found.</Message>;

  const figures = receiptFigures(job);
  const single = paymentId ? singleFigures(job, figures, paymentId) : null;
  if (paymentId && !single) return <Message>Payment not found.</Message>;

  // globals.css prints only #receipt-print-area, so the slip must live inside it.
  return (
    <>
      <style>{RECEIPT_CSS}</style>
      <div id="receipt-print-area">
        {single
          ? <AcknowledgementReceipt job={job} store={store} figures={figures} single={single} />
          : <StatementOfAccount job={job} store={store} figures={figures} />}
      </div>
    </>
  );
}
