import { useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import type { Appointment } from '../appointmentHelpers';
import { appointmentNo, customerLabel, getCustomerInitials, hasName, realEmail } from '../appointmentHelpers';
import { isWalkInEmail } from '@/components/customers/customerHelpers';
import { PLAIN_FIELD, BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import { useToast } from '@/context/ToastContext';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/lib/apiError';
import api from '@/lib/axios';
import { CARD } from './StepCard';

const ACTION = 'inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-white text-[13px] font-medium text-ink hover:bg-sunken';

/** Who it is: name, how they came, and one tap to call, text or copy their contact. A walk-in the shop made can be renamed here. */
export default function CustomerCard({ apt, onSaved }: Readonly<{ apt: Appointment; onSaved?: () => void }>) {
  const toast = useToast();
  const store = useAuthStore((s) => s.store);
  const customer = apt.customer;
  const named = hasName(customer?.name);
  const phone = customer?.phone?.trim();
  const email = realEmail(customer?.email?.trim());
  // The shop made this record (a walk-in account with a placeholder login), so the shop can correct it. An online customer's own account is theirs.
  const editable = Boolean(customer?.id && isWalkInEmail(customer.email));
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [saving, setSaving] = useState(false);

  const copyValue = phone || email;
  const copy = async () => {
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      toast.success(`${phone ? 'Phone' : 'Email'} copied.`);
    } catch {
      toast.error('Could not copy.');
    }
  };

  const startEdit = () => { setName(named ? customer?.name ?? '' : ''); setMobile(phone ?? ''); setEditing(true); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !customer) return;
    setSaving(true);
    try {
      await api.put(`/stores/${store.id}/customers/${customer.id}`, { name: name.trim(), phone: mobile.trim() });
      toast.success('Customer saved.');
      setEditing(false);
      onSaved?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not save the customer.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`${CARD} p-5`}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sunken text-base font-semibold text-taupe">{getCustomerInitials(customer?.name)}</span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-base font-semibold ${named ? 'text-ink' : 'text-ink-muted'}`}>{customerLabel(customer?.name)}</p>
          <p className="text-[13px] text-ink-muted">{apt.intake_channel === 'walk_in' ? 'Came to the shop' : 'Booked online'}</p>
        </div>
        {editable && !editing && (
          <button type="button" onClick={startEdit} aria-label="Edit customer" title="Edit name and number" className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-sunken hover:text-ink"><Pencil size={16} /></button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-4 space-y-3">
          <div>
            <label htmlFor="cc-name" className="mb-1 block text-[13px] font-medium text-ink-muted">Name <span className="text-danger">*</span></label>
            <input id="cc-name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="off" className={PLAIN_FIELD} />
          </div>
          <div>
            <label htmlFor="cc-phone" className="mb-1 block text-[13px] font-medium text-ink-muted">Mobile number <span className="text-danger">*</span></label>
            <input id="cc-phone" required type="tel" inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={20} placeholder="0917 123 4567" autoComplete="off" className={PLAIN_FIELD} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(false)} className={`${BTN} flex-1`}>Cancel</button>
            <button type="submit" disabled={saving} className={`${BTN_PRIMARY} flex-1`}>{saving && <Loader2 size={15} className="animate-spin" />}Save</button>
          </div>
        </form>
      ) : (
        <>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm text-ink-body">
            <div className="flex items-baseline justify-between gap-3"><dt className="text-xs text-ink-muted">Number</dt><dd className="font-mono font-semibold">{appointmentNo(apt.id)}</dd></div>
            <div className="flex items-baseline justify-between gap-3"><dt className="text-xs text-ink-muted">When</dt><dd className="text-right">{new Date(apt.scheduled_at).toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })} · {apt.duration_minutes ?? 60} min</dd></div>
            {phone && <div className="flex items-baseline justify-between gap-3"><dt className="text-xs text-ink-muted">Mobile</dt><dd>{phone}</dd></div>}
            {email && <div className="flex items-baseline justify-between gap-3"><dt className="text-xs text-ink-muted">Email</dt><dd className="truncate">{email}</dd></div>}
            {!phone && !email && editable && <p className="text-[13px] text-ink-muted">No number yet. Tap the pencil to add the name and number.</p>}
          </dl>
          {(phone || email) && (
            <div className="mt-4 flex gap-2">
              {phone && <a href={`tel:${phone}`} className={ACTION}>Call</a>}
              {phone && <a href={`sms:${phone}`} className={ACTION}>Text</a>}
              <button type="button" onClick={copy} className={ACTION}>Copy</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
