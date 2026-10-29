'use client';

import React, { useState } from 'react';
import { Loader2, MessageSquareText } from 'lucide-react';
import Modal from '@/components/Modal';
import DesignSourceField from '@/components/shared/DesignSourceField';
import GenderPicker, { type Gender } from '@/components/shared/GenderPicker';
import type { DesignSource } from '@/lib/designSource';
import CustomerPicker from './CustomerPicker';
import type { CustomerData, ServiceData } from './appointmentHelpers';

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly customers: CustomerData[];
  readonly services: ServiceData[];
  readonly isSubmitting: boolean;
  readonly error: string;
  readonly onStart: (payload: Record<string, unknown>) => Promise<void>;
}

const FIELD = 'h-12 w-full rounded-lg border border-espresso/[0.12] bg-white px-3 text-base text-ink placeholder:text-ink-faint focus:border-taupe focus:outline-none sm:text-sm';
const LABEL = 'mb-1.5 block text-[13px] font-medium text-ink-muted';

const nowLocal = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};

/** A customer is here now and wants to talk: get to know them first (a customer the shop has, or a new name and mobile number), then start. */
export default function ConsultationStartModal({ isOpen, onClose, customers, services, isSubmitting, error, onStart }: Props) {
  const [customerId, setCustomerId] = useState('');
  const [existing, setExisting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender | ''>('male');
  const [serviceId, setServiceId] = useState('');
  const [people, setPeople] = useState('');
  const [pieces, setPieces] = useState('');
  const [design, setDesign] = useState<{ design_source: DesignSource | null; design_link: string | null }>({ design_source: null, design_link: null });
  const [notes, setNotes] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onStart({
      customer_id: existing ? customerId || undefined : undefined,
      walk_in_name: existing ? undefined : name.trim(),
      walk_in_phone: existing ? undefined : phone.trim(),
      walk_in_gender: existing ? undefined : gender || undefined,
      kind: serviceId ? 'service' : 'shop',
      service_id: serviceId || undefined,
      appointment_type: 'consultation',
      scheduled_at: nowLocal(),
      people_count: people ? Number(people) : undefined,
      pieces_count: pieces ? Number(pieces) : undefined,
      design_source: design.design_source ?? undefined,
      design_link: design.design_link ?? undefined,
      visit_notes: notes.trim() || undefined,
    });
  };

  const footer = (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className="h-[52px] cursor-pointer rounded-lg border border-espresso/[0.12] px-6 text-base font-medium text-ink hover:bg-espresso/[0.03]">Cancel</button>
      <button type="submit" form="consult-form" disabled={isSubmitting} className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-espresso px-6 text-base font-semibold text-white hover:bg-espresso/90 disabled:opacity-60">
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <MessageSquareText size={18} />} Start consultation
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start consultation" maxWidth="max-w-2xl" footer={footer}>
      <form id="consult-form" onSubmit={submit} className="space-y-5">
        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-ink">Who is the customer?</h3>
            {/* One connected toggle (not two separate buttons): which customer this consultation is for. */}
            <div role="group" aria-label="New or existing customer" className="inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-espresso/[0.08] bg-espresso/[0.05] p-1">
              <button
                type="button"
                aria-pressed={!existing}
                onClick={() => setExisting(false)}
                className={`flex h-9 cursor-pointer items-center justify-center rounded-lg px-3.5 text-[13px] font-medium transition-colors ${!existing ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
              >New</button>
              <button
                type="button"
                aria-pressed={existing}
                onClick={() => setExisting(true)}
                className={`flex h-9 cursor-pointer items-center justify-center rounded-lg px-3.5 text-[13px] font-medium transition-colors ${existing ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
              >Already a Customer</button>
            </div>
          </div>
          {existing ? (
            <CustomerPicker customers={customers} value={customerId} onChange={setCustomerId} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="walk_in_name" className={LABEL}>Name <span className="text-danger">*</span></label>
                <input id="walk_in_name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={120} autoComplete="off" className={FIELD} />
              </div>
              <div>
                <label htmlFor="walk_in_phone" className={LABEL}>Mobile number <span className="text-danger">*</span></label>
                <input id="walk_in_phone" required type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 123 4567" maxLength={20} autoComplete="off" className={FIELD} />
              </div>
              <div className="sm:col-span-2"><GenderPicker value={gender} onChange={setGender} /></div>
              <p className="text-[13px] text-ink-muted sm:col-span-2">If this number is already the shop’s customer, that customer is used and nothing is duplicated.</p>
            </div>
          )}
        </section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="consult_service" className={LABEL}>What service?</label>
            <select id="consult_service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={FIELD}>
              <option value="">No specific service yet</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="consult_people" className={LABEL}>How many people are we measuring?</label>
            <input id="consult_people" type="number" inputMode="numeric" min={1} max={500} value={people} onChange={(e) => setPeople(e.target.value)} placeholder="1" className={FIELD} />
          </div>
          <div>
            <label htmlFor="consult_pieces" className={LABEL}>How many pieces in total?</label>
            <input id="consult_pieces" type="number" inputMode="numeric" min={1} max={5000} value={pieces} onChange={(e) => setPieces(e.target.value)} placeholder={people || '1'} className={FIELD} />
          </div>
          <p className="text-[13px] text-ink-muted sm:col-span-2">Each person gets their own measurements. A piece is one garment (a shirt, a pair of pants, a barong). Count every garment across all people into the total pieces — the price follows the total.</p>
          {Number(people) > 0 && Number(pieces) > 0 && Number(pieces) < Number(people) && (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-[13px] text-amber-900 sm:col-span-2">You have {people} people but only {pieces} piece{Number(pieces) > 1 ? 's' : ''}. Each person needs at least one garment, so we’ll count <strong>{people} pieces</strong>.</p>
          )}
        </div>
        <DesignSourceField source={design.design_source} link={design.design_link} onChange={setDesign} />
        <div>
          <label htmlFor="consult_notes" className={LABEL}>What did they say?</label>
          <textarea id="consult_notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} placeholder="Style, colours, deadline, anything agreed…" className="w-full rounded-lg border border-espresso/[0.12] bg-white p-3 text-base text-ink placeholder:text-ink-faint focus:border-taupe focus:outline-none sm:text-sm" />
        </div>
      </form>
    </Modal>
  );
}
