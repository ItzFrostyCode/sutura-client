'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Pencil, Megaphone } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';

interface SpecialHour {
  id: number;
  title: string;
  shop_branch_id: number | null;
  branch: { id: number; name: string } | null;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  special_open_time: string | null;
  special_close_time: string | null;
  announcement_message: string | null;
  announcement_image_url: string | null;
}

interface SpecialHoursAnnouncementCardProps {
  readonly shopId: number;
  readonly onSaved: () => void;
  readonly branches?: { id: number; name: string }[];
}

const emptyForm = {
  title: '',
  shop_branch_id: '' as number | '',
  start_date: '',
  end_date: '',
  is_closed: false,
  special_open_time: '09:00',
  special_close_time: '18:00',
  announcement_message: '',
  announcement_image_url: '',
};

export default function SpecialHoursAnnouncementCard({ shopId, onSaved, branches = [] }: SpecialHoursAnnouncementCardProps) {
  const toast = useToast();
  const [items, setItems] = useState<SpecialHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = () => {
    setLoading(true);
    api.get(`/shops/${shopId}/special-hours`, { params: { include_past: 1 } })
      .then(res => setItems(res.data.data || []))
      .catch(() => toast.error('Failed to load special hours.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const load = () => fetchItems();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (item: SpecialHour) => {
    setForm({
      title: item.title,
      shop_branch_id: item.shop_branch_id ?? '',
      start_date: item.start_date,
      end_date: item.end_date,
      is_closed: item.is_closed,
      special_open_time: item.special_open_time || '09:00',
      special_close_time: item.special_close_time || '18:00',
      announcement_message: item.announcement_message || '',
      announcement_image_url: item.announcement_image_url || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/shops/${shopId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.data?.url || '';
      setForm(prev => ({ ...prev, announcement_image_url: url }));
    } catch {
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date || !form.end_date) {
      toast.error('Title, start date, and end date are required.');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      shop_branch_id: form.shop_branch_id === '' ? null : form.shop_branch_id,
      start_date: form.start_date,
      end_date: form.end_date,
      is_closed: form.is_closed,
      special_open_time: form.is_closed ? null : form.special_open_time,
      special_close_time: form.is_closed ? null : form.special_close_time,
      announcement_message: form.announcement_message.trim() || null,
      announcement_image_url: form.announcement_image_url || null,
    };
    try {
      if (editingId) {
        await api.put(`/shops/${shopId}/special-hours/${editingId}`, payload);
        toast.success('Special schedule updated.');
      } else {
        await api.post(`/shops/${shopId}/special-hours`, payload);
        toast.success('Special schedule added.');
      }
      setShowForm(false);
      fetchItems();
      onSaved();
    } catch (err: unknown) {
      const errRes = err as { response?: { data?: { message?: string } } };
      toast.error(errRes.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this special schedule/announcement?')) return;
    try {
      await api.delete(`/shops/${shopId}/special-hours/${id}`);
      toast.success('Removed.');
      fetchItems();
      onSaved();
    } catch {
      toast.error('Failed to remove.');
    }
  };

  return (
    <div className="bg-surface border border-line rounded-2xl">
      <div className="flex items-center justify-between p-5 border-b border-line">
        <h2 className="text-base font-bold text-ink flex items-center gap-2">
          <Megaphone size={18} className="text-taupe" />
          Special Hours &amp; Announcements
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={startCreate}
            className="flex items-center gap-1.5 text-xs font-semibold text-taupe hover:underline"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        <p className="text-xs text-ink-muted -mt-1">
          Set a date range for a holiday closure, special hours, or a promo — whichever entry covers today shows as a banner at the top of your storefront, on every tab.
        </p>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-canvas border border-line rounded-2xl p-5 space-y-3">
            <div>
              <label htmlFor="sh_title" className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">Title <span className="text-rose-500">*</span></label>
              <input
                id="sh_title"
                type="text"
                required
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Holiday Closure, Anniversary Sale"
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
              />
            </div>

            {branches.length > 1 && (
              <div>
                <label htmlFor="sh_branch" className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">Applies To</label>
                <select
                  id="sh_branch"
                  value={form.shop_branch_id}
                  onChange={e => setForm(prev => ({ ...prev, shop_branch_id: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} only</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sh_start" className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">Start Date <span className="text-rose-500">*</span></label>
                <input
                  id="sh_start"
                  type="date"
                  required
                  value={form.start_date}
                  onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                />
              </div>
              <div>
                <label htmlFor="sh_end" className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">End Date <span className="text-rose-500">*</span></label>
                <input
                  id="sh_end"
                  type="date"
                  required
                  value={form.end_date}
                  onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_closed}
                onChange={e => setForm(prev => ({ ...prev, is_closed: e.target.checked }))}
                className="rounded border-line text-taupe focus:ring-taupe"
              />
              <span className="text-sm font-medium text-ink-body">Shop is closed during this period</span>
            </label>

            {!form.is_closed && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sh_open_time" className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">Special Open Time</label>
                  <input
                    id="sh_open_time"
                    type="time"
                    value={form.special_open_time}
                    onChange={e => setForm(prev => ({ ...prev, special_open_time: e.target.value }))}
                    className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                  />
                </div>
                <div>
                  <label htmlFor="sh_close_time" className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">Special Close Time</label>
                  <input
                    id="sh_close_time"
                    type="time"
                    value={form.special_close_time}
                    onChange={e => setForm(prev => ({ ...prev, special_close_time: e.target.value }))}
                    className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="sh_message" className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">Announcement Message <span className="font-normal normal-case text-ink-faint">(optional)</span></label>
              <textarea
                id="sh_message"
                value={form.announcement_message}
                onChange={e => setForm(prev => ({ ...prev, announcement_message: e.target.value }))}
                rows={2}
                placeholder="Shown as a banner at the top of your storefront during this date range."
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe resize-none"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider">Announcement Image <span className="font-normal normal-case text-ink-faint">(optional)</span></span>
              {form.announcement_image_url ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.announcement_image_url} alt="Announcement" className="h-24 rounded-lg border border-line object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, announcement_image_url: '' }))}
                    className="absolute -top-2 -right-2 bg-surface border border-line text-ink-muted hover:text-rose-600 rounded-full p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-ink-muted hover:text-taupe transition-colors bg-white border border-dashed border-line rounded-lg px-3 py-2">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>{uploading ? 'Uploading...' : 'Upload image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={e => handleImageUpload(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-ink-muted hover:bg-white rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-taupe text-white text-sm font-semibold rounded-lg hover:bg-taupe/90 transition-colors disabled:opacity-50">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? 'Save Changes' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-8 text-center text-ink-faint"><Loader2 className="animate-spin mx-auto" /></div>
        ) : items.length === 0 && !showForm ? (
          <p className="text-sm text-ink-faint text-center py-6">No special schedules yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const isExpired = item.end_date < new Date().toISOString().split('T')[0];
              return (
              <div key={item.id} className={`bg-canvas border border-line rounded-xl p-4 flex items-start justify-between gap-3 ${isExpired ? 'opacity-60' : ''}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    {item.branch ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sunken text-taupe border border-line">
                        {item.branch.name}
                      </span>
                    ) : branches.length > 1 && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sunken text-taupe border border-line">
                        All Branches
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white text-ink-muted border border-line">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {item.start_date} — {item.end_date} · {item.is_closed ? 'Closed' : `${item.special_open_time || ''} - ${item.special_close_time || ''}`}
                  </p>
                  {item.announcement_message && (
                    <p className="text-xs text-ink-body mt-1.5 line-clamp-2">{item.announcement_message}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => startEdit(item)} className="p-1.5 text-ink-muted hover:text-taupe hover:bg-white rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} className="p-1.5 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
