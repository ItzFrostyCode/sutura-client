import React, { useRef, useState } from 'react';
import { ArrowLeft, AlertTriangle, Paperclip, ImageIcon, FileVideo, Trash2, Loader2, Send } from 'lucide-react';
import { UploadItem } from './supportHelpers';

// Matches the dashboard's own sidebar + profile-dropdown sections, so an
// owner can point straight at "which part of the app" instead of typing a
// subject from scratch every time.
const SUBJECT_OPTIONS = [
  'Home', 'Appointments', 'Collect Payments', 'Custom Jobs', 'Customers',
  'Design Catalog', 'Services', 'Staff', 'Reports & Insights',
  'Branches', 'My Storefront', 'Billing & Plans', 'Account Settings',
  'Log Out', 'Notifications',
];

interface SupportNewTicketProps {
  onBack: () => void;
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => void;
  form: { subject: string; message: string; type: string; priority: string };
  setForm: React.Dispatch<React.SetStateAction<{ subject: string; message: string; type: string; priority: string }>>;
  formError: string;
  newTicketUploads: UploadItem[];
  setNewTicketUploads: React.Dispatch<React.SetStateAction<UploadItem[]>>;
  handleUpload: (files: File[], isReply: boolean) => Promise<void>;
  submitting: boolean;
}

interface NewTicketUploadItemProps {
  readonly upload: UploadItem;
  readonly onRemove: (id: string) => void;
}

function NewTicketUploadItem({ upload, onRemove }: NewTicketUploadItemProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-[#EBE6E0] rounded-xl bg-white text-sm shadow-sm">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {upload.file.type.startsWith('image/') ? (
          <ImageIcon size={18} className="text-taupe shrink-0" />
        ) : (
          <FileVideo size={18} className="text-taupe shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#2D2A26] truncate">{upload.name}</p>
          {upload.status === 'uploading' && (
            <div className="w-full bg-[#EBE6E0] h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-taupe h-full transition-all duration-300" style={{ width: `${upload.progress}%` }} />
            </div>
          )}
          {upload.status === 'success' && <p className="text-xs text-[#7A8B76] mt-0.5 font-medium">Uploaded successfully</p>}
          {upload.status === 'failed' && <p className="text-xs text-red-500 mt-0.5 font-medium">Upload failed</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(upload.id);
        }}
        className="p-1.5 rounded-lg text-[#827A73] hover:text-red-500 hover:bg-red-50 transition-colors ml-2 shrink-0"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function SupportNewTicket({
  onBack,
  onSubmit,
  form,
  setForm,
  formError,
  newTicketUploads,
  setNewTicketUploads,
  handleUpload,
  submitting,
}: Readonly<SupportNewTicketProps>) {
  const newTicketFileInputRef = useRef<HTMLInputElement>(null);
  // Whether the subject picker is showing the free-text fallback — starts
  // open only if the subject already holds a custom value (e.g. re-opening
  // the form) that isn't one of the predefined sections.
  const [isCustomSubject, setIsCustomSubject] = useState(
    form.subject !== '' && !SUBJECT_OPTIONS.includes(form.subject)
  );
  const handleRemoveNewTicketUpload = (id: string) => setNewTicketUploads(prev => prev.filter(u => u.id !== id));

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto text-[#2D2A26]">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[#F0EAE3] text-[#827A73] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">New Support Ticket</h1>
          <p className="text-[#827A73] text-sm mt-0.5">Describe your issue or request and our team will respond shortly.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ticket-type" className="block text-sm font-medium text-[#2D2A26] mb-1.5">Ticket Type <span className="text-red-500">*</span></label>
            <select
              id="ticket-type"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full border border-[#EBE6E0] rounded-lg px-3 py-2.5 text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40"
            >
              <option value="problem">Problem / Bug</option>
              <option value="update_request">Update Request</option>
              <option value="general">General Inquiry</option>
              <option value="billing">Billing Issue</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-[#2D2A26] mb-1.5">Priority <span className="text-red-500">*</span></label>
            <select
              id="priority"
              value={form.priority}
              onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              className="w-full border border-[#EBE6E0] rounded-lg px-3 py-2.5 text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-[#2D2A26] mb-1.5">Subject <span className="text-red-500">*</span></label>
          {isCustomSubject ? (
            <div className="space-y-1.5">
              <input
                type="text"
                id="subject"
                placeholder="Brief summary of your issue..."
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                className="w-full border border-[#EBE6E0] rounded-lg px-3 py-2.5 text-sm text-[#2D2A26] placeholder:text-[#A8A19A] bg-white focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40"
              />
              <button
                type="button"
                onClick={() => { setIsCustomSubject(false); setForm(p => ({ ...p, subject: '' })); }}
                className="inline-flex items-center text-xs font-medium text-taupe border border-taupe/40 rounded-full px-3 py-1 hover:bg-taupe/10 transition-colors"
              >
                Choose from a list instead
              </button>
            </div>
          ) : (
            <select
              id="subject"
              value={form.subject}
              onChange={e => {
                if (e.target.value === '__other__') {
                  setIsCustomSubject(true);
                  setForm(p => ({ ...p, subject: '' }));
                } else {
                  setForm(p => ({ ...p, subject: e.target.value }));
                }
              }}
              className="w-full border border-[#EBE6E0] rounded-lg px-3 py-2.5 text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40"
            >
              <option value="" disabled>Which part of the app is this about?</option>
              {SUBJECT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="__other__">Other (type my own)</option>
            </select>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-[#2D2A26] mb-1.5">Details <span className="text-red-500">*</span></label>
          <textarea
            rows={6}
            id="message"
            placeholder="Describe the problem, what you expected, and what actually happened..."
            value={form.message}
            onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            className="w-full border border-[#EBE6E0] rounded-lg px-3 py-2.5 text-sm text-[#2D2A26] placeholder:text-[#A8A19A] bg-white focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="attachments-upload" className="block text-sm font-medium text-[#2D2A26] mb-1">Attachments (Images/Videos up to 50MB)</label>
          <input
            type="file"
            id="attachments-upload"
            ref={newTicketFileInputRef}
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={e => {
              if (e.target.files) {
                handleUpload(Array.from(e.target.files), false);
              }
            }}
          />
          <button
            type="button"
            onClick={() => newTicketFileInputRef.current?.click()}
            className="w-full border border-dashed border-[#EBE6E0] hover:border-taupe/40 bg-[#FAF6F3] rounded-xl p-4 text-center cursor-pointer hover:bg-[#FAF6F3]/50 transition-all focus:outline-none focus:ring-2 focus:ring-[#9A8073]/40"
          >
            <div className="flex flex-col items-center gap-1.5">
              <Paperclip size={20} className="text-[#827A73]" />
              <span className="text-sm font-medium text-[#524A44]">Click to select images or video</span>
              <span className="text-xs text-[#A8A19A]">Maximum file size: 50MB</span>
            </div>
          </button>

          {newTicketUploads.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {newTicketUploads.map(upload => (
                <NewTicketUploadItem
                  key={upload.id}
                  upload={upload}
                  onRemove={handleRemoveNewTicketUpload}
                />
              ))}
            </div>
          )}
        </div>


        {formError && (
          <p className="text-sm text-red-500 flex items-center gap-2">
            <AlertTriangle size={14} /> {formError}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EBE6E0]">
          <button type="button" onClick={onBack} className="px-4 py-2 text-sm text-[#827A73] hover:text-[#2D2A26] transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Submit Ticket
          </button>
        </div>
      </form>
    </div>
  );
}
