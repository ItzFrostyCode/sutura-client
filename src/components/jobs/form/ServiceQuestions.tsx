import { FIELD, LABEL, Chip } from './FormStep';
import type { ServiceField } from './types';

interface Props {
  readonly fields: ServiceField[];
  readonly values: Record<string, string>;
  readonly onChange: (label: string, value: string) => void;
}

const picked = (value: string) => value.split(',').map((s) => s.trim()).filter(Boolean);

/** The questions the owner set up on the service (Services → Booking Form). The customer may have answered some when booking. */
export default function ServiceQuestions({ fields, values, onChange }: Props) {
  if (fields.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((f) => {
        const value = values[f.label] ?? '';
        return (
          <div key={f.id} className={f.type === 'checkbox' || f.type === 'radio' ? 'md:col-span-2' : ''}>
            <label htmlFor={f.id} className={LABEL}>{f.label} {f.required && <span className="text-danger">*</span>}</label>
            {f.type === 'select' && (
              <select id={f.id} required={f.required} value={value} onChange={(e) => onChange(f.label, e.target.value)} className={FIELD}>
                <option value="">Select…</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            {f.type === 'radio' && (
              <div className="flex flex-wrap gap-2">
                {f.options?.map((o) => <Chip key={o} active={value === o} onClick={() => onChange(f.label, o)}>{o}</Chip>)}
              </div>
            )}
            {f.type === 'checkbox' && (
              <div className="flex flex-wrap gap-2">
                {f.options?.map((o) => {
                  const on = picked(value).includes(o);
                  return <Chip key={o} active={on} onClick={() => onChange(f.label, (on ? picked(value).filter((p) => p !== o) : [...picked(value), o]).join(', '))}>{o}</Chip>;
                })}
              </div>
            )}
            {(f.type === 'text' || f.type === 'number') && (
              <input id={f.id} type={f.type} inputMode={f.type === 'number' ? 'decimal' : undefined} required={f.required} value={value} onChange={(e) => onChange(f.label, e.target.value)} className={FIELD} />
            )}
          </div>
        );
      })}
    </div>
  );
}
