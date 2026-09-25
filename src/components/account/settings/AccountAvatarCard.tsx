import Image from 'next/image';
import { User as UserIcon, Mail, Camera, Loader2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

interface AccountAvatarCardProps {
  user: {
    name: string;
    email: string;
    profile_picture?: string | null;
  };
  uploadingAvatar: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarClick: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AccountAvatarCard({
  user,
  uploadingAvatar,
  fileInputRef,
  onAvatarClick,
  onAvatarChange,
}: Readonly<AccountAvatarCardProps>) {
  return (
    <div className="bg-surface border border-line p-5 flex flex-col items-center text-center mb-4">
      <button
        type="button"
        onClick={onAvatarClick}
        disabled={uploadingAvatar}
        className="relative w-16 h-16 rounded-full bg-sunken overflow-hidden shrink-0 group focus:outline-none focus:ring-2 focus:ring-taupe"
        title="Change photo"
      >
        {user.profile_picture ? (
          <Image
            src={getMediaUrl(user.profile_picture)}
            alt=""
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserIcon size={28} className="text-ink-faint" />
          </div>
        )}
        <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          {uploadingAvatar ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Camera size={18} className="text-white" />
          )}
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onAvatarChange}
        className="hidden"
      />

      <div className="min-w-0 mt-3">
        <h2 className="mobile-h3 font-semibold text-ink truncate leading-snug">{user.name}</h2>
        <p className="mobile-caption text-ink-muted flex items-center justify-center gap-1.5 mt-0.5 truncate font-normal">
          <Mail size={13} className="shrink-0 text-ink-faint" /> {user.email}
        </p>
      </div>
    </div>
  );
}
