'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  ArrowLeft, Loader2, Edit2, X, Mail, Phone, Clock,
  DollarSign, Scissors, Package, Calendar
} from 'lucide-react';
import { CustomerData, MeasurementProfile, JobOrder, Appointment } from '@/components/customers/customerTypes';
import { isWalkInEmail } from '@/components/customers/customerHelpers';
import CustomerOverviewTab from '@/components/customers/CustomerOverviewTab';
import CustomerMeasurementsTab from '@/components/customers/CustomerMeasurementsTab';
import CustomerJobsTab from '@/components/customers/CustomerJobsTab';
import CustomerAppointmentsTab from '@/components/customers/CustomerAppointmentsTab';
import CustomerHistoryTab from '@/components/customers/CustomerHistoryTab';
import { useToast } from '@/context/ToastContext';

export default function CustomerProfilePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { shop } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementProfile[]>([]);
  const [jobs, setJobs] = useState<JobOrder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'orders' | 'appointments' | 'history'>('overview');
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = useCallback(async () => {
    if (!shop) return;
    try {
      const [resCustomers, resMeasurements, resJobs, resAppointments] = await Promise.all([
        api.get(`/shops/${shop.id}/customers`),
        api.get(`/shops/${shop.id}/measurements`),
        api.get(`/shops/${shop.id}/jobs`),
        api.get(`/shops/${shop.id}/appointments`)
      ]);

      const allCust: CustomerData[] = resCustomers.data.data || [];
      const found = allCust.find((c: CustomerData) => c.id.toString() === id);
      
      if (found) {
        setCustomer(found);
        setEditName(found.name || '');
        setEditEmail(isWalkInEmail(found.email) ? '' : (found.email || ''));
        setEditPhone(found.phone || '');
        setEditNotes(found.shop_notes || '');
      } else {
        setCustomer({
          id: Number.parseInt(id, 10),
          name: `Client #${id}`,
          email: '',
          phone: '',
          created_at: new Date().toISOString()
        });
      }

      // Filter measurements
      const allMeas: MeasurementProfile[] = resMeasurements.data.data || [];
      setMeasurements(allMeas.filter((m: MeasurementProfile) => m.customer.id.toString() === id));

      // Filter job orders
      const allJobs: JobOrder[] = resJobs.data.data.data || resJobs.data.data || [];
      setJobs(allJobs.filter((j: JobOrder) => j.customer?.id.toString() === id));

      // Filter appointments
      const allAppt: Appointment[] = resAppointments.data.data || [];
      setAppointments(allAppt.filter((a: Appointment) => a.customer?.id.toString() === id));

      setLoading(false);
    } catch (err) {
      console.error('Failed to load profile data', err);
      setLoading(false);
    }
  }, [shop, id]);

  useEffect(() => {
    if (shop && id) {
      setTimeout(() => {
        void loadData();
      }, 0);
    }
  }, [shop, id, loadData]);

  const handleUpdateProfile = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shop || !customer) return;

    setSavingProfile(true);
    try {
      const res = await api.put(`/shops/${shop.id}/customers/${customer.id}`, {
        name: editName,
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        notes: editNotes.trim() || null
      });
      const updatedCust = res.data.data;
      // The update endpoint doesn't echo shop_notes back (it lives on the
      // shop_customers pivot, not the User row it returns) — merge locally.
      setCustomer(prev => prev ? { ...prev, ...updatedCust, shop_notes: editNotes.trim() || null } : null);
      setEditName(updatedCust.name || '');
      setEditEmail(isWalkInEmail(updatedCust.email) ? '' : (updatedCust.email || ''));
      setEditPhone(updatedCust.phone || '');
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Failed to update customer details', err);
      toast.error('Failed to update profile info. Please ensure email is valid and unique.');
    } finally {
      setSavingProfile(false);
    }
  };

  const calculateTotalSpend = () => {
    return jobs.reduce((sum, job) => sum + Number.parseFloat(job.total_amount as string || '0'), 0);
  };

  const getActiveJobsCount = () => {
    return jobs.filter(j => !['completed', 'cancelled'].includes(j.status)).length;
  };

  const getCompletedJobsCount = () => {
    return jobs.filter(j => j.status === 'completed').length;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#A8A19A]">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-taupe mx-auto" />
        <span className="text-sm font-medium">Loading customer profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Panel */}
      <div className="flex items-start justify-between bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#827A73] hover:text-[#2D2A26] transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">{customer?.name}</h1>
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="p-1.5 rounded-lg border border-[#EBE6E0] text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#2D2A26] transition-all cursor-pointer"
                title="Edit Client Info"
              >
                <Edit2 size={13} />
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#827A73] mt-1.5 flex-wrap">
              {customer?.email && !isWalkInEmail(customer.email) && (
                <span className="flex items-center gap-1">
                  <Mail size={12} /> {customer.email}
                </span>
              )}
              {customer?.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {customer.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={12} /> Client since {new Date(customer?.created_at || '').toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Value', value: `₱${calculateTotalSpend().toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Active Projects', value: getActiveJobsCount(), icon: Scissors, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Completed Orders', value: getCompletedJobsCount(), icon: Package, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
          { label: 'Appointments', value: appointments.length, icon: Calendar, color: 'bg-amber-50 text-amber-700 border-amber-100' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-[#EBE6E0] rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] font-semibold text-[#827A73] uppercase tracking-wider block">{stat.label}</span>
                <span className="text-lg font-bold text-[#2D2A26] mt-0.5 block">{stat.value}</span>
              </div>
              <div className={`p-2.5 rounded-lg border ${stat.color} shrink-0`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile Edit Dialog */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-[#2D2A26]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBE6E0] rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-[#EBE6E0] pb-3 mb-4">
              <h3 className="text-base font-bold text-[#2D2A26]">Edit Customer Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-[#A8A19A] hover:text-[#2D2A26] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="customer-edit-name" className="block text-xs font-semibold text-[#524A44] mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  id="customer-edit-name"
                  type="text" 
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe" 
                />
              </div>
              <div>
                <label htmlFor="customer-edit-email" className="block text-xs font-semibold text-[#524A44] mb-1">
                  Email Address <span className="text-[10px] text-[#827A73] font-normal">(Optional)</span>
                </label>
                <input 
                  id="customer-edit-email"
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe" 
                />
              </div>
              <div>
                <label htmlFor="customer-edit-phone" className="block text-xs font-semibold text-[#524A44] mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input 
                  id="customer-edit-phone"
                  type="text" 
                  required
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="e.g. +639..."
                  className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                />
              </div>
              <div>
                <label htmlFor="customer-edit-notes" className="block text-xs font-semibold text-[#524A44] mb-1">
                  Shop Notes <span className="text-[10px] text-[#827A73] font-normal">(Private — visible to shop staff only)</span>
                </label>
                <textarea
                  id="customer-edit-notes"
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  maxLength={2000}
                  placeholder="e.g. Prefers loose-fit sleeves, always pays in cash..."
                  className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-[#EBE6E0]">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-[#EBE6E0] rounded-lg text-xs font-semibold text-[#827A73] hover:bg-[#FAF6F3] cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingProfile}
                  className="px-4 py-2 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex border-b border-[#EBE6E0] gap-4">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'measurements', label: 'Measurements & Specs' },
          { id: 'orders', label: `Job Orders (${jobs.length})` },
          { id: 'appointments', label: `Appointments (${appointments.length})` },
          { id: 'history', label: 'Activity History' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'measurements' | 'orders' | 'appointments' | 'history')}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 cursor-pointer ${
              activeTab === tab.id
                ? 'border-taupe text-[#2D2A26]'
                : 'border-transparent text-[#A8A19A] hover:text-[#524A44]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <CustomerOverviewTab
            customer={customer}
            jobs={jobs}
            measurements={measurements}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'measurements' && shop && customer && (
          <CustomerMeasurementsTab
            customerId={customer.id}
            customerName={customer.name}
            shopId={shop.id}
            measurements={measurements}
            onReload={loadData}
          />
        )}

        {activeTab === 'orders' && (
          <CustomerJobsTab jobs={jobs} />
        )}

        {activeTab === 'appointments' && (
          <CustomerAppointmentsTab appointments={appointments} />
        )}

        {activeTab === 'history' && (
          <CustomerHistoryTab
            customer={customer}
            measurements={measurements}
            jobs={jobs}
            appointments={appointments}
          />
        )}
      </div>
    </div>
  );
}
