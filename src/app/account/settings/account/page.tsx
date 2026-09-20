'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  User as UserIcon, Mail, Phone, Camera, Loader2,
  CheckCircle2, AlertCircle, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getMediaUrl } from '@/lib/media';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';

// Real account management — edit your own name/phone/avatar/password. Only
// exposes what ProfileController actually supports for any authenticated
// user today — per customer-module/customer/01_account_and_auth/26's own
// Implementation Status note, phone OTP verification, notification-
// preference toggles, a saved address book, and the Measurement Card
// export are all still unbuilt on the backend, so they're deliberately not
// shown here as if they exist. Email has no edit endpoint either — its
// sheet is honest about that instead of faking an editable field.
//
// Row + bottom-sheet pattern: tapping "Name"/"Phone"/"Email"/"Change
// Password" opens that field's editor as a sheet sliding up from the
// bottom (rounded top corners, centered "Edit {field}" title, field below,
// auto-focused so the keyboard is already up) — not an inline accordion
// that pushes the rest of the list down.
export default function AccountDetailPage() {
  const { user, token, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openField, setOpenField] = useState<'name' | 'phone' | 'password' | 'email' | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (!user) return null;

  const openSheet = (field: 'name' | 'phone' | 'password' | 'email') => {
    setProfileMessage(null);
    setPasswordMessage(null);
    setOpenField(field);
  };

  const closeSheet = () => {
    setOpenField(null);
    setProfileMessage(null);
    setPasswordMessage(null);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('type', 'avatar');
      fd.append('file', file);
      const res = await api.post('/profile/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAuth(res.data.data, token);
    } catch {
      setProfileMessage({ type: 'error', text: 'Failed to upload photo. Please try a JPG/PNG/WEBP under 5MB.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await api.put('/profile/personal', { name, phone });
      setAuth(res.data.data, token);
      setOpenField(null);
    } catch {
      setProfileMessage({ type: 'error', text: 'Failed to update. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      await api.put('/profile/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOpenField(null);
    } catch {
      setPasswordMessage({ type: 'error', text: 'Failed to update password — check your current password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const sheetTitle: Record<NonNullable<typeof openField>, string> = {
    name: 'Edit Name',
    phone: 'Edit Phone',
    email: 'Email',
    password: 'Change Password',
  };

  return (
    <div>
      <AccountHeader title="Account Settings" backHref="/account/settings" />

      {/* Avatar + identity — centered */}
      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col items-center text-center mb-5">
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={uploadingAvatar}
          className="relative w-16 h-16 rounded-full bg-sunken overflow-hidden shrink-0 group"
          title="Change photo"
        >
          {user.profile_picture ? (
            <Image src={getMediaUrl(user.profile_picture)} alt="" fill unoptimized className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon size={24} className="text-ink-faint" />
            </div>
          )}
          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {uploadingAvatar ? <Loader2 size={16} className="text-white animate-spin" /> : <Camera size={16} className="text-white" />}
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="hidden" />
        <div className="min-w-0 mt-3">
          <h2 className="text-base font-bold text-ink truncate">{user.name}</h2>
          <p className="text-xs text-ink-muted flex items-center justify-center gap-1 mt-0.5 truncate">
            <Mail size={11} className="shrink-0" /> {user.email}
          </p>
        </div>
      </div>

      <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2 ml-1">Account</p>
      <div className="bg-surface border border-line rounded-2xl overflow-hidden divide-y divide-line">

        {/* My Profile — same photo-upload action as the avatar card above,
            offered again here as its own row to match the rest of the list. */}
        <button type="button" onClick={handleAvatarClick} disabled={uploadingAvatar} className="w-full flex items-center gap-3 px-4 py-3.5">
          <span className="flex-1 text-left text-sm text-ink">My Profile</span>
          {uploadingAvatar ? <Loader2 size={15} className="text-ink-faint animate-spin" /> : <ChevronRight size={15} className="text-ink-faint" />}
        </button>

        <button type="button" onClick={() => openSheet('name')} className="w-full flex items-center gap-3 px-4 py-3.5">
          <span className="flex-1 text-left text-sm text-ink">Name</span>
          <span className="text-xs text-ink-muted">{user.name}</span>
          <ChevronRight size={15} className="text-ink-faint" />
        </button>

        <button type="button" onClick={() => openSheet('phone')} className="w-full flex items-center gap-3 px-4 py-3.5">
          <span className="flex-1 text-left text-sm text-ink">Phone</span>
          <span className="text-xs text-ink-muted">{user.phone || 'Not set'}</span>
          <ChevronRight size={15} className="text-ink-faint" />
        </button>

        <button type="button" onClick={() => openSheet('email')} className="w-full flex items-center gap-3 px-4 py-3.5">
          <span className="flex-1 text-left text-sm text-ink">Email</span>
          <span className="text-xs text-ink-muted truncate max-w-[140px]">{user.email}</span>
          <ChevronRight size={15} className="text-ink-faint" />
        </button>

        <button type="button" onClick={() => openSheet('password')} className="w-full flex items-center gap-3 px-4 py-3.5">
          <span className="flex-1 text-left text-sm text-ink">Change Password</span>
          <ChevronRight size={15} className="text-ink-faint" />
        </button>
      </div>

      {/* Bottom sheet — backdrop + panel, rendered once, content swapped by openField */}
      {openField && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close"
            onClick={closeSheet}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-in fade-in duration-200"
          />
          <div
            className="relative bg-surface rounded-t-2xl px-5 pt-3 animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="h-1 w-9 rounded-full bg-line-strong mx-auto mb-4" />
            <h2 className="text-base font-bold text-ink text-center mb-5">{sheetTitle[openField]}</h2>

            {openField === 'name' && (
              <form onSubmit={handleProfileSubmit}>
                <input
                  id="acct-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 bg-canvas border border-line rounded-lg text-[16px] text-ink focus:outline-none focus:border-taupe"
                />
                {profileMessage && (
                  <div className={`flex items-center gap-2 mt-3 text-xs px-3 py-2 rounded-lg ${profileMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/5 text-danger'}`}>
                    {profileMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {profileMessage.text}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button type="submit" disabled={savingProfile} className="flex-1 h-11 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg disabled:opacity-60">
                    {savingProfile ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" onClick={closeSheet} className="flex-1 h-11 border border-line text-ink-muted text-sm font-medium rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {openField === 'phone' && (
              <form onSubmit={handleProfileSubmit}>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    id="acct-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09XXXXXXXXX"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 bg-canvas border border-line rounded-lg text-[16px] text-ink focus:outline-none focus:border-taupe"
                  />
                </div>
                {profileMessage && (
                  <div className={`flex items-center gap-2 mt-3 text-xs px-3 py-2 rounded-lg ${profileMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/5 text-danger'}`}>
                    {profileMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {profileMessage.text}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button type="submit" disabled={savingProfile} className="flex-1 h-11 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg disabled:opacity-60">
                    {savingProfile ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" onClick={closeSheet} className="flex-1 h-11 border border-line text-ink-muted text-sm font-medium rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {openField === 'email' && (
              <div>
                <p className="text-sm text-ink-muted leading-relaxed text-center">
                  Changing your email isn&apos;t supported yet — contact support if you need it updated.
                </p>
                <button type="button" onClick={closeSheet} className="w-full h-11 border border-line text-ink-muted text-sm font-medium rounded-lg mt-4">
                  Close
                </button>
              </div>
            )}

            {openField === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label htmlFor="acct-current-pw" className="block text-xs font-semibold text-ink-muted mb-1">Current Password</label>
                  <input
                    id="acct-current-pw"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3 py-2.5 bg-canvas border border-line rounded-lg text-[16px] text-ink focus:outline-none focus:border-taupe"
                  />
                </div>
                <div>
                  <label htmlFor="acct-new-pw" className="block text-xs font-semibold text-ink-muted mb-1">New Password</label>
                  <input
                    id="acct-new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3 py-2.5 bg-canvas border border-line rounded-lg text-[16px] text-ink focus:outline-none focus:border-taupe"
                  />
                </div>
                <div>
                  <label htmlFor="acct-confirm-pw" className="block text-xs font-semibold text-ink-muted mb-1">Confirm New Password</label>
                  <input
                    id="acct-confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3 py-2.5 bg-canvas border border-line rounded-lg text-[16px] text-ink focus:outline-none focus:border-taupe"
                  />
                </div>

                {passwordMessage && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${passwordMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/5 text-danger'}`}>
                    {passwordMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {passwordMessage.text}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={savingPassword} className="flex-1 h-11 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg disabled:opacity-60">
                    {savingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                  <button type="button" onClick={closeSheet} className="flex-1 h-11 border border-line text-ink-muted text-sm font-medium rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
