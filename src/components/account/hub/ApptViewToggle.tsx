import { Calendar as CalendarIcon, List as ListIcon } from 'lucide-react';

interface ApptViewToggleProps {
  readonly view: 'list' | 'calendar';
  readonly onChange: (view: 'list' | 'calendar') => void;
}

const OPTIONS = [
  { key: 'list', label: 'List view', Icon: ListIcon },
  { key: 'calendar', label: 'Calendar view', Icon: CalendarIcon },
] as const;

/** iOS segmented control with two icon segments. The 44px tap area is drawn outside the 32px height. */
export default function ApptViewToggle({ view, onChange }: ApptViewToggleProps) {
  return (
    <div role="tablist" aria-label="Appointment view" className="flex rounded-[9px] bg-sunken p-0.5">
      {OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={view === key}
          aria-label={label}
          onClick={() => onChange(key)}
          className={`relative flex h-8 w-11 items-center justify-center rounded-[7px] transition-colors before:absolute before:inset-x-0 before:-inset-y-1.5 ${view === key ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(45,42,38,0.12)]' : 'text-ink-muted'}`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
