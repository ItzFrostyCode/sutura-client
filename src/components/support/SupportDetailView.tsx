import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, X, Zap, Paperclip, ImageIcon, FileVideo, Send } from 'lucide-react';
import { Ticket, TYPE_LABELS, PRIORITY_LABELS, STATUS_CONFIG, formatDate, renderAttachments, UploadItem } from './supportHelpers';
import Badge from '@/components/shared/Badge';

interface SupportDetailViewProps {
  selected: Ticket;
  user: { name: string } | null;
  onBack: () => void;
  onCloseTicket: () => Promise<void>;
  closing: boolean;
  replyText: string;
  setReplyText: (val: string) => void;
  onSendReply: () => Promise<void>;
  sendingReply: boolean;
  replyUploads: UploadItem[];
  setReplyUploads: React.Dispatch<React.SetStateAction<UploadItem[]>>;
  handleUpload: (files: File[], isReply: boolean) => Promise<void>;
}

interface ReplyUploadItemProps {
  readonly upload: UploadItem;
  readonly onRemove: (id: string) => void;
}

function ReplyUploadItem({ upload, onRemove }: ReplyUploadItemProps) {
  return (
    <div className="relative flex items-center gap-2 px-3 py-1.5 border border-line rounded-lg bg-canvas text-xs max-w-[200px]">
      {upload.file.type.startsWith('image/') ? (
        <ImageIcon size={14} className="text-taupe shrink-0" />
      ) : (
        <FileVideo size={14} className="text-taupe shrink-0" />
      )}
      <span className="truncate flex-1 font-medium text-ink">{upload.name}</span>
      {upload.status === 'uploading' && (
        <span className="text-[10px] text-taupe font-semibold">{upload.progress}%</span>
      )}
      {upload.status === 'failed' && (
        <span className="text-[10px] text-red-500 font-semibold">!</span>
      )}
      <button
        type="button"
        onClick={() => onRemove(upload.id)}
        className="p-0.5 rounded-full hover:bg-line text-ink-muted transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function SupportDetailView({
  selected,
  user,
  onBack,
  onCloseTicket,
  closing,
  replyText,
  setReplyText,
  onSendReply,
  sendingReply,
  replyUploads,
  setReplyUploads,
  handleUpload,
}: Readonly<SupportDetailViewProps>) {
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleRemoveReplyUpload = (id: string) => setReplyUploads(prev => prev.filter(u => u.id !== id));

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [selected.replies.length]);

  const typeConfig = TYPE_LABELS[selected.type];
  const priorityConfig = PRIORITY_LABELS[selected.priority];
  const statusConfig = STATUS_CONFIG[selected.status];
  const isClosed = selected.status === 'closed' || selected.status === 'resolved';

  return (
    <div className="space-y-4 max-w-3xl mx-auto text-ink">
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-sunken text-ink-muted transition-colors mt-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-ink tracking-tight">{selected.subject}</h1>
              <p className="text-ink-faint text-xs mt-0.5">Ticket #{selected.id} · Opened {formatDate(selected.created_at)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={statusConfig.variant}>
                {statusConfig.icon} {statusConfig.label}
              </Badge>
              {!isClosed && (
                <button
                  onClick={onCloseTicket}
                  disabled={closing}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border text-ink-muted bg-white border-line hover:border-danger hover:text-danger transition-colors disabled:opacity-50"
                >
                  {closing ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  Close Ticket
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${typeConfig.color}`}>
              {typeConfig.icon} {typeConfig.label}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${priorityConfig.color}`}>
              <Zap size={11} /> {priorityConfig.label} Priority
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
          <div className="flex gap-3 justify-end">
            <div className="max-w-[80%] space-y-1">
              <p className="text-xs text-ink-faint text-right">{selected.submitted_by?.name || user?.name} · {formatDate(selected.created_at)}</p>
              <div className="bg-taupe text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed flex flex-col">
                <span>{selected.message}</span>
                {renderAttachments(selected.attachments, true)}
              </div>
            </div>
          </div>

          {selected.replies.map(reply => {
            const isMe = !reply.is_admin_reply;
            return (
              <div key={reply.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-[#2D2A26] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    A
                  </div>
                )}
                <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <p className={`text-xs text-ink-faint ${isMe ? 'text-right' : 'text-left'}`}>
                    {reply.is_admin_reply ? 'SUTURA Admin' : reply.user?.name} · {formatDate(reply.created_at)}
                  </p>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed flex flex-col ${
                    isMe
                      ? 'bg-taupe text-white rounded-tr-sm'
                      : 'bg-sunken text-ink rounded-tl-sm border border-line'
                  }`}>
                    <span>{reply.message}</span>
                    {renderAttachments(reply.attachments, isMe)}
                  </div>
                </div>
              </div>
            );
          })}

          {selected.status === 'resolved' && (
            <div className="flex items-center gap-2 justify-center py-2 text-xs text-sage font-medium">
              Check resolved {selected.resolved_at ? `on ${formatDate(selected.resolved_at)}` : ''}
            </div>
          )}
          {selected.status === 'closed' && (
            <div className="flex items-center gap-2 justify-center py-2 text-xs text-ink-faint font-medium">
              <X size={14} /> Ticket closed
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {isClosed ? (
          <div className="border-t border-line p-4 text-center">
            <p className="text-sm text-ink-faint">This ticket is closed.</p>
          </div>
        ) : (
          <div className="border-t border-line p-4 space-y-3">
            {replyUploads.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                {replyUploads.map(upload => (
                  <ReplyUploadItem
                    key={upload.id}
                    upload={upload}
                    onRemove={handleRemoveReplyUpload}
                  />
                ))}
              </div>
            )}

            <div className="flex gap-3 items-end">
              <input
                type="file"
                ref={replyFileInputRef}
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files) {
                    handleUpload(Array.from(e.target.files), true);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => replyFileInputRef.current?.click()}
                className="p-3 border border-line hover:bg-sunken text-ink-muted hover:text-ink rounded-xl transition-colors shrink-0 bg-white"
                title="Attach images/video"
              >
                <Paperclip size={18} />
              </button>
              <textarea
                rows={2}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendReply(); } }}
                placeholder="Add a reply or update... (Enter to send, Shift+Enter for new line)"
                className="flex-1 border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint bg-canvas focus:outline-none focus:ring-2 focus:ring-taupe/40 resize-none"
              />
              <button
                onClick={onSendReply}
                disabled={sendingReply || (!replyText.trim() && replyUploads.filter(u => u.status === 'success').length === 0)}
                className="p-3 bg-taupe hover:bg-taupe/90 text-white rounded-xl transition-colors disabled:opacity-40 shrink-0"
              >
                {sendingReply ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
