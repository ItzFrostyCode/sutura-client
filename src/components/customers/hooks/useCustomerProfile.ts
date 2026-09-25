import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { CustomerData, MeasurementProfile, JobOrder, Appointment } from '../customerTypes';
import { isWalkInEmail } from '../customerHelpers';

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
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = useCallback(async () => {
    if (!store || !id) return;
    try {
      const res = await api.get(`/stores/${store.id}/customers/${id}`);
      const data = res.data.data;

      if (data?.customer) {
        setCustomer(data.customer);
        setEditName(data.customer.name || '');
        setEditEmail(isWalkInEmail(data.customer.email) ? '' : (data.customer.email || ''));
        setEditPhone(data.customer.phone || '');
        setEditNotes(data.customer.store_notes || '');
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
        name: editName,
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        notes: editNotes.trim() || null,
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
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    editNotes,
    setEditNotes,
    savingProfile,
    handleUpdateProfile,
    totalSpend,
    activeJobsCount,
    completedJobsCount,
    noShowCount,
    store,
    loadData,
  };
}
