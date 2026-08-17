import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { CustomerData } from './customerTypes';
import { isWalkInCustomer, isWalkInEmail } from './customerHelpers';

export { type CustomerData };

export function useCustomers() {
  const router = useRouter();
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online' | 'walkin' | 'b2b_suki' | 'reseller' | 'walk_in_retail'>('all');

  useEffect(() => {
    if (!shop) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    let active = true;
    api.get(`/shops/${shop.id}/customers`)
      .then(res => {
        if (active) {
          setCustomers(res.data.data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [shop, user]);

  const handleAddCustomer = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    setIsSubmitting(true);
    setError('');
    
    const payload = {
      name: formData.name,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
    };
    
    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/customers/${editingId}`, payload);
        setCustomers(prev => prev.map(c => c.id === editingId ? { ...c, ...res.data.data } : c));
        toast.success('Customer updated successfully.');
      } else {
        const res = await api.post(`/shops/${shop.id}/customers`, payload);
        const returnedId = res.data.data.id;
        const alreadyListed = customers.some(c => c.id === returnedId);
        setCustomers(prev => {
          if (alreadyListed) {
            return prev.map(c => c.id === returnedId ? { ...c, ...res.data.data } : c);
          }
          return [{ ...res.data.data, active_jobs: 0, completed_jobs: 0, total_spend: 0, is_walk_in: true, intake_channel: 'walk_in' }, ...prev];
        });
        toast.success(alreadyListed ? 'Matched an existing customer with that phone number.' : 'Customer added successfully.');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '' });
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent, customer: CustomerData) => {
    e.stopPropagation();
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      email: isWalkInEmail(customer.email) ? '' : customer.email,
      phone: customer.phone || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/customers/${deletingId}`);
      setCustomers(prev => prev.filter(c => c.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      toast.success('Customer removed successfully.');
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      toast.error(errorResponse.response?.data?.message || 'Failed to remove customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '' });
    setError('');
  };

  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && !isWalkInEmail(c.email) && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.replace(/\s+/g, '').includes(search.replace(/\s+/g, '')));

    if (!matchesSearch) return false;
    
    const isWalkIn = isWalkInCustomer(c);
    if (filterType === 'online') return !isWalkIn;
    if (filterType === 'walkin') return isWalkIn;
    // Suki type filters
    if (filterType === 'b2b_suki') return c.suki_tag === 'b2b_suki';
    if (filterType === 'reseller') return c.suki_tag === 'reseller';
    if (filterType === 'walk_in_retail') return c.suki_tag === 'walk_in_retail';
    return true;
  });

  return {
    router,
    customers,
    loading,
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    editingId,
    setEditingId,
    deletingId,
    setDeletingId,
    isSubmitting,
    formData,
    setFormData,
    error,
    setError,
    filterType,
    setFilterType,
    isWalkInEmail,
    handleAddCustomer,
    handleEditClick,
    handleDeleteClick,
    confirmDelete,
    closeModal,
    filtered,
  };
}
