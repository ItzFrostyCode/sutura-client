'use client';

import { useState } from 'react';
import { getMediaUrl } from '@/lib/media';
import type { NotificationSender } from '@/lib/notificationHelpers';

const SIZES = {
  sm: 'w-8 h-8 rounded-xl text-xs',
  md: 'w-10 h-10 rounded-xl text-sm',
} as const;

/**
 * The sender's face on a notification: their profile picture or shop logo
 * when they have one, the SUTURA mark for platform news, else their initial.
 * A picture that fails to load falls back to the initial.
 */
export default function NotificationAvatar({ sender, size = 'md' }: {
  readonly sender: NotificationSender;
  readonly size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const src = sender.isPlatform ? '/icon.svg' : getMediaUrl(sender.avatar);
  const box = `${SIZES[size]} shrink-0 overflow-hidden border border-line bg-canvas shadow-2xs`;

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user uploads come from several hosts
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${box} ${sender.isPlatform ? 'object-contain p-1.5 bg-surface' : 'object-cover'}`}
      />
    );
  }

  return (
    <div className={`${box} flex items-center justify-center font-black text-taupe`} aria-hidden="true">
      {sender.initial}
    </div>
  );
}
