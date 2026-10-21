'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

import { Service, deriveTiersFromService } from '@/components/services/serviceHelpers';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import ServiceGridView from '@/components/services/ServiceGridView';
import PageHeader from '@/components/shared/PageHeader';
import ServicesModuleTabs from '@/components/services/ServicesModuleTabs';
import ServiceAnalyticsView from '@/components/services/ServiceAnalyticsView';

export default function ServicesPage() {
  const { store, user } = useAuthStore();
  const toast = useToast();
  const router = useRouter();
  // POST/PUT/DELETE on services are role:store_owner,branch_manager-only in routes/api.php, but the
  // Services nav is shown to plain staff too since they need read access to pick a service on a job/appointment.
  const isOwnerOrManager = Boolean(
    user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name))
  );
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type Tab = 'services' | 'analytics';
  const [activeTab, setActiveTabState] = useState<Tab>('services');
  // The tab lives in the URL (?tab=analytics) so coming back lands on the same tab.
  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    window.history.replaceState(null, '', tab === 'services' ? window.location.pathname : `?tab=${tab}`);
  };
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t === 'analytics') setActiveTabState(t);
  }, []);

  const handleDeleteDesign = async (designId: number) => {
    if (!store?.id) return;
    if (!confirm('Are you sure you want to delete this service design?')) return;
    try {
      await api.delete(`/stores/${store.id}/catalog/${designId}`);
      toast.success('Service design deleted.');
      fetchServices();
    } catch {
      toast.error('Failed to delete service design.');
    }
  };

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





  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Your tailoring services and how long they take."
        inlineActions
        actions={
          !isOwnerOrManager ? null : activeTab === 'services' ? (
            <>
              <button
                onClick={() => router.push('/dashboard/services/new')}
                className="flex items-center gap-1.5 min-h-11 bg-espresso hover:bg-espresso/90 text-white px-4 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                <Plus size={17} />
                Create New
              </button>
            </>
          ) : null
        }
      >
        <ServicesModuleTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          serviceCount={services.length}
          isOwnerOrManager={isOwnerOrManager}
        />
      </PageHeader>

      {activeTab === 'services' ? (
        <ServiceGridView
          services={services}
          loading={loading}
          canManage={isOwnerOrManager}
          storeSlug={store?.slug}
          onEdit={(id) => router.push(`/dashboard/services/${id}`)}
          onDelete={(id) => {
            setDeletingId(id);
            setIsDeleteModalOpen(true);
          }}
          onDeleteDesign={handleDeleteDesign}
        />
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
