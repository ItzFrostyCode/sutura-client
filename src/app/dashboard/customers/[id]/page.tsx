'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import CustomerOverviewTab from '@/components/customers/CustomerOverviewTab';
import CustomerMeasurementsTab from '@/components/customers/CustomerMeasurementsTab';
import CustomerJobsTab from '@/components/customers/CustomerJobsTab';
import CustomerAppointmentsTab from '@/components/customers/CustomerAppointmentsTab';
import CustomerHistoryTab from '@/components/customers/CustomerHistoryTab';
import CustomerPaymentsTab from '@/components/customers/CustomerPaymentsTab';
import CustomerTextsTab from '@/components/customers/CustomerTextsTab';
import { useAuthStore } from '@/store/useAuthStore';
import { moneySummary, peso } from '@/components/customers/customerMoney';
import { useCustomerProfile } from '@/components/customers/hooks/useCustomerProfile';
import CustomerProfileHeader from '@/components/customers/profile/CustomerProfileHeader';
import CustomerProfileStats from '@/components/customers/profile/CustomerProfileStats';
import CustomerDeleteModal from '@/components/customers/CustomerDeleteModal';
import CustomerProfileEditModal from '@/components/customers/profile/CustomerProfileEditModal';
import CustomerTabNav, { CustomerTabType } from '@/components/customers/profile/CustomerTabNav';

export default function CustomerProfilePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<CustomerTabType>('overview');
  // Owner and branch manager collect money and send texts; staff see the customer and the balances.
  const roles = useAuthStore((st) => st.user?.roles);
  const canManageMoney = !!roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name));

  const {
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
    editGender,
    setEditGender,
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
  } = useCustomerProfile(id);

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
      <CustomerProfileHeader
        customer={customer}
        onBack={() => router.back()}
        onEditProfile={() => setIsEditingProfile(true)}
        onDelete={() => setIsDeleteOpen(true)}
        onText={canManageMoney ? () => setActiveTab('texts') : undefined}
      />

      {/* Stats Summary 5-Column Grid */}
      <CustomerProfileStats
        totalSpend={totalSpend}
        activeJobsCount={activeJobsCount}
        completedJobsCount={completedJobsCount}
        appointmentsCount={appointments.length}
        noShowCount={noShowCount}
      />

      {/* Profile Edit Dialog */}
      <CustomerProfileEditModal
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editGender={editGender}
        setEditGender={setEditGender}
        savingProfile={savingProfile}
        onSubmit={handleUpdateProfile}
      />

      <CustomerDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        isSubmitting={deleting}
        onConfirm={async () => {
          if (await deleteCustomer()) router.replace('/dashboard/customers');
          else setIsDeleteOpen(false);
        }}
      />

      {/* Clean Tab Navigation */}
      <CustomerTabNav activeTab={activeTab} setActiveTab={setActiveTab} showTexts={canManageMoney} balanceDue={moneySummary(jobs).balance > 0 ? peso(moneySummary(jobs).balance) : undefined} />

      {/* Active Tab Panel */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <CustomerOverviewTab
            customer={customer}
            jobs={jobs}
            measurements={measurements}
            setActiveTab={setActiveTab}
            canCollect={canManageMoney}
            canText={canManageMoney}
            canTrust={canManageMoney}
            onTrustChanged={loadData}
          />
        )}

        {activeTab === 'measurements' && (
          <CustomerMeasurementsTab
            customerId={Number.parseInt(id, 10)}
            customerName={customer?.name || ''}
            measurements={measurements}
          />
        )}

        {activeTab === 'orders' && (
          <CustomerJobsTab jobs={jobs} />
        )}

        {activeTab === 'payments' && <CustomerPaymentsTab jobs={jobs} canCollect={canManageMoney} />}

        {activeTab === 'texts' && canManageMoney && (
          <CustomerTextsTab storeId={store?.id} customerId={customer?.id} customerName={customer?.name} />
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
