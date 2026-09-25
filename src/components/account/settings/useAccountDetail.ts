import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';

export type EditableField = 'name' | 'phone' | 'password' | 'email';

export function useAccountDetail() {
  const { user, token, setAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openField, setOpenField] = useState<EditableField | null>(null);

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

  const openSheet = (field: EditableField) => {
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

  return {
    user,
    fileInputRef,
    openField,
    name,
    setName,
    phone,
    setPhone,
    savingProfile,
    profileMessage,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    savingPassword,
    passwordMessage,
    uploadingAvatar,
    openSheet,
    closeSheet,
    handleAvatarClick,
    handleAvatarChange,
    handleProfileSubmit,
    handlePasswordSubmit,
  };
}
