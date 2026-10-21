'use client';

import { useState, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

/** A photo that tells you when its file is gone, instead of a broken-image icon. Opens full size in a new tab; `children` sit on its corner. */
export default function PhotoThumb({ url, alt, className = 'h-24 w-24', children }: Readonly<{ url: string; alt: string; className?: string; children?: ReactNode }>) {
  const [failed, setFailed] = useState(false);
  const frame = 'flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-espresso/[0.08] bg-espresso/[0.04]';
  return (
    <div className={`relative shrink-0 ${className}`}>
      {failed ? (
        <div className={`${frame} flex-col gap-1 px-1 text-center text-[11px] text-ink-faint`} title="This photo’s file is missing from storage">
          <ImageOff size={18} />
          <span>Photo not found</span>
        </div>
      ) : (
        <a href={getMediaUrl(url)} target="_blank" rel="noopener noreferrer" className={frame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getMediaUrl(url)} alt={alt} onError={() => setFailed(true)} className="h-full w-full object-cover" />
        </a>
      )}
      {children}
    </div>
  );
}
