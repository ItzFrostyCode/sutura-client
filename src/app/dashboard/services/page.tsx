'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

import { Service, ServicePackage, deriveTiersFromService } from '@/components/services/serviceHelpers';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import ServiceGridView from '@/components/services/ServiceGridView';
import PackageGridView from '@/components/services/packages/PackageGridView';
import PageHeader from '@/components/shared/PageHeader';
import ServicesModuleTabs from '@/components/services/ServicesModuleTabs';
import ServiceAnalyticsView from '@/components/services/ServiceAnalyticsView';

export default function ServicesPage() {
  const { store, user } = useAuthStore();
  const toast = useToast();
  const router = useRouter();
  // POST/PUT/DELETE on services, service-packages, and restore are all
  // role:store_owner,branch_manager-only in routes/api.php, but the Services
  // nav (with the Packages tab) is shown to plain staff too since they need
  // read access to pick a service on a job/appointment.
  const isOwnerOrManager = Boolean(
    user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name))
  );
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  // Set when the owner arrived from a design's "+" (?add=1&return=/dashboard/catalog/12):
  // the add form opens right away, and saving it sends them back to that design.
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Packages tab
  type Tab = 'services' | 'packages' | 'analytics';
  const [activeTab, setActiveTabState] = useState<Tab>('services');
  // The tab lives in the URL (?tab=packages) so coming back from a package page lands on the same tab.
  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    window.history.replaceState(null, '', tab === 'services' ? window.location.pathname : `?tab=${tab}`);
  };
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t === 'packages' || t === 'analytics') setActiveTabState(t);
  }, []);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  const fetchServices = useCallback(() => {
    if (!store?.id) {
      if (user?.id) setTimeout(() => setLoading(false), 0);
      return;
    }
    api.get(`/stores/${store.id}/services`)
      .then(res => {
        setServices(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [store, user]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fetchPackages = useCallback(() => {
    if (!store?.id) {
      if (user?.id) setTimeout(() => setPackagesLoading(false), 0);
      return;
    }
    api.get(`/stores/${store.id}/service-packages`)
      .then(res => {
        setPackages(res.data.data);
        setPackagesLoading(false);
      })
      .catch(err => {
        console.error(err);
        setPackagesLoading(false);
      });
  }, [store, user]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    if (!isOwnerOrManager) return;
    const params = new URLSearchParams(window.location.search);
    const back = params.get('return');
    if (params.get('add') !== '1') return;
    // Only ever return to a dashboard page — never an arbitrary URL.
    const safe = back?.startsWith('/dashboard/') && !back.startsWith('//') ? `?return=${encodeURIComponent(back)}` : '';
    router.replace(`/dashboard/services/new${safe}`);
  }, [isOwnerOrManager]);

  const confirmDelete = async () => {
    if (!store || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/stores/${store.id}/services/${deletingId}`);
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

  // Editing happens on the service's own page now (every section has a pencil);
  // the modal stays for adding a new service.
  const handleEditClick = (service: Service) => {
    router.push(`/dashboard/services/${service.id}`);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const categoriesList = ['All', ...Array.from(new Set(services.flatMap(s => s.categories || [])))];

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.categories || []).some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'All' || (s.categories || []).includes(categoryFilter);
    return matchSearch && matchCategory;
  });



  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Your tailoring services, turnaround times, and combo packages."
        inlineActions
        actions={
          !isOwnerOrManager ? null : activeTab === 'services' ? (
            <>
              <button
                onClick={() => router.push('/dashboard/services/new')}
                className="flex items-center gap-1.5 min-h-11 bg-taupe hover:bg-taupe-hover text-white px-4 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                <Plus size={17} />
                Create New
              </button>
            </>
          ) : activeTab === 'packages' ? (
            <button
              onClick={() => router.push('/dashboard/services/packages/new')}
              disabled={services.length < 2}
              title={services.length < 2 ? 'Add at least 2 services first' : undefined}
              className="flex items-center gap-1.5 min-h-11 bg-taupe hover:bg-taupe-hover text-white px-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus size={17} />
              Create New
            </button>
          ) : null
        }
      >
        <ServicesModuleTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          serviceCount={services.length}
          packageCount={packages.length}
          isOwnerOrManager={isOwnerOrManager}
        />
      </PageHeader>

      {activeTab === 'services' ? (
        <ServiceGridView services={services} loading={loading} canManage={isOwnerOrManager} storeSlug={store?.slug} />
      ) : activeTab === 'packages' ? (
        <PackageGridView packages={packages} loading={packagesLoading} />
      ) : isOwnerOrManager ? (
        <ServiceAnalyticsView />
      ) : null}

      <ServiceDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />



    </div>
  );
}
