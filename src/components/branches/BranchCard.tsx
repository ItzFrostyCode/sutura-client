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
}

export default function BranchCard({ branch, onEdit, onDelete }: Readonly<BranchCardProps>) {
  const { shop } = useAuthStore();
  const publicProfileUrl = shop?.slug && branch.slug ? `/shop/${shop.slug}?branch=${branch.slug}` : '#';

  return (
    <div className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden hover:border-[#D1C7BD] hover:shadow-md transition-all duration-200 flex flex-col">
      {branch.guide_image_url && (
        <div className="relative h-32 w-full bg-[#FAF6F3] overflow-hidden border-b border-[#EBE6E0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={branch.guide_image_url} alt={`${branch.name} location guide`} className="w-full h-full object-cover" />
        </div>
      )}
      {/* Card Header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F0EAE3] rounded-xl shrink-0">
              <Building2 className="w-5 h-5 text-taupe" />
            </div>
            <div>
              <h3 className="font-bold text-[#2D2A26] leading-tight">{branch.name}</h3>
              {branch.is_main && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#BCA89F] uppercase tracking-wider mt-0.5">
                  <Star size={10} className="fill-current" /> Main Branch
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={branch.status} />
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex items-start gap-2 text-sm text-[#524A44]">
            <MapPin className="w-4 h-4 text-[#A8A19A] shrink-0 mt-0.5" />
            <span>
              {branch.address}, {branch.city}
            </span>
          </div>
          {branch.landmark && (
            <div className="flex items-start gap-2 text-xs text-[#827A73]">
              <MapPin className="w-3.5 h-3.5 text-[#BCA89F] shrink-0 mt-0.5" />
              <span>Landmark: {branch.landmark}</span>
            </div>
          )}
          {branch.contact_number && (
            <div className="flex items-center gap-2 text-sm text-[#524A44]">
              <Phone className="w-4 h-4 text-[#A8A19A] shrink-0" />
              <span>{branch.contact_number}</span>
            </div>
          )}
          {branch.operating_hours && (
            <div className="flex items-center gap-2 text-sm text-[#524A44]">
              <Clock className="w-4 h-4 text-[#A8A19A] shrink-0" />
              <span>{branch.operating_hours}</span>
            </div>
          )}
          {branch.latitude && branch.longitude && (
            <div className="flex items-center gap-2 text-xs text-[#A8A19A]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                {Number.parseFloat(branch.latitude).toFixed(4)}, {Number.parseFloat(branch.longitude).toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-[#FAF6F3]/60 px-5 py-3 border-t border-[#EBE6E0] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#827A73]">
            <Users size={13} />
            {branch.staff_profiles_count ?? 0} Staff
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#827A73]">
            <Briefcase size={13} />
            {branch.job_orders_count ?? 0} Orders
          </div>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={publicProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Preview Customer View"
            className="p-1.5 text-[#A8A19A] hover:text-taupe transition-colors rounded"
          >
            <Eye size={15} />
          </a>
          <a
            href={getMapUrl(branch)}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Map"
            className="p-1.5 text-[#A8A19A] hover:text-taupe transition-colors rounded"
          >
            <ExternalLink size={15} />
          </a>
          <button
            onClick={() => onEdit(branch)}
            title="Edit Branch"
            className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] transition-colors rounded"
          >
            <Pencil size={15} />
          </button>
          {!branch.is_main && (
            <button
              onClick={() => onDelete(branch.id)}
              title="Delete Branch"
              className="p-1.5 text-[#A8A19A] hover:text-red-500 transition-colors rounded"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
