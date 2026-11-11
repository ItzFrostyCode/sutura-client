'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

/** The tracking code with a copy icon: one tap copies it and a toast confirms it. */
export default function CopyTrackingCode({ code }: { readonly code: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`Tracking code ${code} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy. Press and hold the code to copy it.');
    }
  };

  return (
    <p className="mobile-caption mt-3 flex items-center gap-1 text-ink-faint">
      Tracking code: <span className="select-all font-mono text-ink-muted">{code}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy tracking code ${code}`}
        title="Copy tracking code"
        className="relative -my-2 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors before:absolute before:-inset-1.5 hover:bg-sunken hover:text-ink"
      >
        {copied ? <Check size={15} className="text-sage" aria-hidden /> : <Copy size={15} aria-hidden />}
      </button>
    </p>
  );
}
