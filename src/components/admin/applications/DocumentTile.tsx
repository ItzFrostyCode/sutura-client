'use client';

import { useEffect, useState } from 'react';
import { Eye, FileText, Loader2, Maximize2 } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import Badge from '@/components/shared/Badge';
import { formatDate } from '@/components/admin/useAdminList';
import DocumentPreviewModal from './DocumentPreviewModal';
import type { ApplicationDocument } from './useApplicationDetail';

const LABELS: Record<string, string> = {
  landmark: 'Shop front photo',
  dti: 'DTI registration',
  tin: 'TIN / BIR 2303',
  barangay: 'Barangay clearance',
  'government-id': 'Government ID',
  selfie: 'Selfie with ID',
  receipt: 'Payment receipt',
};

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf',
};

/** Where this document stands in the current change-request round. */
export type DocumentStatus = 'requested' | 'replaced' | 'unchanged' | null;

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const labelFor = (key: string) => LABELS[key] ?? `Business permit ${Number(key.split('-')[1] ?? 0) + 1}`;

type LoadedFile = { url: string; blob: Blob };

// Verification files live on the server's private disk, so a plain <img
// src> can't load them (no auth header). Fetch as a blob with the admin
// token and preview from an object URL instead.
function useDocumentFile(storeId: number, key: string, previous = false) {
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    adminApi.get(`/admin/store-applications/${storeId}/documents/${key}`, {
      responseType: 'blob',
      params: previous ? { version: 'previous' } : undefined,
    })
      .then((res) => { objectUrl = URL.createObjectURL(res.data); setFile({ url: objectUrl, blob: res.data }); })
      .catch(() => setFailed(true));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [storeId, key, previous]);

  return { file, failed };
}

/**
 * Documents that carry personal details (IDs, TIN, clearances, receipts…).
 * Their thumbnails stay blurred; the clear file only shows in the viewer.
 * The shop front photo is a public storefront picture, so it isn't masked.
 */
const isSensitive = (key: string) => key !== 'landmark';

function Preview({ file, failed, type, alt, className = '', masked = false }: {
  readonly file: LoadedFile | null; readonly failed: boolean; readonly type: 'image' | 'pdf'; readonly alt: string;
  readonly className?: string; readonly masked?: boolean;
}) {
  if (failed) return <p className="px-3 text-center text-xs text-danger">Couldn&apos;t load this file</p>;
  if (!file) return <Loader2 className="animate-spin text-ink-faint" />;
  // scale-110 keeps the blur from showing soft, see-through edges inside the frame.
  if (type === 'image') return <img src={file.url} alt={alt} className={`h-full w-full object-cover ${masked ? 'scale-110 blur-md' : ''} ${className}`} />;
  return <FileText size={36} className={`text-ink-muted ${className}`} />;
}

/** Dark veil + "View Document" over a masked thumbnail (a visual mask only). */
function ViewOverlay() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors duration-200 group-hover:bg-ink/45">
      <span className="flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition-transform duration-200 group-hover:scale-105">
        <Eye size={14} aria-hidden="true" /> View Document
      </span>
    </span>
  );
}

function fileNameFor(storeName: string, label: string, file: LoadedFile | null, type: 'image' | 'pdf', suffix = '') {
  const ext = file ? EXTENSIONS[file.blob.type] ?? (type === 'pdf' ? 'pdf' : 'jpg') : '';
  return `${slug(storeName)}-${slug(label)}${suffix}.${ext}`;
}

const STATUS_BADGE: Record<Exclude<DocumentStatus, null>, React.ReactNode> = {
  requested: <Badge variant="warning">Change requested</Badge>,
  replaced: <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Replaced</Badge>,
  unchanged: <Badge variant="neutral">Unchanged</Badge>,
};

/**
 * One verification document. Clicking it opens DocumentPreviewModal rather
 * than a new tab. When the owner re-uploaded it, it shows the replaced file
 * next to the new one (Before / After), each zoomable on its own.
 */
export default function DocumentTile({ storeId, storeName, doc, status = null }: {
  readonly storeId: number; readonly storeName: string; readonly doc: ApplicationDocument; readonly status?: DocumentStatus;
}) {
  if (status === 'replaced' && doc.previous) {
    return <CompareTile storeId={storeId} storeName={storeName} doc={doc} />;
  }
  return <SingleTile storeId={storeId} storeName={storeName} doc={doc} status={status} />;
}

function SingleTile({ storeId, storeName, doc, status }: {
  readonly storeId: number; readonly storeName: string; readonly doc: ApplicationDocument; readonly status: DocumentStatus;
}) {
  const { file, failed } = useDocumentFile(storeId, doc.key);
  const [open, setOpen] = useState(false);
  const label = labelFor(doc.key);
  const masked = isSensitive(doc.key) && doc.type === 'image';

  return (
    <figure className={`admin-card overflow-hidden ${status === 'requested' ? 'border-amber-300!' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!file}
        aria-label={`Preview ${label}`}
        className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-sunken cursor-zoom-in disabled:cursor-default"
      >
        <Preview file={file} failed={failed} type={doc.type} alt={label} masked={masked} />
        {masked && file && <ViewOverlay />}
        {status && <span className="absolute left-2 top-2">{STATUS_BADGE[status]}</span>}
      </button>
      <figcaption className="flex min-h-12 items-center justify-between gap-2 px-3">
        <span className="truncate text-sm text-ink">{label}</span>
        {file && (
          <button type="button" onClick={() => setOpen(true)} aria-label={`Preview ${label}`}
            className="btn-icon-mobile -mr-3 text-ink-muted hover:text-ink cursor-pointer">
            <Maximize2 size={16} aria-hidden="true" />
          </button>
        )}
      </figcaption>

      {open && file && (
        <DocumentPreviewModal title={label} url={file.url} blob={file.blob} type={doc.type}
          fileName={fileNameFor(storeName, label, file, doc.type)} onClose={() => setOpen(false)} />
      )}
    </figure>
  );
}

function CompareTile({ storeId, storeName, doc }: { readonly storeId: number; readonly storeName: string; readonly doc: ApplicationDocument }) {
  const label = labelFor(doc.key);
  const previous = doc.previous!;

  return (
    <figure className="col-span-2 admin-card overflow-hidden">
      <figcaption className="flex min-h-12 items-center justify-between gap-2 border-b border-line px-3">
        <span className="truncate text-sm font-semibold text-ink">{label}</span>
        {STATUS_BADGE.replaced}
      </figcaption>
      <div className="grid grid-cols-2 gap-3 p-3">
        <ComparePane storeId={storeId} storeName={storeName} docKey={doc.key} label={label} version="before"
          type={previous.type} caption={`Uploaded ${formatDate(previous.uploaded_at, true)}`} />
        <ComparePane storeId={storeId} storeName={storeName} docKey={doc.key} label={label} version="after"
          type={doc.type} caption={`Re-uploaded ${formatDate(doc.uploaded_at, true)}`} />
      </div>
    </figure>
  );
}

function ComparePane({ storeId, storeName, docKey, label, version, type, caption }: {
  readonly storeId: number; readonly storeName: string; readonly docKey: string; readonly label: string;
  readonly version: 'before' | 'after'; readonly type: 'image' | 'pdf'; readonly caption: string;
}) {
  const before = version === 'before';
  const { file, failed } = useDocumentFile(storeId, docKey, before);
  const masked = isSensitive(docKey) && type === 'image';
  const [open, setOpen] = useState(false);
  const title = `${label} — ${before ? 'Before' : 'After (New)'}`;

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!file}
        aria-label={`Preview ${title}`}
        className={`group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-sunken cursor-zoom-in disabled:cursor-default ${
          before ? '' : 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-surface'
        }`}
      >
        <Preview file={file} failed={failed} type={type} alt={title} className={before ? 'opacity-60 grayscale' : ''} masked={masked} />
        {masked && file && <ViewOverlay />}
        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white ${before ? 'bg-ink/75' : 'bg-emerald-600'}`}>
          {before ? 'Before' : 'After (New)'}
        </span>
      </button>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`truncate text-xs tabular-nums ${before ? 'text-ink-muted' : 'font-medium text-ink'}`}>{caption}</span>
        {file && (
          <button type="button" onClick={() => setOpen(true)} aria-label={`Preview ${title}`}
            className="btn-icon-mobile -mr-3 shrink-0 text-ink-muted hover:text-ink cursor-pointer">
            <Maximize2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && file && (
        <DocumentPreviewModal title={title} url={file.url} blob={file.blob} type={type}
          fileName={fileNameFor(storeName, label, file, type, before ? '-before' : '')} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
