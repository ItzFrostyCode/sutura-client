'use client';

import { useEffect, useState, useCallback, use, Suspense } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import { MapPin, Star, Phone, Mail, Loader2, Clock, ExternalLink, Image as ImageIcon, AlertCircle, ShoppingBag, Map, Building2, Package, Camera, Pencil, Plus, Trash2, Upload, Info, Search, Calendar, type LucideIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import ServiceDetailModal from '@/components/profile/ServiceDetailModal';
import { getActiveSale } from '@/lib/salePricing';
import { useToast } from '@/context/ToastContext';
import { Service } from '@/components/services/serviceHelpers';
import ServiceFormModal from '@/components/services/ServiceFormModal';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import EditOperatingHoursModal from '@/components/profile/EditOperatingHoursModal';
import SpecialHoursAnnouncementCard from '@/components/profile/SpecialHoursAnnouncementCard';
import ProfileAboutTab from '@/components/profile/ProfileAboutTab';
import PostImageLightbox from '@/components/profile/PostImageLightbox';
import BrandLogo from '@/components/BrandLogo';
import AccountHeaderMenu from '@/components/AccountHeaderMenu';

// Leaflet touches `window`, so load the map client-only — same approach the
// dashboard's own branches map uses.
const SingleBranchMap = dynamic(() => import('@/components/profile/SingleBranchMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl p-10 text-center text-sm text-[#827A73]" style={{ height: 360 }}>
      Loading map…
    </div>
  ),
});

interface ShopBranch {
  id: number;
  name: string;
  address: string;
  city: string;
  contact_number?: string;
  operating_hours?: string;
  latitude?: string;
  longitude?: string;
  guide_image_url?: string | null;
}

interface PublicService {
  id: number;
  name: string;
  description?: string;
  categories?: string[];
  base_price: string;
  sale_price?: string | number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  estimated_days: number;
  is_active: boolean;
  image_url?: string | null;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  custom_fields?: {
    name: string;
    label: string;
    type: 'short_text' | 'number' | 'dropdown' | 'single_choice' | 'multi_select';
    required?: boolean;
    options?: string[];
  }[];
}

interface PublicServicePackage {
  id: number;
  name: string;
  description: string | null;
  bundle_price: string | null;
  services: { id: number; name: string; base_price: string | null }[];
}

interface CatalogItemImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

interface CatalogListItem {
  id: number;
  name: string;
  price: string;
  estimated_days?: number | null;
  material: string;
  garment_type?: string | null;
  images: CatalogItemImage[];
}

interface PublicShopPost {
  id: number;
  image_urls: string[];
  caption: string;
  service_id: number | null;
  service?: { id: number; name: string } | null;
  created_at: string;
}

interface StorefrontReview {
  id: number;
  user: { id: number; name: string };
  rating: number;
  comment: string | null;
  reply: string | null;
  is_featured: boolean;
  created_at: string;
}

interface ShopProfile {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  logo_path: string;
  banner_path?: string | null;
  // The About tab's Social Media Links editor (SettingsBasicInfo/useSettings)
  // stores this as a free-form array of { label, url } — NOT a fixed
  // { facebook, instagram, tiktok } object. getSocialUrl() below bridges
  // the two so saving a link there actually shows up here.
  social_links: { label: string; url: string }[];
  reviews_avg_rating: number | null;
  reviews_count: number;
  branches?: ShopBranch[];
  owner?: {
    id: number;
    name: string;
    email: string;
    profile_picture?: string | null;
  };
  active_special_hours?: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
    announcement_image_url: string | null;
  } | null;
  operating_hours?: Record<string, { is_open: boolean; open: string; close: string }>;
  special_hours?: Array<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
    announcement_image_url: string | null;
  }>;
}

interface PublicShopProfilePageProps {
  readonly params: Promise<{
    readonly shop_id: string;
  }>;
}

function PublicShopProfileContent({ params }: Readonly<PublicShopProfilePageProps>) {
  const { shop_id: shopId } = use(params);
  const { user, shop: authShop, token, setAuth } = useAuthStore();
  const toast = useToast();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [packages, setPackages] = useState<PublicServicePackage[]>([]);
  const [posts, setPosts] = useState<PublicShopPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Whether the person currently viewing this page is the shop's own owner —
  // matched by slug since that's what identifies this page. Drives whether
  // edit affordances render at all; the public page stays pure read-only
  // for everyone else, including a different shop's own owner.
  const isOwnerViewingOwnShop = !!authShop && authShop.slug === shopId && user?.roles?.[0]?.name === 'shop_owner';

  // Full, authenticated service records (pricing tiers, service types, etc.)
  // for the owner's inline edit flow — the public /services endpoint returns
  // a slimmer shape that isn't enough to populate the edit form correctly.
  const [ownerServices, setOwnerServices] = useState<Service[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [isServiceSubmitting, setIsServiceSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [isServiceDeleteOpen, setIsServiceDeleteOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);

  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  const MAX_POST_IMAGES = 12;
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [postImageUrls, setPostImageUrls] = useState<string[]>([]);
  const [postUploading, setPostUploading] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [postServiceId, setPostServiceId] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const searchParams = useSearchParams();
  const selectedBranchId = searchParams.get('branch_id');
  const initialTabParam = searchParams.get('tab');

  // Review State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PublicServicePackage | null>(null);
  // A branch_id in the URL means we arrived here from the owner's "Preview Customer
  // View" link for a specific branch — land straight on Locations with it highlighted.
  // A ?tab= param covers old bookmarks/links to the standalone /catalog page, which
  // now redirects here instead of being its own route.
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'services' | 'catalog' | 'hours' | 'locations' | 'work' | 'reviews'>(
    selectedBranchId
      ? 'locations'
      : (initialTabParam === 'catalog' || initialTabParam === 'reviews' || initialTabParam === 'about' ? initialTabParam : 'home')
  );

  // Catalog tab state — same data source and behavior as the old standalone
  // /shop/[slug]/catalog page, just embedded here instead of a separate route.
  const [catalogItems, setCatalogItems] = useState<CatalogListItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogGarmentTypeFilter, setCatalogGarmentTypeFilter] = useState('');

  // Reviews tab state — everyone sees the same list; reply/feature/delete
  // actions are owner-only, same management the dashboard's Reviews page had.
  const [reviews, setReviews] = useState<StorefrontReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLastPage, setReviewsLastPage] = useState(1);
  const [reviewFilterRating, setReviewFilterRating] = useState('');
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [currentReviewForReply, setCurrentReviewForReply] = useState<StorefrontReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [mapModalBranch, setMapModalBranch] = useState<ShopBranch | null>(null);

  const getSocialUrl = (links: { label: string; url: string }[] | undefined, keyword: string): string | undefined =>
    links?.find(l => l.label?.toLowerCase().includes(keyword))?.url;

  const getMessengerUrl = (facebookUrl?: string) => {
    if (!facebookUrl) return 'https://m.me/suturatailoring';
    try {
      const url = new URL(facebookUrl);
      const pathname = url.pathname.replace(/^\/|\/$/g, '');
      if (pathname && !pathname.includes('/') && pathname !== 'profile.php') {
        return `https://m.me/${pathname}`;
      }
    } catch {
      // Ignore URL parse error
    }
    return 'https://m.me/suturatailoring';
  };

  const activeBranch = shop?.branches?.find(b => b.id.toString() === selectedBranchId);

  const fetchShop = useCallback(() => {
    api.get(`/public/shops/${shopId}`)
      .then(res => {
        setShop(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shopId]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  // Fetch public services
  useEffect(() => {
    api.get(`/public/shops/${shopId}/services`)
      .then(res => setServices((res.data.data || []).filter((s: PublicService) => s.is_active)))
      .catch(() => {
        // Fall back silently — services section won't show
      });
  }, [shopId]);

  // Fetch public service packages (combo bundles)
  useEffect(() => {
    api.get(`/public/shops/${shopId}/service-packages`)
      .then(res => setPackages(res.data.data || []))
      .catch(() => {
        // Fall back silently — packages section won't show
      });
  }, [shopId]);

  // Fetch the shop's "Our Work" posts (completed-order showcase)
  useEffect(() => {
    api.get(`/public/shops/${shopId}/posts`)
      .then(res => setPosts(res.data.data || []))
      .catch(() => {
        // Fall back silently — Our Work tab just won't show
      });
  }, [shopId]);

  // Fetch the catalog listing — same endpoint the old standalone /catalog
  // page used, just embedded here instead of navigating to a separate route.
  useEffect(() => {
    api.get(`/catalog/${shopId}`)
      .then(res => {
        setCatalogItems(res.data.data || []);
        setCatalogLoading(false);
      })
      .catch(() => {
        setCatalogLoading(false);
      });
  }, [shopId]);

  // Fetch reviews — same list for everyone; reply/feature/delete stay owner-only.
  useEffect(() => {
    let ignore = false;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      const params = new URLSearchParams({ page: String(reviewsPage) });
      if (reviewFilterRating) params.append('rating', reviewFilterRating);
      try {
        const res = await api.get(`/public/shops/${shopId}/reviews?${params.toString()}`);
        if (!ignore) {
          setReviews(res.data.data.data || []);
          setReviewsLastPage(res.data.data.last_page || 1);
        }
      } catch {
        // Fall back silently
      } finally {
        if (!ignore) setReviewsLoading(false);
      }
    };
    fetchReviews();
    return () => { ignore = true; };
  }, [shopId, reviewsPage, reviewFilterRating]);

  // If the owner has a valid session token but the in-memory auth store hasn't
  // been populated yet (e.g. they landed here via a hard refresh instead of
  // client-side navigation from the dashboard), rehydrate it silently. A failed
  // or expired token just leaves this as the normal public read-only view —
  // unlike the dashboard layout's bootstrap, we never redirect from here.
  useEffect(() => {
    if (!user && token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            const { user: fetchedUser, shop: fetchedShop, staff_profile } = res.data.data;
            setAuth(fetchedUser, token, fetchedShop, staff_profile);
          }
        })
        .catch(() => {
          // Invalid/expired token on a public page — fail silently.
        });
    }
  }, [user, token, setAuth]);

  const refreshOwnerServices = (shopIdForFetch: number) => {
    api.get(`/shops/${shopIdForFetch}/services`)
      .then(res => setOwnerServices(res.data.data || []))
      .catch(() => {
        // Fall back silently — owner just won't see edit-ready data yet
      });
  };

  useEffect(() => {
    if (isOwnerViewingOwnShop && authShop) {
      Promise.resolve().then(() => refreshOwnerServices(authShop.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnerViewingOwnShop, authShop?.id]);

  // ─── Owner-only inline edit handlers (no-ops unless isOwnerViewingOwnShop) ───

  const refreshPublicServices = () => {
    api.get(`/public/shops/${shopId}/services`)
      .then(res => setServices((res.data.data || []).filter((s: PublicService) => s.is_active)))
      .catch(() => {
        // Fall back silently
      });
  };

  const handleServiceSubmit = async (payload: Record<string, unknown>) => {
    if (!authShop) return;
    setIsServiceSubmitting(true);
    setServiceError('');
    try {
      if (editingServiceId) {
        await api.put(`/shops/${authShop.id}/services/${editingServiceId}`, payload);
        toast.success('Service updated.');
      } else {
        await api.post(`/shops/${authShop.id}/services`, payload);
        toast.success('Service added.');
      }
      refreshOwnerServices(authShop.id);
      refreshPublicServices();
      setIsServiceModalOpen(false);
      setEditingServiceId(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setServiceError(error.response?.data?.message || 'Failed to save service.');
    } finally {
      setIsServiceSubmitting(false);
    }
  };

  const confirmDeleteService = async () => {
    if (!authShop || !deletingServiceId) return;
    setIsServiceSubmitting(true);
    try {
      await api.delete(`/shops/${authShop.id}/services/${deletingServiceId}`);
      refreshOwnerServices(authShop.id);
      refreshPublicServices();
      setIsServiceDeleteOpen(false);
      setDeletingServiceId(null);
      toast.success('Service deleted.');
    } catch {
      toast.error('Failed to delete service.');
    } finally {
      setIsServiceSubmitting(false);
    }
  };

  const handleHoursSaved = (hours: Record<string, { is_open: boolean; open: string; close: string }>) => {
    setShop(prev => (prev ? { ...prev, operating_hours: hours } : prev));
  };

  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !authShop) return;

    const slotsLeft = MAX_POST_IMAGES - postImageUrls.length;
    if (slotsLeft <= 0) {
      toast.error(`You can only add up to ${MAX_POST_IMAGES} photos per post.`);
      e.target.value = '';
      return;
    }
    const filesToUpload = Array.from(files).slice(0, slotsLeft);
    if (files.length > slotsLeft) {
      toast.error(`Only ${MAX_POST_IMAGES} photos are allowed per post — added the first ${slotsLeft}.`);
    }

    setPostUploading(true);
    try {
      const uploaded = await Promise.all(filesToUpload.map(async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post(`/shops/${authShop.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data.data?.url || res.data.url;
      }));
      setPostImageUrls(prev => [...prev, ...uploaded.filter(Boolean)]);
    } catch {
      toast.error('Failed to upload one or more photos.');
    } finally {
      setPostUploading(false);
      e.target.value = '';
    }
  };

  const removePostImage = (url: string) => {
    setPostImageUrls(prev => prev.filter(u => u !== url));
  };

  const submitPost = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!authShop || postImageUrls.length === 0 || !postCaption.trim()) return;
    setPostSubmitting(true);
    try {
      const res = await api.post(`/shops/${authShop.id}/posts`, {
        image_urls: postImageUrls,
        caption: postCaption.trim(),
        service_id: postServiceId ? Number.parseInt(postServiceId, 10) : null,
      });
      setPosts(prev => [res.data.data, ...prev]);
      setPostImageUrls([]);
      setPostCaption('');
      setPostServiceId('');
      setIsAddingPost(false);
      toast.success('Posted! Customers can now see this on your storefront.');
    } catch {
      toast.error('Failed to publish post.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const deletePost = async (id: number) => {
    if (!authShop) return;
    try {
      await api.delete(`/shops/${authShop.id}/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post removed.');
    } catch {
      toast.error('Failed to remove post.');
    }
  };

  const refreshOwnerReviews = () => {
    if (!authShop) return;
    const params = new URLSearchParams({ page: String(reviewsPage) });
    if (reviewFilterRating) params.append('rating', reviewFilterRating);
    api.get(`/shops/${authShop.id}/reviews?${params.toString()}`)
      .then(res => {
        setReviews(res.data.data.data || []);
        setReviewsLastPage(res.data.data.last_page || 1);
      })
      .catch(() => {
        // Fall back silently
      });
  };

  const handleToggleFeatureReview = async (review: StorefrontReview) => {
    if (!authShop) return;
    try {
      await api.put(`/shops/${authShop.id}/reviews/${review.id}`, { is_featured: !review.is_featured });
      refreshOwnerReviews();
    } catch {
      toast.error('Failed to update featured status.');
    }
  };

  const submitReviewReply = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!authShop || !currentReviewForReply) return;
    setReplySubmitting(true);
    try {
      await api.put(`/shops/${authShop.id}/reviews/${currentReviewForReply.id}`, { reply: replyText });
      setReplyModalOpen(false);
      refreshOwnerReviews();
      toast.success('Reply saved.');
    } catch {
      toast.error('Failed to submit reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!authShop) return;
    try {
      await api.delete(`/shops/${authShop.id}/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review deleted.');
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  const submitRating = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to leave a review.");
      return;
    }
    if (!shop) {
      alert("Shop profile is still loading. Please try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/shops/${shop.id}/reviews`, {
        rating: ratingValue,
        comment: ratingComment
      });
      setIsRatingModalOpen(false);
      fetchShop(); // Refresh counts
    } catch (e) {
      console.error(e);
      alert("Failed to submit rating. You might have already rated this shop.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>;
  }

  if (!shop) {
    return <div className="py-32 text-center text-[#A8A19A]">Shop not found.</div>;
  }

  const tabList: { id: 'home' | 'about' | 'services' | 'catalog' | 'hours' | 'locations' | 'work' | 'reviews'; label: string; icon: LucideIcon }[] = [
    { id: 'home', label: 'Home', icon: Building2 },
  ];
  if (isOwnerViewingOwnShop) {
    tabList.push({ id: 'about', label: 'About', icon: Info });
  }
  tabList.push(
    { id: 'services', label: 'Services', icon: ShoppingBag },
    { id: 'catalog', label: 'Catalog', icon: Package },
    { id: 'hours', label: 'Hours', icon: Clock },
  );
  if (shop.branches && shop.branches.length > 0) {
    tabList.push({ id: 'locations', label: 'Branches', icon: Map });
  }
  if (posts.length > 0 || isOwnerViewingOwnShop) {
    tabList.push({ id: 'work', label: 'Our Work', icon: Camera });
  }
  tabList.push({ id: 'reviews', label: 'Reviews', icon: Star });

  // Post photo grid: shows at most 4 thumbnails so a 12-photo post doesn't
  // overwhelm the feed — the 4th tile gets a "+N" overlay for the rest.
  // Every visible thumbnail opens the same lightbox, just starting at a
  // different index, so the hidden photos are still one click away.
  const renderPostImageGrid = (images: string[], openLightbox: (index: number) => void) => {
    const count = images.length;
    if (count <= 1) {
      return (
        <button type="button" onClick={() => openLightbox(0)} className="block w-full aspect-4/3 bg-[#F0EAE3] relative focus:outline-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt="" className="w-full h-full object-cover" />
        </button>
      );
    }
    const gridCols = count === 3 ? 'grid-cols-3' : 'grid-cols-2';
    const visible = images.slice(0, 4);
    const remaining = count - visible.length;
    return (
      <div className={`grid ${gridCols} gap-0.5 aspect-4/3`}>
        {visible.map((img, i) => (
          <button
            type="button"
            key={img}
            onClick={() => openLightbox(i)}
            className="relative overflow-hidden focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="w-full h-full object-cover" />
            {i === visible.length - 1 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-lg">
                +{remaining}
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-zinc-900 selection:bg-[#EBE6E0] selection:text-indigo-900">
      {/* Navigation Bar — this is the SUTURA platform's own header, not the
          shop's. The shop's identity (logo, name, actions like View Catalog
          and Book Appointment) already lives in the profile card and its Home
          tab right below, so it isn't repeated up here. When the owner is
          viewing their own shop, this is the exact same account menu (bell +
          profile dropdown) as the dashboard header — same component, not a
          second build of it — minus the Premium Plan badge and branch
          switcher, which are dashboard-data-scoping concepts with no meaning
          on a public page. The logo click already goes to /dashboard, same as
          clicking the dashboard's own logo does. */}
      <nav className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={isOwnerViewingOwnShop ? '/dashboard' : '/'} className="flex items-center gap-2">
            <BrandLogo iconOnly className="w-8 h-8" />
            <span className="font-serif font-bold text-lg tracking-tight text-zinc-900">SUTURA</span>
          </Link>
          {isOwnerViewingOwnShop && <AccountHeaderMenu />}
        </div>
      </nav>

      {(shop.active_special_hours?.announcement_message || shop.active_special_hours?.announcement_image_url) && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 py-3.5 px-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            {shop.active_special_hours.announcement_image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={shop.active_special_hours.announcement_image_url}
                alt=""
                className="w-10 h-10 rounded-lg object-cover border border-amber-200 shrink-0"
              />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div className="text-sm font-medium">
              <span className="font-bold mr-1">{shop.active_special_hours.title}:</span>
              {shop.active_special_hours.announcement_message}
            </div>
          </div>
        </div>
      )}

      {/* Unified Profile Card — same header/tabs pattern as the owner's dashboard
          storefront widget, so the public page and the dashboard preview feel
          like one design instead of two different UIs bolted together. */}
      <div className="flex-1 bg-[#FAF6F3] py-8">
        <div className="max-w-5xl mx-auto px-6 space-y-8">

          <div className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
            {shop.banner_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.banner_path} alt="" className="h-32 md:h-48 w-full object-cover" />
            ) : (
              <div className="h-32 md:h-48 bg-gradient-to-br from-[#F0EAE3] to-[#EBE6E0] w-full" />
            )}

            <div className="px-5 md:px-8 relative">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-10">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-5 text-center md:text-left">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm shrink-0">
                    {shop.logo_path ? (
                      <Image
                        src={shop.logo_path}
                        alt={shop.name}
                        width={112}
                        height={112}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8C6B5D] text-4xl font-serif bg-[#FAF6F3]">
                        {shop.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="mb-1 md:mb-2">
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900">{shop.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 mt-1.5 text-sm text-[#827A73]">
                      <span className="flex items-center gap-1 font-medium">
                        <Star size={14} className="fill-current text-[#BCA89F]" />
                        {shop.reviews_avg_rating ? shop.reviews_avg_rating : 'New'} · {shop.reviews_count} {shop.reviews_count === 1 ? 'Review' : 'Reviews'}
                      </span>
                      {(activeBranch || shop.address) && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {activeBranch ? activeBranch.city : shop.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-2 md:mb-3 shrink-0">
                  {isOwnerViewingOwnShop && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('about')}
                      title="Edit Profile"
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#524A44] rounded-lg transition-colors text-sm font-medium"
                    >
                      <Pencil size={15} /> Edit
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    title="Catalog"
                    className="p-2.5 bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#524A44] rounded-lg transition-colors"
                  >
                    <Package size={17} />
                  </button>

                  {shop.active_special_hours?.is_closed ? (
                    <button
                      type="button"
                      disabled
                      title="Online booking is temporarily disabled"
                      className="p-2.5 bg-[#B26959]/10 text-[#B26959]/50 rounded-lg cursor-not-allowed"
                    >
                      <Calendar size={17} />
                    </button>
                  ) : (
                    <Link
                      href={`/shop/${shopId}/book`}
                      title="Book Appointment"
                      className="p-2.5 bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#524A44] rounded-lg transition-colors"
                    >
                      <Calendar size={17} />
                    </Link>
                  )}

                  {!isOwnerViewingOwnShop && (
                    <>
                      <button
                        onClick={() => setIsRatingModalOpen(true)}
                        className="px-4 py-2 bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#524A44] rounded-lg transition-colors text-sm font-medium"
                      >
                        Rate Shop
                      </button>
                      <a
                        href={getMessengerUrl(getSocialUrl(shop.social_links, 'facebook'))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#2D2A26] hover:bg-[#9A8073] text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        💬 Chat
                      </a>
                    </>
                  )}
                </div>
              </div>

              <hr className="mt-5 mb-0 border-[#EBE6E0]" />

              <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                {tabList.map(tab => {
                  const isActive = activeTab === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                        isActive
                          ? 'border-[#2D2A26] text-[#2D2A26]'
                          : 'border-transparent text-[#827A73] hover:text-[#524A44]'
                      }`}
                    >
                      <TabIcon size={15} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TAB: HOME */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                {activeBranch && (
                  <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1">Selected Location</p>
                    <p className="text-sm font-semibold text-[#2D2A26]">{activeBranch.name}</p>
                  </div>
                )}

                <div className="bg-white border border-[#EBE6E0] rounded-2xl p-5 shadow-sm space-y-3">
                  {activeBranch ? (
                    <>
                      <div className="flex items-start gap-3 text-[#827A73] text-sm">
                        <MapPin className="w-4 h-4 text-[#9A8073] shrink-0 mt-0.5" />
                        <span>{activeBranch.address}, {activeBranch.city}</span>
                      </div>
                      {activeBranch.contact_number && (
                        <div className="flex items-center gap-3 text-[#827A73] text-sm">
                          <Phone className="w-4 h-4 text-[#9A8073] shrink-0" />
                          <span>{activeBranch.contact_number}</span>
                        </div>
                      )}
                      {activeBranch.operating_hours && (
                        <div className="flex items-center gap-3 text-[#827A73] text-sm">
                          <Clock className="w-4 h-4 text-[#9A8073] shrink-0" />
                          <span>{activeBranch.operating_hours}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {shop.address && (
                        <div className="flex items-start gap-3 text-[#827A73] text-sm">
                          <MapPin className="w-4 h-4 text-[#9A8073] shrink-0 mt-0.5" />
                          <span>{shop.address}, {shop.city}, {shop.province}</span>
                        </div>
                      )}
                      {shop.phone && (
                        <div className="flex items-center gap-3 text-[#827A73] text-sm">
                          <Phone className="w-4 h-4 text-[#9A8073] shrink-0" />
                          <span>{shop.phone}</span>
                        </div>
                      )}
                    </>
                  )}
                  {shop.email && (
                    <div className="flex items-center gap-3 text-[#827A73] text-sm">
                      <Mail className="w-4 h-4 text-[#9A8073] shrink-0" />
                      <span>{shop.email}</span>
                    </div>
                  )}
                </div>

                {shop.social_links && shop.social_links.filter(l => l.url).length > 0 && (
                  <div className="bg-white border border-[#EBE6E0] rounded-2xl p-5 shadow-sm flex flex-wrap gap-2">
                    {shop.social_links.filter(l => l.url).map(link => {
                      const key = link.label?.toLowerCase() ?? '';
                      const styleClass = key.includes('facebook')
                        ? 'bg-zinc-100 hover:bg-[#F0EAE3] text-[#886E62]'
                        : key.includes('instagram')
                        ? 'bg-zinc-100 hover:bg-pink-50 text-pink-600'
                        : key.includes('tiktok')
                        ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold'
                        : 'bg-zinc-100 hover:bg-[#F0EAE3] text-[#524A44]';
                      return (
                        <a
                          key={link.label + link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3 py-1.5 rounded-full transition-colors text-sm font-medium ${styleClass}`}
                        >
                          {link.label || 'Link'}
                        </a>
                      );
                    })}
                  </div>
                )}

                {shop.owner && (
                  <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-[#9A8073] flex items-center justify-center text-white font-semibold text-lg shrink-0">
                      {shop.owner.profile_picture ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={shop.owner.profile_picture} alt={shop.owner.name} className="w-full h-full object-cover" />
                      ) : (
                        shop.owner.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#827A73] uppercase tracking-wider">Shop Owner</p>
                      <h4 className="text-sm font-bold text-[#2D2A26]">{shop.owner.name}</h4>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
                  <h3 className="font-serif text-lg font-bold text-zinc-900 mb-2">About</h3>
                  <p className="text-[#524A44] leading-relaxed">
                    {shop.description || 'A premium tailoring establishment dedicated to exceptional craftsmanship.'}
                  </p>
                </div>

                {isOwnerViewingOwnShop && authShop && (
                  <SpecialHoursAnnouncementCard shopId={authShop.id} onSaved={fetchShop} />
                )}
              </div>
            </div>
          )}

          {/* TAB: ABOUT — owner-only settings editor, reused as-is from the dashboard
              so editing here and editing from /dashboard/profile are the exact same
              component, not two parallel implementations. */}
          {activeTab === 'about' && isOwnerViewingOwnShop && (
            <ProfileAboutTab />
          )}

          {/* TAB: SERVICES */}
          {activeTab === 'services' && (
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-zinc-900">Our Services</h2>
                  <p className="text-[#827A73] text-sm mt-1">Browse our tailoring offerings and estimated turnaround times.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {isOwnerViewingOwnShop && (
                    <button
                      type="button"
                      onClick={() => { setEditingServiceId(null); setServiceError(''); setIsServiceModalOpen(true); }}
                      className="flex items-center gap-1.5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors"
                    >
                      <Plus size={15} /> Add Service
                    </button>
                  )}
                  {services.length > 0 && (
                    <button type="button" onClick={() => setActiveTab('catalog')} className="text-sm font-semibold text-[#9A8073] hover:underline flex items-center gap-1 whitespace-nowrap">
                      View Catalog &rarr;
                    </button>
                  )}
                </div>
              </div>

              {services.length === 0 && packages.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
                  <p className="text-[#827A73]">No services listed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedService(service); }}
                      role="button"
                      tabIndex={0}
                      className="relative bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm hover:border-[#9A8073]/40 hover:shadow-md transition-all duration-200 group flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9A8073]"
                    >
                      {isOwnerViewingOwnShop && (
                        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingServiceId(service.id);
                              setServiceError('');
                              setIsServiceModalOpen(true);
                            }}
                            title="Edit service"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/95 shadow-sm border border-[#EBE6E0] text-[#524A44] hover:text-taupe transition-colors focus:outline-none"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingServiceId(service.id);
                              setIsServiceDeleteOpen(true);
                            }}
                            title="Delete service"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/95 shadow-sm border border-[#EBE6E0] text-[#524A44] hover:text-[#B26959] transition-colors focus:outline-none"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}

                      {/* Image */}
                      <div className="h-52 bg-[#F0EAE3] border-b border-[#EBE6E0] overflow-hidden shrink-0">
                        {service.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#C5BDBA]">
                            <ImageIcon size={28} />
                            <span className="text-[11px]">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-5 space-y-2 flex flex-col flex-1">
                        <h3 className="font-serif font-bold text-zinc-900 text-base leading-snug line-clamp-2">{service.name}</h3>

                        <div className="flex items-center gap-2 text-xs">
                          {(() => {
                            const activeSale = service.base_price ? getActiveSale({ price: service.base_price, sale_price: service.sale_price, sale_starts_at: service.sale_starts_at, sale_ends_at: service.sale_ends_at }) : null;
                            if (activeSale) {
                              return (
                                <span className="font-bold flex items-center gap-1.5">
                                  <span className="line-through text-[#A8A19A] font-normal">₱{activeSale.original.toLocaleString()}</span>
                                  <span className="text-rose-600">₱{activeSale.sale.toLocaleString()}</span>
                                </span>
                              );
                            }
                            return (
                              <span className="font-bold text-[#9A8073]">
                                {service.base_price !== null && service.base_price !== undefined ? (
                                  `₱${Number.parseFloat(service.base_price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                ) : (
                                  'Custom Quote'
                                )}
                              </span>
                            );
                          })()}
                          {service.estimated_days ? (
                            <span className="flex items-center gap-1 text-[#A8A19A]">
                              <Clock size={11} /> {service.estimated_days}d
                            </span>
                          ) : null}
                        </div>

                        {service.description && (
                          <p className="text-xs text-[#827A73] line-clamp-2 leading-relaxed">{service.description}</p>
                        )}

                        {/* CTA */}
                        <div className="mt-auto pt-3 space-y-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedService(service);
                            }}
                            className="block w-full text-center bg-[#2D2A26] hover:bg-[#9A8073] text-white py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none"
                          >
                            Inquire / Order Custom →
                          </button>
                          {getSocialUrl(shop.social_links, 'facebook') && (
                            <a
                              href={getMessengerUrl(getSocialUrl(shop.social_links, 'facebook'))}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="block w-full text-center bg-white border border-[#EBE6E0] hover:bg-[#F0EAE3] text-[#524A44] py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none"
                            >
                              💬 Inquire on Facebook
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {packages.map(pkg => {
                    const sumPrice = pkg.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0);
                    const displayPrice = pkg.bundle_price ? Number(pkg.bundle_price) : sumPrice;
                    return (
                      <div
                        key={`package-${pkg.id}`}
                        onClick={() => setSelectedPackage(pkg)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedPackage(pkg); }}
                        role="button"
                        tabIndex={0}
                        className="bg-white border border-taupe/30 rounded-2xl overflow-hidden shadow-sm hover:border-taupe/60 hover:shadow-md transition-all duration-200 group flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9A8073]"
                      >
                        <div className="h-52 bg-taupe/10 border-b border-[#EBE6E0] flex items-center justify-center shrink-0">
                          <Package size={40} className="text-taupe/50" />
                        </div>

                        <div className="p-5 space-y-2 flex flex-col flex-1">
                          <div className="flex items-center gap-1.5">
                            <Package size={13} className="text-taupe shrink-0" />
                            <h3 className="font-serif font-bold text-zinc-900 text-base leading-snug line-clamp-2">{pkg.name}</h3>
                          </div>

                          <span className="text-xs font-bold text-taupe">
                            ₱{displayPrice.toLocaleString()}
                          </span>

                          <p className="text-xs text-[#827A73] line-clamp-2 leading-relaxed">
                            {pkg.description || `Includes: ${pkg.services.map(s => s.name).join(', ')}`}
                          </p>

                          <div className="mt-auto pt-3 space-y-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPackage(pkg);
                              }}
                              className="block w-full text-center bg-taupe hover:bg-taupe/90 text-white py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none"
                            >
                              View Package →
                            </button>
                            {getSocialUrl(shop.social_links, 'facebook') && (
                              <a
                                href={getMessengerUrl(getSocialUrl(shop.social_links, 'facebook'))}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block w-full text-center bg-white border border-[#EBE6E0] hover:bg-[#F0EAE3] text-[#524A44] py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none"
                              >
                                💬 Inquire on Facebook
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: CATALOG */}
          {activeTab === 'catalog' && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-zinc-900">{shop.name}&apos;s Collection</h2>
                <p className="text-[#827A73] text-sm mt-1">Explore our premium tailored garments, crafted with the finest materials and meticulous attention to detail.</p>
              </div>

              {catalogLoading ? (
                <div className="text-center py-16 text-[#A8A19A] animate-pulse">Curating showcase...</div>
              ) : (
                <>
                  {catalogItems.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={16} />
                        <input
                          type="text"
                          placeholder="Search this collection... e.g. team jersey, barong, gown"
                          value={catalogSearch}
                          onChange={e => setCatalogSearch(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-[#EBE6E0] rounded-full text-sm text-zinc-900 placeholder-[#A8A19A] focus:outline-none focus:border-taupe transition-colors"
                        />
                      </div>
                      {Array.from(new Set(catalogItems.map(i => i.garment_type).filter((v): v is string => !!v && v.trim() !== ''))).length > 1 && (
                        <select
                          value={catalogGarmentTypeFilter}
                          onChange={e => setCatalogGarmentTypeFilter(e.target.value)}
                          className="px-4 py-3 bg-white border border-[#EBE6E0] rounded-full text-sm text-zinc-900 focus:outline-none focus:border-taupe transition-colors"
                        >
                          <option value="">All Garment Types</option>
                          {Array.from(new Set(catalogItems.map(i => i.garment_type).filter((v): v is string => !!v && v.trim() !== ''))).sort((a, b) => a.localeCompare(b)).map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {(() => {
                    const filteredCatalogItems = catalogItems.filter(item =>
                      (!catalogSearch || item.name.toLowerCase().includes(catalogSearch.toLowerCase())) &&
                      (!catalogGarmentTypeFilter || item.garment_type === catalogGarmentTypeFilter)
                    );

                    if (catalogItems.length === 0) {
                      return (
                        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 text-[#827A73]">
                          This shop hasn&apos;t published any showcase items yet.
                        </div>
                      );
                    }
                    if (filteredCatalogItems.length === 0) {
                      return (
                        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 text-[#827A73]">
                          No items match your search. Try a different keyword or garment type.
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
                        {filteredCatalogItems.map(item => {
                          const primaryImage = item.images.find(img => img.is_primary)?.image_url || item.images[0]?.image_url;
                          return (
                            <Link href={`/shop/${shopId}/catalog/${item.id}`} key={item.id} className="group block">
                              <div className="aspect-3/4 bg-[#F0EAE3] overflow-hidden relative rounded-xl">
                                {primaryImage ? (
                                  <Image
                                    src={primaryImage}
                                    alt={item.name}
                                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                    fill
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#A8A19A] text-sm">No Image</div>
                                )}

                                {/* Hover Overlay for Material */}
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                  <span className="text-xs font-medium tracking-widest uppercase text-zinc-900 border border-zinc-900 px-4 py-2">
                                    {item.material || 'View Details'}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-3 text-center">
                                <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-[#886E62] transition-colors">{item.name}</h3>
                                <p className="text-xs text-[#A8A19A] mt-1">Starting at ₱{Number(item.price).toLocaleString()}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* TAB: HOURS — announcements show in the global top banner across
              every tab (see the banner right after the nav above), so this
              tab is just the standard operating hours. */}
          {activeTab === 'hours' && (
            <div className="max-w-md mx-auto">
              <div>
                <h3 className="text-xl font-bold text-[#2D2A26] mb-6 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Clock size={20} className="text-[#9A8073]" />
                    Standard Operating Hours
                  </span>
                  {isOwnerViewingOwnShop && (
                    <button
                      type="button"
                      onClick={() => setIsHoursModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-taupe hover:underline"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  )}
                </h3>

                <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
                  <div className="space-y-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                      const hours = shop.operating_hours?.[day];
                      if (!hours) return null;
                      return (
                        <div key={day} className="flex justify-between items-center text-sm py-1 border-b border-[#EBE6E0]/50 last:border-0 last:pb-0">
                          <span className="capitalize text-[#524A44] font-medium">{day}</span>
                          {hours.is_open ? (
                            <span className="text-[#2D2A26] font-bold bg-[#FAF6F3] px-3 py-1 rounded-lg">
                              {hours.open} - {hours.close}
                            </span>
                          ) : (
                            <span className="text-[#B26959] font-bold text-xs uppercase tracking-wider bg-[#B26959]/10 px-3 py-1 rounded-lg">
                              Closed
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LOCATIONS */}
          {activeTab === 'locations' && shop.branches && shop.branches.length > 0 && (
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-zinc-900">Our Branches</h2>
                  <p className="text-[#827A73] text-sm mt-1">Visit us at any of our physical tailoring shops.</p>
                </div>
                {isOwnerViewingOwnShop && (
                  <Link href="/dashboard/branches" className="shrink-0 text-sm font-semibold text-[#9A8073] hover:underline flex items-center gap-1 whitespace-nowrap">
                    <Pencil size={13} /> Manage Branches
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shop.branches.map((branch) => {
                  const isSelected = selectedBranchId === branch.id.toString();
                  return (
                    <div 
                      key={branch.id} 
                      className={`bg-white rounded-2xl p-6 transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'border-2 border-[#2D2A26] shadow-md ring-2 ring-white ring-offset-1 ring-offset-[#2D2A26]' 
                          : 'border border-[#EBE6E0] hover:border-[#9A8073] hover:shadow-md'
                      }`}
                    >
                      <div>
                        {branch.guide_image_url && (
                          <div className="-mx-6 -mt-6 mb-4 aspect-video bg-[#F0EAE3] overflow-hidden rounded-t-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={branch.guide_image_url} alt={branch.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-[#2D2A26] text-xl flex items-center gap-2">
                            <Building2 className="text-[#9A8073]" size={20} />
                            {branch.name}
                          </h3>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-white bg-[#2D2A26] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                              Selected Location
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-3 text-sm text-[#524A44] mb-8 bg-[#FAF6F3] p-4 rounded-xl border border-[#EBE6E0]/50">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-[#9A8073] shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{branch.address}, {branch.city}</span>
                          </div>
                          {branch.contact_number && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-[#9A8073] shrink-0" />
                              <span className="font-medium">{branch.contact_number}</span>
                            </div>
                          )}
                          {branch.operating_hours && (
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-[#9A8073] shrink-0" />
                              <span className="font-medium">{branch.operating_hours}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-auto">
                        <Link 
                          href={`/shop/${shopId}/book?branch_id=${branch.id}`}
                          className={`flex-1 text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                            isSelected 
                              ? 'bg-[#2D2A26] text-white hover:bg-black' 
                              : 'bg-white border-2 border-[#2D2A26] text-[#2D2A26] hover:bg-[#FAF6F3]'
                          }`}
                        >
                          Book Here
                        </Link>
                        {branch.latitude && branch.longitude && (
                          <>
                            <button
                              type="button"
                              onClick={() => setMapModalBranch(branch)}
                              className="px-4 py-2.5 rounded-xl border border-[#EBE6E0] text-[#524A44] hover:bg-[#F0EAE3] hover:text-[#2D2A26] transition-colors flex items-center justify-center bg-white shadow-sm"
                              title="View on Map"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 rounded-xl border border-[#EBE6E0] text-[#524A44] hover:bg-[#F0EAE3] hover:text-[#2D2A26] transition-colors flex items-center justify-center bg-white shadow-sm"
                              title="Get Directions"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: OUR WORK */}
          {activeTab === 'work' && (posts.length > 0 || isOwnerViewingOwnShop) && (
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-zinc-900">Our Work</h2>
                  <p className="text-[#827A73] text-sm mt-1">A look at recent custom orders we&apos;ve completed for happy customers.</p>
                </div>
                {isOwnerViewingOwnShop && !isAddingPost && (
                  <button
                    type="button"
                    onClick={() => setIsAddingPost(true)}
                    className="shrink-0 flex items-center gap-1.5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Plus size={15} /> Add Post
                  </button>
                )}
              </div>

              {isOwnerViewingOwnShop && isAddingPost && (
                <form onSubmit={submitPost} className="bg-white border border-[#EBE6E0] rounded-2xl p-5 shadow-sm space-y-3 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#827A73] uppercase tracking-wider">Photos</span>
                    <span className={`text-xs font-semibold ${postImageUrls.length >= MAX_POST_IMAGES ? 'text-[#B26959]' : 'text-[#827A73]'}`}>
                      {postImageUrls.length} / {MAX_POST_IMAGES} photos
                    </span>
                  </div>

                  {postImageUrls.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {postImageUrls.map(url => (
                        <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-[#EBE6E0] group/thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePostImage(url)}
                            title="Remove photo"
                            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity focus:outline-none"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {postImageUrls.length < MAX_POST_IMAGES && (
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-[#EBE6E0] border-dashed rounded-xl bg-[#FAF6F3]/50">
                      <div className="space-y-1 text-center">
                        {postUploading ? (
                          <Loader2 className="mx-auto h-8 w-8 text-[#A8A19A] animate-spin" />
                        ) : (
                          <>
                            <Upload className="mx-auto h-8 w-8 text-[#A8A19A]" />
                            <div className="flex text-sm text-[#827A73] justify-center">
                              <label htmlFor="inline-post-image" className="relative cursor-pointer bg-transparent rounded-md font-medium text-taupe hover:underline focus-within:outline-none">
                                <span>{postImageUrls.length === 0 ? 'Upload photos' : 'Add more photos'}</span>
                                <input
                                  id="inline-post-image"
                                  type="file"
                                  multiple
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handlePostImageUpload}
                                  disabled={postUploading}
                                />
                              </label>
                            </div>
                            <p className="text-xs text-[#A8A19A]">PNG, JPG — up to {MAX_POST_IMAGES} photos per post</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={postCaption}
                    onChange={e => setPostCaption(e.target.value)}
                    placeholder="e.g. Thank you to the Barangay Ballers team for trusting us with your jerseys! 🏀"
                    className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] resize-none focus:outline-none focus:border-taupe"
                  />

                  <select
                    value={postServiceId}
                    onChange={e => setPostServiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                  >
                    <option value="">No related service</option>
                    {ownerServices.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => { setIsAddingPost(false); setPostImageUrls([]); setPostCaption(''); setPostServiceId(''); }} className="px-4 py-2 text-sm font-medium text-[#524A44] hover:bg-[#FAF6F3] rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={postSubmitting || postImageUrls.length === 0 || !postCaption.trim()}
                      className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-taupe hover:bg-taupe-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      {postSubmitting && <Loader2 size={15} className="animate-spin" />}
                      Post to Storefront
                    </button>
                  </div>
                </form>
              )}

              {posts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
                  <p className="text-[#827A73]">No posts yet. Share your first completed order above.</p>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-6">
                  {posts.map(post => (
                    <div key={post.id} className="group relative bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm w-full sm:w-[calc(50%-0.75rem)] max-w-md">
                      {isOwnerViewingOwnShop && (
                        <button
                          type="button"
                          onClick={() => deletePost(post.id)}
                          title="Remove post"
                          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/95 shadow-sm border border-[#EBE6E0] text-[#524A44] hover:text-[#B26959] focus:outline-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="p-4 flex items-center gap-3">
                        {shop.logo_path ? (
                          <Image
                            src={shop.logo_path}
                            alt={shop.name}
                            width={36}
                            height={36}
                            unoptimized
                            className="w-9 h-9 rounded-full object-cover border border-zinc-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-taupe/10 flex items-center justify-center text-taupe font-bold text-sm shrink-0">
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-zinc-900 truncate">{shop.name}</p>
                          <p className="text-xs text-[#A8A19A]">
                            {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#F0EAE3] relative">
                        {renderPostImageGrid(post.image_urls, (i) => {
                          setLightboxImages(post.image_urls);
                          setLightboxIndex(i);
                        })}
                      </div>

                      <div className="p-4 space-y-2">
                        <p className="text-sm text-[#524A44] leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                        <div className="pt-2 space-y-2">
                          <a
                            href={getMessengerUrl(getSocialUrl(shop.social_links, 'facebook'))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-[#2D2A26] hover:bg-[#9A8073] text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                          >
                            💬 Inquire About This
                          </a>
                          {post.service && (
                            <Link
                              href={`/shop/${shopId}/book?service_id=${post.service.id}`}
                              className="block w-full text-center bg-white border border-[#EBE6E0] hover:bg-[#F0EAE3] text-[#524A44] py-2 rounded-xl text-xs font-semibold transition-colors"
                            >
                              📅 Book &quot;{post.service.name}&quot;
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: REVIEWS */}
          {activeTab === 'reviews' && (
            <div>
              <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-zinc-900">Reviews</h2>
                  <p className="text-[#827A73] text-sm mt-1">What customers are saying about {shop.name}.</p>
                </div>
                <select
                  value={reviewFilterRating}
                  onChange={e => { setReviewFilterRating(e.target.value); setReviewsPage(1); }}
                  className="px-4 py-2 bg-white border border-[#EBE6E0] rounded-full text-sm text-zinc-900 focus:outline-none focus:border-taupe transition-colors"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {reviewsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#A8A19A]" /></div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
                  <Star className="mx-auto h-10 w-10 text-[#C5BDBA] mb-3" />
                  <p className="text-[#827A73]">No reviews yet.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#EBE6E0] divide-y divide-[#EBE6E0] overflow-hidden">
                  {reviews.map(review => (
                    <div key={review.id} className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#EBE6E0] flex items-center justify-center font-bold text-[#524A44] shrink-0">
                              {review.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#2D2A26] leading-tight">{review.user.name}</p>
                              <p className="text-xs text-[#A8A19A]">{new Date(review.created_at).toLocaleDateString()}</p>
                            </div>
                            {review.is_featured && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>

                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={15} className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                            ))}
                          </div>

                          <p className="text-[#524A44] leading-relaxed">
                            {review.comment || <span className="italic text-[#A8A19A]">No written comment provided.</span>}
                          </p>

                          {review.reply && (
                            <div className="mt-2 bg-[#F0EAE3]/50 border-l-2 border-taupe p-4 rounded-r-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-taupe">Shop Response</span>
                              </div>
                              <p className="text-[#524A44] text-sm">{review.reply}</p>
                            </div>
                          )}
                        </div>

                        {isOwnerViewingOwnShop && (
                          <div className="flex flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleFeatureReview(review)}
                              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border flex items-center gap-1.5 ${
                                review.is_featured
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-white text-[#827A73] border-[#EBE6E0] hover:bg-[#F0EAE3]'
                              }`}
                            >
                              <Star size={12} className={review.is_featured ? 'fill-amber-500 text-amber-500' : ''} />
                              {review.is_featured ? 'Featured' : 'Feature'}
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => { setCurrentReviewForReply(review); setReplyText(review.reply || ''); setReplyModalOpen(true); }}
                                className="text-xs font-medium text-taupe hover:underline"
                              >
                                {review.reply ? 'Edit Reply' : 'Reply'}
                              </button>
                              <span className="text-[#EBE6E0]">|</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(review.id)}
                                className="text-xs font-medium text-[#B26959] hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {reviewsLastPage > 1 && (
                    <div className="p-4 flex justify-center gap-2 bg-[#FAF6F3]">
                      <button
                        type="button"
                        disabled={reviewsPage === 1}
                        onClick={() => setReviewsPage(p => p - 1)}
                        className="px-4 py-1.5 rounded-lg border border-[#EBE6E0] bg-white text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-1.5 text-sm text-[#524A44] font-medium">Page {reviewsPage} of {reviewsLastPage}</span>
                      <button
                        type="button"
                        disabled={reviewsPage === reviewsLastPage}
                        onClick={() => setReviewsPage(p => p + 1)}
                        className="px-4 py-1.5 rounded-lg border border-[#EBE6E0] bg-white text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Rating Modal */}
      <Modal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} title="Rate this Shop">
        <form onSubmit={submitRating} className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-[#827A73] mb-4">How was your experience with {shop.name}?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingValue(star)}
                  className={`p-2 transition-transform hover:scale-125 ${ratingValue >= star ? 'text-[#BCA89F]' : 'text-[#524A44]'}`}
                >
                  <Star size={36} className={ratingValue >= star ? 'fill-current' : ''} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="rating-comment" className="block text-sm font-medium text-zinc-700 mb-1">Optional Comment</label>
            <textarea 
              id="rating-comment"
              rows={3}
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              placeholder="Tell others about your experience..."
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:border-taupe focus:ring-1 focus:ring-taupe"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <button type="button" onClick={() => setIsRatingModalOpen(false)} className="px-4 py-2 text-sm text-[#A8A19A] hover:text-zinc-900">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-white shadow-sm hover:bg-black text-[#2D2A26] rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Submit Rating
            </button>
          </div>
        </form>
      </Modal>

      {isOwnerViewingOwnShop && (
        <Modal isOpen={replyModalOpen} onClose={() => setReplyModalOpen(false)} title="Respond to Review">
          <form onSubmit={submitReviewReply} className="space-y-4">
            <div className="p-4 bg-[#FAF6F3] rounded-lg border border-[#EBE6E0]">
              <p className="text-sm italic text-[#524A44]">&quot;{currentReviewForReply?.comment}&quot;</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="storefront-review-reply" className="text-sm font-medium text-[#524A44]">Your Reply</label>
              <textarea
                id="storefront-review-reply"
                required
                rows={4}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Thank the customer or address their feedback..."
                className="w-full px-4 py-2 border border-[#EBE6E0] rounded-lg focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe bg-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#EBE6E0]">
              <button type="button" onClick={() => setReplyModalOpen(false)} className="px-4 py-2 text-sm text-[#524A44] hover:text-[#2D2A26] transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={replySubmitting}
                className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {replySubmitting && <Loader2 size={16} className="animate-spin" />}
                Save Reply
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ServiceDetailModal
        service={selectedService}
        isOpen={selectedService !== null}
        onClose={() => setSelectedService(null)}
        facebookUrl={getSocialUrl(shop.social_links, 'facebook')}
        shopId={shopId}
      />

      <ServiceDetailModal
        service={selectedPackage ? {
          id: selectedPackage.id,
          name: selectedPackage.name,
          price: selectedPackage.bundle_price
            ? Number(selectedPackage.bundle_price)
            : selectedPackage.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0),
          description: selectedPackage.description || undefined,
          categories: ['Package'],
          tags: selectedPackage.services.map(s => s.name),
          kind: 'package',
        } : null}
        isOpen={selectedPackage !== null}
        onClose={() => setSelectedPackage(null)}
        facebookUrl={getSocialUrl(shop.social_links, 'facebook')}
        shopId={shopId}
      />

      <PostImageLightbox
        images={lightboxImages || []}
        initialIndex={lightboxIndex}
        isOpen={lightboxImages !== null}
        onClose={() => setLightboxImages(null)}
      />

      <Modal isOpen={mapModalBranch !== null} onClose={() => setMapModalBranch(null)} title={mapModalBranch?.name || 'Branch Location'}>
        {mapModalBranch?.latitude && mapModalBranch?.longitude && (
          <SingleBranchMap
            shopName={shop.name}
            branchName={mapModalBranch.name}
            address={mapModalBranch.address}
            city={mapModalBranch.city}
            latitude={Number(mapModalBranch.latitude)}
            longitude={Number(mapModalBranch.longitude)}
          />
        )}
      </Modal>

      {isOwnerViewingOwnShop && (
        <>
          <ServiceFormModal
            isOpen={isServiceModalOpen}
            onClose={() => { setIsServiceModalOpen(false); setEditingServiceId(null); setServiceError(''); }}
            editingId={editingServiceId}
            onSubmit={handleServiceSubmit}
            isSubmitting={isServiceSubmitting}
            error={serviceError}
            editingService={editingServiceId ? ownerServices.find(s => s.id === editingServiceId) || null : null}
          />

          <ServiceDeleteModal
            isOpen={isServiceDeleteOpen}
            onClose={() => { setIsServiceDeleteOpen(false); setDeletingServiceId(null); }}
            onConfirm={confirmDeleteService}
            isSubmitting={isServiceSubmitting}
          />

          <EditOperatingHoursModal
            isOpen={isHoursModalOpen}
            onClose={() => setIsHoursModalOpen(false)}
            initialHours={shop.operating_hours || {}}
            onSaved={handleHoursSaved}
          />
        </>
      )}
    </div>
  );
}

export default function PublicShopProfilePage(props: Readonly<PublicShopProfilePageProps>) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>}>
      <PublicShopProfileContent {...props} />
    </Suspense>
  );
}
