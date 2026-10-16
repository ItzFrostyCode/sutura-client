/** The customer's view of an order, built by the server (OrderProgress.php): five plain stages and one sentence. */
export interface OrderProgress {
  stages: { key: string; label: string; state: 'done' | 'current' | 'upcoming' }[];
  current: string | null;
  closed: 'cancelled' | 'rejected' | 'declined' | null;
  on_hold: boolean;
  headline: string;
  detail: string | null;
  /** What the customer should do next, when there is something. Guests never get one. */
  action: { key: string; label: string } | null;
}

/** The label of the stage an order is in ("Being made"), or the reason it is closed. */
export function progressLabel(p?: OrderProgress | null): string | null {
  if (!p) return null;
  if (p.closed) return { cancelled: 'Cancelled', rejected: 'Not accepted', declined: 'Declined' }[p.closed];
  if (p.on_hold) return 'On hold';
  return p.stages.find((s) => s.key === p.current)?.label ?? null;
}
