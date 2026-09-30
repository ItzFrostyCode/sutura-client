'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflineScreen() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [dots, setDots] = useState('');

  // Animated ellipsis for the "Checking…" state
  useEffect(() => {
    if (!isRetrying) return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(id);
  }, [isRetrying]);

  const handleRetry = () => {
    setIsRetrying(true);
    // Give the browser a moment to re-evaluate connectivity, then reload.
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setIsRetrying(false);
        setDots('');
      }
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-canvas">
      {/* Subtle radial glow behind the icon */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 40% at 50% 45%, rgba(154,128,115,0.10) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center text-center px-8 max-w-[340px] w-full">
        {/* Icon badge */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 rounded-[28px] bg-sunken border border-line flex items-center justify-center shadow-sm">
            <WifiOff className="w-10 h-10 text-taupe" strokeWidth={1.5} />
          </div>
          {/* Pulse ring */}
          <span
            className="absolute inset-0 rounded-[28px] border border-taupe/25 animate-ping"
            style={{ animationDuration: '2.4s' }}
          />
        </div>

        {/* Headline */}
        <h1 className="mobile-h1 text-ink mb-3">No Internet</h1>

        {/* Body */}
        <p className="mobile-body-sm text-ink-muted leading-relaxed mb-8">
          Sutura can&apos;t reach the server right now. Check your Wi-Fi or mobile
          data and try again.
        </p>

        {/* Retry button */}
        <button
          id="offline-retry-btn"
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="
            inline-flex items-center justify-center gap-2.5
            w-full h-[52px] rounded-xl
            bg-taupe text-white
            text-base font-semibold
            transition-all duration-200
            hover:bg-taupe-hover active:scale-[0.97]
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          <RefreshCw
            className={`w-[18px] h-[18px] ${isRetrying ? 'animate-spin' : ''}`}
            strokeWidth={2}
          />
          {isRetrying ? `Checking${dots}` : 'Try Again'}
        </button>

        {/* Footer hint */}
        <p className="mobile-caption text-ink-faint mt-6">
          Your progress is saved — nothing was lost.
        </p>
      </div>
    </div>
  );
}
