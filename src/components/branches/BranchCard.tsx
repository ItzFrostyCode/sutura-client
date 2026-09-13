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
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { ShopBranch, StatusBadge, getMapUrl } from './branchHelpers';

interface BranchCardProps {
  readonly branch: ShopBranch;
  readonly onEdit: (branch: ShopBranch) => void;
  readonly onDelete: (id: number) => void;
  readonly onSetMain?: (branch: ShopBranch) => void;
}

export default function BranchCard({ branch, onEdit, onDelete, onSetMain }: Readonly<BranchCardProps>) {
  const { shop } = useAuthStore();
  const publicProfileUrl = shop?.slug && branch.slug ? `/shop/${shop.slug}?branch=${branch.slug}` : '#';

  return (
    <div className={`bg-surface border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col ${
      branch.is_main ? 'border-taupe/60 ring-1 ring-taupe/20' : 'border-line hover:border-line-strong'
    }`}>
      {branch.guide_image_url && (
        <div className="relative h-32 w-full bg-canvas overflow-hidden border-b border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={branch.guide_image_url} alt={`${branch.name} location guide`} className="w-full h-full object-cover" />
        </div>
      )}
      {/* Card Header */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${branch.is_main ? 'bg-taupe/15 text-taupe' : 'bg-sunken text-ink-muted'}`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-ink leading-tight truncate">{branch.name}</h3>
                {branch.is_main ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-taupe uppercase tracking-wider mt-0.5">
                    <Star size={10} className="fill-taupe" /> Primary Headquarters
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-muted mt-0.5 block">Satellite Branch</span>
                )}
              </div>
            </div>
            <StatusBadge status={branch.status} />
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-start gap-2 text-sm text-ink-body">
              <MapPin className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
              <span>
                {branch.address}, {branch.city}
              </span>
            </div>
            {branch.landmark && (
              <div className="flex items-start gap-2 text-xs text-ink-muted">
                <MapPin className="w-3.5 h-3.5 text-taupe shrink-0 mt-0.5" />
                <span>Landmark: {branch.landmark}</span>
              </div>
            )}
            {branch.contact_number && (
              <div className="flex items-center gap-2 text-sm text-ink-body">
                <Phone className="w-4 h-4 text-ink-faint shrink-0" />
                <span>{branch.contact_number}</span>
              </div>
            )}
            {branch.operating_hours && (
              <div className="flex items-center gap-2 text-sm text-ink-body">
                <Clock className="w-4 h-4 text-ink-faint shrink-0" />
                <span>{branch.operating_hours}</span>
              </div>
            )}
            {branch.latitude && branch.longitude && (
              <div className="flex items-center gap-2 text-xs text-ink-faint">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {Number.parseFloat(branch.latitude).toFixed(4)}, {Number.parseFloat(branch.longitude).toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Branch Manager Section */}
        <div className="mt-4 pt-3 border-t border-line/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Branch Manager</span>
            {branch.manager?.role && (
              <span className="text-[10px] font-medium capitalize text-taupe bg-taupe/10 px-1.5 py-0.5 rounded">
                {branch.manager.role.replaceAll('_', ' ')}
              </span>
            )}
          </div>
          {branch.manager?.user ? (
            <div className="flex items-center gap-2.5">
              {branch.manager.user.profile_picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branch.manager.user.profile_picture}
                  alt={branch.manager.user.name}
                  className="w-7 h-7 rounded-full object-cover border border-line shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-taupe/20 text-taupe flex items-center justify-center font-bold text-xs shrink-0">
                  {branch.manager.user.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink truncate">{branch.manager.user.name}</p>
                <p className="text-[11px] text-ink-muted truncate">
                  {branch.manager.user.phone || branch.manager.user.email}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-faint italic">No manager assigned</p>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-canvas/60 px-5 py-3 border-t border-line flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted" title="Assigned Staff">
            <Users size={13} />
            {branch.staff_profiles_count ?? 0} Staff
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted" title="Active Job Orders">
            <Briefcase size={13} />
            {branch.job_orders_count ?? 0} Orders
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!branch.is_main && onSetMain && (
            <button
              type="button"
              onClick={() => onSetMain(branch)}
              title="Promote to Main Branch"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-taupe bg-taupe/10 hover:bg-taupe hover:text-white rounded-md transition-colors mr-1"
            >
              <Star size={12} className="fill-current" />
              Set as Main
            </button>
          )}
          <a
            href={publicProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview Customer View"
            className="p-1.5 text-ink-faint hover:text-taupe transition-colors rounded"
          >
            <Eye size={15} />
          </a>
          <a
            href={getMapUrl(branch)}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Map"
            className="p-1.5 text-ink-faint hover:text-taupe transition-colors rounded"
          >
            <ExternalLink size={15} />
          </a>
          <button
            type="button"
            onClick={() => onEdit(branch)}
            title="Edit Branch"
            className="p-1.5 text-ink-faint hover:text-ink transition-colors rounded"
          >
            <Pencil size={15} />
          </button>
          {!branch.is_main && (
            <button
              type="button"
              onClick={() => onDelete(branch.id)}
              title="Delete Branch"
              className="p-1.5 text-ink-faint hover:text-red-500 transition-colors rounded"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
