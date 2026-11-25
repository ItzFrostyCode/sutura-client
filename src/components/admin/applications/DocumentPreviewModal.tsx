'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Minimize2, Save, X, ZoomIn, ZoomOut } from 'lucide-react';

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

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const STEP = 0.5;

/**
 * The full, unblurred document. Zoom with the − / + buttons, the mouse wheel,
 * double-click, or the + / − / 0 keys; when zoomed in, drag to move around.
 */
function ZoomableImage({ url, title }: { readonly url: string; readonly title: string }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const setZoomClamped = useCallback((next: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 100) / 100));
    setZoom(z);
    if (z === 1) setPan({ x: 0, y: 0 }); // back to fit: re-centre
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') setZoomClamped(zoom + STEP);
      else if (e.key === '-' || e.key === '_') setZoomClamped(zoom - STEP);
      else if (e.key === '0') setZoomClamped(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoom, setZoomClamped]);

  const zoomButton = 'flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-sunken hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-sunken">
      <div
        className={`flex h-[80vh] items-center justify-center overflow-hidden select-none ${zoom > 1 ? (drag.current ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}
        onWheel={(e) => setZoomClamped(zoom + (e.deltaY < 0 ? STEP : -STEP))}
        onDoubleClick={() => setZoomClamped(zoom > 1 ? 1 : 2)}
        onPointerDown={(e) => {
          if (zoom === 1) return;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPan({ x: drag.current.panX + (e.clientX - drag.current.x) / zoom, y: drag.current.panY + (e.clientY - drag.current.y) / zoom });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={title}
          draggable={false}
          style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
          className="max-h-full max-w-full object-contain p-2 sm:p-4 transition-transform duration-150 ease-out"
        />
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-line bg-surface/95 p-1 shadow-md">
        <button type="button" onClick={() => setZoomClamped(zoom - STEP)} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out" title="Zoom out (−)" className={zoomButton}>
          <ZoomOut size={17} aria-hidden="true" />
        </button>
        <span className="w-12 text-center text-xs font-semibold tabular-nums text-ink" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoomClamped(zoom + STEP)} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in (+)" className={zoomButton}>
          <ZoomIn size={17} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setZoomClamped(1)} disabled={zoom === 1} aria-label="Fit to screen" title="Fit (0)" className={zoomButton}>
          <Minimize2 size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
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

        {type === 'image' ? (
          <ZoomableImage url={url} title={title} />
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-sunken p-2 sm:p-4">
            {/* The browser's PDF viewer has its own zoom. */}
            <iframe src={url} title={title} className="h-[85vh] w-full border-0 bg-white" />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
