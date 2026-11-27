import React from 'react';
import { StaffPresence } from './dashboardHelpers';

interface StaffOnlineProps {
  /** Staff seen in the last 5 minutes, earliest first. */
  readonly onlineStaff: StaffPresence[];
  /** The rest of the team, most recently seen first. */
  readonly offlineStaff?: StaffPresence[];
  /** The signed-in owner/manager: they're on this page, so they're online. */
  readonly viewerName?: string;
  /** When the staff list was fetched (epoch ms), for "last seen" ages. */
  readonly checkedAt?: number;
}

const AVATAR_TONES = ['bg-taupe text-white', 'bg-sage text-white', 'bg-[#8B7B6B] text-white', 'bg-[#6B7B8B] text-white'];
const MAX_OFFLINE = 4;

const initialsOf = (name: string) =>
  name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const roleLabelOf = (role?: string) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1).replaceAll('_', ' ') : 'Staff';

function lastSeen(ms: number, now: number): string {
  if (!ms) return 'Not signed in yet';
  const mins = Math.max(0, Math.floor((now - ms) / 60000));
  if (mins < 60) return `Last seen ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Last seen yesterday' : `Last seen ${days} days ago`;
}

function Avatar({ name, tone, online, size = 'md' }: Readonly<{ name: string; tone: string; online: boolean; size?: 'sm' | 'md' }>) {
  const box = size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-[13px]';
  return (
    <span className="relative shrink-0">
      <span className={`${box} rounded-full flex items-center justify-center font-bold select-none ${online ? tone : 'bg-sunken text-ink-muted'}`}>
        {initialsOf(name)}
      </span>
      <span
        aria-hidden="true"
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${online ? 'bg-emerald-500' : 'bg-line'}`}
      />
    </span>
  );
}

// Who's working right now: the signed-in owner/manager first ("You"), then
// staff active in the last 5 minutes, then the rest of the team with when they
// were last on. Real presence only (users.last_seen_at); nothing is invented.
export default function StaffOnline({ onlineStaff, offlineStaff = [], viewerName = '', checkedAt = 0 }: StaffOnlineProps) {
  const people = [
    ...(viewerName ? [{ key: 'you', name: viewerName, sub: 'You', online: true }] : []),
    ...onlineStaff.map(m => ({ key: `on-${m.id}`, name: m.user.name, sub: roleLabelOf(m.role), online: true })),
  ];
  const offline = offlineStaff.slice(0, MAX_OFFLINE);
  const moreOffline = offlineStaff.length - offline.length;
  const onlineCount = people.length;

  return (
    <div className="bg-surface rounded-xl border border-line p-5 sm:p-6 flex flex-col text-ink flex-1 w-full">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h2 className="text-eyebrow-accent">Team</h2>
          <p className="text-display text-lg font-semibold text-ink mt-1">Online now</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          {onlineCount} online
        </span>
      </div>

      {/* Avatar stack: the quick "who's here" read (only worth it with a few people on). */}
      {people.length > 1 && (
      <div className="flex items-center mt-5" aria-hidden="true">
        {people.slice(0, 6).map((p, idx) => (
          <span key={p.key} className={`rounded-full ring-2 ring-surface ${idx > 0 ? '-ml-2' : ''}`}>
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold ${AVATAR_TONES[idx % AVATAR_TONES.length]}`}>
              {initialsOf(p.name)}
            </span>
          </span>
        ))}
        {people.length > 6 && (
          <span className="-ml-2 w-9 h-9 rounded-full ring-2 ring-surface bg-sunken text-ink-muted text-[11px] font-bold flex items-center justify-center">
            +{people.length - 6}
          </span>
        )}
      </div>
      )}

      <ul className="mt-4 divide-y divide-line">
        {people.map((p, idx) => (
          <li key={p.key} className="flex items-center gap-3 py-2.5">
            <Avatar name={p.name} tone={AVATAR_TONES[idx % AVATAR_TONES.length]} online />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">
                {p.name}{p.sub === 'You' && <span className="font-normal text-ink-muted"> (You)</span>}
              </p>
              <p className="text-[11px] text-ink-muted">{p.sub === 'You' ? 'Signed in on this device' : p.sub}</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 shrink-0">Active now</span>
          </li>
        ))}
      </ul>

      {offline.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
            {onlineStaff.length === 0 ? 'No staff online right now' : 'Away'}
          </p>
          <ul className="divide-y divide-line/70">
            {offline.map(m => (
              <li key={m.id} className="flex items-center gap-3 py-2">
                <Avatar name={m.user.name} tone="" online={false} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-body truncate">{m.user.name}</p>
                  <p className="text-[11px] text-ink-faint">{roleLabelOf(m.role)}</p>
                </div>
                <span className="text-[11px] text-ink-muted shrink-0">{lastSeen(m._onlineSince, checkedAt)}</span>
              </li>
            ))}
          </ul>
          {moreOffline > 0 && <p className="text-[11px] text-ink-faint mt-1">+{moreOffline} more on the team</p>}
        </div>
      )}

      {onlineStaff.length === 0 && offline.length === 0 && (
        <p className="mt-3 text-xs text-ink-muted">No staff accounts yet. Staff show here when they sign in.</p>
      )}
    </div>
  );
}
