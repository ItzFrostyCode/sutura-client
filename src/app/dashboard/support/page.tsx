'use client';

import { useEffect, useState, useCallback, SubmitEvent } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

import { Ticket, PRIORITY_ORDER, UploadItem } from '@/components/support/supportHelpers';
import SupportNewTicket from '@/components/support/SupportNewTicket';
import SupportDetailView from '@/components/support/SupportDetailView';
import SupportListView from '@/components/support/SupportListView';
import { useToast } from '@/context/ToastContext';

// Helper functions to update upload status and progress without nesting functions more than 4 levels deep
const updateUploadProgress = (
  setUploads: React.Dispatch<React.SetStateAction<UploadItem[]>>,
  itemId: string,
  progress: number
) => {
  setUploads(prev => prev.map(u => u.id === itemId ? { ...u, progress } : u));
};

const updateUploadStatus = (
  setUploads: React.Dispatch<React.SetStateAction<UploadItem[]>>,
  itemId: string,
  status: 'success' | 'failed',
  url?: string
) => {
  setUploads(prev => prev.map(u => u.id === itemId ? { ...u, status, ...(url ? { url } : {}) } : u));
};

export default function SupportPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');

  // New ticket form
  const [form, setForm] = useState({ subject: '', message: '', type: 'general', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Reply
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [closing, setClosing] = useState(false);

  // Attachments state
  const [newTicketUploads, setNewTicketUploads] = useState<UploadItem[]>([]);
  const [replyUploads, setReplyUploads] = useState<UploadItem[]>([]);

  const fetchTickets = useCallback(async () => {
    if (!shop) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/shops/${shop.id}/tickets`);
      const sorted = (res.data.data as Ticket[]).sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      );
      setTickets(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [shop]);

  useEffect(() => { 
    const t = setTimeout(() => fetchTickets(), 0);
    return () => clearTimeout(t);
  }, [fetchTickets, user]);

  const openDetail = async (ticket: Ticket) => {
    if (!shop) return;
    try {
      const res = await api.get(`/shops/${shop.id}/tickets/${ticket.id}`);
      setSelected(res.data.data);
    } catch {
      setSelected(ticket);
    }
    setView('detail');
  };

  const handleUpload = async (files: File[], isReply: boolean) => {
    if (!shop) return;
    const setUploads = isReply ? setReplyUploads : setNewTicketUploads;
    const maxSize = 50 * 1024 * 1024; // 50MB

    // Validate size
    for (const file of files) {
      if (file.size > maxSize) {
        const errMsg = `File ${file.name} exceeds the 50MB limit.`;
        if (isReply) {
          toast.error(errMsg);
        } else {
          setFormError(errMsg);
        }
        return;
      }
    }

    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      progress: 0,
      status: 'uploading' as const,
      url: '',
    }));

    setUploads(prev => [...prev, ...newItems]);

    for (const item of newItems) {
      const formData = new FormData();
      formData.append('file', item.file);

      try {
        const res = await api.post(`/shops/${shop.id}/support/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            updateUploadProgress(setUploads, item.id, percent);
          }
        });

        if (res.data.success) {
          updateUploadStatus(setUploads, item.id, 'success', res.data.data.url);
        } else {
          updateUploadStatus(setUploads, item.id, 'failed');
        }
      } catch (err) {
        console.error('Upload failed:', err);
        updateUploadStatus(setUploads, item.id, 'failed');
      }
    }
  };

  const submitTicket = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop) return;
    if (!form.subject.trim() || !form.message.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    const attachmentUrls = newTicketUploads
      .filter(u => u.status === 'success')
      .map(u => u.url);

    setSubmitting(true);
    setFormError('');
    try {
      await api.post(`/shops/${shop.id}/tickets`, {
        ...form,
        attachments: attachmentUrls
      });
      setForm({ subject: '', message: '', type: 'general', priority: 'medium' });
      setNewTicketUploads([]);
      await fetchTickets();
      setView('list');
    } catch {
      setFormError('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    const successUploads = replyUploads.filter(u => u.status === 'success');
    if (!shop || !selected || (!replyText.trim() && successUploads.length === 0)) return;
    setSendingReply(true);
    const attachmentUrls = successUploads.map(u => u.url);
    try {
      const res = await api.post(`/shops/${shop.id}/tickets/${selected.id}/reply`, {
        message: replyText,
        attachments: attachmentUrls
      });
      const newStatus = selected.status === 'resolved' || selected.status === 'closed' ? 'open' : selected.status;
      setSelected(prev => prev ? { ...prev, replies: [...prev.replies, res.data.data], status: newStatus } : prev);
      setReplyText('');
      setReplyUploads([]);
      // update list too
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: newStatus } : t));
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  const closeTicket = async () => {
    if (!shop || !selected) return;
    setClosing(true);
    try {
      await api.post(`/shops/${shop.id}/tickets/${selected.id}/close`);
      setSelected(prev => prev ? { ...prev, status: 'closed' } : prev);
      setTickets(prev => prev.map(t => t.id === selected?.id ? { ...t, status: 'closed' } : t));
    } catch (e) {
      console.error(e);
    } finally {
      setClosing(false);
    }
  };

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  if (view === 'new') {
    return (
      <SupportNewTicket
        onBack={() => setView('list')}
        onSubmit={submitTicket}
        form={form}
        setForm={setForm}
        formError={formError}
        newTicketUploads={newTicketUploads}
        setNewTicketUploads={setNewTicketUploads}
        handleUpload={handleUpload}
        submitting={submitting}
      />
    );
  }

  if (view === 'detail' && selected) {
    return (
      <SupportDetailView
        selected={selected}
        user={user}
        onBack={() => { setView('list'); setSelected(null); }}
        onCloseTicket={closeTicket}
        closing={closing}
        replyText={replyText}
        setReplyText={setReplyText}
        onSendReply={sendReply}
        sendingReply={sendingReply}
        replyUploads={replyUploads}
        setReplyUploads={setReplyUploads}
        handleUpload={handleUpload}
      />
    );
  }

  return (
    <SupportListView
      tickets={tickets}
      loading={loading}
      openCount={openCount}
      onCreateTicket={() => setView('new')}
      onSelectTicket={openDetail}
    />
  );
}
