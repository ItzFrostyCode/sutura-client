import { ExternalLink, KeyRound, MapPin } from 'lucide-react';
import { specializationLabel } from '@/lib/storeSpecializations';
import { formatPeso } from '@/components/store-application/applicationTypes';
import { formatDate } from '../useAdminList';
import type { ApplicationDetail } from './useApplicationDetail';

function Row({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children ?? '—'}</dd>
    </div>
  );
}

function Card({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="border border-line bg-surface px-5 py-4">
      <h2 className="tablet-h4 text-ink mb-1">{title}</h2>
      <dl className="divide-y divide-line">{children}</dl>
    </section>
  );
}

export default function ApplicationSummary({
  store,
  onReissueCredentials,
  reissuing = false,
}: {
  readonly store: ApplicationDetail;
  readonly onReissueCredentials?: () => void;
  readonly reissuing?: boolean;
}) {
  const app = store.application;
  const fullName = app ? [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean).join(' ') : store.owner?.name;
  const coords = store.latitude && store.longitude ? `${store.latitude},${store.longitude}` : null;
  const addressQuery = [store.address, store.city, store.province].filter(Boolean).join(', ');
  const mapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`
    : addressQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
      : null;

  const contactEmail = store.owner?.contact_email ?? store.owner?.email;
  const contactPhone = app?.contact_number ?? store.owner?.phone;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Owner">
        <Row label="Full name">{fullName}</Row>
        <Row label="Date of birth">{app ? formatDate(app.birthday) : null}</Row>
        <Row label="Contact email">
          {contactEmail ? (
            <a href={`mailto:${contactEmail}`} className="break-all underline underline-offset-2 hover:text-espresso">
              {contactEmail}
            </a>
          ) : null}
        </Row>
        <Row label="Shop login">
          {store.status === 'approved' ? (
            <div className="space-y-1.5">
              <span className="block break-all text-sm text-ink select-all leading-relaxed">
                {store.owner?.email}
              </span>
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs">
                <a
                  href="/login?as=store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-espresso underline underline-offset-2 hover:text-ink"
                  title="Open Shop Sign In page in a new tab"
                >
                  <ExternalLink size={12} /> Sign In
                </a>
                {onReissueCredentials && (
                  <button
                    type="button"
                    onClick={onReissueCredentials}
                    disabled={reissuing}
                    className="inline-flex items-center gap-1 font-medium text-ink-muted underline underline-offset-2 hover:text-ink disabled:opacity-50"
                    title="Reset temporary password to 'password' and show credentials"
                  >
                    <KeyRound size={12} /> {reissuing ? 'Resetting...' : 'Re-issue Password'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            'Issued on approval'
          )}
        </Row>
        <Row label="Contact">
          {contactPhone ? (
            <a href={`tel:${contactPhone}`} className="underline underline-offset-2 hover:text-espresso">
              {contactPhone}
            </a>
          ) : null}
        </Row>
        <Row label="ID type">{app?.government_id_type}</Row>
      </Card>

      <Card title="Shop">
        <Row label="Address">{[store.address, store.city, store.province].filter(Boolean).join(', ')}</Row>
        <Row label="Map pin">
          {mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-espresso">
              <MapPin size={14} /> Open in Maps
            </a>
          ) : null}
        </Row>
        {store.status === 'approved' && store.slug && (
          <Row label="Store page">
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-espresso"
            >
              <ExternalLink size={13} /> View on Sutura
            </a>
          </Row>
        )}
        <Row label="Specializes in">{store.specializations?.map(specializationLabel).join(', ')}</Row>
        <Row label="Applied">{formatDate(store.created_at, true)}</Row>
      </Card>


      <Card title="Plan & payment">
        <Row label="Requested plan">{app?.requested_plan?.name}</Row>
        <Row label="Billing">{app ? `${app.billing_cycle} · ${formatPeso(app.quoted_price)}` : null}</Row>
        <Row label="Paid via">{app?.payment_method?.replace('_', ' ')}</Row>
        <Row label="Current plan">
          {store.subscription?.plan ? `${store.subscription.plan.name} (${store.subscription.status}, until ${formatDate(store.subscription.ends_at)})` : 'Starts on approval'}
        </Row>
      </Card>
    </div>
  );
}
