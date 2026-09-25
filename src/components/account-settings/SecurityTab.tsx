import React from 'react';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordFormState {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface PasswordErrorsState {
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

interface SecurityTabProps {
  readonly passwordForm: PasswordFormState;
  readonly setPasswordForm: React.Dispatch<React.SetStateAction<PasswordFormState>>;
  readonly passwordErrors: PasswordErrorsState;
  readonly setPasswordErrors: React.Dispatch<React.SetStateAction<PasswordErrorsState>>;
  readonly handlePasswordSubmit: (e: React.SyntheticEvent) => void;
  readonly loadingPassword: boolean;
  readonly showCurrent: boolean;
  readonly setShowCurrent: React.Dispatch<React.SetStateAction<boolean>>;
  readonly showNew: boolean;
  readonly setShowNew: React.Dispatch<React.SetStateAction<boolean>>;
  readonly showConfirm: boolean;
  readonly setShowConfirm: React.Dispatch<React.SetStateAction<boolean>>;
}

const getPasswordStrengthColor = (password: string, level: number): string => {
  if (password.length < level * 2) return 'bg-line';
  if (level <= 2) return 'bg-danger';
  if (level === 3) return 'bg-amber-400';
  return 'bg-sage';
};

export default function SecurityTab({
  passwordForm,
  setPasswordForm,
  passwordErrors,
  setPasswordErrors,
  handlePasswordSubmit,
  loadingPassword,
  showCurrent,
  setShowCurrent,
  showNew,
  setShowNew,
  showConfirm,
  setShowConfirm,
}: Readonly<SecurityTabProps>) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-6 animate-in fade-in duration-200">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-ink">Change Password</h2>
        <p className="text-xs text-ink-faint mt-0.5">
          Use a strong password with at least 8 characters.
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-5">
        {/* Current Password */}
        <div className="space-y-1.5">
          <label htmlFor="current_password" className="block text-sm font-medium text-ink-body">
            Current Password
          </label>
          <div className="relative">
            <input
              id="current_password"
              type={showCurrent ? 'text' : 'password'}
              value={passwordForm.current_password || ''}
              onChange={(e) => {
                setPasswordForm({ ...passwordForm, current_password: e.target.value });
                if (passwordErrors.current_password) {
                  setPasswordErrors((prev) => ({ ...prev, current_password: undefined }));
                }
              }}
              className={`w-full pr-10 px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
                passwordErrors.current_password
                  ? 'border-danger bg-danger/5'
                  : 'border-line focus:border-taupe'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-body transition-colors cursor-pointer"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordErrors.current_password && (
            <p className="text-xs text-danger">{passwordErrors.current_password}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* New Password */}
          <div className="space-y-1.5">
            <label htmlFor="new_password" className="block text-sm font-medium text-ink-body">
              New Password
            </label>
            <div className="relative">
              <input
                id="new_password"
                type={showNew ? 'text' : 'password'}
                value={passwordForm.password || ''}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, password: e.target.value });
                  if (passwordErrors.password) {
                    setPasswordErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                className={`w-full pr-10 px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
                  passwordErrors.password
                    ? 'border-danger bg-danger/5'
                    : 'border-line focus:border-taupe'
                }`}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-body transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.password && (
              <p className="text-xs text-danger">{passwordErrors.password}</p>
            )}
            {/* Strength hint */}
            {passwordForm.password && (
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${getPasswordStrengthColor(
                      passwordForm.password || '',
                      level
                    )}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-ink-body">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="password_confirmation"
                type={showConfirm ? 'text' : 'password'}
                value={passwordForm.password_confirmation || ''}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, password_confirmation: e.target.value });
                  if (passwordErrors.password_confirmation) {
                    setPasswordErrors((prev) => ({ ...prev, password_confirmation: undefined }));
                  }
                }}
                className={`w-full pr-10 px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
                  passwordErrors.password_confirmation
                    ? 'border-danger bg-danger/5'
                    : 'border-line focus:border-taupe'
                }`}
                placeholder="Re-enter password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-body transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.password_confirmation && (
              <p className="text-xs text-danger">{passwordErrors.password_confirmation}</p>
            )}
            {passwordForm.password_confirmation && passwordForm.password && (
              <p
                className={`text-xs mt-1 ${
                  passwordForm.password === passwordForm.password_confirmation
                    ? 'text-sage'
                    : 'text-danger'
                }`}
              >
                {passwordForm.password === passwordForm.password_confirmation
                  ? '✓ Passwords match'
                  : '✗ Passwords do not match'}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-line flex justify-end">
          <button
            type="submit"
            disabled={loadingPassword}
            className="bg-taupe hover:bg-[#8a7065] text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm cursor-pointer"
          >
            {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock size={15} />}
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}
