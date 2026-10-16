import { Mars, Venus } from 'lucide-react';

export type Gender = 'male' | 'female';

interface GenderPickerProps {
  readonly value: Gender | '';
  readonly onChange: (value: Gender | '') => void;
  readonly label?: string;
  /** Default true. A form that needs the answer passes false. */
  readonly optional?: boolean;
}

const OPTIONS: { value: Gender; label: string; Icon: typeof Mars }[] = [
  { value: 'male', label: 'Male', Icon: Mars },
  { value: 'female', label: 'Female', Icon: Venus },
];

/** Male / Female as two big icon buttons (a radio group). Tapping the chosen one again clears it. */
export default function GenderPicker({ value, onChange, label = 'Gender', optional = true }: GenderPickerProps) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-1.5 text-sm font-medium text-ink-body">{label} {optional ? <span className="text-xs font-normal text-ink-faint">(optional)</span> : <span className="text-danger">*</span>}</p>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(({ value: v, label: text, Icon }) => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(selected ? '' : v)}
              className={`flex min-h-12 items-center justify-center gap-2 border text-sm font-semibold transition-colors ${selected ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-body hover:border-ink-muted'}`}
            >
              <Icon size={20} aria-hidden="true" /> {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
