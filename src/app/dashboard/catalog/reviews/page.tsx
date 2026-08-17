'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, Star, Trash2 } from 'lucide-react';
import CatalogModuleTabs from '@/components/catalog/CatalogModuleTabs';
import Modal from '@/components/Modal';
import { useToast } from '@/context/ToastContext';

interface CatalogItemReview {
  id: number;
  rating: number;
  comment: string | null;
  reply: string | null;
  created_at: string;
  user: { id: number; name: string; email: string };
  catalog_item: { id: number; name: string } | null;
}

// Owner-facing management for reviews left on individual Design Catalog
// items (e.g. a specific Barong/gown), distinct from the shop-level
// Reviews tab on the storefront page — before this, a customer could rate
// a catalog item and the owner had no page anywhere to see or respond to it.
export default function CatalogItemReviewsPage() {
  const { shop } = useAuthStore();
  const shopId = shop?.id;
  const toast = useToast();
  const [reviews, setReviews] = useState<CatalogItemReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filterRating, setFilterRating] = useState('');

  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<CatalogItemReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const reloadReviews = useCallback(() => {
    if (!shopId) return;
    const params = new URLSearchParams({ page: String(page) });
    if (filterRating) params.set('rating', filterRating);
    api.get(`/shops/${shopId}/catalog-item-reviews?${params.toString()}`)
      .then(res => {
        setReviews(res.data.data.data || []);
        setLastPage(res.data.data.last_page || 1);
      })
      .catch(err => console.error(err));
  }, [shopId, page, filterRating]);

  useEffect(() => {
    let isMounted = true;
    if (!shopId) return;

    const params = new URLSearchParams({ page: String(page) });
    if (filterRating) params.set('rating', filterRating);
    api.get(`/shops/${shopId}/catalog-item-reviews?${params.toString()}`)
      .then(res => {
        if (!isMounted) return;
        setReviews(res.data.data.data || []);
        setLastPage(res.data.data.last_page || 1);
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shopId, page, filterRating]);

  const openReplyModal = (review: CatalogItemReview) => {
    setCurrentReview(review);
    setReplyText(review.reply || '');
    setReplyModalOpen(true);
  };

  const submitReply = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shopId || !currentReview) return;
    setReplySubmitting(true);
    try {
      await api.put(`/shops/${shopId}/catalog-item-reviews/${currentReview.id}`, { reply: replyText });
      toast.success('Reply saved.');
      setReplyModalOpen(false);
      reloadReviews();
    } catch {
      toast.error('Failed to save reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!shopId) return;
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await api.delete(`/shops/${shopId}/catalog-item-reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review deleted.');
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  const renderReviewsContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-ink-faint" />
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-2xl border border-line">
          <Star className="mx-auto h-10 w-10 text-ink-faint mb-3" />
          <p className="text-ink-muted">No item reviews yet.</p>
        </div>
      );
    }

    return (
      <div className="bg-surface rounded-2xl border border-line divide-y divide-line overflow-hidden">
        {reviews.map(review => (
          <div key={review.id} className="p-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center font-bold text-ink-body shrink-0">
                    {review.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-ink leading-tight">{review.user.name}</p>
                    <p className="text-xs text-ink-faint">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                  {review.catalog_item && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-sunken text-taupe border border-line rounded-full">
                      {review.catalog_item.name}
                    </span>
                  )}
                </div>

                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={15} className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                  ))}
                </div>

                <p className="text-ink-body leading-relaxed">
                  {review.comment || <span className="italic text-ink-faint">No written comment provided.</span>}
                </p>

                {review.reply && (
                  <div className="mt-2 bg-sunken/50 border-l-2 border-taupe p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-taupe">Shop Response</span>
                    </div>
                    <p className="text-ink-body text-sm">{review.reply}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => openReplyModal(review)}
                  className="text-xs font-medium text-taupe hover:underline"
                >
                  {review.reply ? 'Edit Reply' : 'Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(review.id)}
                  className="text-xs font-medium text-danger hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {lastPage > 1 && (
          <div className="p-4 flex justify-center gap-2 bg-canvas">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-1.5 rounded-lg border border-line bg-white text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-1.5 text-sm text-ink-body font-medium">Page {page} of {lastPage}</span>
            <button
              type="button"
              disabled={page === lastPage}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-1.5 rounded-lg border border-line bg-white text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-ink animate-fade-in">
      <div>
        <span className="text-[11px] font-bold text-taupe uppercase tracking-wider block">Customer Feedback</span>
        <h1 className="text-2xl font-black text-ink tracking-tight">Catalog Showcase</h1>
        <p className="text-xs text-ink-muted mt-0.5">Your made-to-order Design Catalog, Walk-in Orders, and performance analytics in one place.</p>
      </div>

      <CatalogModuleTabs />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-ink">Item Reviews</h2>
          <p className="text-ink-muted text-sm mt-0.5">Ratings and comments left on your individual catalog items.</p>
        </div>
        <select
          value={filterRating}
          onChange={e => { setFilterRating(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-surface border border-line rounded-full text-sm text-ink focus:outline-none focus:border-taupe transition-colors"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {renderReviewsContent()}

      <Modal isOpen={replyModalOpen} onClose={() => setReplyModalOpen(false)} title="Respond to Review">
        <form onSubmit={submitReply} className="space-y-4">
          <div className="p-4 bg-canvas rounded-lg border border-line">
            <p className="text-sm italic text-ink-body">&quot;{currentReview?.comment}&quot;</p>
          </div>
          <div className="space-y-1">
            <label htmlFor="catalog-item-review-reply" className="text-sm font-medium text-ink-body">Your Reply</label>
            <textarea
              id="catalog-item-review-reply"
              required
              rows={4}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Thank the customer or address their feedback..."
              className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe bg-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <button type="button" onClick={() => setReplyModalOpen(false)} className="px-4 py-2 text-sm text-ink-body hover:text-ink transition-colors">
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
    </div>
  );
}
