'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ChevronLeft,
  Trash2,
  ExternalLink,
  Calendar,
  CreditCard,
  Scissors,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Modal from '@/components/Modal';
import NotificationBannerGraphic from './NotificationBannerGraphic';
import {
  AppNotification,
  getSenderInfo,
  formatDateTime,
  relativeHoursAgo,
  getActionLabel,
} from '@/lib/notificationHelpers';
import api from '@/lib/axios';

interface NotificationDetailModalProps {
  readonly notif: AppNotification | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onDelete?: (id: string) => void;
  readonly onPrevious?: () => void;
  readonly hasPrevious?: boolean;
}

export default function NotificationDetailModal({
  notif,
  isOpen,
  onClose,
  onDelete,
  onPrevious,
  hasPrevious = false,
}: NotificationDetailModalProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!notif) return null;

  const sender = getSenderInfo(notif);
  const data = notif.data || {};
  const actionLabel = getActionLabel(notif);
  const actionUrl = data.action_url;
  const sentFormatted = formatDateTime(notif.created_at);
  const timeAgo = relativeHoursAgo(notif.created_at);

  const handleAction = () => {
    onClose();
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/notifications/${notif.id}`);
      onDelete?.(notif.id);
      onClose();
    } catch (e) {
      console.error('Failed to delete notification', e);
    } finally {
      setDeleting(false);
    }
  };

  // Custom footer with back arrow on left and Delete button on right
  const footerContent = (
    <div className="w-full flex items-center justify-between">
      <button
        type="button"
        onClick={hasPrevious ? onPrevious : onClose}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-sunken rounded-lg transition-colors border border-line"
        title="Back"
      >
        <ChevronLeft size={16} />
        <span>Back</span>
      </button>

      <button
        type="button"
        disabled={deleting}
        onClick={handleDelete}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0B7D8C] hover:bg-[#096774] text-white rounded-lg transition-colors disabled:opacity-50"
      >
        <Trash2 size={13} />
        <span>{deleting ? 'Deleting...' : 'Delete'}</span>
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Notification from ${sender.name}`}
      maxWidth="max-w-xl"
      footer={footerContent}
    >
      <div className="space-y-5">
        {/* Metadata Header (From / Subject) */}
        <div className="space-y-2.5 pb-3 border-b border-line">
          {/* From Line */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-ink-muted w-14 shrink-0">From:</span>
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-xs font-black text-taupe shrink-0 shadow-2xs">
                {sender.initial}
              </div>
              <span className="text-sm font-semibold text-[#0B7D8C] hover:underline cursor-default truncate">
                {sender.name}
              </span>
              <span className="text-xs text-ink-muted">
                @ {sentFormatted} ({timeAgo})
              </span>
            </div>
          </div>

          {/* Subject Line */}
          <div className="flex items-start gap-3">
            <span className="text-xs font-bold text-ink-muted w-14 shrink-0 pt-0.5">Subject:</span>
            <p className="text-sm font-semibold text-ink leading-snug">
              {data.title || 'Notification Update'}
            </p>
          </div>
        </div>

        {/* Illustrated Editorial Banner Graphic */}
        <NotificationBannerGraphic type={data.type} title={data.title} />

        {/* Detailed Message Text */}
        <div className="text-center px-2 py-1">
          <p className="text-[15px] font-semibold text-ink leading-relaxed">
            {data.message || 'You have received a new notification from the SUTURA platform.'}
          </p>

          {/* Secondary contextual metadata pill if applicable */}
          {(data.order_number || data.amount !== undefined) && (
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              {data.order_number && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-sunken border border-line rounded-lg text-ink-body">
                  <Scissors size={12} className="text-taupe" />
                  Order: <strong className="text-ink">{data.order_number}</strong>
                </span>
              )}
              {data.amount !== undefined && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  <CreditCard size={12} className="text-emerald-700" />
                  Amount: <strong>₱{Number(data.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        {actionUrl && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleAction}
              className="px-5 py-2.5 rounded-full border border-line-strong hover:border-ink text-xs sm:text-sm font-semibold text-ink hover:bg-sunken transition-all flex items-center gap-2 shadow-sm"
            >
              <span>{actionLabel}</span>
              <ExternalLink size={14} className="text-ink-muted" />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
