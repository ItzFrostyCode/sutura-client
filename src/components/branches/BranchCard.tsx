import Link from 'next/link';
import { formatAddress } from '@/lib/formatAddress';
import React from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Users,
  Briefcase,
  ExternalLink,
  Pencil,
  Trash2,
  Star,
  Eye,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { StoreBranch, StatusBadge, getMapUrl } from './branchHelpers';

interface BranchCardProps {
  readonly branch: StoreBranch;
  readonly onEdit: (branch: StoreBranch) => void;
  readonly onDelete?: (id: number) => void;
  readonly onSetMain?: (branch: StoreBranch) => void;
}

export default function BranchCard({ branch, onEdit, onDelete, onSetMain }: Readonly<BranchCardProps>) {
  const { store } = useAuthStore();
  const publicProfileUrl = store?.slug && branch.slug ? `/store/${store.slug}?branch=${branch.slug}` : '#';

  return (
    <div
      className={`bg-surface border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-xs group ${
        branch.is_main
          ? 'border-taupe/40 ring-1 ring-taupe/15'
          : 'border-line hover:border-line-strong'
      }`}
    >
      {branch.guide_image_url && (
        <div className="relative h-36 w-full bg-canvas overflow-hidden border-b border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={branch.guide_image_url}
            alt={`${branch.name}`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Header row: Icon + Name + Badges */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${
                  branch.is_main ? 'bg-taupe/10 text-taupe' : 'bg-sunken text-ink-muted'
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-ink leading-tight truncate">
                  {branch.name}
                </h3>
                {branch.is_main ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-taupe mt-0.5">
                    <Star size={10} className="fill-taupe" /> Main location
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-muted mt-0.5 block">Branch location</span>
                )}
              </div>
            </div>
            <StatusBadge status={branch.status} />
          </div>

          {branch.verification_status === 'pending' && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-xs text-amber-800">
              Awaiting location check before appearing on customer map.
            </p>
          )}
          {branch.verification_status === 'rejected' && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50/80 px-2.5 py-1.5 text-xs text-red-800">
              Needs adjustment: {branch.verification_note}. Update and save to resubmit.
            </p>
          )}

          {/* Details list */}
          <div className="space-y-2 text-xs sm:text-sm text-ink-body">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-ink-faint shrink-0 mt-0.5" />
              <span className="line-clamp-2">{formatAddress(branch)}</span>
            </div>
            {branch.landmark && (
              <p className="text-[11px] text-ink-muted pl-5">Near {branch.landmark}</p>
            )}
            {branch.contact_number && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Phone className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                <span>{branch.contact_number}</span>
              </div>
            )}
            {branch.operating_hours && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                <span>{branch.operating_hours}</span>
              </div>
            )}
          </div>
        </div>

        {/* Manager Row */}
        <div className="pt-3 border-t border-line/60">
          {branch.manager?.user ? (
            <div className="flex items-center gap-2.5">
              {branch.manager.user.profile_picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branch.manager.user.profile_picture}
                  alt={branch.manager.user.name}
                  className="w-6 h-6 rounded-full object-cover border border-line shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-taupe/15 text-taupe flex items-center justify-center font-bold text-[10px] shrink-0">
                  {branch.manager.user.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink truncate">{branch.manager.user.name}</p>
                <p className="text-[10px] text-ink-muted">Branch manager</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <User size={13} className="shrink-0" />
              <span>No manager assigned yet</span>
              {onSetMain && (
                <Link
                  href={`/dashboard/branches/${branch.id}/manager`}
                  className="ml-1 text-xs font-semibold text-taupe underline underline-offset-2 hover:text-taupe/80 transition-colors"
                >
                  Assign one
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-canvas/40 px-4 py-2.5 border-t border-line flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <Users size={12} className="text-ink-faint" />
            {branch.staff_profiles_count ?? 0} staff
          </span>
          <span className="text-ink-faint">•</span>
          <span className="flex items-center gap-1">
            <Briefcase size={12} className="text-ink-faint" />
            {branch.job_orders_count ?? 0} orders
          </span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {!branch.is_main && onSetMain && (
            <button
              type="button"
              onClick={() => onSetMain(branch)}
              title="Make this your main branch"
              className="text-[11px] font-medium text-taupe hover:text-ink px-2 py-1 rounded-md hover:bg-surface transition-colors mr-1"
            >
              Set as main
            </button>
          )}
          <a
            href={publicProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview customer view"
            className="p-1.5 text-ink-faint hover:text-ink hover:bg-surface rounded-md transition-colors"
          >
            <Eye size={15} />
          </a>
          <a
            href={getMapUrl(branch)}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Maps"
            className="p-1.5 text-ink-faint hover:text-ink hover:bg-surface rounded-md transition-colors"
          >
            <ExternalLink size={15} />
          </a>
          <button
            type="button"
            onClick={() => onEdit(branch)}
            title="Edit branch"
            className="p-1.5 text-ink-faint hover:text-ink hover:bg-surface rounded-md transition-colors"
          >
            <Pencil size={15} />
          </button>
          {!branch.is_main && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(branch.id)}
              title="Delete branch"
              className="p-1.5 text-ink-faint hover:text-red-600 hover:bg-surface rounded-md transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
