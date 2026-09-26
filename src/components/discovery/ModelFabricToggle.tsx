'use client';

import React from 'react';
import { Shirt, Sparkles } from 'lucide-react';

interface ModelFabricToggleProps {
  readonly showFabric: boolean;
  readonly setShowFabric: (v: boolean | ((prev: boolean) => boolean)) => void;
  readonly className?: string;
  readonly size?: 'sm' | 'md';
}

export default function ModelFabricToggle({
  showFabric,
  setShowFabric,
  className = '',
  size = 'md',
}: ModelFabricToggleProps) {
  const isSm = size === 'sm';

  return (
    <div
      role="group"
      aria-label="Toggle between Model and Fabric swatch views"
      className={`inline-flex items-center p-0.5 bg-sunken/80 border border-line rounded-full shrink-0 select-none shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setShowFabric(false)}
        className={`flex items-center gap-1.5 rounded-full transition-all cursor-pointer ${
          isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${
          !showFabric
            ? 'bg-surface text-ink font-bold shadow-xs border border-line/60'
            : 'text-ink-muted hover:text-ink font-medium border border-transparent'
        }`}
      >
        <Shirt size={isSm ? 11 : 13} className={!showFabric ? 'text-ink' : 'text-ink-faint'} />
        <span>Model</span>
      </button>

      <button
        type="button"
        onClick={() => setShowFabric(true)}
        className={`flex items-center gap-1.5 rounded-full transition-all cursor-pointer ${
          isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
        } ${
          showFabric
            ? 'bg-surface text-ink font-bold shadow-xs border border-line/60'
            : 'text-ink-muted hover:text-ink font-medium border border-transparent'
        }`}
      >
        <Sparkles size={isSm ? 11 : 13} className={showFabric ? 'text-taupe' : 'text-ink-faint'} />
        <span>Fabric</span>
      </button>
    </div>
  );
}
