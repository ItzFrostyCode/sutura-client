'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useScrollLock } from '@/hooks/useScrollLock';

/**
 * Full-screen photo viewer (e.g. a payment's receipt image) with a Download
 * and a Close icon. Closes on Esc or a click on the dark backdrop.
 */
export default function ImageViewerModal({ src, title, fileName, onClose }: Readonly<{
  /** Image path or URL; the viewer is open while this is set. */
  src: string | null;
  title?: string;
  /** Saved file name, without extension. */
  fileName?: string;
  onClose: () => void;
}>) {
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const open = !!src;
  useScrollLock(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;
  const url = getMediaUrl(src);

  // Fetch as a blob so the browser saves the file instead of navigating to it
  // (the image lives on the API domain, where a plain download link is ignored).
  // If the fetch is blocked, fall back to opening the image in a new tab.
  const download = async () => {
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const ext = (blob.type.split('/')[1] || url.split('.').pop() || 'jpg').split(/[?#;]/)[0];
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${fileName || 'receipt'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  const iconBtn = 'w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50';

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/90" role="dialog" aria-modal="true" aria-label={title || 'Image'}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 shrink-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={download} disabled={downloading} aria-label="Download image" title="Download" className={iconBtn}>
            {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          </button>
          <button type="button" onClick={onClose} aria-label="Close" title="Close" className={iconBtn}>
            <X size={20} />
          </button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="flex-1 min-h-0 flex items-center justify-center p-4 pt-0 cursor-default"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={title || 'Image'}
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-auto"
        />
      </button>
    </div>,
    document.body
  );
}
