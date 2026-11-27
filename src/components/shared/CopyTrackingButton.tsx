'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyTrackingButton({ code }: Readonly<{ code: string }>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable (e.g. insecure context); fail silently.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Tracking code copied' : `Copy tracking code ${code}`}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-line bg-surface hover:bg-sunken text-xs font-semibold text-ink transition-colors duration-150 active:scale-[0.97] cursor-pointer shrink-0"
    >
      {copied ? (
        <>
          <Check size={13} className="text-sage" />
          <span className="text-sage">Copied</span>
        </>
      ) : (
        <>
          <Copy size={13} className="text-ink-muted" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
