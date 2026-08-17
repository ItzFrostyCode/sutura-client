'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Package as PackageIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

import { Service, ServicePackage } from '@/components/services/serviceHelpers';
import ServicePackageListView from '@/components/services/ServicePackageListView';
import ServicePackageFormModal from '@/components/services/ServicePackageFormModal';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';

// Basic plan: 3 packages max. Pro/Premium: unlimited.
const BASIC_PACKAGE_LIMIT = 3;

export default function ServicePackagesPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const { tier, loading: tierLoading } = useSubscriptionTier();

  const [services, setServices] = useState<Service[]>([]);
  // null = not fetched yet (loading), [] = fetched but empty
  const [packages, setPackages] = useState<ServicePackage[] | null>(null);

  const [search, setSearch] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Derived: loading while packages haven't been fetched yet
  const loading = shop?.id ? packages === null : false;

  // Whether the current tier allows creating more packages
  const atBasicLimit =
    !tierLoading && tier === 'basic' && (packages ?? []).length >= BASIC_PACKAGE_LIMIT;
  const canAdd = services.length >= 2 && !atBasicLimit;

  useEffect(() => {
    if (!shop?.id) return;
    api
      .get(`/shops/${shop.id}/services`)
      .then((res) => setServices(res.data.data ?? []))
      .catch((err) => console.error('[ServicePackagesPage] services fetch:', err));
  }, [shop]);

  useEffect(() => {
    if (!shop?.id) return;
    api
      .get(`/shops/${shop.id}/service-packages`)
      .then((res) => setPackages(res.data.data ?? []))
      .catch((err) => console.error('[ServicePackagesPage] packages fetch:', err));
  }, [shop]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingPackageId(null);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEdit = (pkg: ServicePackage) => {
    setEditingPackageId(pkg.id);
    setFormError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPackageId(null);
    setFormError('');
  };

  const handleFormSubmit = async (payload: Record<string, unknown>) => {
    if (!shop) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      if (editingPackageId) {
        const res = await api.put(
          `/shops/${shop.id}/service-packages/${editingPackageId}`,
          payload,
        );
        setPackages((prev) =>
          (prev ?? []).map((p) => (p.id === editingPackageId ? res.data.data : p)),
        );
        toast.success('Package updated successfully.');
      } else {
        const res = await api.post(`/shops/${shop.id}/service-packages`, payload);
        setPackages((prev) => [res.data.data, ...(prev ?? [])]);
        toast.success('Package created successfully.');
      }
      closeForm();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e.response?.data?.message ?? 'Failed to save package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/service-packages/${deletingId}`);
      setPackages((prev) => (prev ?? []).filter((p) => p.id !== deletingId));
      setIsDeleteOpen(false);
      setDeletingId(null);
      toast.success('Package deleted.');
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Failed to delete package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (pkg: ServicePackage) => {
    if (!shop) return;
    const next = !pkg.is_active;
    // Optimistic update
    setPackages((prev) =>
      (prev ?? []).map((p) => (p.id === pkg.id ? { ...p, is_active: next } : p)),
    );
    try {
      const res = await api.put(`/shops/${shop.id}/service-packages/${pkg.id}`, {
        name: pkg.name,
        description: pkg.description,
        service_ids: pkg.services.map((s) => s.id),
        bundle_price: pkg.bundle_price ?? null,
        is_active: next,
      });
      setPackages((prev) => (prev ?? []).map((p) => (p.id === pkg.id ? res.data.data : p)));
      toast.success(next ? 'Package activated.' : 'Package deactivated.');
    } catch (err) {
      // Roll back on failure
      setPackages((prev) =>
        (prev ?? []).map((p) => (p.id === pkg.id ? { ...p, is_active: !next } : p)),
      );
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Failed to update package status.');
    }
  };

  const filteredPackages = (packages ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const editingPackage = editingPackageId
    ? ((packages ?? []).find((p) => p.id === editingPackageId) ?? null)
    : null;

  // ── Tier limit banner ────────────────────────────────────────────────────────

  const renderTierBanner = () => {
    if (tierLoading) return null;
    if (tier !== 'basic') return null;
    return (
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <PackageIcon size={16} className="shrink-0 text-amber-600" />
        <span>
          <strong>Basic plan:</strong> you can create up to {BASIC_PACKAGE_LIMIT} packages.{' '}
          {(packages ?? []).length >= BASIC_PACKAGE_LIMIT ? (
            <>
              Limit reached.{' '}
              <Link href="/dashboard/billing" className="underline font-semibold hover:text-amber-900">
                Upgrade to Pro
              </Link>{' '}
              for unlimited packages.
            </>
          ) : (
            <>
              {BASIC_PACKAGE_LIMIT - (packages ?? []).length} remaining.{' '}
              <Link href="/dashboard/billing" className="underline font-semibold hover:text-amber-900">
                Upgrade for unlimited.
              </Link>
            </>
          )}
        </span>
      </div>
    );
  };

  // ── Add button tooltip text ──────────────────────────────────────────────────

  const addButtonTitle = (() => {
    if (services.length < 2) return 'Add at least 2 services first to create a package';
    if (atBasicLimit) return `Basic plan limit reached (${BASIC_PACKAGE_LIMIT} packages max). Upgrade to Pro.`;
    return undefined;
  })();

  return (
    <div className="space-y-6 text-ink">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/services"
            className="p-2 rounded-lg text-ink-muted hover:bg-sunken hover:text-ink transition-colors"
            title="Back to Services"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Service Packages</h1>
            <p className="text-ink-muted text-sm mt-0.5">
              Bundle two or more services into a combo deal with a discounted price.
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          disabled={!canAdd}
          title={addButtonTitle}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus size={18} />
          Add Package
        </button>
      </div>

      {/* Tier banner */}
      {renderTierBanner()}

      {/* List */}
      <ServicePackageListView
        filteredPackages={filteredPackages}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        onEdit={openEdit}
        onDelete={openDelete}
        onToggleActive={handleToggleActive}
      />

      {/* Form Modal */}
      <ServicePackageFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        services={services}
        editingPackage={editingPackage}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={formError}
      />

      {/* Delete Confirmation Modal */}
      <ServiceDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
        label="package"
      />
    </div>
  );
}
