'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Trash2, Package as PackageIcon, Megaphone } from 'lucide-react';
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
    <div className="space-y-6 text-[#2D2A26]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Services Catalog</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage your tailoring offerings, combo packages, and turnaround times.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsPromoModalOpen(true)}
            title="Generate Promo Post"
            className="flex items-center gap-2 bg-[#FAF6F3] border border-[#EBE6E0] text-[#524A44] hover:bg-[#F0EAE3] px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Megaphone size={18} />
            Generate Promo Post
          </button>
          {activeTab === 'services' ? (
            <>
              <button
                onClick={() => setShowTrash(true)}
                title="View deleted services"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#FAF6F3] border border-[#EBE6E0] text-[#827A73] hover:bg-[#F0EAE3] transition-colors"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setError('');
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                Add Service
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditingPackageId(null);
                setPackageError('');
                setIsPackageModalOpen(true);
              }}
              disabled={services.length < 2}
              title={services.length < 2 ? 'Add at least 2 services first' : undefined}
              className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Add Package
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EBE6E0]">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'services' ? 'border-taupe text-taupe' : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
          }`}
        >
          Individual Services
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'packages' ? 'border-taupe text-taupe' : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
          }`}
        >
          <PackageIcon size={15} />
          Packages
          {packages.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'packages' ? 'bg-taupe/10 text-taupe' : 'bg-[#F0EAE3] text-[#A8A19A]'
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
