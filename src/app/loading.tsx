import SuturaLogo from '@/components/brand/SuturaLogo';

// Shown by Next.js while a page loads: the Tailor Pin on the canvas colour,
// breathing gently (still for visitors who prefer reduced motion).
export default function Loading() {
  return (
    <div role="status" aria-label="Loading SUTURA" className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-5 bg-canvas">
      <SuturaLogo variant="mark" title="" className="h-20 animate-pulse motion-reduce:animate-none" />
      <p className="text-sm text-ink-muted">Loading…</p>
    </div>
  );
}
