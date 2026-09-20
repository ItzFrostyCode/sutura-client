'use client';

import { useState, useEffect } from 'react';
import { getMediaUrl } from '@/lib/media';
import { Store } from 'lucide-react';

interface ShopLogoAvatarProps {
  readonly src?: string | null;
  readonly name: string;
  readonly className?: string;
  readonly containerClassName?: string;
  readonly textClassName?: string;
  /**
   * When provided, renders a green (true) or red (false) dot on the
   * bottom-right corner of the avatar — the shop's open/closed status.
   * Pass `undefined` to hide the dot entirely.
   */
  readonly isOpen?: boolean;
}

export default function ShopLogoAvatar({
  src,
  name,
  className = 'w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-[#FAF6F3] shadow-md',
  containerClassName = '',
  textClassName = 'text-3xl md:text-4xl font-serif font-bold text-[#8C6B5D]',
  isOpen,
}: ShopLogoAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const fullUrl = getMediaUrl(src);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const initial = (name || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className={`relative inline-flex shrink-0 ${containerClassName}`}>
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

      {/* Online / Offline status dot — rendered when isOpen is a boolean.
          Positioned at the bottom-right of the avatar with high z-index and white border. */}
      {isOpen !== undefined && (
        <span
          aria-label={isOpen ? 'Online · Open now' : 'Offline · Closed now'}
          title={isOpen ? 'Online · Open now' : 'Offline · Closed now'}
          className={`absolute bottom-0 right-0 z-20 w-4 h-4 md:w-4.5 md:h-4.5 rounded-full border-2 border-white shadow-md transition-all ${
            isOpen ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
          }`}
        >
          {isOpen && (
            <span className="absolute inset-0 rounded-full bg-[#22c55e] animate-ping opacity-75" />
          )}
        </span>
      )}
    </div>
  );
}
