import React from 'react';

export default function BrandLogo({ className = "", iconOnly = false }: { readonly className?: string, readonly iconOnly?: boolean }) {
  const size = iconOnly ? 32 : 40;
  return (
    <div className={`flex items-center justify-center ${className}`} aria-label="SUTURA">
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full bg-linear-to-br from-[#B99A6B] to-[#8A7063] text-white font-serif italic font-bold shrink-0"
      >
        <span style={{ fontSize: size * 0.55 }}>S</span>
      </div>
    </div>
  );
}
