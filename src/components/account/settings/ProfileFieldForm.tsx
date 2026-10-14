import { Phone } from 'lucide-react';
import FormActions from './FormActions';
import FormMessage from './FormMessage';

interface ProfileFieldFormProps {
  readonly field: 'name' | 'phone';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly saving: boolean;
  readonly message: { type: 'success' | 'error'; text: string } | null;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onClose: () => void;
}

const input = 'h-12 w-full rounded-xl bg-sunken px-4 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong';

/** The edit sheet's form for the name or the phone number: one soft field. */
export default function ProfileFieldForm({ field, value, onChange, saving, message, onSubmit, onClose }: ProfileFieldFormProps) {
  return (
    <form onSubmit={onSubmit}>
      {field === 'name' ? (
        <input id="acct-name" type="text" value={value} onChange={(e) => onChange(e.target.value)} required autoFocus className={input} />
      ) : (
        <div className="relative">
          <Phone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input id="acct-phone" type="tel" value={value} onChange={(e) => onChange(e.target.value)} placeholder="09XXXXXXXXX" autoFocus className={`${input} pl-11`} />
        </div>
      )}
      <FormMessage message={message} />
      <FormActions saving={saving} label="Save" savingLabel="Saving…" onCancel={onClose} />
    </form>
  );
}
