'use client';

import { useState, useEffect } from 'react';
import { getMediaUrl } from '@/lib/media';
import { Store } from 'lucide-react';

interface ShopLogoAvatarProps {
  readonly src?: string | null;
  readonly name: string;
  readonly className?: string;
  readonly textClassName?: string;
}

export default function ShopLogoAvatar({
  src,
  name,
  className = 'w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-[#FAF6F3] shadow-md',
  textClassName = 'text-3xl md:text-4xl font-serif font-bold text-[#8C6B5D]',
}: ShopLogoAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const fullUrl = getMediaUrl(src);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const initial = (name || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className={`relative shrink-0 overflow-hidden flex items-center justify-center bg-[#FAF6F3] ${className}`}>
      {fullUrl && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fullUrl}
          alt=""
          aria-hidden="true"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FAF6F3] to-[#F0EAE3]">
          {initial ? (
            <span className={textClassName}>{initial}</span>
          ) : (
            <Store className="w-1/2 h-1/2 text-[#8C6B5D]" />
          )}
        </div>
      )}
    </div>
  );
}
