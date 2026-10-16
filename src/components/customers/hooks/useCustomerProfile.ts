import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { CustomerData, MeasurementProfile, JobOrder, Appointment } from '../customerTypes';

export function useCustomerProfile(id: string) {
  const { store } = useAuthStore();
  const toast = useToast();

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementProfile[]>([]);
  const [jobs, setJobs] = useState<JobOrder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!store || !id) return;
    try {
      const res = await api.get(`/stores/${store.id}/customers/${id}`);
      const data = res.data.data;

      if (data?.customer) {
        setCustomer(data.customer);
        setEditName(data.customer.name || '');
        setEditPhone(data.customer.phone || '');
        setMeasurements(data.measurements || []);
        setJobs(data.jobs || []);
        setAppointments(data.appointments || []);
      } else {
        setCustomer({
          id: Number.parseInt(id, 10),
          name: `Client #${id}`,
          email: '',
          phone: '',
          created_at: new Date().toISOString(),
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load profile data', err);
      setLoading(false);
    }
  }, [store, id]);

  useEffect(() => {
    if (store && id) {
      setTimeout(() => {
        void loadData();
      }, 0);
    }
  }, [store, id, loadData]);

  const handleUpdateProfile = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!store || !customer) return;

    setSavingProfile(true);
    try {
      await api.put(`/stores/${store.id}/customers/${customer.id}`, {
        name: editName.trim(),
        phone: editPhone.trim() || null,
      });
      setIsEditingProfile(false);
      toast.success('Profile updated successfully.');
      void loadData();
    } catch (err) {
      console.error('Failed to update customer details', err);
      toast.error('Failed to update profile info. Please ensure email is valid and unique.');
    } finally {
      setSavingProfile(false);
    }
  };

  /** Takes the customer off the Client Book. The server refuses (and says why) when they have orders. */
  const deleteCustomer = async (): Promise<boolean> => {
    if (!store || !customer) return false;
    setDeleting(true);
    try {
      await api.delete(`/stores/${store.id}/customers/${customer.id}`);
      toast.success('Customer removed successfully.');
      return true;
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Failed to remove customer.');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const totalSpend = customer?.total_spend ?? jobs.reduce((sum, job) => sum + Number.parseFloat(job.total_amount as string || '0'), 0);
  const activeJobsCount = customer?.active_jobs ?? jobs.filter((j) => !['completed', 'cancelled'].includes(j.status)).length;
  const completedJobsCount = customer?.completed_jobs ?? jobs.filter((j) => j.status === 'completed').length;
  const noShowCount = customer?.no_show_count ?? appointments.filter((a) => a.status === 'no_show').length;

  return {
    customer,
    measurements,
    jobs,
    appointments,
    loading,
    isEditingProfile,
    setIsEditingProfile,
    editName,
    setEditName,
    editPhone,
    setEditPhone,
    savingProfile,
    isDeleteOpen,
    setIsDeleteOpen,
    deleting,
    deleteCustomer,
    handleUpdateProfile,
    totalSpend,
    activeJobsCount,
    completedJobsCount,
    noShowCount,
    store,
    loadData,
  };
}
