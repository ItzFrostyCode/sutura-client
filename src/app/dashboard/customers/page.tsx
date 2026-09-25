'use client';

import Link from 'next/link';
import { Ruler, Plus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { useCustomers } from '@/components/customers/useCustomers';
import { TableSkeleton } from '@/components/ui/Skeleton';
import CustomersModuleTabs from '@/components/customers/CustomersModuleTabs';
import CustomerStatsCards from '@/components/customers/CustomerStatsCards';
import CustomerFilterBar from '@/components/customers/CustomerFilterBar';
import CustomerTable from '@/components/customers/CustomerTable';
import CustomerMobileCards from '@/components/customers/CustomerMobileCards';
import CustomerAddEditModal from '@/components/customers/CustomerAddEditModal';
import CustomerDeleteModal from '@/components/customers/CustomerDeleteModal';
import { isWalkInCustomer } from '@/components/customers/customerHelpers';

export default function CustomersPage() {
  const {
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
    isSubmitting,
    formData,
    setFormData,
    error,
    setError,
    filterType,
    setFilterType,
    handleAddCustomer,
    handleEditClick,
    handleDeleteClick,
    confirmDelete,
    closeModal,
    filtered,
  } = useCustomers();

  const onlineCount = customers.filter((c) => !isWalkInCustomer(c)).length;
  const walkinCount = customers.filter((c) => isWalkInCustomer(c)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relationships"
        title="Client Book"
        description="Manage your customer directory, loyalty suki tiers, and lifetime value."
        actions={
          <>
            <Link
              href="/dashboard/measurements"
              title="Search and manage measurement profiles across all customers"
              className="flex items-center gap-2 bg-surface hover:bg-sunken border border-line text-ink px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors min-h-10.5 shadow-2xs"
            >
              <Ruler size={15} />
              <span className="hidden sm:inline">All </span>Measurements
            </Link>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', email: '', phone: '' });
                setError('');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all min-h-10.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              Add Customer
            </button>
          </>
        }
      >
        <CustomersModuleTabs activeTab="customers" />
      </PageHeader>

      {/* Top CRM KPI Metric Cards */}
      <CustomerStatsCards customers={customers} />

      {/* Main Client Book Container */}
      <div className="bg-surface border border-line rounded-2xl shadow-2xs overflow-hidden">
        <CustomerFilterBar
          filterType={filterType as 'all' | 'online' | 'walkin'}
          setFilterType={(val) => setFilterType(val)}
          search={search}
          setSearch={setSearch}
          totalCount={customers.length}
          onlineCount={onlineCount}
          walkinCount={walkinCount}
        />

        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : (
          <>
            <CustomerMobileCards
              customers={filtered}
              onView={(id) => router.push(`/dashboard/customers/${id}`)}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
            <CustomerTable
              customers={filtered}
              onView={(id) => router.push(`/dashboard/customers/${id}`)}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <CustomerAddEditModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddCustomer}
        isSubmitting={isSubmitting}
        error={error}
      />

      <CustomerDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
