import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { Job } from '../jobHelpers';

export interface DragState {
  job: Job;
  fromCol: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Set when the card is flying back to where it came from. */
  returning: { x: number; y: number } | null;
}

export interface HoverState {
  laneId: string;
  colId: string;
  /** Where the drop slot goes among the column's cards; -1 = no slot (same column or refused). */
  index: number;
  refused: boolean;
}

interface Press {
  job: Job;
  colId: string;
  pointerId: number;
  startX: number;
  startY: number;
  offX: number;
  offY: number;
  rect: DOMRect;
  started: boolean;
}

interface Options {
  /** True when moving a card from `fromCol` into `colId` would break that column's WIP limit. */
  isFull: (colId: string, fromCol: string) => boolean;
  onDrop: (job: Job, toCol: string) => void;
  onOpen: (job: Job) => void;
  boardRef: RefObject<HTMLElement | null>;
}

const sameHover = (a: HoverState | null, b: HoverState | null) =>
  a === b || (!!a && !!b && a.laneId === b.laneId && a.colId === b.colId && a.index === b.index && a.refused === b.refused);

/**
 * Mouse/pen drag for the Kanban cards: the dragged card lifts and follows the pointer, the target
 * column shows a drop slot, a full column refuses with a shake, and a bad drop flies back.
 * Touch is left alone so phones keep scrolling; they use the card's "Move to" menu instead.
 */
export function useKanbanDrag({ isFull, onDrop, onOpen, boardRef }: Options) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const press = useRef<Press | null>(null);
  const hoverRef = useRef<HoverState | null>(null);
  const previewEl = useRef<HTMLDivElement | null>(null);

  const resetBody = () => {
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };
  useEffect(() => resetBody, []);

  const findTarget = useCallback((x: number, y: number, fromCol: string): HoverState | null => {
    const col = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-kanban-col]');
    if (!col || col.dataset.collapsed === 'true') return null;
    const colId = col.dataset.colId ?? '';
    const laneId = col.dataset.laneId ?? 'unified';
    if (colId === fromCol) return { laneId, colId, index: -1, refused: false };
    if (isFull(colId, fromCol)) return { laneId, colId, index: -1, refused: true };
    const cards = Array.from(col.querySelectorAll<HTMLElement>('[data-kanban-card]')).filter((c) => c.dataset.dragging !== 'true');
    let index = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { index = i; break; }
    }
    return { laneId, colId, index, refused: false };
  }, [isFull]);

  const finish = (e: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
    const p = press.current;
    if (!p || p.pointerId !== e.pointerId) return;
    press.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    resetBody();
    if (!p.started) {
      if (!cancelled) onOpen(p.job);
      return;
    }
    const h = hoverRef.current;
    hoverRef.current = null;
    setHover(null);
    if (!cancelled && h && !h.refused && h.index >= 0) {
      setDrag(null);
      onDrop(p.job, h.colId);
      return;
    }
    if (!cancelled && h?.refused) {
      setShakeKey(`${h.laneId}:${h.colId}`);
      setTimeout(() => setShakeKey(null), 420);
    }
    setDrag((d) => (d ? { ...d, returning: { x: p.rect.left, y: p.rect.top } } : d));
    setTimeout(() => setDrag(null), 200);
  };

  const cardHandlers = (job: Job, colId: string) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0 || e.pointerType === 'touch') return;
      if ((e.target as HTMLElement).closest('a,button,select,input')) return;
      const rect = e.currentTarget.getBoundingClientRect();
      press.current = {
        job, colId, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY,
        offX: e.clientX - rect.left, offY: e.clientY - rect.top, rect, started: false,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const p = press.current;
      if (!p || p.pointerId !== e.pointerId) return;
      if (!p.started) {
        if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < 4) return; // a click, not a drag
        p.started = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        setDrag({ job: p.job, fromCol: p.colId, x: e.clientX - p.offX, y: e.clientY - p.offY, w: p.rect.width, h: p.rect.height, returning: null });
      }
      if (previewEl.current) {
        previewEl.current.style.left = `${e.clientX - p.offX}px`;
        previewEl.current.style.top = `${e.clientY - p.offY}px`;
      }
      const next = findTarget(e.clientX, e.clientY, p.colId);
      if (!sameHover(hoverRef.current, next)) {
        hoverRef.current = next;
        setHover(next);
      }
      const board = boardRef.current;
      if (board) {
        const r = board.getBoundingClientRect();
        if (e.clientX < r.left + 56) board.scrollLeft -= 16;
        else if (e.clientX > r.right - 56) board.scrollLeft += 16;
      }
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => finish(e, false),
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => finish(e, true),
  });

  return { drag, hover, shakeKey, previewEl, cardHandlers };
}
