'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import type { ApplicationDocument } from './useApplicationDetail';

const LABELS: Record<string, string> = {
  landmark: 'Shop front photo',
  dti: 'DTI registration',
  tin: 'TIN / BIR 2303',
  barangay: 'Barangay clearance',
  'government-id': 'Government ID',
  receipt: 'Payment receipt',
};

// Verification files live on the server's private disk, so a plain <img
// src> can't load them (no auth header). Fetch as a blob with the admin
// token and preview from an object URL instead.
export default function DocumentTile({ storeId, doc }: { readonly storeId: number; readonly doc: ApplicationDocument }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const label = LABELS[doc.key] ?? `Business permit ${Number(doc.key.split('-')[1] ?? 0) + 1}`;

  useEffect(() => {
    let objectUrl: string | null = null;
    adminApi.get(`/admin/store-applications/${storeId}/documents/${doc.key}`, { responseType: 'blob' })
      .then((res) => { objectUrl = URL.createObjectURL(res.data); setUrl(objectUrl); })
      .catch(() => setFailed(true));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [storeId, doc.key]);

  let preview: React.ReactNode = <Loader2 className="animate-spin text-ink-faint" />;
  if (failed) preview = <p className="px-3 text-center text-xs text-danger">Couldn&apos;t load this file</p>;
  else if (url && doc.type === 'image') preview = <img src={url} alt={label} className="h-full w-full object-cover" />;
  else if (url) preview = <FileText size={36} className="text-ink-muted" />;

  return (
    <figure className="border border-line bg-surface">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-sunken">{preview}</div>
      <figcaption className="flex min-h-12 items-center justify-between gap-2 px-3">
        <span className="truncate text-sm text-ink">{label}</span>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${label}`} className="btn-icon-mobile -mr-3 text-ink-muted hover:text-ink">
            <ExternalLink size={16} />
          </a>
        )}
      </figcaption>
    </figure>
  );
}
