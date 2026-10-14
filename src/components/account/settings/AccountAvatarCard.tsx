import Image from 'next/image';
import { User as UserIcon, Camera, Loader2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

interface AccountAvatarCardProps {
  user: {
    name: string;
    email: string;
    profile_picture?: string | null;
  };
  uploadingAvatar: boolean;
  /** Shown under the email when the last upload failed (the edit sheet, which used to hold it, is not open then). */
  error?: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarClick: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** The profile photo, with an edit box in its corner (always visible — a hover hint would never show on a phone) so it is clear it can be changed. */
export default function AccountAvatarCard({
  user,
  uploadingAvatar,
  error,
  fileInputRef,
  onAvatarClick,
  onAvatarChange,
}: Readonly<AccountAvatarCardProps>) {
  return (
    <div className="card-soft mb-4 flex flex-col items-center px-5 py-6 text-center">
      <button
        type="button"
        onClick={onAvatarClick}
        disabled={uploadingAvatar}
        aria-label="Change photo"
        title="Change photo"
        className="relative h-24 w-24 shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-line-strong"
      >
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken">
          {user.profile_picture ? (
            <Image src={getMediaUrl(user.profile_picture)} alt="" fill className="object-cover" />
          ) : (
            <UserIcon size={36} className="text-ink-faint" />
          )}
        </span>
        <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-[11px] border-2 border-surface bg-ink text-white">
          {uploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        </span>
      </button>

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatarChange} className="hidden" />

      <div className="mt-4 min-w-0 max-w-full">
        <h2 className="mobile-h3 truncate text-ink">{user.name}</h2>
        <p className="mobile-caption mt-0.5 truncate text-ink-muted">{user.email}</p>
        {error && <p className="mobile-caption mt-2 text-danger">{error}</p>}
      </div>
    </div>
  );
}
