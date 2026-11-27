'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Mail, MapPin, Phone, Store as StoreIcon, Star } from 'lucide-react';
import Modal from '@/components/Modal';
import Badge from '@/components/shared/Badge';
import PlanPill, { PILL } from '@/components/admin/ui/PlanPill';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';

interface Branch {
  id: number;
  name: string;
  address: string | null;
  barangay: string | null;
  district: string | null;
  city: string | null;
  contact_number: string | null;
  is_main: boolean;
  status: string;
  verification_status: string;
}

interface DayHours { is_open?: boolean; open?: string; close?: string }

interface StoreDetails {
  id: number;
  name: string;
  slug: string;
  status: string;
  is_hidden: boolean;
  admin_hidden_at: string | null;
  admin_hidden_reason: string | null;
  logo_path: string | null;
  description: string | null;
  business_type: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  specializations: string[];
  operating_hours: Record<string, DayHours> | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  owner: { name: string; email: string; phone: string | null; last_seen_at: string | null } | null;
  subscription: {
    status: string;
    billing_cycle: string | null;
    starts_at: string | null;
    ends_at: string | null;
    trial_ends_at: string | null;
    plan: { name: string } | null;
  } | null;
  branches: Branch[];
  counts: Record<'staff' | 'services' | 'catalog_items' | 'job_orders' | 'appointments' | 'customers' | 'reviews', number>;
  rating: number | null;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtTime = (t?: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const SUB_TONE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trial: 'bg-amber-50 text-amber-800 border-amber-200',
  expired: 'bg-sunken text-ink-muted border-line',
  cancelled: 'bg-sunken text-ink-muted border-line',
};
const VERIFY_TONE: Record<string, 'success' | 'warning' | 'danger'> = { verified: 'success', pending: 'warning', rejected: 'danger' };

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

/** Shop details for the admin Shops page: opened by clicking a shop in the list. */
export default function StoreDetailsModal({ storeId, onClose }: { readonly storeId: number | null; readonly onClose: () => void }) {
  const [data, setData] = useState<StoreDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (storeId === null) return;
    let alive = true;
    setData(null);
    setError('');
    adminApi.get(`/admin/stores/${storeId}`)
      .then((res) => { if (alive) setData(res.data.data); })
      .catch((err) => { if (alive) setError(getErrorMessage(err, 'Could not load this shop.')); });
    return () => { alive = false; };
  }, [storeId]);

  const sub = data?.subscription ?? null;
  const subEnd = sub?.ends_at ?? sub?.trial_ends_at ?? null;
  const counts = data
    ? [
        { label: 'Job orders', value: data.counts.job_orders },
        { label: 'Appointments', value: data.counts.appointments },
        { label: 'Customers', value: data.counts.customers },
        { label: 'Staff', value: data.counts.staff },
        { label: 'Services', value: data.counts.services },
        { label: 'Catalog designs', value: data.counts.catalog_items },
      ]
    : [];

  return (
    <Modal
      isOpen={storeId !== null}
      onClose={onClose}
      title={data?.name ?? 'Shop details'}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          {data && data.status === 'approved' && (
            <a
              href={`/store/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 admin-field px-4 text-sm font-medium text-ink shadow-2xs hover:bg-sunken"
            >
              <ExternalLink size={15} aria-hidden="true" /> Open shop page
            </a>
          )}
          <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center rounded-lg bg-ink px-5 text-sm font-semibold text-white hover:bg-ink/85">
            Close
          </button>
        </div>
      }
    >
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      {!data && !error && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading shop details">
          <div className="h-16 animate-pulse rounded-lg bg-sunken" />
          <div className="h-24 animate-pulse rounded-lg bg-sunken" />
          <div className="h-32 animate-pulse rounded-lg bg-sunken" />
        </div>
      )}

      {data && (
        <div className="space-y-6 text-sm text-ink-body">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sunken text-ink-faint">
              {data.logo_path
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={data.logo_path} alt="" className="h-full w-full object-cover" />
                : <StoreIcon size={24} aria-hidden="true" />}
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <PlanPill plan={sub?.plan?.name ?? null} />
                {sub && <span className={`${PILL} ${SUB_TONE[sub.status] ?? SUB_TONE.expired}`}>{titleCase(sub.status)}</span>}
                {data.status !== 'approved' && <Badge variant={data.status === 'pending' ? 'warning' : 'danger'} className="capitalize">{data.status}</Badge>}
                {data.admin_hidden_at && <Badge variant="danger">Hidden by admin</Badge>}
                {!data.admin_hidden_at && data.is_hidden && <Badge>Hidden · unsubscribed</Badge>}
              </div>
              <p className="text-ink-muted">
                {data.business_type ? `${titleCase(data.business_type)} · ` : ''}Joined {fmtDate(data.created_at)}
                {data.approved_at && <> · Approved {fmtDate(data.approved_at)}{data.approved_by ? ` by ${data.approved_by}` : ''}</>}
              </p>
              {data.rating !== null && (
                <p className="inline-flex items-center gap-1 text-ink">
                  <Star size={14} className="fill-amber-400 text-amber-500" aria-hidden="true" />
                  <span className="font-semibold tabular-nums">{data.rating.toFixed(1)}</span>
                  <span className="text-ink-muted">({data.counts.reviews} {data.counts.reviews === 1 ? 'review' : 'reviews'})</span>
                </p>
              )}
            </div>
          </div>

          {data.admin_hidden_at && data.admin_hidden_reason && (
            <p className="rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-danger">
              <span className="font-semibold">Hidden {fmtDate(data.admin_hidden_at)}:</span> {data.admin_hidden_reason}
            </p>
          )}

          {data.description && <p className="max-w-prose leading-relaxed">{data.description}</p>}

          {/* Activity */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {counts.map((c) => (
              <div key={c.label} className="bg-surface px-3.5 py-2.5">
                <dt className="text-xs text-ink-muted">{c.label}</dt>
                <dd className="text-base font-semibold tabular-nums text-ink">{c.value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-6 sm:grid-cols-2">
            <Section title="Owner">
              {data.owner ? (
                <ul className="space-y-1.5">
                  <li className="font-medium text-ink">{data.owner.name}</li>
                  <li className="flex items-center gap-2 break-all"><Mail size={14} className="shrink-0 text-ink-faint" aria-hidden="true" />{data.owner.email}</li>
                  {data.owner.phone && <li className="flex items-center gap-2"><Phone size={14} className="shrink-0 text-ink-faint" aria-hidden="true" />{data.owner.phone}</li>}
                  <li className="text-ink-muted">{data.owner.last_seen_at ? `Last active ${fmtDate(data.owner.last_seen_at)}` : 'Not signed in yet'}</li>
                </ul>
              ) : <p className="text-ink-muted">No owner on record.</p>}
            </Section>

            <Section title="Plan">
              {sub ? (
                <ul className="space-y-1.5">
                  <li className="font-medium text-ink">{sub.plan?.name ?? 'No plan'}{sub.billing_cycle ? ` · ${titleCase(sub.billing_cycle)}` : ''}</li>
                  <li className="tabular-nums">{sub.starts_at ? fmtDate(sub.starts_at) : '—'} – {subEnd ? fmtDate(subEnd) : '—'}</li>
                  {sub.status === 'trial' && <li className="text-ink-muted">Free trial</li>}
                </ul>
              ) : <p className="text-ink-muted">No subscription yet.</p>}
            </Section>

            <Section title="Shop contact">
              <ul className="space-y-1.5">
                {data.phone && <li className="flex items-center gap-2"><Phone size={14} className="shrink-0 text-ink-faint" aria-hidden="true" />{data.phone}</li>}
                {data.email && <li className="flex items-center gap-2 break-all"><Mail size={14} className="shrink-0 text-ink-faint" aria-hidden="true" />{data.email}</li>}
                {(data.address || data.city) && (
                  <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />{[data.address, data.city].filter(Boolean).join(', ')}</li>
                )}
                {!data.phone && !data.email && !data.address && <li className="text-ink-muted">No contact details yet.</li>}
              </ul>
            </Section>

            <Section title="Opening hours">
              {data.operating_hours ? (
                <ul className="space-y-1">
                  {DAYS.map((d) => {
                    const h = data.operating_hours?.[d];
                    return (
                      <li key={d} className="flex justify-between gap-3 tabular-nums">
                        <span className="capitalize text-ink-muted">{d.slice(0, 3)}</span>
                        <span className={h?.is_open ? 'text-ink' : 'text-ink-faint'}>{h?.is_open ? `${fmtTime(h.open)} – ${fmtTime(h.close)}` : 'Closed'}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="text-ink-muted">Not set yet.</p>}
            </Section>
          </div>

          {data.specializations.length > 0 && (
            <Section title="Specializations">
              <ul className="flex flex-wrap gap-1.5">
                {data.specializations.map((s) => (
                  <li key={s} className="rounded-full border border-line bg-sunken px-2.5 py-0.5 text-xs text-ink-body">{titleCase(s)}</li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={`Branches (${data.branches.length})`}>
            {data.branches.length === 0 ? <p className="text-ink-muted">No branches yet.</p> : (
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                {data.branches.map((b) => (
                  <li key={b.id} className="space-y-1 bg-surface px-3.5 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-ink">{b.name}</span>
                      {b.is_main && <Badge>Main</Badge>}
                      <Badge variant={VERIFY_TONE[b.verification_status] ?? 'warning'} className="capitalize">{b.verification_status}</Badge>
                      {b.status !== 'active' && <Badge className="capitalize">{b.status}</Badge>}
                    </div>
                    <p className="text-ink-muted">{[b.address, b.barangay, b.district, b.city].filter(Boolean).join(', ') || 'No address'}</p>
                    {b.contact_number && <p className="text-ink-muted">{b.contact_number}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </Modal>
  );
}
