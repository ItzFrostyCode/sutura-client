import React from 'react';
import { AlertTriangle, RefreshCw, Info, CreditCard, CircleDot, Loader2, CheckCircle2, X, Paperclip } from 'lucide-react';
import type { BadgeVariant } from '@/components/shared/Badge';

export interface TicketReply {
  id: number;
  user: { id: number; name: string; email: string };
  message: string;
  is_admin_reply: boolean;
  created_at: string;
  attachments?: string[];
}

export interface Ticket {
  id: number;
  subject: string;
  message: string;
  type: 'problem' | 'update_request' | 'general' | 'billing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  resolved_at: string | null;
  replies: TicketReply[];
  submitted_by: { name: string; email: string };
  attachments?: string[];
}

export const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  problem:        { label: 'Problem / Bug',     icon: <AlertTriangle size={14} />, color: 'text-red-500 bg-red-50 border-red-200' },
  update_request: { label: 'Update Request',    icon: <RefreshCw size={14} />,     color: 'text-blue-500 bg-blue-50 border-blue-200' },
  general:        { label: 'General Inquiry',   icon: <Info size={14} />,          color: 'text-ink-muted bg-sunken border-line' },
  billing:        { label: 'Billing Issue',     icon: <CreditCard size={14} />,    color: 'text-violet-500 bg-violet-50 border-violet-200' },
};

export const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low:    { label: 'Low',    color: 'text-sage bg-sage/10 border-sage/20' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  high:   { label: 'High',   color: 'text-orange-500 bg-orange-50 border-orange-200' },
  urgent: { label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-200' },
};

export const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: BadgeVariant }> = {
  open:        { label: 'Open',        icon: <CircleDot size={14} />,    variant: 'accent' },
  in_progress: { label: 'In Progress', icon: <Loader2 size={14} />,      variant: 'warning' },
  resolved:    { label: 'Resolved',    icon: <CheckCircle2 size={14} />, variant: 'success' },
  closed:      { label: 'Closed',      icon: <X size={14} />,            variant: 'neutral' },
};

export const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export interface UploadItem {
  id: string;
  file: File;
  name: string;
  progress: number;
  status: 'uploading' | 'success' | 'failed';
  url: string;
}

export const isImage = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
};

export const isVideo = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'avi', 'webm'].includes(ext || '');
};

export const renderAttachments = (urls?: string[], isMe?: boolean) => {
  if (!urls || urls.length === 0) return null;
  return (
    <div className={`mt-2 gap-2 ${urls.length === 1 ? 'max-w-sm block' : 'grid grid-cols-2 max-w-md'}`}>
      {urls.map((url) => {
        const img = isImage(url);
        const vid = isVideo(url);
        return (
          <div key={url} className={`relative rounded-lg overflow-hidden border ${isMe ? 'border-white/20 bg-black/10' : 'border-line bg-black/5'} aspect-video flex items-center justify-center`}>
            {img ? (
              <button
                type="button"
                onClick={() => globalThis.window.open(url, '_blank')}
                className="w-full h-full cursor-zoom-in focus:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Attachment"
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </button>
            ) : null}
            {!img && vid && (
              <video src={url} controls className="w-full h-full object-contain bg-black">
                <track kind="captions" />
              </video>
            )}
            {!img && !vid && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center p-4 text-xs font-medium transition-colors ${
                  isMe ? 'text-white/90 hover:text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Paperclip size={16} className="mr-1.5 shrink-0" />
                <span className="truncate max-w-[150px]">View Attachment</span>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
