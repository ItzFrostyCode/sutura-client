'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

/** One frame height for every chart count, so the card never grows or shrinks. */
export const CHART_FRAME = 'h-[340px] sm:h-[420px]';
/** Shorter frame for a chart inside a form (e.g. the order's Person card). */
export const CHART_FRAME_COMPACT = 'h-64 sm:h-72';

/**
 * Reference chart images in one fixed-size frame: the whole image, contained,
 * with previous / next arrows and a "1 / 2" counter laid over it when there is
 * more than one. Used by the owner's editor and the customer's size guide, so
 * both look the same and neither changes height with the number of charts.
 */
export default function ChartImageViewer({
  images,
  index,
  onIndexChange,
  label = 'Reference chart',
  compact = false,
}: Readonly<{
  compact?: boolean;
  images: string[];
  /** Controlled index (the editor needs it to know which chart Replace/Remove act on). */
  index?: number;
  onIndexChange?: (i: number) => void;
  label?: string;
}>) {
  const [own, setOwn] = useState(0);
  const count = images.length;
  const current = Math.min(index ?? own, Math.max(0, count - 1));
  const go = (i: number) => {
    const next = (i + count) % count;
    if (onIndexChange) onIndexChange(next);
    else setOwn(next);
  };
  if (count === 0) return null;
  const src = images[current];
  const arrow = 'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/90 border border-line text-ink shadow-sm flex items-center justify-center hover:bg-surface focus-visible:outline-2 focus-visible:outline-taupe cursor-pointer';

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={count > 1 ? `${label}s, ${current + 1} of ${count}` : label}
      onKeyDown={(e) => {
        if (count < 2) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
      }}
      className={`relative w-full ${compact ? CHART_FRAME_COMPACT : CHART_FRAME} border border-line bg-canvas overflow-hidden`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={src} src={src} alt={count > 1 ? `${label} ${current + 1} of ${count}` : label} className="w-full h-full object-contain" />

      {count > 1 && (
        <>
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-ink/75 text-white text-[11px] font-semibold tabular-nums" aria-hidden="true">
            {current + 1} / {count}
          </span>
          <button type="button" onClick={() => go(current - 1)} aria-label="Previous chart" className={`${arrow} left-2`}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => go(current + 1)} aria-label="Next chart" className={`${arrow} right-2`}>
            <ChevronRight size={18} />
          </button>
        </>
      )}

      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open this chart full size"
        title="Open full size"
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface/90 border border-line text-ink-muted hover:text-ink flex items-center justify-center"
      >
        <Maximize2 size={14} />
      </a>
    </div>
  );
}
