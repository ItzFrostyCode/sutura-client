'use client';

import { useEffect, useState } from 'react';
import { getMediaUrl } from '@/lib/media';

/** The signed-in admin's photo, or their initial when there is none (or it fails to load). */
export default function AdminAvatar({ name, src, className = 'h-9 w-9 text-xs' }: Readonly<{
  name?: string | null;
  src?: string | null;
  className?: string;
}>) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  const initial = (name ?? 'A').trim().charAt(0).toUpperCase() || 'A';

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink font-bold text-white shadow-2xs ${className}`}>
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getMediaUrl(src)} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
