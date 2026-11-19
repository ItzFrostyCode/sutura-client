import { MapPin } from 'lucide-react';
import { specializationLabel } from '@/lib/storeSpecializations';
import { formatPeso } from '@/components/store-application/applicationTypes';
import { formatDate } from '../useAdminList';
import { ageFrom } from '@/lib/age';
import { formatAddress } from '@/lib/formatAddress';
import type { ApplicationDetail, PlanPayment } from './useApplicationDetail';

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
    <section className="admin-card overflow-hidden px-5 py-4">
      <h2 className="tablet-h4 text-ink mb-1">{title}</h2>
      <dl className="admin-divide">{children}</dl>
    </section>
  );
}

export default function ApplicationSummary({ store, planPayment }: { readonly store: ApplicationDetail; readonly planPayment?: PlanPayment | null }) {
  const online = planPayment?.channel === 'online';
  const app = store.application;
  const fullName = app ? [app.first_name, app.middle_name, app.last_name, app.suffix].filter(Boolean).join(' ') : store.owner?.name;
  const mapsUrl = store.latitude && store.longitude ? `https://www.google.com/maps?q=${store.latitude},${store.longitude}` : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title="Owner">
        <Row label="Full name">{fullName}</Row>
        <Row label="Date of birth">{app ? formatDate(app.birthday) : null}</Row>
        <Row label="Age">{app && ageFrom(app.birthday) !== null ? `${ageFrom(app.birthday)} years old` : null}</Row>
        <Row label="Contact email">{store.owner?.contact_email ?? store.owner?.email}</Row>
        <Row label="Shop login">{store.status === 'approved' ? store.owner?.email : 'Issued on approval'}</Row>
        <Row label="Contact">{app?.contact_number ?? store.owner?.phone}</Row>
        <Row label="ID type">{app?.government_id_type}</Row>
        {app && <Row label="Face match"><FaceMatchNote match={app.face_match} distance={app.face_match_distance} /></Row>}
        <Row label="Consent">
          {app?.privacy_consent_at
            ? `Privacy consent and terms agreed ${formatDate(app.privacy_consent_at, true)}${app.consent_version ? ` (notice ${app.consent_version})` : ''}`
            : 'Not recorded (sent before consent was added)'}
        </Row>
        {app?.selfie_deleted_at && (
          <Row label="Selfie">Deleted {formatDate(app.selfie_deleted_at, true)} under the 30-day retention rule</Row>
        )}
      </Card>

      <Card title="Shop">
        <Row label="Address">{formatAddress({ address: store.address, city: store.city, province: store.province })}</Row>
        <Row label="Map pin">
          {mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
              <MapPin size={14} /> Open in Maps
            </a>
          ) : null}
        </Row>
        <Row label="Services">{[...(store.specializations ?? []).map(specializationLabel), ...(store.custom_services ?? [])].join(', ')}</Row>
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
        {app?.free_trial ? (
          <Row label="Payment"><span className="font-semibold text-ink">Free trial · 14 days</span><span className="block text-xs text-ink-muted">Nothing paid yet. The plan starts as a trial when you approve; the shop is paused if it doesn&apos;t pay before it ends.</span></Row>
        ) : (
          <>
            <Row label="Billing">{app ? `${app.billing_cycle} · ${formatPeso(app.quoted_price)}` : null}</Row>
            <Row label="Paid via">{planPayment ? (online ? 'GCash' : 'GCash · Receipt') : app?.payment_method?.replace('_', ' ')}</Row>
          </>
        )}
        {online && planPayment && (
          <Row label="Payment">
            {planPayment.paid
              ? <span className="font-semibold text-emerald-800">Paid{planPayment.paid_at ? ` ${formatDate(planPayment.paid_at, true)}` : ''}</span>
              : <span className="font-semibold text-amber-800">Not paid yet: approve once it shows as paid</span>}
            {planPayment.reference && <span className="block font-mono text-xs text-ink-muted break-all">{planPayment.reference}</span>}
          </Row>
        )}
        {planPayment?.refund_status && (
          <Row label="Refund">
            {planPayment.refund_status === 'succeeded' ? 'Refunded' : planPayment.refund_status === 'pending' ? 'Refund processing' : 'Refund failed (retry from Payments)'}
            {planPayment.refund_amount != null ? ` · ${formatPeso(planPayment.refund_amount)}` : ''}
          </Row>
        )}
        <Row label="Current plan">
          {store.subscription?.plan ? `${store.subscription.plan.name} (${store.subscription.status}, until ${formatDate(store.subscription.ends_at)})` : 'Starts on approval'}
        </Row>
      </Card>
    </div>
  );
}

const FACE_MATCH: Record<string, { label: string; tone: string }> = {
  likely: { label: 'Likely the same person', tone: 'text-emerald-800' },
  unsure: { label: 'Unsure: compare the selfie with the ID yourself', tone: 'text-amber-800' },
  no_match: { label: 'Doesn’t look like the ID photo: check carefully', tone: 'text-red-700' },
  no_id_face: { label: 'The ID photo wasn’t visible in the selfie', tone: 'text-amber-800' },
  not_checked: { label: 'Not checked (it didn’t run on the owner’s device)', tone: 'text-ink-muted' },
};

// Computed on the owner's device, so it's a hint for the reviewer, never proof.
function FaceMatchNote({ match, distance }: { readonly match?: string | null; readonly distance?: number | string | null }) {
  const info = match ? FACE_MATCH[match] : undefined;
  if (!info) return <span className="text-ink-muted">Not recorded (sent before this check existed)</span>;
  return (
    <span className={info.tone}>
      {info.label}
      {distance != null && <span className="text-ink-muted"> · score {Number(distance).toFixed(2)} (lower is closer)</span>}
    </span>
  );
}
