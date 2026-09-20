import { ImageIcon } from 'lucide-react';

/**
 * Stand-in for a real photo until one is shot/sourced — no image
 * generation model is wired into this build, so every hero/banner spot
 * that wants real photography gets this instead of a fabricated image.
 * Deliberately loud (dashed border + explicit label) so it reads as
 * "swap me" during review, not as a finished empty state.
 */
export default function ImagePlaceholder({
  label = 'Image coming soon',
  className = '',
}: {
  readonly label?: string;
  readonly className?: string;
}) {
  return (
    <div
      className={`bg-sunken border border-dashed border-line-strong flex flex-col items-center justify-center gap-2 text-ink-faint ${className}`}
    >
      <ImageIcon size={28} strokeWidth={1.5} />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-center px-4">{label}</span>
    </div>
  );
}
