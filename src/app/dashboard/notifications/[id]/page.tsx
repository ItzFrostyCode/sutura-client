'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  CreditCard,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import NotificationBannerGraphic from '@/components/notifications/NotificationBannerGraphic';
import api from '@/lib/axios';
import {
  AppNotification,
  getSenderInfo,
  formatDateTime,
  relativeHoursAgo,
  getActionLabel,
} from '@/lib/notificationHelpers';

export default function NotificationDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();

  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/notifications/${id}`);
        if (!cancelled && res.data?.data) {
          setNotification(res.data.data);
          // Mark as read if unread
          if (!res.data.data.read_at) {
            void api.post(`/notifications/${id}/read`);
          }
        }
      } catch (e) {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/notifications/${id}`);
      router.push('/dashboard/notifications');
    } catch (e) {
      console.error('Failed to delete notification', e);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 size={32} className="text-taupe animate-spin mb-3" />
        <p className="text-sm font-semibold text-ink">Loading notification details...</p>
      </div>
    );
  }

  if (notFound || !notification) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Link
          href="/dashboard/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to Notifications</span>
        </Link>
        <div className="bg-surface border border-line rounded-2xl p-10 text-center">
          <p className="text-base font-semibold text-ink">Notification Not Found</p>
          <p className="text-xs text-ink-muted mt-1">
            This notification may have been deleted or dismissed.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/notifications')}
            className="mt-5 px-4 py-2 text-xs font-bold bg-taupe hover:bg-taupe-hover text-white rounded-xl transition-colors"
          >
            Go to Notifications Hub
          </button>
        </div>
      </div>
    );
  }

  const sender = getSenderInfo(notification);
  const data = notification.data || {};
  const actionLabel = getActionLabel(notification);
  const actionUrl = data.action_url;
  const sentFormatted = formatDateTime(notification.created_at);
  const timeAgo = relativeHoursAgo(notification.created_at);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/notifications"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink hover:bg-sunken rounded-xl transition-colors border border-line"
        >
          <ChevronLeft size={16} />
          <span>Notifications</span>
        </Link>
      </div>

      {/* ── Main Detail Container (Screenshot 4 Reference) ── */}
      <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Header Subject Title */}
        <div className="space-y-3 pb-4 border-b border-line">
          <h1 className="text-xl sm:text-2xl font-bold text-ink leading-snug">
            {data.title || 'Notification Update'}
          </h1>

          {/* From Line with Avatar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-canvas border border-line flex items-center justify-center text-sm font-black text-taupe shrink-0 shadow-2xs">
              {sender.initial}
            </div>
            <div className="text-sm font-semibold text-ink-body">
              <span>From </span>
              <span className="text-[#0B7D8C]">{sender.name}</span>
              <span className="text-xs text-ink-muted font-normal ml-2">
                @ {sentFormatted} ({timeAgo})
              </span>
            </div>
          </div>
        </div>

        {/* Illustrated Editorial Banner Graphic */}
        <div className="max-w-2xl mx-auto">
          <NotificationBannerGraphic type={data.type} title={data.title} />
        </div>

        {/* Message Content */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <p className="text-base sm:text-lg font-medium text-ink leading-relaxed">
            {data.message || 'An update has been posted to your account.'}
          </p>

          {/* Order / Amount Badges */}
          {(data.order_number || data.amount !== undefined) && (
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              {data.order_number && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-sunken border border-line rounded-lg text-ink-body">
                  <Scissors size={13} className="text-taupe" />
                  Order: <strong className="text-ink">{data.order_number}</strong>
                </span>
              )}
              {data.amount !== undefined && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  <CreditCard size={13} className="text-emerald-700" />
                  Amount:{' '}
                  <strong>₱{Number(data.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                </span>
              )}
            </div>
          )}

          {/* Primary Action Button */}
          {actionUrl && (
            <div className="pt-3">
              <button
                type="button"
                onClick={() => router.push(actionUrl)}
                className="px-6 py-2.5 rounded-full border border-line-strong hover:border-ink text-sm font-semibold text-ink hover:bg-sunken transition-all inline-flex items-center gap-2 shadow-sm"
              >
                <span>{actionLabel}</span>
                <ExternalLink size={14} className="text-ink-muted" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="pt-6 border-t border-line flex items-center justify-between">
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-danger hover:bg-danger/10 border border-danger/25 rounded-xl transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            <span>{deleting ? 'Deleting...' : 'Delete Notification'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
