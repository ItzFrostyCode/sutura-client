'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Lock, Eye, EyeOff, Bell, MessageSquare, Mail, BarChart2, Camera } from 'lucide-react';
import { useAccountSettings } from '@/components/account-settings/useAccountSettings';
import PageHeader from '@/components/shared/PageHeader';

const getPasswordStrengthColor = (password: string, level: number): string => {
  if (password.length < level * 2) return 'bg-line';
  if (level <= 2) return 'bg-danger';
  if (level === 3) return 'bg-amber-400';
  return 'bg-sage';
};

interface PersonalTabProps {
  readonly personalForm: { name: string; phone: string };
  readonly setPersonalForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string }>>;
  readonly personalErrors: { name?: string; phone?: string };
  readonly setPersonalErrors: React.Dispatch<React.SetStateAction<{ name?: string; phone?: string }>>;
  readonly handlePersonalSubmit: (e: React.SyntheticEvent) => void;
  readonly loadingPersonal: boolean;
  readonly userEmail: string;
}

function PersonalTab({
  personalForm,
  setPersonalForm,
  personalErrors,
  setPersonalErrors,
  handlePersonalSubmit,
  loadingPersonal,
  userEmail,
}: Readonly<PersonalTabProps>) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-6 animate-in fade-in duration-200">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-ink">Personal Details</h2>
        <p className="text-xs text-ink-faint mt-0.5">
          These details are shown on your profile and used for communication.
        </p>
      </div>

      <form onSubmit={handlePersonalSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="full_name" className="block text-sm font-medium text-ink-body">Full Name</label>
          <input
            id="full_name"
            type="text"
            value={personalForm.name}
            onChange={e => {
              setPersonalForm({ ...personalForm, name: e.target.value });
              if (personalErrors.name) setPersonalErrors(prev => ({ ...prev, name: undefined }));
            }}
            className={`w-full px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
              personalErrors.name ? 'border-danger bg-danger/5' : 'border-line focus:border-taupe'
            }`}
            placeholder="Your full name"
          />
          {personalErrors.name && (
            <p className="text-xs text-danger mt-1">{personalErrors.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label htmlFor="email_address" className="block text-sm font-medium text-ink-body">Email Address</label>
            <input
              id="email_address"
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-2.5 bg-canvas border border-line rounded-xl text-ink-faint cursor-not-allowed text-sm"
            />
            <p className="text-[11px] text-ink-faint">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone_number" className="block text-sm font-medium text-ink-body">Phone Number</label>
            <input
              id="phone_number"
              type="text"
              value={personalForm.phone}
              onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
              className={`w-full px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
                personalErrors.phone ? 'border-danger bg-danger/5' : 'border-line focus:border-taupe'
              }`}
              placeholder="+63 9XX XXX XXXX"
            />
            {personalErrors.phone && (
              <p className="text-xs text-danger mt-1">{personalErrors.phone}</p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-line flex justify-end mt-6">
          <button
            type="submit"
            disabled={loadingPersonal}
            className="bg-taupe hover:bg-[#8a7065] text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loadingPersonal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

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

function SecurityTab({
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
          <label htmlFor="current_password" className="block text-sm font-medium text-ink-body">Current Password</label>
          <div className="relative">
            <input
              id="current_password"
              type={showCurrent ? 'text' : 'password'}
              value={passwordForm.current_password || ''}
              onChange={e => {
                setPasswordForm({ ...passwordForm, current_password: e.target.value });
                if (passwordErrors.current_password) setPasswordErrors(prev => ({ ...prev, current_password: undefined }));
              }}
              className={`w-full pr-10 px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
                passwordErrors.current_password ? 'border-danger bg-danger/5' : 'border-line focus:border-taupe'
              }`}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-body transition-colors">
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
            <label htmlFor="new_password" className="block text-sm font-medium text-ink-body">New Password</label>
            <div className="relative">
              <input
                id="new_password"
                type={showNew ? 'text' : 'password'}
                value={passwordForm.password || ''}
                onChange={e => {
                  setPasswordForm({ ...passwordForm, password: e.target.value });
                  if (passwordErrors.password) setPasswordErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={`w-full pr-10 px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
                  passwordErrors.password ? 'border-danger bg-danger/5' : 'border-line focus:border-taupe'
                }`}
                placeholder="Min. 8 characters"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-body transition-colors">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.password && (
              <p className="text-xs text-danger">{passwordErrors.password}</p>
            )}
            {/* Strength hint */}
            {passwordForm.password && (
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4].map(level => (
                  <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${getPasswordStrengthColor(passwordForm.password || '', level)}`} />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-ink-body">Confirm Password</label>
            <div className="relative">
              <input
                id="password_confirmation"
                type={showConfirm ? 'text' : 'password'}
                value={passwordForm.password_confirmation || ''}
                onChange={e => {
                  setPasswordForm({ ...passwordForm, password_confirmation: e.target.value });
                  if (passwordErrors.password_confirmation) setPasswordErrors(prev => ({ ...prev, password_confirmation: undefined }));
                }}
                className={`w-full pr-10 px-4 py-2.5 bg-canvas border rounded-xl text-ink text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-taupe/20 ${
                  passwordErrors.password_confirmation ? 'border-danger bg-danger/5' : 'border-line focus:border-taupe'
                }`}
                placeholder="Re-enter password"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-body transition-colors">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.password_confirmation && (
              <p className="text-xs text-danger">{passwordErrors.password_confirmation}</p>
            )}
            {/* Match indicator */}
            {passwordForm.password_confirmation && passwordForm.password && (
              <p className={`text-xs mt-1 ${
                passwordForm.password === passwordForm.password_confirmation
                  ? 'text-sage' : 'text-danger'
              }`}>
                {passwordForm.password === passwordForm.password_confirmation
                  ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-line flex justify-end">
          <button
            type="submit"
            disabled={loadingPassword}
            className="bg-taupe hover:bg-[#8a7065] text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock size={15} />}
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Notification Preferences ─────────────────────────────────────────────────

const NOTIF_STORAGE_KEY = 'sutura_notif_prefs';

interface NotifPrefs {
  new_order: boolean;
  sms: boolean;
  email: boolean;
  weekly_summary: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  new_order: true,
  sms: false,
  email: true,
  weekly_summary: false,
};

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-taupe' : 'bg-line'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const update = (key: keyof NotifPrefs) => (val: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const rows: { key: keyof NotifPrefs; label: string; desc: string; icon: React.ElementType }[] = [
    { key: 'new_order',      label: 'New Order Notifications',  desc: 'Get notified whenever a new order is placed in your shop.',                   icon: Bell },
    { key: 'sms',           label: 'SMS Notifications',        desc: 'Receive order updates and reminders via SMS to your registered phone number.', icon: MessageSquare },
    { key: 'email',         label: 'Email Notifications',      desc: 'Receive order confirmations, status updates, and alerts via email.',          icon: Mail },
    { key: 'weekly_summary',label: 'Weekly Sales Summary',     desc: 'Get a weekly digest of your shop\'s sales performance every Monday morning.', icon: BarChart2 },
  ];

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 animate-in fade-in duration-200">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-ink">Notification Preferences</h2>
        <p className="text-xs text-ink-faint mt-0.5">
          Choose which alerts and summaries you want to receive.
        </p>
      </div>

      <div className="space-y-5">
        {rows.map(({ key, label, desc, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={15} className="text-taupe" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-ink-faint mt-0.5">{desc}</p>
              </div>
            </div>
            <Toggle id={`notif-${key}`} checked={prefs[key]} onChange={update(key)} />
          </div>
        ))}
      </div>

      <div className="pt-5 border-t border-line flex items-center justify-between mt-6">
        {saved ? (
          <span className="text-xs text-emerald-600 font-medium">Preferences saved.</span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSave}
          className="bg-taupe hover:bg-[#8a7065] text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
        >
          <Save size={15} />
          Save Preferences
        </button>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  const {
    user,
    roleName,
    activeTab,
    setActiveTab,
    tabs: baseTabs,
    personalForm,
    setPersonalForm,
    personalErrors,
    setPersonalErrors,
    passwordForm,
    setPasswordForm,
    passwordErrors,
    setPasswordErrors,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    loadingPersonal,
    loadingPassword,
    uploadingAvatar,
    togglingAvailability,
    isStaffOnly,
    staffProfile,
    handlePersonalSubmit,
    handlePasswordSubmit,
    handleAvatarUpload,
    handleToggleAvailability,
  } = useAccountSettings();

  // Extend tabs with Notifications (owner-only concern, shown to all for simplicity)
  const tabs = [...baseTabs, { id: 'notifications' as const, label: 'Notifications', icon: Bell }];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Your Account"
        title="Account Settings"
        description="Manage your personal details and security preferences."
      />

      {/* Avatar + Identity Card */}
      <div className="bg-surface border border-line rounded-2xl p-6 flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#9A8073] to-[#B26959] flex items-center justify-center text-white text-2xl font-bold select-none overflow-hidden">
            {user?.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-surface border border-line flex items-center justify-center cursor-pointer hover:bg-sunken transition-colors">
            {uploadingAvatar ? (
              <Loader2 size={12} className="animate-spin text-ink-muted" />
            ) : (
              <Camera size={12} className="text-ink-muted" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingAvatar}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) void handleAvatarUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-ink truncate">{user?.name}</p>
          <p className="text-sm text-ink-muted truncate">{user?.email}</p>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-sunken text-taupe text-[11px] font-semibold rounded-full capitalize tracking-wide">
            {roleName}
          </span>
        </div>
      </div>

      {/* Availability toggle — staff-only (matches ProfileController::
          toggleAvailability's own role gate), distinct from is_active
          (still employed): this is "on leave / out today" for the
          owner's own Staff Management view to see. */}
      {isStaffOnly && (
        <div className="bg-surface border border-line rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Available for New Assignments</p>
            <p className="text-xs text-ink-muted mt-0.5">
              Turn off if you&apos;re on leave or out today — the shop owner sees this on the Staff page, it won&apos;t remove you from jobs already assigned to you.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={staffProfile?.is_available !== false}
            disabled={togglingAvailability}
            onClick={() => handleToggleAvailability(!(staffProfile?.is_available !== false))}
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
              staffProfile?.is_available !== false ? 'bg-taupe' : 'bg-line'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                staffProfile?.is_available !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-sunken p-1 rounded-xl w-fit max-w-full">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-ink'
                  : 'text-ink-muted hover:text-ink-body'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Personal Info */}
      {(activeTab as string) === 'personal' && (
        <PersonalTab
          personalForm={personalForm}
          setPersonalForm={setPersonalForm}
          personalErrors={personalErrors}
          setPersonalErrors={setPersonalErrors}
          handlePersonalSubmit={handlePersonalSubmit}
          loadingPersonal={loadingPersonal}
          userEmail={user?.email || ''}
        />
      )}

      {/* Tab: Security */}
      {(activeTab as string) === 'security' && (
        <SecurityTab
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          passwordErrors={passwordErrors}
          setPasswordErrors={setPasswordErrors}
          handlePasswordSubmit={handlePasswordSubmit}
          loadingPassword={loadingPassword}
          showCurrent={showCurrent}
          setShowCurrent={setShowCurrent}
          showNew={showNew}
          setShowNew={setShowNew}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
        />
      )}
      {/* Tab: Notifications */}
      {(activeTab as string) === 'notifications' && <NotificationsTab />}

    </div>
  );
}
