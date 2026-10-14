import FormActions from './FormActions';
import FormMessage from './FormMessage';

interface PasswordFormProps {
  readonly currentPassword: string;
  readonly setCurrentPassword: (val: string) => void;
  readonly newPassword: string;
  readonly setNewPassword: (val: string) => void;
  readonly confirmPassword: string;
  readonly setConfirmPassword: (val: string) => void;
  readonly saving: boolean;
  readonly message: { type: 'success' | 'error'; text: string } | null;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly onClose: () => void;
}

const input = 'h-12 w-full rounded-xl bg-sunken px-4 text-base text-ink focus:outline-none focus:ring-2 focus:ring-line-strong';

function Field({ id, label, value, onChange, autoFocus, minLength }: { readonly id: string; readonly label: string; readonly value: string; readonly onChange: (v: string) => void; readonly autoFocus?: boolean; readonly minLength?: number }) {
  return (
    <div>
      <label htmlFor={id} className="mobile-caption mb-1 block text-ink-muted">{label}</label>
      <input id={id} type="password" value={value} onChange={(e) => onChange(e.target.value)} required autoFocus={autoFocus} minLength={minLength} className={input} />
    </div>
  );
}

/** The edit sheet's change-password form: current, new and confirm, as three soft fields. */
export default function PasswordForm({ currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, saving, message, onSubmit, onClose }: PasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field id="acct-current-pw" label="Current Password" value={currentPassword} onChange={setCurrentPassword} autoFocus />
      <Field id="acct-new-pw" label="New Password" value={newPassword} onChange={setNewPassword} minLength={8} />
      <Field id="acct-confirm-pw" label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} minLength={8} />
      <FormMessage message={message} />
      <FormActions saving={saving} label="Update Password" savingLabel="Updating…" onCancel={onClose} />
    </form>
  );
}
