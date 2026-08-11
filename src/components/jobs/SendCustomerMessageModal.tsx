import React, { useState } from 'react';
import { Mail, Send, Eye, Pencil, Loader2, AlertTriangle } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';

interface SendCustomerMessageModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly shopId: number;
  readonly jobId: number;
  readonly orderNumber: string;
  readonly shopName: string;
  readonly customerName: string;
  readonly customerEmail: string | null | undefined;
}

export default function SendCustomerMessageModal({
  isOpen,
  onClose,
  shopId,
  jobId,
  orderNumber,
  shopName,
  customerName,
  customerEmail,
}: SendCustomerMessageModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<'compose' | 'preview'>('compose');
  const [subject, setSubject] = useState(`Update on your order ${orderNumber}`);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const canSend = !!customerEmail && !customerEmail.startsWith('walkin_');

  const handleClose = () => {
    setStep('compose');
    setSubject(`Update on your order ${orderNumber}`);
    setMessage('');
    onClose();
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await api.post(`/shops/${shopId}/jobs/${jobId}/notify-customer`, { subject, message });
      toast.success(res.data.message || 'Message sent.');
      handleClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Update to Customer" maxWidth="max-w-lg">
      <div className="p-6 space-y-4">
        {!canSend && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>This customer has no real email on file (walk-in placeholder) — a message can&apos;t be sent.</span>
          </div>
        )}

        {step === 'compose' ? (
          <>
            <div className="space-y-1.5">
              <label htmlFor="msg-subject" className="text-sm font-medium text-[#524A44]">Subject</label>
              <input
                id="msg-subject"
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={150}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="msg-body" className="text-sm font-medium text-[#524A44]">Message</label>
              <textarea
                id="msg-body"
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={5000}
                rows={7}
                placeholder={`Hi ${customerName.split(' ')[0] || ''},\n\nJust a quick update on your order...`}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe resize-none"
              />
              <p className="text-[11px] text-[#A8A19A] text-right">{message.length}/5000</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#827A73] hover:bg-[#FAF6F3] transition-colors">
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSend || !subject.trim() || !message.trim()}
                onClick={() => setStep('preview')}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-taupe text-white hover:bg-taupe/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Eye size={15} /> Preview
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-[#827A73]">This is exactly what {customerName} will receive at <span className="font-semibold text-[#524A44]">{customerEmail}</span>:</p>

            <div className="border border-[#EBE6E0] rounded-xl overflow-hidden">
              <div className="bg-[#F0EAE3] px-4 py-2.5 flex items-center gap-2 text-xs text-[#827A73]">
                <Mail size={13} />
                <span className="truncate">To: {customerEmail}</span>
              </div>
              <div className="p-5 bg-white space-y-3">
                <p className="text-sm font-semibold text-[#2D2A26]">{subject} — {shopName}</p>
                <p className="text-sm text-[#524A44]">Hello {customerName},</p>
                <div className="space-y-2">
                  {message.split(/\r?\n/).filter(line => line !== '').map((line, i) => (
                    <p key={i} className="text-sm text-[#524A44] leading-relaxed">{line}</p>
                  ))}
                </div>
                <div className="pt-2">
                  <span className="inline-block bg-taupe text-white text-xs font-semibold px-4 py-2 rounded-lg">
                    Visit {shopName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setStep('compose')} className="px-4 py-2 rounded-lg text-sm font-medium text-[#827A73] hover:bg-[#FAF6F3] transition-colors flex items-center gap-2">
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={handleSend}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
