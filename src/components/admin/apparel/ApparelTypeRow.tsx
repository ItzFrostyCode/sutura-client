import Image from 'next/image';
import { Check, Shirt, X } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import { formatDate } from '@/components/admin/useAdminList';
import { getMediaUrl } from '@/lib/media';

export interface ApparelType {
  id: number;
  label: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  designs_count: number;
  store: { id: number; name: string; slug: string } | null;
  reviewer: string | null;
  reviewed_at: string | null;
  created_at: string;
  samples: { id: number; name: string; store: string | null; image_url: string | null }[];
}

const VARIANT = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;

interface ApparelTypeRowProps {
  readonly type: ApparelType;
  readonly onApprove: (type: ApparelType) => void;
  readonly onReject: (type: ApparelType) => void;
}

export default function ApparelTypeRow({ type, onApprove, onReject }: ApparelTypeRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink">“{type.label}”</p>
          <Badge variant={VARIANT[type.status]} className="capitalize">{type.status}</Badge>
        </div>
        <p className="text-sm text-ink-muted">
          First typed by {type.store?.name ?? 'a removed shop'} · {formatDate(type.created_at)} · used on {type.designs_count} {type.designs_count === 1 ? 'design' : 'designs'}
        </p>
        {type.reviewed_at && type.status !== 'pending' && (
          <p className="text-sm text-ink-muted">{type.status === 'approved' ? 'Approved' : 'Rejected'} {type.reviewer ? `by ${type.reviewer} ` : ''}on {formatDate(type.reviewed_at)}</p>
        )}
        {type.rejection_reason && <p className="text-sm text-danger">Rejected: {type.rejection_reason}</p>}

        {type.samples.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-3" aria-label="Designs using this name">
            {type.samples.map((s) => (
              <li key={s.id} className="flex w-44 items-center gap-2">
                <span className="relative flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden bg-sunken">
                  {s.image_url
                    ? <Image src={getMediaUrl(s.image_url)} alt="" fill sizes="40px" className="object-cover" />
                    : <Shirt size={16} className="text-ink-faint" aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{s.name}</span>
                  <span className="block truncate text-xs text-ink-muted">{s.store}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1">
        {type.status !== 'approved' && (
          <button type="button" onClick={() => onApprove(type)} className="inline-flex min-h-11 items-center gap-1.5 bg-ink px-4 text-sm font-semibold text-white">
            <Check size={15} /> Approve
          </button>
        )}
        {type.status !== 'rejected' && (
          <button type="button" onClick={() => onReject(type)} className="inline-flex min-h-11 items-center gap-1.5 border border-line px-4 text-sm text-ink hover:bg-canvas">
            <X size={15} /> Reject
          </button>
        )}
      </div>
    </li>
  );
}
