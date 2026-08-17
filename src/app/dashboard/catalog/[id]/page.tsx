'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { getMediaUrl } from '@/lib/media';
import { parseFeatures, parseCareInstructions, formatCatalogPrice } from '@/components/catalog/catalogHelpers';
import {
  ArrowLeft, Loader2, Edit3, Trash2, Eye, Heart, Star,
  ShoppingBag, DollarSign, Clock, ExternalLink, Image as ImageIcon,
  CheckCircle2, Ruler, Sparkles, Shirt,
  AlertCircle, EyeOff, Plus, Search
} from 'lucide-react';
import CatalogDeleteModal from '@/components/catalog/CatalogDeleteModal';
import Modal from '@/components/Modal';

interface CatalogImage {
  id: number;
  image_url: string;
  view_angle?: string;
  is_primary: boolean;
}

interface CatalogReview {
  id: number;
  rating: number;
  comment?: string;
  reply?: string;
  created_at: string;
  user?: { id: number; name: string };
}

interface ConnectedOrder {
  id: number;
  order_number?: string;
  type?: string;
  selected_size?: string | null;
  total_amount: string | number;
  payment_status?: string;
  status?: string;
  created_at: string;
  customer?: { id: number; name: string; phone?: string; email?: string } | null;
}

interface OtherCatalogOption {
  id: number;
  name: string;
  price: string | number;
  material?: string;
  images?: CatalogImage[];
}

interface DetailedCatalogItem {
  id: number;
  name: string;
  price: string | number;
  estimated_days?: number | null;
  material?: string;
  color?: string;
  fabric_image_url?: string | null;
  sizes?: string[] | null;
  description?: string | null;
  garment_type?: string | null;
  listing_type?: string;
  is_active?: boolean;
  images?: CatalogImage[];
  views_count?: number;
  saves_count?: number;
  reviews_avg_rating?: number | null;
  reviews_count?: number;
  features?: unknown;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  care_instructions?: unknown;
  external_gallery_url?: string | null;
  total_revenue?: number;
  order_count?: number;
  catalog_orders_count?: number;
  job_orders_count?: number;
  reviews?: CatalogReview[];
  catalog_orders?: ConnectedOrder[];
  job_orders?: ConnectedOrder[];
  recommendations?: {
    id: number;
    recommended_item_id?: number;
    recommendation_type?: string;
    recommended_item?: {
      id: number;
      name: string;
      price: string | number;
      images?: CatalogImage[];
    };
  }[];
}

export default function CatalogItemDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { shop } = useAuthStore();
  const router = useRouter();
  const toast = useToast();

  const [item, setItem] = useState<DetailedCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'reviews' | 'recommendations'>('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Recommendations management visual selector state
  const [isAddRecModalOpen, setIsAddRecModalOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState<OtherCatalogOption[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [recSearch, setRecSearch] = useState('');
  const [selectedRecItemIds, setSelectedRecItemIds] = useState<number[]>([]);
  const [selectedRecType, setSelectedRecType] = useState('similar');
  const [savingRec, setSavingRec] = useState(false);

  const reloadItem = useCallback(async () => {
    if (!shop || !id) return;
    try {
      const res = await api.get(`/shops/${shop.id}/catalog/${id}`);
      setItem(res.data.data);
    } catch (err) {
      console.error('Failed to reload catalog item', err);
    }
  }, [shop, id]);

  useEffect(() => {
    let isMounted = true;
    if (!shop?.id || !id) return;

    api.get(`/shops/${shop.id}/catalog/${id}`)
      .then(res => {
        if (isMounted) {
          setItem(res.data.data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Failed to load catalog item', err);
          toast.error('Failed to load catalog item details.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shop?.id, id, toast]);

  const handleToggleStatus = async () => {
    if (!shop || !item) return;
    setTogglingStatus(true);
    const nextStatus = !item.is_active;
    try {
      await api.put(`/shops/${shop.id}/catalog/${item.id}`, {
        is_active: nextStatus,
      });
      setItem(prev => prev ? { ...prev, is_active: nextStatus } : null);
      toast.success(nextStatus ? 'Design published & visible.' : 'Design paused.');
    } catch {
      toast.error('Failed to update design status.');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!shop || !item) return;
    setIsDeleting(true);
    try {
      await api.delete(`/shops/${shop.id}/catalog/${item.id}`);
      toast.success('Catalog item deleted successfully.');
      router.push('/dashboard/catalog');
    } catch {
      toast.error('Failed to delete catalog item.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const openAddRecModal = async () => {
    setIsAddRecModalOpen(true);
    setSelectedRecItemIds([]);
    setRecSearch('');
    if (!shop) return;
    setLoadingAvailable(true);
    try {
      const res = await api.get(`/shops/${shop.id}/catalog`);
      const all: OtherCatalogOption[] = res.data.data || [];
      const others = all.filter(i => i.id !== Number(id));
      setAvailableItems(others);
    } catch {
      toast.error('Failed to load catalog items for recommendations.');
    } finally {
      setLoadingAvailable(false);
    }
  };

  const toggleRecSelection = (recId: number) => {
    setSelectedRecItemIds(prev =>
      prev.includes(recId) ? prev.filter(i => i !== recId) : [...prev, recId]
    );
  };

  const handleSaveRecommendations = async () => {
    if (!shop || !item || selectedRecItemIds.length === 0) return;
    setSavingRec(true);

    const currentRecs = (item.recommendations || []).map(r => ({
      id: r.recommended_item?.id || r.recommended_item_id,
      type: r.recommendation_type || 'similar',
    })).filter(r => r.id);

    const newEntries = selectedRecItemIds
      .filter(recId => !currentRecs.some(r => Number(r.id) === recId))
      .map(recId => ({ id: recId, type: selectedRecType }));

    if (newEntries.length === 0) {
      toast.error('Selected design(s) are already linked.');
      setSavingRec(false);
      return;
    }

    const updatedRecs = [...currentRecs, ...newEntries];

    try {
      await api.put(`/shops/${shop.id}/catalog/${item.id}`, {
        recommendations: updatedRecs,
      });
      toast.success(`${newEntries.length} related design(s) linked successfully.`);
      setIsAddRecModalOpen(false);
      await reloadItem();
    } catch {
      toast.error('Failed to save recommendations.');
    } finally {
      setSavingRec(false);
    }
  };

  const handleRemoveRecommendation = async (recItemId: number) => {
    if (!shop || !item) return;
    const currentRecs = (item.recommendations || []).map(r => ({
      id: r.recommended_item?.id || r.recommended_item_id,
      type: r.recommendation_type || 'similar',
    })).filter(r => r.id && Number(r.id) !== recItemId);

    try {
      await api.put(`/shops/${shop.id}/catalog/${item.id}`, {
        recommendations: currentRecs,
      });
      toast.success('Related design unlinked.');
      await reloadItem();
    } catch {
      toast.error('Failed to unlink recommendation.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-ink-muted">
        <Loader2 className="w-9 h-9 animate-spin text-taupe mb-3" />
        <span className="text-sm font-semibold">Loading design details...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-white border border-line rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <AlertCircle size={44} className="text-ink-muted mx-auto mb-3" />
        <h2 className="text-lg font-bold text-ink">Design Not Found</h2>
        <p className="text-xs text-ink-muted mt-1 mb-6">
          This catalog item may have been removed or does not belong to your shop.
        </p>
        <Link
          href="/dashboard/catalog"
          className="px-5 py-2.5 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-[#8A7063] transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Catalog Showcase
        </Link>
      </div>
    );
  }

  const images = item.images && item.images.length > 0 ? item.images : [];
  const activeImage = images[selectedImageIndex] || images[0];
  const { bullets: featuresList } = parseFeatures(item.features);
  const { text: careText } = parseCareInstructions(item.care_instructions);

  const allOrders: ConnectedOrder[] = [
    ...(item.catalog_orders || []).map(o => ({ ...o, type: 'Walk-in Order' })),
    ...(item.job_orders || []).map(o => ({ ...o, type: 'Custom Job Order' })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const reviews = item.reviews || [];

  const filteredAvailable = availableItems.filter(i =>
    i.name.toLowerCase().includes(recSearch.toLowerCase()) ||
    Boolean(i.material?.toLowerCase().includes(recSearch.toLowerCase()))
  );

  const renderStatusToggleButton = () => {
    if (togglingStatus) {
      return <Loader2 size={14} className="animate-spin" />;
    }
    if (item.is_active !== false) {
      return (
        <>
          <EyeOff size={14} className="text-ink-muted" />
          <span>Pause</span>
        </>
      );
    }
    return (
      <>
        <Eye size={14} className="text-emerald-600" />
        <span>Activate</span>
      </>
    );
  };

  const getLinkRecButtonLabel = () => {
    if (selectedRecItemIds.length === 0) {
      return 'Select Designs';
    }
    const suffix = selectedRecItemIds.length === 1 ? '' : 's';
    return `Link ${selectedRecItemIds.length} Design${suffix}`;
  };

  const renderAvailableRecGrid = () => {
    if (loadingAvailable) {
      return (
        <div className="py-16 flex flex-col items-center justify-center text-ink-muted">
          <Loader2 size={28} className="animate-spin text-taupe mb-2" />
          <span className="text-xs font-medium">Loading shop designs...</span>
        </div>
      );
    }

    if (availableItems.length === 0) {
      return (
        <div className="py-16 text-center text-ink-muted text-xs bg-canvas rounded-2xl border border-line">
          No other catalog designs found in your shop.
        </div>
      );
    }

    if (filteredAvailable.length === 0) {
      return (
        <div className="py-16 text-center text-ink-muted text-xs bg-canvas rounded-2xl border border-line">
          No designs match &quot;{recSearch}&quot;.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredAvailable.map((opt) => {
          const isSelected = selectedRecItemIds.includes(opt.id);
          const optImg = opt.images?.[0]?.image_url;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleRecSelection(opt.id)}
              className={`rounded-xl overflow-hidden flex flex-col text-left transition-all relative cursor-pointer border ${
                isSelected
                  ? 'border-taupe bg-taupe/10 ring-2 ring-taupe shadow-xs'
                  : 'border-line bg-surface hover:border-taupe/50 hover:bg-canvas shadow-2xs'
              }`}
            >
              <div className="aspect-4/3 w-full bg-sunken relative overflow-hidden shrink-0">
                {optImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getMediaUrl(optImg)}
                    alt={opt.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isSelected ? 'scale-105' : ''
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-muted">
                    <ImageIcon size={20} />
                  </div>
                )}

                <div
                  className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-taupe text-white shadow-sm scale-110'
                      : 'bg-black/40 text-white/80 backdrop-blur-xs'
                  }`}
                >
                  <CheckCircle2 size={14} className={isSelected ? 'fill-current text-white' : ''} />
                </div>
              </div>

              <div className="p-2 flex flex-col flex-1 w-full bg-white justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold text-ink line-clamp-2 leading-snug">
                    {opt.name}
                  </h4>
                  {opt.material && (
                    <span className="text-[10px] text-ink-muted truncate block mt-0.5">
                      {opt.material}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-taupe font-mono">
                  {formatCatalogPrice(opt.price)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTabOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Visual Gallery (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-line">
          <div className="aspect-3/4 rounded-xl overflow-hidden bg-sunken relative">
            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getMediaUrl(activeImage.image_url)}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted">
                <ImageIcon size={40} className="mb-2 text-ink-faint" />
                <span className="text-xs font-semibold">No images uploaded</span>
              </div>
            )}
            {activeImage?.view_angle && (
              <span className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {activeImage.view_angle} View
              </span>
            )}
            {activeImage?.is_primary && (
              <span className="absolute top-3 right-3 bg-taupe text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                Primary Cover
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    selectedImageIndex === idx ? 'border-taupe shadow-xs scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(img.image_url)}
                    alt={`Angle ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {item.fabric_image_url && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Shirt size={14} className="text-taupe" /> Fabric Sample Swatch
              </span>
              <span className="text-[11px] text-ink-muted">{item.material || 'Custom Material'}</span>
            </div>
            <div className="h-32 rounded-xl overflow-hidden bg-sunken border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(item.fabric_image_url)}
                alt="Fabric swatch"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Commercial & Technical Specifications (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-5">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Garment Specifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Pricing Model</span>
              <span className="text-sm font-bold text-ink">{formatCatalogPrice(item.price)}</span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Production Time</span>
              <span className="text-sm font-bold text-ink flex items-center gap-1">
                <Clock size={13} className="text-taupe" /> Est. {item.estimated_days ?? 7} Days
              </span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Primary Material</span>
              <span className="text-sm font-bold text-ink truncate block">{item.material || 'Custom Tailored'}</span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Garment Type</span>
              <span className="text-sm font-bold text-ink capitalize truncate block">
                {(item.garment_type || 'General Apparel').replaceAll('_', ' ')}
              </span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Color Scheme</span>
              <span className="text-sm font-bold text-ink truncate block">{item.color || 'Customizable'}</span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Listing Type</span>
              <span className="text-sm font-bold text-taupe uppercase tracking-wider text-[11px]">Made to Order</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-bold text-ink uppercase tracking-wider block mb-2">Available Size Range</span>
            {item.sizes && item.sizes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {item.sizes.map((size) => (
                  <span
                    key={size}
                    className="px-3 py-1.5 bg-canvas border border-line rounded-lg text-xs font-bold text-ink shadow-2xs"
                  >
                    {size}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-ink-muted italic">Fully customizable to client measurements</span>
            )}
          </div>

          {item.description && (
            <div className="pt-2 border-t border-line/60">
              <span className="text-xs font-bold text-ink uppercase tracking-wider block mb-2">Description & Notes</span>
              <p className="text-sm text-ink-body leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}
        </div>

        {item.size_chart_rows && item.size_chart_rows.length > 0 && item.size_chart_columns && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Ruler size={16} className="text-taupe" /> Standard Size Chart Matrix
              </h3>
              <span className="text-xs text-ink-muted">Inches (in)</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sunken border-b border-line text-ink font-bold">
                    <th className="py-2.5 px-3">Size</th>
                    {item.size_chart_columns.map((col) => (
                      <th key={col} className="py-2.5 px-3 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {item.size_chart_rows.map((row) => (
                    <tr key={row.size} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-ink bg-canvas/30">{row.size}</td>
                      {row.values.map((val, vIdx) => (
                        <td key={`${row.size}-${vIdx}`} className="py-2 px-3 text-ink-body font-mono">
                          {val || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {featuresList.some(f => f.text.trim()) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-taupe" /> Design Features & Tailoring Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {featuresList.filter(f => f.text.trim()).map((feat) => (
                <div key={feat.id} className="flex items-start gap-2 text-xs text-ink-body bg-canvas p-2.5 rounded-xl border border-line/60">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(careText || item.external_gallery_url) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-4">
            {careText && (
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider block mb-1.5">Garment Care Guidelines</h3>
                <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-wrap">{careText}</p>
              </div>
            )}
            {item.external_gallery_url && (
              <div className="pt-3 border-t border-line/60 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-ink">External Media Gallery</span>
                <a
                  href={item.external_gallery_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-canvas border border-line text-taupe font-bold text-xs hover:bg-sunken flex items-center gap-1.5 transition-all"
                >
                  <span>Open Link</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderTabOrders = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">Order History & Sales Breakdown</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Every walk-in sale and custom order booked against this design.
          </p>
        </div>
        <span className="text-xs font-bold bg-sunken px-3 py-1 rounded-xl text-ink-body border border-line">
          {allOrders.length} {allOrders.length === 1 ? 'Order' : 'Orders'} Total
        </span>
      </div>

      {allOrders.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          <ShoppingBag size={38} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold">No orders recorded yet for this design.</p>
          <p className="text-xs text-ink-faint mt-1">
            When customers order this item from your storefront or via walk-in, orders will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sunken border-b border-line text-ink font-bold">
                <th className="py-3 px-4">Order Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size Selected</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Production Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {allOrders.map((ord) => (
                <tr key={`${ord.type}-${ord.id}`} className="hover:bg-canvas/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-ink">
                    {ord.order_number || `#${ord.id}`}
                  </td>
                  <td className="py-3 px-4 font-semibold text-ink">
                    {ord.customer?.name || 'Walk-in Client'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-sunken border border-line text-[10px] font-semibold text-ink-muted">
                      {ord.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-ink-body">
                    {ord.selected_size || 'Standard'}
                  </td>
                  <td className="py-3 px-4 font-bold text-ink font-mono">
                    ₱{Number(ord.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        ord.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {ord.payment_status || 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-medium text-ink-body capitalize">
                      {(ord.status || 'Pending').replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-ink-muted text-[11px]">
                    {new Date(ord.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderTabReviews = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-base font-bold text-ink">Customer Reviews & Feedback</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Ratings and reviews submitted by verified customers.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-canvas px-4 py-2 rounded-xl border border-line">
          <div className="flex items-center gap-1 text-amber-500 font-black text-lg">
            <Star size={18} className="fill-current" />
            <span>{item.reviews_avg_rating ? item.reviews_avg_rating : '0.0'}</span>
          </div>
          <span className="text-xs font-medium text-ink-muted">({reviews.length} reviews)</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          <Star size={38} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold">No reviews submitted yet for this item.</p>
          <p className="text-xs text-ink-faint mt-1">
            Reviews left on your public storefront will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-xl bg-canvas border border-line/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-ink">{rev.user?.name || 'Customer'}</span>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={`star-${rev.id}-${i}`}
                        size={12}
                        className={i < (rev.rating || 0) ? 'fill-current' : 'text-zinc-300'}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-ink-muted">
                  {new Date(rev.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {rev.comment && (
                <p className="text-xs text-ink-body leading-relaxed">{rev.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTabRecommendations = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-base font-bold text-ink">Related & Cross-Sell Designs</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Items suggested alongside this design on your public storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddRecModal}
          className="px-4 py-2 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-[#8A7063] transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-center cursor-pointer"
        >
          <Plus size={15} />
          <span>Link Related Design</span>
        </button>
      </div>

      {(!item.recommendations || item.recommendations.length === 0) ? (
        <div className="py-16 text-center text-ink-muted">
          <Sparkles size={38} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold">No related items linked yet.</p>
          <p className="text-xs text-ink-faint mt-1 mb-5">
            Suggest complementary accessories, pairs, or similar silhouettes right here.
          </p>
          <button
            type="button"
            onClick={openAddRecModal}
            className="px-4 py-2 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-[#8A7063] transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus size={15} /> Link First Related Design
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {item.recommendations.map((rec) => {
            const recItem = rec.recommended_item;
            if (!recItem) return null;
            const recImg = recItem.images?.[0]?.image_url;
            return (
              <div
                key={rec.id}
                className="bg-canvas border border-line rounded-xl p-3 flex flex-col justify-between gap-3 relative group hover:border-taupe transition-all"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-sunken shrink-0">
                    {recImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getMediaUrl(recImg)}
                        alt={recItem.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <Link href={`/dashboard/catalog/${recItem.id}`} className="hover:underline">
                        <h4 className="text-xs font-bold text-ink truncate group-hover:text-taupe transition-colors">
                          {recItem.name}
                        </h4>
                      </Link>
                      <span className="text-[10px] text-taupe font-bold uppercase tracking-wider block mt-0.5">
                        {(rec.recommendation_type || 'similar').replaceAll('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-ink font-mono">
                      {formatCatalogPrice(recItem.price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-line/60 text-[11px]">
                  <Link
                    href={`/dashboard/catalog/${recItem.id}`}
                    className="text-taupe font-semibold hover:underline"
                  >
                    View Overview →
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecommendation(recItem.id)}
                    className="text-ink-muted hover:text-red-600 transition-colors p-1 rounded cursor-pointer"
                    title="Unlink related design"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-ink pb-12">
      {/* ── Top Header Panel ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/catalog')}
            className="h-10 w-10 rounded-xl bg-canvas border border-line text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer mt-0.5"
            title="Back to Catalog"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{item.name}</h1>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  item.is_active !== false
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {item.is_active !== false ? 'Active' : 'Paused'}
              </span>
              {item.garment_type && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-sunken text-ink-muted border border-line capitalize">
                  {item.garment_type.replaceAll('_', ' ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
              <span className="font-semibold text-ink">{formatCatalogPrice(item.price)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-taupe" /> Est. {item.estimated_days ?? 7} days
              </span>
              {item.material && (
                <>
                  <span>•</span>
                  <span>{item.material}</span>
                </>
              )}
              {shop?.slug && (
                <>
                  <span>•</span>
                  <a
                    href={`/shop/${shop.slug}?tab=catalog`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-taupe hover:underline"
                  >
                    <span>Storefront View</span>
                    <ExternalLink size={12} />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className="px-3.5 py-2 rounded-xl bg-canvas hover:bg-sunken border border-line text-ink-body font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title={item.is_active !== false ? 'Pause listing' : 'Activate listing'}
          >
            {renderStatusToggleButton()}
          </button>
          <Link
            href={`/dashboard/catalog/${item.id}/edit`}
            className="px-4 py-2 rounded-xl bg-canvas hover:bg-sunken border border-line text-ink font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <Edit3 size={14} className="text-taupe" />
            <span>Edit Design</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-xl bg-canvas hover:bg-red-50 border border-line hover:border-red-200 text-ink-muted hover:text-red-600 transition-all cursor-pointer"
            title="Delete design"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ── 5-Card Stat Band (KPI Overview) ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          {
            label: 'Total Revenue',
            value: `₱${Number(item.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            sub: 'From all orders',
            icon: DollarSign,
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          },
          {
            label: 'Total Orders',
            value: String(item.order_count ?? (item.catalog_orders_count || 0) + (item.job_orders_count || 0)),
            sub: `${item.catalog_orders_count || 0} walk-in · ${item.job_orders_count || 0} custom`,
            icon: ShoppingBag,
            color: 'bg-blue-50 text-blue-700 border-blue-200',
          },
          {
            label: 'Storefront Views',
            value: String(item.views_count || 0),
            sub: 'Customer impressions',
            icon: Eye,
            color: 'bg-amber-50 text-amber-800 border-amber-200',
          },
          {
            label: 'Wishlist Saves',
            value: String(item.saves_count || 0),
            sub: 'Saved by customers',
            icon: Heart,
            color: 'bg-rose-50 text-rose-700 border-rose-200',
          },
          {
            label: 'Average Rating',
            value: item.reviews_avg_rating ? `${item.reviews_avg_rating} ★` : 'No rating',
            sub: `${item.reviews_count || 0} customer reviews`,
            icon: Star,
            color: 'bg-purple-50 text-purple-700 border-purple-200',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-4 shadow-sm border border-line flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">{stat.label}</span>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${stat.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <div>
                <p className="text-xl font-black text-ink tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-ink-muted mt-0.5">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-line pb-2 overflow-x-auto">
        {[
          { id: 'overview' as const, label: 'Overview & Design Specs', icon: Shirt },
          { id: 'orders' as const, label: `Orders & Sales (${allOrders.length})`, icon: ShoppingBag },
          { id: 'reviews' as const, label: `Reviews & Ratings (${reviews.length})`, icon: Star },
          { id: 'recommendations' as const, label: `Related Items (${(item.recommendations || []).length})`, icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-taupe text-white shadow-xs'
                  : 'bg-white text-ink-muted hover:text-ink hover:bg-canvas border border-line'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active Tab Content ────────────────────────────────────────────── */}
      {activeTab === 'overview' && renderTabOverview()}
      {activeTab === 'orders' && renderTabOrders()}
      {activeTab === 'reviews' && renderTabReviews()}
      {activeTab === 'recommendations' && renderTabRecommendations()}

      {/* Visual Multi-Select Link Recommendation Modal */}
      <Modal
        isOpen={isAddRecModalOpen}
        onClose={() => setIsAddRecModalOpen(false)}
        title="Link Related Designs"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-ink-muted">
              {selectedRecItemIds.length > 0 ? (
                <span><strong>{selectedRecItemIds.length}</strong> selected as <strong>{selectedRecType}</strong></span>
              ) : (
                <span>Click cards to select</span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddRecModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-ink-body hover:bg-canvas rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRecommendations}
                disabled={savingRec || selectedRecItemIds.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-[#8A7063] transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                {savingRec ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>{getLinkRecButtonLabel()}</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-3.5 text-ink">
          {/* Controls: Search + Relationship Type + Select All */}
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 min-w-30">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={recSearch}
                onChange={e => setRecSearch(e.target.value)}
                placeholder="Search designs or fabric..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-line rounded-xl bg-canvas focus:outline-none focus:border-taupe"
              />
            </div>

            <select
              value={selectedRecType}
              onChange={e => setSelectedRecType(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-line rounded-xl bg-canvas focus:outline-none focus:border-taupe font-semibold text-ink capitalize shrink-0"
            >
              <option value="similar">Similar Silhouette</option>
              <option value="accessory">Matching Accessory</option>
              <option value="matching">Entourage Pair</option>
              <option value="complementary">Complementary</option>
            </select>

            {filteredAvailable.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedRecItemIds(
                  selectedRecItemIds.length === filteredAvailable.length
                    ? []
                    : filteredAvailable.map(i => i.id)
                )}
                className="px-3 py-1.5 text-xs font-semibold text-taupe bg-taupe/10 hover:bg-taupe/20 rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                {selectedRecItemIds.length === filteredAvailable.length ? 'Clear All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Visual Cards Grid */}
          {renderAvailableRecGrid()}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <CatalogDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
