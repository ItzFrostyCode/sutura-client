import { ChevronRight, Loader2 } from 'lucide-react';
import { type EditableField } from './useAccountDetail';

interface AccountRowsListProps {
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
  uploadingAvatar: boolean;
  onAvatarClick: () => void;
  onOpenSheet: (field: EditableField) => void;
}

export default function AccountRowsList({
  user,
  uploadingAvatar,
  onAvatarClick,
  onOpenSheet,
}: Readonly<AccountRowsListProps>) {
  return (
    <div>
      <p className="mobile-overline text-ink-faint mb-2 ml-1">Account</p>
      <div className="bg-surface border border-line overflow-hidden divide-y divide-line">
        {/* My Profile */}
        <button
          type="button"
          onClick={onAvatarClick}
          disabled={uploadingAvatar}
          className="mobile-nav-row w-full flex items-center gap-3 px-4 hover:bg-canvas transition-colors text-left"
        >
          <span className="flex-1 mobile-body-md font-normal text-ink">My Profile</span>
          {uploadingAvatar ? (
            <Loader2 size={16} className="text-ink-faint animate-spin" />
          ) : (
            <ChevronRight size={16} className="text-ink-faint" />
          )}
        </button>

        {/* Name */}
        <button
          type="button"
          onClick={() => onOpenSheet('name')}
          className="mobile-nav-row w-full flex items-center gap-3 px-4 hover:bg-canvas transition-colors text-left"
        >
          <span className="flex-1 mobile-body-md font-normal text-ink">Name</span>
          <span className="mobile-body-sm text-ink-muted font-normal">{user.name}</span>
          <ChevronRight size={16} className="text-ink-faint" />
        </button>

        {/* Phone */}
        <button
          type="button"
          onClick={() => onOpenSheet('phone')}
          className="mobile-nav-row w-full flex items-center gap-3 px-4 hover:bg-canvas transition-colors text-left"
        >
          <span className="flex-1 mobile-body-md font-normal text-ink">Phone</span>
          <span className="mobile-body-sm text-ink-muted font-normal">{user.phone || 'Not set'}</span>
          <ChevronRight size={16} className="text-ink-faint" />
        </button>

        {/* Email */}
        <button
          type="button"
          onClick={() => onOpenSheet('email')}
          className="mobile-nav-row w-full flex items-center gap-3 px-4 hover:bg-canvas transition-colors text-left"
        >
          <span className="flex-1 mobile-body-md font-normal text-ink">Email</span>
          <span className="mobile-body-sm text-ink-muted truncate max-w-[140px] font-normal">{user.email}</span>
          <ChevronRight size={16} className="text-ink-faint" />
        </button>

        {/* Change Password */}
        <button
          type="button"
          onClick={() => onOpenSheet('password')}
          className="mobile-nav-row w-full flex items-center gap-3 px-4 hover:bg-canvas transition-colors text-left"
        >
          <span className="flex-1 mobile-body-md font-normal text-ink">Change Password</span>
          <ChevronRight size={16} className="text-ink-faint" />
        </button>
      </div>
    </div>
  );
}
