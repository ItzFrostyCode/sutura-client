'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, MessageSquare, Copy, Ruler, Link as LinkIcon, ImagePlus, X, Loader2, Check } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import type { Appointment } from './appointmentHelpers';

interface AppointmentCustomerToolkitProps {
  readonly apt: Appointment;
  readonly onChanged: () => void;
}

const BTN = 'h-11 px-4 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken flex items-center justify-center gap-2 cursor-pointer transition-colors';

// What the shop needs once a request is in / accepted: reach the customer
// (the conversation itself happens on Messenger or SMS), hand them a link or
// photos, and write down their measurements from the phone.
export default function AppointmentCustomerToolkit({ apt, onChanged }: Readonly<AppointmentCustomerToolkitProps>) {
  const router = useRouter();
  const toast = useToast();
  const { store } = useAuthStore();
  const accepted = apt.status === 'confirmed' || apt.status === 'in_progress';
  const phone = apt.customer?.phone?.trim() || '';
  const email = apt.customer?.email?.trim() || '';

  const [link, setLink] = useState(apt.shared_link ?? '');
  const [images, setImages] = useState<string[]>(apt.shared_images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error('Could not copy — select and copy it manually.');
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file || !store?.id) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${store.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.data?.url || res.data?.url;
      if (url) setImages(prev => [...prev, url].slice(0, 6));
      setSaved(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload the photo.'));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!store?.id) return;
    setSaving(true);
    try {
      await api.put(`/stores/${store.id}/appointments/${apt.id}`, {
        shared_link: link.trim() || null,
        shared_images: images,
      });
      setSaved(true);
      toast.success('Shared with the customer — they were notified.');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not share this with the customer.'));
    } finally {
      setSaving(false);
    }
  };

  const contactLine = [phone, email].filter(Boolean).join(' · ') || 'No contact details on file';

  return (
    <div className="border-t border-line pt-4 space-y-5">
      <section aria-label="Contact the customer">
        <p className="text-xs font-bold uppercase tracking-wider text-ink mb-2">Talk to the customer</p>
        <p className="text-xs text-ink-muted mb-3 break-words">{apt.customer?.name} — {contactLine}</p>
        <div className="grid grid-cols-3 gap-2">
          {phone ? (
            <>
              <a href={`tel:${phone}`} className={BTN}><Phone size={15} /> Call</a>
              <a href={`sms:${phone}`} className={BTN}><MessageSquare size={15} /> SMS</a>
            </>
          ) : (
            <p className="col-span-2 text-xs text-ink-muted self-center">No phone number — use the email, or message them on Messenger.</p>
          )}
          <button type="button" onClick={() => copy(phone || email, phone ? 'Phone number' : 'Email')} disabled={!phone && !email} className={`${BTN} disabled:opacity-50`}>
            <Copy size={15} /> Copy
          </button>
        </div>
      </section>

      {accepted && (
        <>
          <section aria-label="Share with the customer" className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink">Share with the customer</p>
            <p className="text-xs text-ink-muted">A link or photos (e.g. a sketch, fabric options). They see it on their appointment and get a notification.</p>

            <div className="flex items-center gap-2 border border-line bg-white px-3 h-11">
              <LinkIcon size={15} className="text-ink-faint shrink-0" />
              <input
                type="url"
                value={link}
                onChange={e => { setLink(e.target.value); setSaved(false); }}
                placeholder="https://…"
                aria-label="Link to share"
                className="flex-1 min-w-0 bg-transparent text-base text-ink focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {images.map(url => (
                <div key={url} className="relative w-16 h-16 border border-line bg-sunken">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getMediaUrl(url)} alt="Shared" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImages(prev => prev.filter(u => u !== url)); setSaved(false); }}
                    aria-label="Remove photo"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <label className="w-16 h-16 border border-dashed border-line-strong bg-sunken flex items-center justify-center text-ink-muted hover:text-taupe cursor-pointer" title="Add a photo">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={20} />}
                  <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
              )}
            </div>

            <button type="button" onClick={save} disabled={saving || uploading} className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
              {saved ? 'Shared' : 'Share'}
            </button>
          </section>

          <section aria-label="Measurements">
            <p className="text-xs font-bold uppercase tracking-wider text-ink mb-2">Measurements</p>
            <button
              type="button"
              disabled={!apt.customer?.id}
              onClick={() => router.push(`/dashboard/measurements?customer_id=${apt.customer.id}&return=${encodeURIComponent('/dashboard/appointments')}`)}
              className={`${BTN} w-full`}
            >
              <Ruler size={16} /> Record measurements
            </button>
            <p className="text-xs text-ink-muted mt-1.5">Opens the customer&apos;s measurement form; saving brings you back here.</p>
          </section>
        </>
      )}
    </div>
  );
}
