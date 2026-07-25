import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { ShopSettingsData } from '@/components/settings/SettingsRentalPolicies';

const DEFAULT_HOURS = {
  monday: { is_open: true, open: '09:00', close: '18:00' },
  tuesday: { is_open: true, open: '09:00', close: '18:00' },
  wednesday: { is_open: true, open: '09:00', close: '18:00' },
  thursday: { is_open: true, open: '09:00', close: '18:00' },
  friday: { is_open: true, open: '09:00', close: '18:00' },
  saturday: { is_open: false, open: '09:00', close: '18:00' },
  sunday: { is_open: false, open: '09:00', close: '18:00' },
};

export type SettingsTab = 'business_type' | 'basic_info' | 'social_links' | 'booking_flow' | 'map_coordinates';

export function useSettings() {
  const { shop, setAuth, user, token, staffProfile } = useAuthStore();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize tab from URL search parameters if valid
  const getInitialTab = (): SettingsTab => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as SettingsTab;
      const validTabs: SettingsTab[] = ['business_type', 'basic_info', 'social_links', 'booking_flow', 'map_coordinates'];
      if (validTabs.includes(tab)) return tab;
    }
    return 'basic_info';
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(getInitialTab());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLocationChange = () => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab') as SettingsTab;
        const validTabs: SettingsTab[] = ['business_type', 'basic_info', 'social_links', 'booking_flow', 'map_coordinates'];
        if (validTabs.includes(tab)) {
          setActiveTab(tab);
        }
      };
      
      handleLocationChange();
      window.addEventListener('popstate', handleLocationChange);
      return () => window.removeEventListener('popstate', handleLocationChange);
    }
  }, []);

  const savedDataRef = useRef<ShopSettingsData | null>(null);

  const [formData, setFormData] = useState<ShopSettingsData>({
    name: '',
    description: '',
    logo_path: '',
    banner_path: '',
    address: '',
    landmark: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    booking_policy: '',
    booking_questions: [] as string[],
    max_appointments_per_day: null,
    latitude: '',
    longitude: '',
    social_links: [] as { label: string; url: string }[],
    gallery_images: [] as string[],
    business_type: 'tailoring_shop',
    operating_hours: DEFAULT_HOURS as Record<string, { is_open: boolean; open: string; close: string }>,
    security_deposit: 0,
    rental_duration_days: 3,
    overdue_penalty_per_day: 0,
    fitting_fee: 0,
    fitting_limit: 3,
    reschedule_fee_percent: 0,
    change_reserved_hours: 24,
    change_reserved_fee_percent: 0,
    supported_couriers: [] as string[],
    specializations: [] as string[],
    is_featured: false,
    is_hidden: false,
  });

  const setFormDataWithDirty = (valueOrUpdater: ShopSettingsData | ((prev: ShopSettingsData) => ShopSettingsData)) => {
    if (typeof valueOrUpdater === 'function') {
      setFormData(prev => {
        const next = valueOrUpdater(prev);
        setIsDirty(true);
        return next;
      });
    } else {
      setFormData(valueOrUpdater);
      setIsDirty(true);
    }
  };

  useEffect(() => {
    if (shop) {
      api
        .get(`/shops/${shop.id}`)
        .then(res => {
          const s = res.data.data;
          const loaded: ShopSettingsData = {
            name: s.name || '',
            description: s.description || '',
            logo_path: s.logo_path || '',
            banner_path: s.banner_path || '',
            address: s.address || '',
            landmark: s.landmark || '',
            city: s.city || '',
            province: s.province || '',
            phone: s.phone || '',
            email: s.email || '',
            booking_policy: s.booking_policy || '',
            booking_questions: Array.isArray(s.booking_questions) ? s.booking_questions : [],
            max_appointments_per_day: s.max_appointments_per_day ?? null,
            latitude: s.latitude || '',
            longitude: s.longitude || '',
            social_links: Array.isArray(s.social_links)
              ? s.social_links
              : (s.social_links && typeof s.social_links === 'object'
                ? Object.entries(s.social_links).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), url: v as string }))
                : []),
            gallery_images: Array.isArray(s.gallery_images) ? s.gallery_images : [],
            business_type: s.business_type || 'tailoring_shop',
            operating_hours: s.operating_hours || DEFAULT_HOURS,
            security_deposit: s.security_deposit ?? 0,
            rental_duration_days: s.rental_duration_days ?? 3,
            overdue_penalty_per_day: s.overdue_penalty_per_day ?? 0,
            fitting_fee: s.fitting_fee ?? 0,
            fitting_limit: s.fitting_limit ?? 3,
            reschedule_fee_percent: s.reschedule_fee_percent ?? 0,
            change_reserved_hours: s.change_reserved_hours ?? 24,
            change_reserved_fee_percent: s.change_reserved_fee_percent ?? 0,
            supported_couriers: Array.isArray(s.supported_couriers) ? s.supported_couriers : [],
            specializations: Array.isArray(s.specializations) ? s.specializations : [],
            is_featured: !!s.is_featured,
            is_hidden: !!s.is_hidden,
          };
          setFormData(loaded);
          savedDataRef.current = loaded;
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          toast.error('Failed to load shop settings.');
          setLoading(false);
        });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormDataWithDirty(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBusinessTypeChange = (value: string) => {
    setFormDataWithDirty(prev => ({ ...prev, business_type: value }));
  };

  const handleSocialChange = (newLinks: { label: string; url: string }[]) => {
    setFormDataWithDirty(prev => ({ ...prev, social_links: newLinks }));
  };

  const handleHoursChange = (day: string, field: 'is_open' | 'open' | 'close', value: string | boolean) => {
    setFormDataWithDirty(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: { ...prev.operating_hours[day], [field]: value },
      },
    }));
  };

  // Single-image uploads (replace, not append — unlike gallery_images).
  // Genuinely new: there was previously no owner-facing way to set either
  // of these at all, `logo_path` wasn't even in UpdateShopRequest's
  // validation rules, so any attempt would have silently no-op'd.
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && shop) {
      const file = e.target.files[0];
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await api.post(`/shops/${shop.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormDataWithDirty(prev => ({ ...prev, logo_path: res.data.data.url }));
        toast.success('Logo uploaded — click Save Changes to apply.');
      } catch {
        toast.error('Failed to upload logo. Please try again.');
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && shop) {
      const file = e.target.files[0];
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await api.post(`/shops/${shop.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormDataWithDirty(prev => ({ ...prev, banner_path: res.data.data.url }));
        toast.success('Banner uploaded — click Save Changes to apply.');
      } catch {
        toast.error('Failed to upload banner. Please try again.');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && shop) {
      const file = e.target.files[0];
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await api.post(`/shops/${shop.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormDataWithDirty(prev => ({
          ...prev,
          gallery_images: [...prev.gallery_images, res.data.data.url],
        }));
        toast.success('Image uploaded successfully.');
      } catch {
        toast.error('Failed to upload image. Please try again.');
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormDataWithDirty(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      const res = await api.put(`/shops/${shop.id}`, formData);
      savedDataRef.current = formData;
      setIsDirty(false);
      toast.success('Shop settings saved successfully.');
      if (user && token) {
        setAuth(user, token, res.data.data, staffProfile || undefined);
      }
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (savedDataRef.current) {
      setFormData(savedDataRef.current);
      setIsDirty(false);
    }
  };

  return {
    shop,
    loading,
    saving,
    isDirty,
    activeTab,
    setActiveTab,
    formData,
    setFormDataWithDirty,
    handleChange,
    handleBusinessTypeChange,
    handleSocialChange,
    handleHoursChange,
    handleImageUpload,
    handleLogoUpload,
    handleBannerUpload,
    handleRemoveImage,
    handleSave,
    handleDiscard,
  };
}
