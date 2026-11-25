'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import PageHeader from '@/components/shared/PageHeader';
import AdminAvatar from '@/components/admin/AdminAvatar';
import { useAdminAuthStore, type AdminUser } from '@/store/useAdminAuthStore';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import { PASSWORD_RULES, meetsPasswordRules } from '@/lib/passwordRules';

const LABEL = 'mb-1.5 block text-xs font-semibold text-ink';
const FIELD = 'admin-field h-11 w-full px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-taupe focus:outline-none disabled:bg-sunken disabled:text-ink-muted';
const PRIMARY = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer';
const MAX_PHOTO_MB = 5;

function PasswordField({ id, label, value, onChange, autoComplete }: Readonly<{
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string;
}>) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={LABEL}>{label}</label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete} className={`${FIELD} pr-11`} />
        <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-sunken hover:text-ink cursor-pointer">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

/**
 * The System Admin's own account: photo, name and phone, and password. Uses
 * the same /profile endpoints every signed-in account has (ProfileController),
 * through the admin's own session (adminApi). The email is the admin login, so
 * it is shown but not editable here.
 */
export default function AdminSettingsPage() {
  const { user, updateUser } = useAdminAuthStore();
  const toast = useToast();

  // ── Profile ──
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setPhone(user.phone ?? '');
  }, [user]);

  const keepAdminShape = (fresh: AdminUser) => updateUser({ ...user, ...fresh, roles: fresh.roles ?? user?.roles ?? [] });

  const profileDirty = !!user && (name.trim() !== (user.name ?? '') || phone.trim() !== (user.phone ?? ''));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Enter your name.'); return; }
    setSavingProfile(true);
    try {
      const res = await adminApi.put('/profile/personal', { name: name.trim(), phone: phone.trim() || null });
      keepAdminShape(res.data.data);
      toast.success('Profile saved.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast.error('Use a JPG, PNG or WebP image.'); return; }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { toast.error(`The photo must be ${MAX_PHOTO_MB} MB or smaller.`); return; }
    const form = new FormData();
    form.append('type', 'avatar');
    form.append('file', file);
    setUploading(true);
    try {
      const res = await adminApi.post('/profile/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      keepAdminShape(res.data.data);
      toast.success('Photo updated.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload the photo.'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── Password ──
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSavePassword = current.length > 0 && meetsPasswordRules(next) && confirm === next && next !== current;

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSavePassword) return;
    setSavingPassword(true);
    try {
      await adminApi.put('/profile/password', { current_password: current, password: next, password_confirmation: confirm });
      setCurrent(''); setNext(''); setConfirm('');
      toast.success('Password changed. Your other sessions were signed out.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change your password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Account settings" description="Your own admin account: how you appear in the console and how you sign in." />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* Profile */}
        <form onSubmit={saveProfile} className="admin-card p-5 sm:p-6" aria-labelledby="admin-profile-title">
          <h2 id="admin-profile-title" className="text-base font-semibold text-ink">Profile</h2>

          <div className="mt-5 flex items-center gap-4">
            <div className="relative">
              <AdminAvatar name={user.name} src={user.profile_picture} className="h-20 w-20 text-2xl" />
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-ink/60">
                  <Loader2 size={20} className="animate-spin text-white" aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="admin-photo"
                onChange={(e) => uploadPhoto(e.target.files?.[0])} disabled={uploading} />
              <label htmlFor="admin-photo"
                className={`admin-field inline-flex min-h-10 items-center gap-2 px-4 text-sm font-semibold text-ink transition-colors hover:bg-[#FAF8F5] ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
                <Camera size={15} aria-hidden="true" /> {user.profile_picture ? 'Change photo' : 'Upload photo'}
              </label>
              <p className="mt-1.5 text-xs text-ink-muted">JPG, PNG or WebP, up to {MAX_PHOTO_MB} MB. Shown in the console sidebar and header.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-name" className={LABEL}>Full name</label>
              <input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} autoComplete="name" className={FIELD} required />
            </div>
            <div>
              <label htmlFor="admin-phone" className={LABEL}>Phone number <span className="font-normal text-ink-muted">(optional)</span></label>
              <input id="admin-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} autoComplete="tel"
                placeholder="e.g. +63 912 345 6789" className={FIELD} />
            </div>
            <div>
              <label htmlFor="admin-email" className={LABEL}>Email</label>
              <div className="relative">
                <input id="admin-email" value={user.email} disabled className={`${FIELD} pr-10`} />
                <Lock size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">This is the admin login, so it can&apos;t be changed here.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={!profileDirty || savingProfile} className={PRIMARY}>
              {savingProfile && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>

        {/* Password */}
        <form onSubmit={savePassword} className="admin-card p-5 sm:p-6" aria-labelledby="admin-password-title">
          <h2 id="admin-password-title" className="text-base font-semibold text-ink">Password</h2>
          <p className="mt-1 text-sm text-ink-muted">Changing it signs you out everywhere else. This browser stays signed in.</p>

          <div className="mt-5 space-y-4">
            <PasswordField id="admin-current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
            <div>
              <PasswordField id="admin-new" label="New password" value={next} onChange={setNext} autoComplete="new-password" />
              <ul className="mt-3 space-y-1.5" aria-label="Password requirements">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(next);
                  return (
                    <li key={rule.key} className="flex items-center gap-2 text-xs">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${met ? 'border-ink bg-ink text-white' : 'border-line-strong text-transparent'}`}>
                        <Check size={10} strokeWidth={3} aria-hidden="true" />
                      </span>
                      <span className={met ? 'text-ink' : 'text-ink-muted'}>{rule.label}</span>
                    </li>
                  );
                })}
                {next.length > 0 && next === current && (
                  <li className="text-xs text-danger">Use a password different from your current one.</li>
                )}
              </ul>
            </div>
            <div>
              <PasswordField id="admin-confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
              {mismatch && <p className="mt-1.5 text-xs text-danger" role="alert">The passwords don&apos;t match.</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={!canSavePassword || savingPassword} className={PRIMARY}>
              {savingPassword && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {savingPassword ? 'Changing…' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
