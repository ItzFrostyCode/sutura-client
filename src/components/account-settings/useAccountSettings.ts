import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore, StaffProfile } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { User, ShieldCheck } from 'lucide-react';

export type Tab = 'personal' | 'security' | 'notifications';

export function useAccountSettings() {
  const { user, token, setAuth, shop, staffProfile } = useAuthStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('personal');

  const [personalForm, setPersonalForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [personalErrors, setPersonalErrors] = useState<{ name?: string; phone?: string }>({});

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    current_password?: string;
    password?: string;
    password_confirmation?: string;
  }>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [userReady, setUserReady] = useState(!!user?.roles?.length);
  const [prevUser, setPrevUser] = useState(user);

  if (user !== prevUser) {
    setPrevUser(user);
    setPersonalForm({
      name: user?.name || '',
      phone: user?.phone || '',
    });
  }

  useEffect(() => {
    if (user?.roles?.length) {
      return;
    }
    api.get('/auth/me')
      .then(res => {
        // `/auth/me` responds with { user, shop, staff_profile } nested
        // under data — res.data.data is that whole wrapper, not the user
        // record itself. Passing it straight to setAuth() stored a user
        // object with no .name/.roles/.phone, which silently corrupted the
        // *global* auth store (not just this page): Full Name and Phone
        // showed blank here, and the sidebar's owner-only sections
        // (Design Catalog, Services, Staff, Reports, Branches) disappeared
        // everywhere else in the app too, since isShopOwner reads
        // user?.roles?.[0]?.name. Confirmed live on a hard navigation to
        // this page — dashboard/layout.tsx's own bootstrap fetch races this
        // same call, and whichever resolves last wins the store.
        if (token && res.data.success) {
          const { user: freshUser, shop: freshShop, staff_profile } = res.data.data;
          setAuth(freshUser, token, freshShop ?? shop ?? undefined, staff_profile ?? staffProfile ?? undefined);
        }
      })
      .catch(() => {})
      .finally(() => setUserReady(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const validatePersonal = () => {
    const errors: typeof personalErrors = {};
    if (!personalForm.name.trim()) errors.name = 'Full name is required.';
    else if (personalForm.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
    setPersonalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors: typeof passwordErrors = {};
    if (!passwordForm.current_password) errors.current_password = 'Current password is required.';
    if (!passwordForm.password) errors.password = 'New password is required.';
    else if (passwordForm.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (passwordForm.password !== passwordForm.password_confirmation)
      errors.password_confirmation = 'Passwords do not match.';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePersonalSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validatePersonal()) return;
    setLoadingPersonal(true);
    try {
      const res = await api.put('/profile/personal', {
        name: personalForm.name,
        phone: personalForm.phone,
      });
      toast.success('Personal details updated successfully.');
      if (user && token) {
        setAuth(res.data.data, token, shop ?? undefined, staffProfile || undefined);
      }
    } catch {
      toast.error('Failed to update personal details. Please try again.');
    } finally {
      setLoadingPersonal(false);
    }
  };

  // Backend route (`POST /profile/upload`, ProfileController::uploadImage)
  // has existed since before this session, and User already has a
  // `profile_picture` column read by Customers/Staff Management/the public
  // shop page's owner card — but nothing anywhere ever called this route,
  // so the field could never actually get a value. This is the only place
  // it makes sense to set it from: every role (owner, staff, branch_manager)
  // already reaches this same shared Account Settings page.
  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('type', 'avatar');
      fd.append('file', file);
      const res = await api.post('/profile/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Profile photo updated.');
      if (user && token) {
        setAuth(res.data.data, token, shop ?? undefined, staffProfile || undefined);
      }
    } catch {
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ProfileController::toggleAvailability (PUT /profile/availability) has
  // existed as long as the avatar upload route, but nothing in the frontend
  // ever called it either — same "backend built, no consumer" gap. Staff-only
  // (matches the backend's own `$user->hasRole('staff')` check — not shown
  // to branch_manager or shop_owner, who don't have this field at all).
  const handleToggleAvailability = async (nextValue: boolean) => {
    setTogglingAvailability(true);
    try {
      const res = await api.put('/profile/availability', { is_available: nextValue });
      toast.success(nextValue ? 'You\'re marked as available for new assignments.' : 'You\'re marked as on leave / unavailable.');
      if (user && token) {
        setAuth(user, token, shop ?? undefined, { ...(staffProfile as StaffProfile), ...res.data.data });
      }
    } catch {
      toast.error('Failed to update availability. Please try again.');
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handlePasswordSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoadingPassword(true);
    try {
      await api.put('/profile/password', passwordForm);
      toast.success('Password updated successfully.');
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setPasswordErrors({});
    } catch {
      toast.error('Failed to update password. Please check your current password.');
    } finally {
      setLoadingPassword(false);
    }
  };

  const isShopOwner =
    user?.roles?.some(r => r.name === 'shop_owner') ||
    !!shop?.id;

  // Matches ProfileController::toggleAvailability's own gate exactly —
  // branch_manager and shop_owner don't have this field at all, only plain
  // staff.
  const isStaffOnly = user?.roles?.some(r => r.name === 'staff') && !isShopOwner;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  const roleName = user?.roles?.[0]?.name?.replaceAll('_', ' ') || 'Shop Owner';

  return {
    user,
    roleName,
    activeTab,
    setActiveTab,
    tabs,
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
    userReady,
    isShopOwner,
    isStaffOnly,
    shop,
    staffProfile,
    handlePersonalSubmit,
    handlePasswordSubmit,
    handleAvatarUpload,
    handleToggleAvailability,
  };
}
