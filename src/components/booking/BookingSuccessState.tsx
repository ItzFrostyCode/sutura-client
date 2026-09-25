'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import BookingHeader from './BookingHeader';

interface BookingSuccessStateProps {
  readonly storeId: string;
  readonly storeName?: string;
}

export default function BookingSuccessState({ storeId, storeName }: BookingSuccessStateProps) {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col bg-canvas text-ink">
      <BookingHeader onBack={() => router.push(`/store/${storeId}?tab=catalog`)} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface p-8 rounded-2xl text-center border border-line">
          <div className="w-16 h-16 bg-sage/20 text-sage rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-ink-muted mb-8 text-sm">
            Your appointment request has been sent to {storeName || 'the store'}. They will review and confirm your slot shortly.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/store/${storeId}?tab=catalog`)}
            className="w-full bg-sunken hover:bg-line text-ink font-medium py-3 rounded-lg transition-colors cursor-pointer text-sm"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
