import { CalendarCheck } from 'lucide-react';
import { parseBookingNotes, type Appointment } from '@/components/appointments/appointmentHelpers';
import FormStep, { LABEL } from './FormStep';
import PhotoThumb from './PhotoThumb';

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

function Row({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </div>
  );
}

/** Everything the consultation / booking recorded, beside the form: what was asked for, answers, photos, fabric, notes. */
export default function ConsultationRecap({ appointment: a, defaultOpen = false }: Readonly<{ appointment: Appointment; defaultOpen?: boolean }>) {
  const booked = parseBookingNotes(a.notes);
  const items = a.items ?? [];
  const answers = Object.entries(a.answers ?? {}).filter(([, v]) => String(v).trim() !== '');
  const images = a.reference_images ?? [];
  const source = a.intake_channel === 'online' ? 'Online booking' : 'In-shop';

  return (
    <details open={defaultOpen} className="group rounded-xl border border-espresso/[0.08] bg-white">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-ink">From consultation</span>
          <span className="block truncate text-[13px] text-ink-muted">{`Appointment #${a.id} · ${when(a.scheduled_at)} · ${source}`}</span>
        </span>
        <span className="text-[13px] font-medium text-espresso group-open:hidden">Show</span>
        <span className="hidden text-[13px] font-medium text-espresso group-open:inline">Hide</span>
      </summary>
      <div className="space-y-4 border-t border-espresso/[0.06] p-4 sm:p-5">
      <p className="text-xs text-ink-muted">Creating this order closes this consultation and keeps a link back to it. What it recorded is already filled into the form.</p>
      <dl className="-my-2 divide-y divide-espresso/[0.06]">
        {items.length > 0 && (
          <Row label="Asked for">
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.id}>
                  <span className="font-medium">{it.quantity} × {it.item_name}</span>
                  {it.catalog_item && it.service && <span className="block text-xs text-ink-muted">Service: {it.service.name}</span>}
                  <span className="block text-xs text-ink-muted">{[it.selected_size && `Size ${it.selected_size}`, it.selected_color && `Color ${it.selected_color}`, ...(it.add_ons ?? [])].filter(Boolean).join(' · ')}</span>
                  {it.notes && <span className="block text-xs text-ink-muted">{it.notes}</span>}
                </li>
              ))}
            </ul>
          </Row>
        )}
        {a.catalog_item && items.length === 0 && <Row label="Design">{a.catalog_item.name}</Row>}
        {a.service && items.length === 0 && <Row label="Service">{a.service.name}</Row>}
        {(a.selected_size || a.selected_color) && items.length === 0 && <Row label="Size and color">{[a.selected_size, a.selected_color].filter(Boolean).join(' · ')}</Row>}
        {a.material_source && <Row label="Fabric">{a.material_source === 'shop' ? 'Shop’s fabric' : `Customer brings their own${a.material_note ? ` — ${a.material_note}` : ''}`}</Row>}
        {answers.map(([q, v]) => <Row key={q} label={q}>{String(v)}</Row>)}
        {booked.text && <Row label="Customer’s note">{booked.text}</Row>}
        {a.reference_link && <Row label="Link"><a href={a.reference_link} target="_blank" rel="noopener noreferrer" className="text-espresso hover:underline">{a.reference_link}</a></Row>}
        {a.visit_notes && <Row label="Notes from the visit">{a.visit_notes}</Row>}
        {a.fitting_notes && <Row label="Shop’s note">{a.fitting_notes}</Row>}
      </dl>
      {images.length > 0 && (
        <div>
          <span className={LABEL}>Photos the customer sent</span>
          <div className="flex flex-wrap gap-2">{images.map((u) => <PhotoThumb key={u} url={u} alt="Sent with the booking" />)}</div>
        </div>
      )}
      {items.length === 0 && !a.service && !a.catalog_item && !booked.text && images.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-ink-muted"><CalendarCheck size={15} />The consultation recorded no details.</p>
      )}
      </div>
    </details>
  );
}
