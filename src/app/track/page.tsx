'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package } from 'lucide-react';

export default function TrackLandingPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-surface border-b border-line px-4 h-[50px] flex items-center justify-center relative">
        <button
          type="button"
          onClick={() => router.push('/')}
          aria-label="Back"
          className="absolute left-4 p-1 text-ink-muted"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold text-ink">Track Order</h1>
      </div>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-sunken flex items-center justify-center mx-auto mb-5">
            <Package size={24} className="text-taupe" />
          </div>
          <h1 className="text-display text-2xl text-ink mb-2">Track Your Order</h1>
          <p className="text-sm text-ink-muted mb-8">
            Enter the tracking code given to you at the shop counter to check your garment&apos;s progress.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. TNED8K2P"
              className="w-full px-4 py-3 bg-surface border border-line rounded-lg text-sm text-ink text-center tracking-widest font-medium uppercase focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors"
              maxLength={12}
            />
            <button
              type="submit"
              disabled={!code.trim()}
              className="w-full px-4 py-3 bg-taupe hover:bg-taupe-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Track Order
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
