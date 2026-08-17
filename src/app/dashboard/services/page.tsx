'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Trash2, Package as PackageIcon, Megaphone, Layers, Tag, Clock } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

import { Service, ServicePackage, deriveTiersFromService } from '@/components/services/serviceHelpers';
import ServiceFormModal from '@/components/services/ServiceFormModal';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import ServiceListView from '@/components/services/ServiceListView';
import ServiceSaleModal from '@/components/services/ServiceSaleModal';
import ServiceTrashModal from '@/components/services/ServiceTrashModal';
import ServicePackageListView from '@/components/services/ServicePackageListView';
import ServicePackageFormModal from '@/components/services/ServicePackageFormModal';
import PromoPostModal from '@/components/promotions/PromoPostModal';
import PageHeader from '@/components/shared/PageHeader';
import StatBand from '@/components/shared/StatBand';

export default function ServicesPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showTrash, setShowTrash] = useState(false);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleServiceItem, setSaleServiceItem] = useState<Service | null>(null);
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Packages tab
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services');
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packageSearch, setPackageSearch] = useState('');
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [deletingPackageId, setDeletingPackageId] = useState<number | null>(null);
  const [isPackageDeleteModalOpen, setIsPackageDeleteModalOpen] = useState(false);
  const [packageSubmitting, setPackageSubmitting] = useState(false);
  const [packageError, setPackageError] = useState('');

  const fetchServices = useCallback(() => {
    if (!shop?.id) {
      if (user?.id) setTimeout(() => setLoading(false), 0);
      return;
    }
    api.get(`/shops/${shop.id}/services`)
      .then(res => {
        setServices(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shop, user]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fetchPackages = useCallback(() => {
    if (!shop?.id) {
      if (user?.id) setTimeout(() => setPackagesLoading(false), 0);
      return;
    }
    api.get(`/shops/${shop.id}/service-packages`)
      .then(res => {
        setPackages(res.data.data);
        setPackagesLoading(false);
      })
      .catch(err => {
        console.error(err);
        setPackagesLoading(false);
      });
  }, [shop, user]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handlePackageFormSubmit = async (payload: Record<string, unknown>) => {
    if (!shop) return;
    setPackageSubmitting(true);
    setPackageError('');
    try {
      if (editingPackageId) {
        const res = await api.put(`/shops/${shop.id}/service-packages/${editingPackageId}`, payload);
        setPackages(prev => prev.map(p => p.id === editingPackageId ? res.data.data : p));
        toast.success('Package updated successfully.');
      } else {
        const res = await api.post(`/shops/${shop.id}/service-packages`, payload);
        setPackages(prev => [res.data.data, ...prev]);
        toast.success('Package created successfully.');
      }
      setIsPackageModalOpen(false);
      setEditingPackageId(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setPackageError(error.response?.data?.message || 'Failed to save package');
    } finally {
      setPackageSubmitting(false);
    }
  };

  const confirmDeletePackage = async () => {
    if (!shop || !deletingPackageId) return;
    setPackageSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/service-packages/${deletingPackageId}`);
      setPackages(prev => prev.filter(p => p.id !== deletingPackageId));
      setIsPackageDeleteModalOpen(false);
      setDeletingPackageId(null);
      toast.success('Package deleted.');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete package.');
    } finally {
      setPackageSubmitting(false);
    }
  };

  const handleEditPackageClick = (pkg: ServicePackage) => {
    setEditingPackageId(pkg.id);
    setIsPackageModalOpen(true);
  };

  const handleDeletePackageClick = (id: number) => {
    setDeletingPackageId(id);
    setIsPackageDeleteModalOpen(true);
  };

  const handleDuplicateClick = async (service: Service) => {
    if (!shop) return;
    setActionLoadingId(service.id);
    try {
      const payload = {
        name: `${service.name} (Copy)`,
        description: service.description || '',
        categories: service.categories || [],
        service_types: service.service_types || [],
        base_price: service.base_price ? Number.parseFloat(service.base_price.toString()) : null,
        estimated_days: service.estimated_days,
        min_order_qty: service.min_order_qty || 1,
        custom_fields: service.custom_fields || [],
        is_active: service.is_active,
        pricing_tiers: deriveTiersFromService(service).map(t => ({
          label: t.label,
          amount: t.amount.trim() === '' ? null : Number.parseFloat(t.amount),
        })),
        image_url: service.image_url || null,
      };
      const res = await api.post(`/shops/${shop.id}/services`, payload);
      setServices(prev => [res.data.data, ...prev]);
      toast.success('Service duplicated successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to duplicate service. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFormSubmit = async (payload: Record<string, unknown>) => {
    if (!shop) return;
    setIsSubmitting(true);
    setError('');

    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/services/${editingId}`, payload);
        setServices(prev => prev.map(s => s.id === editingId ? res.data.data : s));
        toast.success('Service updated successfully.');
      } else {
        const res = await api.post(`/shops/${shop.id}/services`, payload);
        setServices(prev => [res.data.data, ...prev]);
        toast.success('Service created successfully.');
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/services/${deletingId}`);
      setServices(prev => prev.filter(s => s.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      toast.success('Service deleted.');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (service: Service) => {
    setEditingId(service.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const openSale = (service: Service) => {
    setSaleServiceItem(service);
    setSaleError('');
    setIsSaleModalOpen(true);
  };

  const submitSale = async (payload: Record<string, unknown>) => {
    if (!shop || !saleServiceItem) return;
    setSaleSubmitting(true);
    setSaleError('');
    try {
      const res = await api.put(`/shops/${shop.id}/services/${saleServiceItem.id}/sale`, payload);
      setServices(prev => prev.map(s => s.id === saleServiceItem.id ? res.data.data : s));
      toast.success(payload.sale_price ? 'Sale price updated.' : 'Sale removed.');
      setIsSaleModalOpen(false);
      setSaleServiceItem(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setSaleError(error.response?.data?.message || 'Failed to update sale price.');
    } finally {
      setSaleSubmitting(false);
    }
  };

  const categoriesList = ['All', ...Array.from(new Set(services.flatMap(s => s.categories || [])))];

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.categories || []).some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'All' || (s.categories || []).includes(categoryFilter);
    return matchSearch && matchCategory;
  });

  const editingService = editingId ? (services.find(s => s.id === editingId) || null) : null;

  const filteredPackages = packages.filter(p => p.name.toLowerCase().includes(packageSearch.toLowerCase()));
  const editingPackage = editingPackageId ? (packages.find(p => p.id === editingPackageId) || null) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Offerings"
        title="Services Catalog"
        description="Manage your tailoring offerings, combo packages, and turnaround times."
        actions={
          <>
            <button
              onClick={() => setIsPromoModalOpen(true)}
              className="flex items-center gap-2 bg-surface border border-line text-ink-body hover:bg-sunken px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px]"
            >
              <Megaphone size={16} />
              <span className="hidden sm:inline">Generate Promo Post</span>
              <span className="sm:hidden">Promo</span>
            </button>
            {activeTab === 'services' ? (
              <>
                <button
                  onClick={() => setShowTrash(true)}
                  title="View deleted services"
                  aria-label="View deleted services"
                  className="flex items-center justify-center w-11 h-11 rounded-lg bg-surface border border-line text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => { setEditingId(null); setError(''); setIsModalOpen(true); }}
                  className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px]"
                >
                  <Plus size={17} />
                  Add Service
                </button>
              </>
            ) : (
              <button
                onClick={() => { setEditingPackageId(null); setPackageError(''); setIsPackageModalOpen(true); }}
                disabled={services.length < 2}
                title={services.length < 2 ? 'Add at least 2 services first' : undefined}
                className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                <Plus size={17} />
                Add Package
              </button>
            )}
          </>
        }
      />

      {services.length > 0 && (() => {
        const activeServices = services.filter(s => s.is_active);
        const prices = services.map(s => Number(s.base_price || 0)).filter(p => p > 0);
        const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
        const avgDays = services.reduce((sum, s) => sum + (s.estimated_days || 0), 0) / services.length;
        return (
          <StatBand
            items={[
              { label: 'Active Services', value: `${activeServices.length} / ${services.length}`, icon: PackageIcon },
              { label: 'Packages', value: packages.length, icon: Layers },
              { label: 'Avg. Price', value: `₱${avgPrice.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`, icon: Tag },
              { label: 'Avg. Turnaround', value: `${avgDays.toFixed(0)}d`, icon: Clock },
            ]}
          />
        );
      })()}

      {/* Tabs */}
      <div className="flex border-b border-line overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('services')}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px min-h-[44px] ${
            activeTab === 'services' ? 'border-taupe text-taupe' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Individual Services
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px min-h-[44px] ${
            activeTab === 'packages' ? 'border-taupe text-taupe' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <PackageIcon size={15} />
          Packages
          {packages.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'packages' ? 'bg-taupe/10 text-taupe' : 'bg-sunken text-ink-faint'
            }`}>{packages.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'services' ? (
        <>
          <ServiceListView
            filteredServices={filtered}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            allCategories={categoriesList}
            actionLoadingId={actionLoadingId}
            onDuplicate={handleDuplicateClick}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onOpenSale={openSale}
          />
        </>
      ) : (
        <ServicePackageListView
          filteredPackages={filteredPackages}
          loading={packagesLoading}
          search={packageSearch}
          onSearchChange={setPackageSearch}
          onEdit={handleEditPackageClick}
          onDelete={handleDeletePackageClick}
        />
      )}

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setError('');
        }}
        editingId={editingId}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={error}
        editingService={editingService}
      />

      <ServiceDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />


      {shop && (
        <ServiceTrashModal
          isOpen={showTrash}
          onClose={() => setShowTrash(false)}
          shopId={shop.id}
          onRestored={(restored) => {
            setServices(prev => [restored, ...prev]);
            toast.success(`"${restored.name}" restored to your active catalog.`);
          }}
        />
      )}

      <ServicePackageFormModal
        isOpen={isPackageModalOpen}
        onClose={() => {
          setIsPackageModalOpen(false);
          setEditingPackageId(null);
          setPackageError('');
        }}
        services={services}
        editingPackage={editingPackage}
        onSubmit={handlePackageFormSubmit}
        isSubmitting={packageSubmitting}
        error={packageError}
      />

      <ServiceDeleteModal
        isOpen={isPackageDeleteModalOpen}
        onClose={() => {
          setIsPackageDeleteModalOpen(false);
          setDeletingPackageId(null);
        }}
        onConfirm={confirmDeletePackage}
        isSubmitting={packageSubmitting}
        label="package"
      />

      <ServiceSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSaleServiceItem(null);
        }}
        service={saleServiceItem}
        onSubmit={submitSale}
        isSubmitting={saleSubmitting}
        error={saleError}
      />

      <PromoPostModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
      />
    </div>
  );
}
