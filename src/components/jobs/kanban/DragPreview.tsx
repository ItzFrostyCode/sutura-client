import React from 'react';
import { createPortal } from 'react-dom';
import KanbanCard from './KanbanCard';
import type { DragState } from './useKanbanDrag';

interface DragPreviewProps {
  readonly drag: DragState | null;
  /** The hook moves this element directly while dragging, so the board doesn't re-render per pixel. */
  readonly previewRef: React.RefObject<HTMLDivElement | null>;
}

/** The lifted copy of the card that follows the pointer (tilted, scaled, deep shadow). */
export default function DragPreview({ drag, previewRef }: DragPreviewProps) {
  if (!drag || typeof document === 'undefined') return null;
  const flying = drag.returning !== null;
  return createPortal(
    <div
      ref={previewRef}
      className="pointer-events-none fixed z-[9999] will-change-[left,top]"
      style={{
        left: flying ? drag.returning!.x : drag.x,
        top: flying ? drag.returning!.y : drag.y,
        width: drag.w,
        transition: flying ? 'left 0.18s ease, top 0.18s ease, opacity 0.18s ease' : undefined,
        opacity: flying ? 0.4 : 0.98,
      }}
    >
      <KanbanCard job={drag.job} preview />
    </div>,
    document.body,
  );
}
