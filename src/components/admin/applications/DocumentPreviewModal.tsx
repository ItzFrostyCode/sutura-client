'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, Save, X } from 'lucide-react';

interface DocumentPreviewModalProps {
  readonly title: string;
  /** Object URL of the fetched file (private disk — never a public link). */
  readonly url: string;
  readonly blob: Blob;
  readonly type: 'image' | 'pdf';
  /** "feng-tailoring-shop-dti-registration.pdf" */
  readonly fileName: string;
  readonly onClose: () => void;
}

type SavePicker = (opts: { suggestedName: string; types?: { description: string; accept: Record<string, string[]> }[] }) => Promise<{
  createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
}>;

function downloadBlob(url: string, fileName: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * A verification document, previewed over the application page instead of
 * a new tab. Save asks where to keep it (the browser's "Save as" window, when
 * it has one); Download drops it straight into Downloads. Esc, the ✕, or a
 * click on the dimmed backdrop closes it.
 */
export default function DocumentPreviewModal({ title, url, blob, type, fileName, onClose }: DocumentPreviewModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const save = async () => {
    const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
    if (!picker) return downloadBlob(url, fileName); // Firefox / Safari: same as Download
    try {
      const ext = fileName.slice(fileName.lastIndexOf('.'));
      const handle = await picker({
        suggestedName: fileName,
        types: [{ description: title, accept: { [blob.type || 'application/octet-stream']: [ext] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch {
      /* the admin cancelled the Save window */
    }
  };

  const iconButton = 'flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-taupe cursor-pointer';

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="doc-preview-title">
      <button type="button" aria-label="Close preview" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-black/70" />

      <div className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden bg-surface shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-line py-2 pl-4 pr-2">
          <h2 id="doc-preview-title" className="min-w-0 truncate font-semibold text-ink">{title}</h2>
          <div className="flex shrink-0 items-center gap-0.5">
            <button type="button" onClick={() => void save()} aria-label={`Save ${title}`} title="Save" className={iconButton}>
              <Save size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => downloadBlob(url, fileName)} aria-label={`Download ${title}`} title="Download" className={iconButton}>
              <Download size={18} aria-hidden="true" />
            </button>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" title="Close" className={iconButton}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-sunken p-2 sm:p-4">
          {type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={title} className="max-h-[85vh] max-w-full object-contain" />
          ) : (
            <iframe src={url} title={title} className="h-[85vh] w-full border-0 bg-white" />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
