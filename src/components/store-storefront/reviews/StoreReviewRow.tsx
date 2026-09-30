import React, { useState } from 'react';
import { Star, MessageSquare, Pin, Loader2 } from 'lucide-react';
import { StorefrontReview } from '../types';

interface StoreReviewRowProps {
  readonly review: StorefrontReview;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onDeleteReview: (id: number) => void;
  readonly onReplyToReview: (id: number, reply: string) => Promise<boolean>;
  readonly onToggleFeatured: (id: number, isFeatured: boolean) => void;
}

export default function StoreReviewRow({
  review,
  isOwnerViewingOwnStore,
  onDeleteReview,
  onReplyToReview,
  onToggleFeatured,
}: StoreReviewRowProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState(review.reply || '');
  const [saving, setSaving] = useState(false);

  const submitReply = async () => {
    setSaving(true);
    const ok = await onReplyToReview(review.id, replyDraft);
    setSaving(false);
    if (ok) setIsReplying(false);
  };

  return (
    <div className="p-3 hover:bg-sunken/20 transition-colors">
      <div className="flex items-center justify-between gap-3 min-h-[52px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-line/80 flex items-center justify-center font-semibold text-ink-body text-sm shrink-0">
            {review.user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink text-sm truncate leading-tight flex items-center gap-1.5">
              {review.user?.name || 'Customer'}
              {review.is_featured && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
                  <Pin size={9} /> Featured
                </span>
              )}
            </p>
            <time className="text-xs text-ink-faint mt-0.5 block">
              {new Date(review.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={13}
                  className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-amber-800 ml-0.5">
              {Number(review.rating).toFixed(1)}
            </span>
          </div>

          {isOwnerViewingOwnStore && (
            <>
              <button
                type="button"
                onClick={() => onToggleFeatured(review.id, !review.is_featured)}
                title={review.is_featured ? 'Unfeature' : 'Pin as featured'}
                className={`min-h-[44px] w-9 flex items-center justify-center cursor-pointer transition-colors ${
                  review.is_featured ? 'text-amber-600' : 'text-ink-faint hover:text-amber-600'
                }`}
              >
                <Pin size={15} className={review.is_featured ? 'fill-amber-400' : ''} />
              </button>
              <button
                type="button"
                onClick={() => setIsReplying((v) => !v)}
                className="min-h-[44px] px-2 text-xs text-taupe hover:underline font-semibold cursor-pointer flex items-center gap-1"
              >
                <MessageSquare size={13} /> {review.reply ? 'Edit Reply' : 'Reply'}
              </button>
              <button
                type="button"
                onClick={() => onDeleteReview(review.id)}
                className="min-h-[44px] px-2 text-xs text-danger hover:underline font-semibold cursor-pointer flex items-center"
                title="Delete rating"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {review.comment && (
        <p className="mt-1.5 ml-[52px] text-sm text-ink-body leading-relaxed whitespace-pre-line">{review.comment}</p>
      )}

      {isReplying ? (
        <div className="mt-2.5 ml-[52px] space-y-2">
          <textarea
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            rows={2}
            placeholder="Write a public reply..."
            className="w-full px-3 py-2 bg-canvas border border-line text-ink text-sm focus:outline-none focus:border-taupe"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setIsReplying(false); setReplyDraft(review.reply || ''); }}
              disabled={saving}
              className="min-h-[36px] px-3 text-xs font-semibold text-ink-body hover:bg-sunken bg-canvas border border-line transition-all disabled:opacity-40 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReply}
              disabled={saving}
              className="min-h-[36px] px-3 bg-taupe text-white text-xs font-bold hover:bg-[#8A7063] transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              {saving && <Loader2 size={12} className="animate-spin" />} Save Reply
            </button>
          </div>
        </div>
      ) : review.reply ? (
        <div className="mt-2 ml-[52px] pl-3 border-l-2 border-taupe/40 bg-canvas p-2.5">
          <p className="text-[11px] font-bold text-taupe uppercase tracking-wide mb-0.5">Shop&apos;s Reply</p>
          <p className="text-sm text-ink-body leading-relaxed whitespace-pre-line">{review.reply}</p>
        </div>
      ) : null}
    </div>
  );
}
