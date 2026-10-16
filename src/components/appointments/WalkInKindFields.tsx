import React from 'react';
import { Scissors, Store } from 'lucide-react';
import PurposeLabelField from './PurposeLabelField';
import ServicePicker from './ServicePicker';
import { TYPE_CONFIG, type AppointmentType, type ServiceData } from './appointmentHelpers';

export interface KindFormPart {
  kind: 'service' | 'shop';
  service_id: string;
  appointment_type: AppointmentType;
  purpose_label: string;
}

interface Props {
  readonly form: KindFormPart;
  readonly services: ServiceData[];
  readonly onChange: (patch: Partial<KindFormPart>) => void;
}

const SHOP_PURPOSES: AppointmentType[] = ['consultation', 'measurement', 'other'];
const SERVICE_PURPOSES: AppointmentType[] = ['consultation', 'measurement'];
const label = 'block text-sm font-medium text-ink-body mb-1';

/** Service or Shop, then the purpose. A service visit's purpose follows the service. */
export default function WalkInKindFields({ form, services, onChange }: Props) {
  const service = services.find((s) => String(s.id) === form.service_id);
  const isAlteration = service?.service_category === 'alterations_repairs';
  const purposes = form.kind === 'shop' ? SHOP_PURPOSES : SERVICE_PURPOSES;

  return (
    <div className="space-y-4">
      <div>
        <span className={label}>Kind of visit <span className="text-rose-500">*</span></span>
        <div className="grid grid-cols-2 gap-2">
          {([['service', 'Service', Scissors], ['shop', 'Shop', Store]] as const).map(([value, text, Icon]) => (
            <button
              type="button" key={value}
              onClick={() => onChange({ kind: value, appointment_type: 'consultation', purpose_label: '' })}
              className={`min-h-12 flex items-center justify-center gap-2 border text-sm font-semibold transition-colors ${
                form.kind === value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-muted hover:border-ink/40'
              }`}
            >
              <Icon size={15} /> {text}
            </button>
          ))}
        </div>
      </div>

      {form.kind === 'service' && (
        <div>
          <label htmlFor="walkin_service" className={label}>Service <span className="text-rose-500">*</span></label>
          <ServicePicker services={services} value={form.service_id} onChange={(id) => onChange({ service_id: id })} />
        </div>
      )}

      {form.kind === 'service' && isAlteration ? (
        <p className="text-sm text-ink-muted">The customer brings the garment for alteration or repair.</p>
      ) : (
        <div>
          <span className={label}>What is it for? <span className="text-rose-500">*</span></span>
          <div className={`grid gap-2 ${purposes.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {purposes.map((t) => {
              const tc = TYPE_CONFIG[t];
              const on = form.appointment_type === t;
              return (
                <button type="button" key={t} onClick={() => onChange({ appointment_type: t })}
                  className={`min-h-12 flex items-center justify-center gap-1.5 border text-xs font-semibold transition-colors ${
                    on ? 'border-ink bg-ink text-white' : 'bg-white border-line text-ink-muted hover:border-ink/40'
                  }`}>
                  {tc.icon} {tc.label}
                </button>
              );
            })}
          </div>
          {form.kind === 'shop' && form.appointment_type === 'other' && (
            <PurposeLabelField value={form.purpose_label} onChange={(v) => onChange({ purpose_label: v })} />
          )}
        </div>
      )}
    </div>
  );
}
