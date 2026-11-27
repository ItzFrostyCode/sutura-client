import React from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface AccountProfileCardProps {
  user: { name?: string; email?: string; profile_picture?: string | null } | null;
  roleName: string;
  uploadingAvatar: boolean;
  onAvatarUpload: (file: File) => void;
  isStaffOnly?: boolean;
  staffProfile: { is_available?: boolean } | null;
  togglingAvailability: boolean;
  onToggleAvailability: (available: boolean) => void;
}

export default function AccountProfileCard({
  user,
  roleName,
  uploadingAvatar,
  onAvatarUpload,
  isStaffOnly,
  staffProfile,
  togglingAvailability,
  onToggleAvailability,
}: AccountProfileCardProps) {
  return (
    <div className="space-y-6">
      {/* Avatar + Identity Card */}
      <div className="bg-surface border border-line rounded-2xl p-6 flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#9A8073] to-[#B26959] flex items-center justify-center text-white text-2xl font-bold select-none overflow-hidden">
            {user?.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile_picture}
                alt={user.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border border-line flex items-center justify-center cursor-pointer hover:bg-sunken transition-colors">
            {uploadingAvatar ? (
              <Loader2 size={12} className="animate-spin text-ink-muted" />
            ) : (
              <Camera size={12} className="text-ink-muted" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingAvatar}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onAvatarUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ink truncate">{user?.name}</p>
          <p className="text-sm text-ink-muted truncate">{user?.email}</p>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-sunken text-taupe text-[11px] font-semibold rounded-full capitalize tracking-wide">
            {roleName}
          </span>
        </div>
      </div>

      {/* Availability toggle — staff-only */}
      {isStaffOnly && (
        <div className="bg-surface border border-line rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Available for New Assignments</p>
            <p className="text-xs text-ink-muted mt-0.5">
              Turn off if you&apos;re on leave or out today — the store owner sees this on the Staff
              page, it won&apos;t remove you from jobs already assigned to you.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={staffProfile?.is_available !== false}
            disabled={togglingAvailability}
            onClick={() => onToggleAvailability(!(staffProfile?.is_available !== false))}
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${
              staffProfile?.is_available !== false ? 'bg-taupe' : 'bg-line'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                staffProfile?.is_available !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
