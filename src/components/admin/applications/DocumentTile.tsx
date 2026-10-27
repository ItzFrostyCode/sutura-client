'use client';

import { useEffect, useState } from 'react';
import { FileText, Loader2, Maximize2 } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import DocumentPreviewModal from './DocumentPreviewModal';
import type { ApplicationDocument } from './useApplicationDetail';

const LABELS: Record<string, string> = {
  landmark: 'Shop front photo',
  dti: 'DTI registration',
  tin: 'TIN / BIR 2303',
  barangay: 'Barangay clearance',
  'government-id': 'Government ID',
  receipt: 'Payment receipt',
};

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf',
};

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Verification files live on the server's private disk, so a plain <img
// src> can't load them (no auth header). Fetch as a blob with the admin
// token and preview from an object URL instead. Clicking the card opens it
// in DocumentPreviewModal rather than a new tab.
export default function DocumentTile({ storeId, storeName, doc }: { readonly storeId: number; readonly storeName: string; readonly doc: ApplicationDocument }) {
  const [file, setFile] = useState<{ url: string; blob: Blob } | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const label = LABELS[doc.key] ?? `Business permit ${Number(doc.key.split('-')[1] ?? 0) + 1}`;

  useEffect(() => {
    let objectUrl: string | null = null;
    adminApi.get(`/admin/store-applications/${storeId}/documents/${doc.key}`, { responseType: 'blob' })
      .then((res) => { objectUrl = URL.createObjectURL(res.data); setFile({ url: objectUrl, blob: res.data }); })
      .catch(() => setFailed(true));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [storeId, doc.key]);

  let preview: React.ReactNode = <Loader2 className="animate-spin text-ink-faint" />;
  if (failed) preview = <p className="px-3 text-center text-xs text-danger">Couldn&apos;t load this file</p>;
  else if (file && doc.type === 'image') preview = <img src={file.url} alt={label} className="h-full w-full object-cover" />;
  else if (file) preview = <FileText size={36} className="text-ink-muted" />;

  const ext = file ? EXTENSIONS[file.blob.type] ?? (doc.type === 'pdf' ? 'pdf' : 'jpg') : '';
  const fileName = `${slug(storeName)}-${slug(label)}.${ext}`;

  return (
    <figure className="border-2 border-line-strong bg-surface">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!file}
        aria-label={`Preview ${label}`}
        className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-sunken cursor-zoom-in disabled:cursor-default"
      >
        {preview}
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
        <DocumentPreviewModal title={label} url={file.url} blob={file.blob} type={doc.type} fileName={fileName} onClose={() => setOpen(false)} />
      )}
    </figure>
  );
}
