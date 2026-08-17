'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ArrowLeft, Loader2, Edit2, X, Mail, Phone, Clock,
  DollarSign, Scissors, Package, Calendar, UserX,
  User, Ruler, History
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
    if (!shop || !id) return;
    try {
      const res = await api.get(`/shops/${shop.id}/customers/${id}`);
      const data = res.data.data;
      
      if (data?.customer) {
        setCustomer(data.customer);
        setEditName(data.customer.name || '');
        setEditEmail(isWalkInEmail(data.customer.email) ? '' : (data.customer.email || ''));
        setEditPhone(data.customer.phone || '');
        setEditNotes(data.customer.shop_notes || '');
        setMeasurements(data.measurements || []);
        setJobs(data.jobs || []);
        setAppointments(data.appointments || []);
      } else {
        setCustomer({
          id: Number.parseInt(id, 10),
          name: `Client #${id}`,
          email: '',
          phone: '',
          created_at: new Date().toISOString()
        });
      }

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
      await api.put(`/shops/${shop.id}/customers/${customer.id}`, {
        name: editName,
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        notes: editNotes.trim() || null
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

  const calculateTotalSpend = () => {
    return customer?.total_spend ?? jobs.reduce((sum, job) => sum + Number.parseFloat(job.total_amount as string || '0'), 0);
  };

  const getActiveJobsCount = () => {
    return customer?.active_jobs ?? jobs.filter(j => !['completed', 'cancelled'].includes(j.status)).length;
  };

  const getCompletedJobsCount = () => {
    return customer?.completed_jobs ?? jobs.filter(j => j.status === 'completed').length;
  };

  const getNoShowCount = () => {
    return customer?.no_show_count ?? appointments.filter(a => a.status === 'no_show').length;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-ink-faint">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-taupe mx-auto" />
        <span className="text-sm font-medium">Loading customer profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button 
              type="button"
              onClick={() => router.back()}
              className="h-10 w-10 rounded-xl bg-canvas border border-line text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer"
              title="Back to Client Book"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">{customer?.name}</h1>
                {customer?.suki_tag && (() => {
                  const tagMap: Record<string, { label: string; badgeCls: string }> = {
                    b2b_suki: { label: 'B2B Suki ⭐', badgeCls: 'bg-amber-50 text-amber-800 border-amber-200' },
                    reseller: { label: 'Reseller 🏬', badgeCls: 'bg-purple-50 text-purple-800 border-purple-200' },
                    walk_in_retail: { label: 'Walk-in Retail', badgeCls: 'bg-sunken text-ink-muted border-line' },
                  };
                  const t = tagMap[customer.suki_tag] ?? { label: customer.suki_tag, badgeCls: 'bg-sunken text-ink-muted border-line' };
                  return (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${t.badgeCls}`}>
                      {t.label}
                    </span>
                  );
                })()}
                <button 
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="h-7 w-7 rounded-lg border border-line text-ink-muted hover:bg-canvas hover:text-ink flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Edit Client Info"
                >
                  <Edit2 size={12} />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                {customer?.email && !isWalkInEmail(customer.email) ? (
                  <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-taupe transition-colors">
                    <Mail size={12} className="text-ink-faint shrink-0" /> {customer.email}
                  </a>
                ) : (
                  <span className="inline-flex items-center text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200 uppercase tracking-wider">Walk-in Client</span>
                )}
                {customer?.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-taupe transition-colors font-mono">
                    <Phone size={12} className="text-ink-faint shrink-0" /> {customer.phone}
                  </a>
                )}
                <span className="flex items-center gap-1 text-ink-faint">
                  <Clock size={12} className="shrink-0" /> Client since {new Date(customer?.created_at || '').toLocaleDateString('en-PH', { year: 'numeric', month: 'short' })}
                </span>
                <span className="text-ink-faint font-mono text-[11px]">ID #{customer?.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/dashboard/jobs/new?customer_id=${customer?.id}`}
              className="h-9 px-3.5 rounded-xl bg-taupe hover:bg-taupe-hover text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
            >
              <Scissors size={13} />
              <span>New Order</span>
            </Link>
            <button
              type="button"
              onClick={() => setActiveTab('measurements')}
              className="h-9 px-3.5 rounded-xl bg-surface hover:bg-canvas border border-line text-ink font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span>Measurements</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary 5-Column Grid (Symmetrically Aligned & Leveled) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { label: 'Lifetime Spend', value: `₱${calculateTotalSpend().toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: 'Total amount paid', icon: DollarSign, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Active Pipeline', value: String(getActiveJobsCount()), sub: 'In production', icon: Scissors, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Completed Jobs', value: String(getCompletedJobsCount()), sub: 'Settled orders', icon: Package, color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Appointments', value: String(appointments.length), sub: 'Fittings & consults', icon: Calendar, color: 'bg-amber-50 text-amber-800 border-amber-200' },
          { label: 'No-Shows', value: String(getNoShowCount()), sub: getNoShowCount() === 0 ? '100% Attendance' : 'Missed bookings', icon: UserX, color: getNoShowCount() > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-canvas text-ink-muted border-line' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="h-24 bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg border ${stat.color} shrink-0`}>
                  <Icon size={13} />
                </div>
              </div>
              <div>
                <div className="h-6 flex items-baseline font-black font-mono text-lg text-ink">
                  {stat.value}
                </div>
                <div className="text-[10px] text-ink-muted leading-none mt-0.5 truncate">{stat.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile Edit Dialog */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-[#2D2A26]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Edit Customer Profile</h3>
              <button type="button" onClick={() => setIsEditingProfile(false)} className="text-ink-faint hover:text-ink cursor-pointer p-1">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="customer-edit-name" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  id="customer-edit-name"
                  type="text" 
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-xs text-ink font-semibold focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs" 
                />
              </div>
              <div>
                <label htmlFor="customer-edit-email" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Email Address <span className="text-[10px] text-ink-faint font-normal lowercase">(Optional for walk-ins)</span>
                </label>
                <input 
                  id="customer-edit-email"
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs" 
                />
              </div>
              <div>
                <label htmlFor="customer-edit-phone" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input 
                  id="customer-edit-phone"
                  type="text" 
                  required
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="e.g. +63 917 123 4567"
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-xs text-ink font-mono focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs" 
                />
              </div>
              <div>
                <label htmlFor="customer-edit-notes" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                  Private Shop Notes <span className="text-[10px] text-ink-faint font-normal lowercase">(Internal atelier reference)</span>
                </label>
                <textarea
                  id="customer-edit-notes"
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  maxLength={2000}
                  placeholder="e.g. Prefers snug waist fit, allergic to synthetic wool, uses cocoon silk for barongs..."
                  className="w-full px-3.5 py-2.5 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe resize-none shadow-2xs" 
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-canvas cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-taupe hover:bg-taupe-hover text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {savingProfile && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stroke Underline Tab Navigation */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-line overflow-x-auto hide-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'measurements', label: 'Measurements & Specs', icon: Ruler },
          { id: 'orders', label: 'Job Orders', icon: Scissors },
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'history', label: 'Activity History', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'overview' | 'measurements' | 'orders' | 'appointments' | 'history')}
              className={`flex items-center gap-2 pb-3.5 pt-1 text-xs sm:text-sm font-bold tracking-tight border-b-2 transition-all whitespace-nowrap cursor-pointer -mb-0.5 ${
                isActive
                  ? 'border-taupe text-taupe'
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-taupe' : 'text-ink-muted'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
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

        {activeTab === 'history' && customer && (
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
