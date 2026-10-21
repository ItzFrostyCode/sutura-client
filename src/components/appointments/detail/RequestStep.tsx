import Link from 'next/link';
import { Link as LinkIcon } from 'lucide-react';
import PhotoThumb from '@/components/jobs/form/PhotoThumb';
import { safeHref } from '@/lib/safeHref';
import type { Appointment } from '../appointmentHelpers';
import AppointmentItemsBreakdown from '../AppointmentItemsBreakdown';
import { Fact, StepCard, Sub } from './StepCard';

/** Did the customer ask for anything? A walk-in whose consultation just started has not: there is no request to show. */
export function hasRequest(apt: Appointment, customerNotes: string): boolean {
  return apt.intake_channel !== 'walk_in' || Boolean(
    apt.service || apt.catalog_item || apt.items?.length || customerNotes || apt.reference_link || apt.reference_images?.length || apt.material_source
    || Object.values(apt.answers ?? {}).some((v) => String(v).trim() !== ''),
  );
}

/** Step 1: everything the customer asked for, in one place: what, their fabric, their answers, their note, their photos. */
export default function RequestStep({ apt, storeSlug, customerNotes }: Readonly<{ apt: Appointment; storeSlug?: string; customerNotes: string }>) {
  const answers = Object.entries(apt.answers ?? {}).filter(([, v]) => String(v).trim() !== '');
  const images = apt.reference_images ?? [];
  const about = apt.catalog_item
    ? { title: apt.catalog_item.name, line: apt.service ? `Design of ${apt.service.name}` : 'Design', href: storeSlug ? `/store/${storeSlug}/catalog/${apt.catalog_item.id}` : null }
    : apt.service
    ? { title: apt.service.name, line: 'Service', href: storeSlug ? `/store/${storeSlug}/service/${apt.service.id}` : null }
    : { title: apt.purpose_label || 'General visit', line: 'No service or design chosen', href: null };

  return (
    <StepCard n={1} title="Request" hint="What the customer asked for." done={apt.status !== 'pending'}>
      <div>
        <Sub>About</Sub>
        <p className="text-base font-semibold text-ink">
          {about.href ? <Link href={about.href} target="_blank" className="hover:underline">{about.title}</Link> : about.title}
        </p>
        <p className="text-[13px] text-ink-muted">{about.line}{apt.selected_size || apt.selected_color ? ` · ${[apt.selected_size && `Size ${apt.selected_size}`, apt.selected_color].filter(Boolean).join(' · ')}` : ''}</p>
        {apt.items && apt.items.length > 0 && <div className="mt-3"><AppointmentItemsBreakdown items={apt.items} storeSlug={storeSlug} /></div>}
      </div>

      {apt.material_source && (
        <dl>
          <Fact label="Fabric">{apt.material_source === 'own' ? `Customer brings their own${apt.material_note ? ` — ${apt.material_note}` : ''}` : 'Shop’s fabric'}</Fact>
        </dl>
      )}

      {answers.length > 0 && (
        <div>
          <Sub>Answers to the shop’s questions</Sub>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{answers.map(([q, a]) => <Fact key={q} label={q}>{String(a)}</Fact>)}</dl>
        </div>
      )}

      {customerNotes && (
        <div>
          <Sub>Customer’s note</Sub>
          <p className="whitespace-pre-wrap rounded-lg bg-canvas p-3 text-sm text-ink">{customerNotes}</p>
        </div>
      )}

      {(images.length > 0 || apt.reference_link) && (
        <div>
          <Sub>Photos and link</Sub>
          {apt.reference_link && <a href={safeHref(apt.reference_link)} target="_blank" rel="noopener noreferrer" className="mb-3 flex items-center gap-2 break-all text-sm text-taupe hover:underline"><LinkIcon size={14} className="shrink-0" />{apt.reference_link}</a>}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {images.map((u) => <PhotoThumb key={u} url={u} alt="Photo with this appointment" className="aspect-square h-auto w-full" />)}
            </div>
          )}
        </div>
      )}
    </StepCard>
  );
}
