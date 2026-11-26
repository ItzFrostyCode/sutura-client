'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ApplePage, { AppleBar } from '@/components/jobs/ui/ApplePage';
import CustomerOverviewTab from '@/components/customers/CustomerOverviewTab';
import CustomerMeasurementsTab from '@/components/customers/CustomerMeasurementsTab';
import CustomerJobsTab from '@/components/customers/CustomerJobsTab';
import CustomerPaymentsTab from '@/components/customers/CustomerPaymentsTab';
import CustomerAppointmentsTab from '@/components/customers/CustomerAppointmentsTab';
import CustomerTextsTab from '@/components/customers/CustomerTextsTab';
import CustomerActivityTimeline from '@/components/customers/CustomerActivityTimeline';
import { useAuthStore } from '@/store/useAuthStore';
import { moneySummary, peso } from '@/components/customers/customerMoney';
import { useCustomerProfile } from '@/components/customers/hooks/useCustomerProfile';
import CustomerProfileHeader from '@/components/customers/profile/CustomerProfileHeader';
import CustomerProfileStats from '@/components/customers/profile/CustomerProfileStats';
import CustomerDeleteModal from '@/components/customers/CustomerDeleteModal';
import CustomerProfileEditModal from '@/components/customers/profile/CustomerProfileEditModal';
import CustomerTabNav, { CustomerTabType } from '@/components/customers/profile/CustomerTabNav';

// The screen's content column: matches the dashboard shell's header edges (pr-4 / lg:px-6), so the title row and
// the main panel line up with the top bar instead of running deeper than it.
const COL = 'mx-auto w-full max-w-[1600px] px-4 sm:px-6';

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
    store,
    loadData,
  } = useCustomerProfile(id);
  const money = moneySummary(jobs);

  if (loading) {
    return (
      <ApplePage>
        <div className="flex flex-col items-center justify-center py-24 text-ink-faint">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-taupe mx-auto" />
          <span className="text-sm font-medium">Loading customer profile...</span>
        </div>
      </ApplePage>
    );
  }

  return (
    <ApplePage>
      {/* Title row: who this is + the quick actions (the same header shape as Appointments and Job Orders) */}
      <div className={COL}>
        <AppleBar flush>
          <CustomerProfileHeader
            customer={customer}
            onBack={() => router.back()}
            onEditProfile={() => setIsEditingProfile(true)}
            onDelete={() => setIsDeleteOpen(true)}
            onText={canManageMoney ? () => setActiveTab('texts') : undefined}
          />
        </AppleBar>
      </div>

      <div className={`${COL} space-y-4 pb-10 pt-1 sm:pt-2`}>
        <CustomerProfileStats
          totalSpend={totalSpend}
          activeJobsCount={activeJobsCount}
          completedJobsCount={completedJobsCount}
          appointmentsCount={appointments.length}
          invoiced={money.billed}
          balance={money.balance}
          onCollect={canManageMoney ? () => setActiveTab('payments') : undefined}
        />

        <CustomerTabNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showTexts={canManageMoney}
          balanceDue={money.balance > 0 ? peso(money.balance) : undefined}
          ordersCount={activeJobsCount}
        />

        <div>
          {activeTab === 'overview' && (
            <CustomerOverviewTab
              customer={customer}
              jobs={jobs}
              measurements={measurements}
              appointments={appointments}
              setActiveTab={setActiveTab}
              canCollect={canManageMoney}
              canText={canManageMoney}
              canTrust={canManageMoney}
              onTrustChanged={loadData}
              onEditProfile={() => setIsEditingProfile(true)}
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

          {activeTab === 'payments' && (
            <CustomerPaymentsTab jobs={jobs} canCollect={canManageMoney} customerName={customer?.name} />
          )}

          {activeTab === 'texts' && canManageMoney && (
            <CustomerTextsTab storeId={store?.id} customerId={customer?.id} customerName={customer?.name} />
          )}

          {activeTab === 'appointments' && (
            <CustomerAppointmentsTab appointments={appointments} />
          )}

          {activeTab === 'activity' && (
            <CustomerActivityTimeline customer={customer} measurements={measurements} jobs={jobs} appointments={appointments} paged />
          )}
        </div>
      </div>

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
    </ApplePage>
  );
}
