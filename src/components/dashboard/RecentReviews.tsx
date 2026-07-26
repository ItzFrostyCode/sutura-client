import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { name: string };
}

export default function RecentReviews() {
  const { shop, user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  // Reviews management is owner-only (matches the shop_owner-only
  // /shops/{shop}/reviews route) — staff/branch managers share this
  // dashboard now, and shouldn't 403 on a widget they can't act on anyway.
  const isShopOwner = user?.roles?.[0]?.name === 'shop_owner';

  useEffect(() => {
    const load = async () => {
      if (!shop || !isShopOwner) { setLoading(false); return; }
      try {
        const res = await api.get(`/shops/${shop.id}/reviews?per_page=3`);
        setReviews(res.data.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [shop, isShopOwner]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#EBE6E0] p-6 h-[300px] flex items-center justify-center">
        <span className="text-[#A8A19A] text-sm animate-pulse">Loading reviews...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EBE6E0] flex flex-col min-h-[280px]">
      <div className="p-5 border-b border-[#EBE6E0] flex justify-between items-center">
        <h3 className="font-semibold text-[#2D2A26] flex items-center gap-2">
          <MessageSquare size={16} className="text-[#9A8073]" />
          Recent Reviews
        </h3>
        <Link
          href={shop?.slug ? `/shop/${shop.slug}?tab=reviews` : '/dashboard/reviews'}
          className="text-xs font-medium text-taupe hover:text-[#524A44] transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto min-h-[250px]">
        {reviews.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Star size={32} className="text-[#EBE6E0] mb-2" />
            <p className="text-sm font-medium text-[#827A73]">No reviews yet.</p>
            <p className="text-xs text-[#A8A19A] mt-1 max-w-[200px]">
              When customers rate your shop, their feedback will appear here.
            </p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="pb-4 border-b border-[#FAF6F3] last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[#2D2A26] truncate">{review.user.name}</span>
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={10} className={i < review.rating ? 'fill-current' : 'text-[#EBE6E0]'} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-[#827A73] line-clamp-2 leading-relaxed">
                {review.comment || <span className="italic">No written comment</span>}
              </p>
              <div className="text-[10px] text-[#A8A19A] mt-1">
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
