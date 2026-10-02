export type SmsStatus = 'draft' | 'approved' | 'sent' | 'failed' | 'blocked' | 'cancelled';
export type SmsMode = 'off' | 'review' | 'auto';
export type SmsTab = 'draft' | 'sent' | 'problems';

export interface SmsMessage {
  id: number; event: string; event_label: string; status: SmsStatus; customer: string | null;
  to_number: string | null; raw_number: string | null; blocked_reason: string | null;
  body: string; chars: number; segments: number; is_test: boolean; error: string | null;
  created_at: string; sent_at: string | null; related_type: string | null; related_id: number | null;
}
export interface SmsEventSetting { key: string; label: string; enabled: boolean; recommended: boolean }
export interface SmsOutbox {
  mode: SmsMode; test_mode: boolean; plan_allows: boolean; daily_cap: number;
  counts: { draft: number; sent: number; problems: number };
  events: SmsEventSetting[]; messages: SmsMessage[];
}

export const MODES: { id: SmsMode; label: string; hint: string }[] = [
  { id: 'review', label: 'Check first', hint: 'Texts wait here. You check the number and the words, then send. (Recommended)' },
  { id: 'auto', label: 'Send automatically', hint: 'Texts go out right away. Numbers that look wrong are still held back.' },
  { id: 'off', label: 'Off', hint: 'No texts are prepared at all.' },
];

/** Live counter. One SMS is 160 plain characters; accents, ₱ and fancy quotes are turned into plain ones on the server. */
export function measure(text: string): { chars: number; segments: number; foldedChars: boolean } {
  const chars = text.length;
  return { chars, segments: chars <= 160 ? 1 : Math.ceil(chars / 153), foldedChars: /[^\x20-\x7E\n]/.test(text) };
}

export const formatWhen = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
