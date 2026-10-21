import React from 'react';
import SuturaLogo from '@/components/brand/SuturaLogo';
import SuturaMark from '@/components/brand/SuturaMark';

interface BrandLogoProps {
  readonly className?: string;
  readonly iconOnly?: boolean;
}

export default function BrandLogo({ className = '', iconOnly = false }: BrandLogoProps) {
  if (iconOnly) {
    return (
      <div className={`flex items-center justify-center shrink-0 ${className}`} aria-label="SUTURA">
        <SuturaMark detail="small" halo="var(--surface, #FFFFFF)" className="h-8 w-8 text-espresso" />
      </div>
    );
  }

  return (
    <div className={`flex items-center shrink-0 ${className}`} aria-label="SUTURA">
      <SuturaLogo detail="small" halo="var(--surface, #FFFFFF)" className="h-7 w-auto text-espresso sm:h-8" />
    </div>
  );
}
