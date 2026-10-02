import { Check, ExternalLink, X } from 'lucide-react';
import Badge from '@/components/shared/Badge';
import { formatDate } from '@/components/admin/useAdminList';

export interface PendingBranch {
  id: number;
  name: string;
  is_main: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_note: string | null;
  address: string;
  barangay: string | null;
  district: string | null;
  city: string;
  landmark: string | null;
  latitude: string | null;
  longitude: string | null;
  map_url: string | null;
  created_at: string;
  store: { id: number; name: string; slug: string };
  owner: { name: string; email: string } | null;
}

const VARIANT = { pending: 'warning', verified: 'success', rejected: 'danger' } as const;

interface BranchRowProps {
  readonly branch: PendingBranch;
  readonly onVerify: (branch: PendingBranch) => void;
  readonly onReject: (branch: PendingBranch) => void;
}

export default function BranchRow({ branch, onVerify, onReject }: BranchRowProps) {
  const place = [branch.address, branch.barangay, branch.district, branch.city].filter(Boolean).join(', ');
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-ink">{branch.store.name} · {branch.name}</p>
          {branch.is_main && <Badge>Main branch</Badge>}
          <Badge variant={VARIANT[branch.verification_status]} className="capitalize">{branch.verification_status}</Badge>
        </div>
        <p className="text-sm text-ink-body">{place}</p>
        {branch.landmark && <p className="text-sm text-ink-muted">Landmark: {branch.landmark}</p>}
        <p className="text-sm text-ink-muted">
          {branch.owner?.name} · {branch.owner?.email} · added {formatDate(branch.created_at)}
          {branch.latitude && branch.longitude && ` · ${Number(branch.latitude).toFixed(5)}, ${Number(branch.longitude).toFixed(5)}`}
        </p>
        {branch.verification_note && <p className="text-sm text-danger">Rejected: {branch.verification_note}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1">
        {branch.map_url && (
          <a href={branch.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 px-3 text-sm text-ink underline underline-offset-2">
            <ExternalLink size={15} /> Check pin
          </a>
        )}
        {branch.verification_status !== 'verified' && (
          <button type="button" onClick={() => onVerify(branch)} className="inline-flex min-h-11 items-center gap-1.5 bg-ink px-4 text-sm font-semibold text-white">
            <Check size={15} /> Verify
          </button>
        )}
        {branch.verification_status !== 'rejected' && (
          <button type="button" onClick={() => onReject(branch)} className="inline-flex min-h-11 items-center gap-1.5 px-3 text-sm text-danger hover:bg-danger/5">
            <X size={15} /> Reject
          </button>
        )}
      </div>
    </li>
  );
}
