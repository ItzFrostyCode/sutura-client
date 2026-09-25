import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { type EditableField } from './useAccountDetail';

interface AccountEditSheetProps {
  openField: EditableField;
  onClose: () => void;
  name: string;
  setName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  savingProfile: boolean;
  profileMessage: { type: 'success' | 'error'; text: string } | null;
  onProfileSubmit: (e: React.FormEvent) => void;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  savingPassword: boolean;
  passwordMessage: { type: 'success' | 'error'; text: string } | null;
  onPasswordSubmit: (e: React.FormEvent) => void;
}

const SHEET_TITLES: Record<EditableField, string> = {
  name: 'Edit Name',
  phone: 'Edit Phone',
  email: 'Email',
  password: 'Change Password',
};

export default function AccountEditSheet({
  openField,
  onClose,
  name,
  setName,
  phone,
  setPhone,
  savingProfile,
  profileMessage,
  onProfileSubmit,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  savingPassword,
  passwordMessage,
  onPasswordSubmit,
}: Readonly<AccountEditSheetProps>) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      />
      <div
        className="relative w-full max-w-[599px] sm:max-w-2xl mx-auto bg-surface rounded-t-2xl border-x border-t border-line px-5 sm:px-8 pt-3 pb-8 animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <div className="h-1 w-10 rounded-full bg-line-strong mx-auto mb-4" />
        <h2 className="mobile-h3 font-semibold text-ink text-center mb-4">
          {SHEET_TITLES[openField]}
        </h2>

        {openField === 'name' && (
          <form onSubmit={onProfileSubmit}>
            <input
              id="acct-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full form-input-mobile bg-canvas border border-line text-base text-ink font-normal focus:outline-none focus:border-taupe"
            />
            {profileMessage && (
              <div className={`flex items-center gap-2 mt-3 mobile-caption px-3 py-2 ${
                profileMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/5 text-danger'
              }`}>
                {profileMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {profileMessage.text}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary-mobile flex-1 bg-taupe hover:bg-taupe-hover text-white disabled:opacity-60"
              >
                {savingProfile ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary-mobile flex-1 border border-line text-ink-muted hover:bg-sunken"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {openField === 'phone' && (
          <form onSubmit={onProfileSubmit}>
            <div className="relative flex items-center gap-2.5 h-[52px] px-3.5 bg-canvas border border-line focus-within:border-taupe transition-colors">
              <Phone size={18} className="text-ink-faint shrink-0" />
              <input
                id="acct-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXXX"
                autoFocus
                className="flex-1 min-w-0 bg-transparent text-base text-ink font-normal focus:outline-none"
              />
            </div>
            {profileMessage && (
              <div className={`flex items-center gap-2 mt-3 mobile-caption px-3 py-2 ${
                profileMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/5 text-danger'
              }`}>
                {profileMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {profileMessage.text}
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary-mobile flex-1 bg-taupe hover:bg-taupe-hover text-white disabled:opacity-60"
              >
                {savingProfile ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary-mobile flex-1 border border-line text-ink-muted hover:bg-sunken"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {openField === 'email' && (
          <div>
            <p className="mobile-body-sm text-ink-muted leading-relaxed text-center font-normal">
              Changing your email isn&apos;t supported yet — contact support if you need it updated.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-mobile w-full border border-line text-ink hover:bg-sunken mt-5"
            >
              Close
            </button>
          </div>
        )}

        {openField === 'password' && (
          <form onSubmit={onPasswordSubmit} className="space-y-3">
            <div>
              <label htmlFor="acct-current-pw" className="block mobile-caption font-semibold text-ink-muted mb-1">
                Current Password
              </label>
              <input
                id="acct-current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoFocus
                className="w-full form-input-mobile bg-canvas border border-line text-base text-ink font-normal focus:outline-none focus:border-taupe"
              />
            </div>
            <div>
              <label htmlFor="acct-new-pw" className="block mobile-caption font-semibold text-ink-muted mb-1">
                New Password
              </label>
              <input
                id="acct-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full form-input-mobile bg-canvas border border-line text-base text-ink font-normal focus:outline-none focus:border-taupe"
              />
            </div>
            <div>
              <label htmlFor="acct-confirm-pw" className="block mobile-caption font-semibold text-ink-muted mb-1">
                Confirm New Password
              </label>
              <input
                id="acct-confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full form-input-mobile bg-canvas border border-line text-base text-ink font-normal focus:outline-none focus:border-taupe"
              />
            </div>

            {passwordMessage && (
              <div className={`flex items-center gap-2 mobile-caption px-3 py-2 ${
                passwordMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/5 text-danger'
              }`}>
                {passwordMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {passwordMessage.text}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="btn-primary-mobile flex-1 bg-taupe hover:bg-taupe-hover text-white disabled:opacity-60"
              >
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary-mobile flex-1 border border-line text-ink-muted hover:bg-sunken"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
