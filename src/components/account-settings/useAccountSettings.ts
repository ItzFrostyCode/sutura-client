import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { User, ShieldCheck, Building2 } from 'lucide-react';

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
        if (token) setAuth(res.data.data, token, shop ?? undefined, staffProfile || undefined);
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
    userReady,
    isShopOwner,
    shop,
    handlePersonalSubmit,
    handlePasswordSubmit,
  };
}
