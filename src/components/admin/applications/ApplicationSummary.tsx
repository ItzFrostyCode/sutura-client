import { MapPin } from 'lucide-react';
import { specializationLabel } from '@/lib/storeSpecializations';
import { formatPeso } from '@/components/store-application/applicationTypes';
import { formatDate } from '../useAdminList';
import type { ApplicationDetail } from './useApplicationDetail';

function Row({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children ?? '—'}</dd>
    </div>
  );
}

function Card({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <section className="border-2 border-line-strong bg-surface px-5 py-4">
      <h2 className="tablet-h4 text-ink mb-1">{title}</h2>
      <dl className="divide-y-2 divide-line-strong">{children}</dl>
    </section>
  );
}

export default function ApplicationSummary({ store }: { readonly store: ApplicationDetail }) {
  const app = store.application;
  const fullName = app ? [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean).join(' ') : store.owner?.name;
  const mapsUrl = store.latitude && store.longitude ? `https://www.google.com/maps?q=${store.latitude},${store.longitude}` : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Owner">
        <Row label="Full name">{fullName}</Row>
        <Row label="Date of birth">{app ? formatDate(app.birthday) : null}</Row>
        <Row label="Contact email">{store.owner?.contact_email ?? store.owner?.email}</Row>
        <Row label="Shop login">{store.status === 'approved' ? store.owner?.email : 'Issued on approval'}</Row>
        <Row label="Contact">{app?.contact_number ?? store.owner?.phone}</Row>
        <Row label="ID type">{app?.government_id_type}</Row>
      </Card>

      <Card title="Shop">
        <Row label="Address">{[store.address, store.city, store.province].filter(Boolean).join(', ')}</Row>
        <Row label="Map pin">
          {mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
              <MapPin size={14} /> Open in Maps
            </a>
          ) : null}
        </Row>
        <Row label="Specializes in">{store.specializations?.map(specializationLabel).join(', ')}</Row>
        {(store.custom_services?.length ?? 0) > 0 && (
          <Row label="Other services">{store.custom_services!.join(', ')}</Row>
        )}
        {(store.declared_branches?.length ?? 0) > 0 && (
          <Row label="Other branches">
            <ul className="space-y-1">
              {store.declared_branches!.map((b) => (
                <li key={b.name}><span className="font-medium">{b.name}</span> <span className="text-ink-muted">— {b.address}</span></li>
              ))}
            </ul>
          </Row>
        )}
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
