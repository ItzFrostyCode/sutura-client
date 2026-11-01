import type { useBottomSheet } from './useBottomSheet';

type Sheet = ReturnType<typeof useBottomSheet>;

const LABEL: Record<Sheet['snap'], string> = { peek: 'Show more', half: 'Show more', full: 'Show less' };

/**
 * The grab bar at the top of the sheet. Drag it to resize, tap it to step up (and back down from full), or use the arrow
 * keys. It replaces the old "^" arrow and the expand button; the 44px area is the touch target, the bar is only 5px.
 */
export default function SheetHandle({ sheet }: { readonly sheet: Sheet }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${LABEL[sheet.snap]}. Drag to resize the panel.`}
      {...sheet.handleProps}
      className="relative flex h-7 shrink-0 cursor-grab touch-none items-center justify-center before:absolute before:inset-x-0 before:-inset-y-2 active:cursor-grabbing lg:hidden"
    >
      <span aria-hidden className="h-1.5 w-10 rounded-full bg-line-strong" />
    </div>
  );
}
