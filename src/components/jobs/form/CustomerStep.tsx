import { useState } from 'react';
import { Store, ShoppingBag, ShieldCheck, Eye } from 'lucide-react';
import Modal from '@/components/Modal';
import ConsultationRecap from './ConsultationRecap';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { appointmentNo } from '@/components/appointments/appointmentHelpers';
import CustomerPicker from '@/components/appointments/CustomerPicker';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import { getErrorMessage } from '@/lib/apiError';
import { LABEL } from './FormStep';
import { BTN_SM } from '@/components/shared/plainForm';
import type { CustomerData } from './types';

interface Props {
  readonly customers: CustomerData[];
  readonly customerId: string;
  readonly onChange: (id: string) => void;
  readonly onAdd: (payload: Record<string, string | null>) => Promise<CustomerData>;
  readonly locked: boolean;
  readonly onUnlock: () => void;
  readonly channel: 'walk_in' | 'online';
  readonly appointmentId: string | null;
  /** The consultation has no name yet: ask who it really is. */
  readonly unnamedVisit?: boolean;
  /** The consultation this order is written up from, to look at without leaving the form. */
  readonly appointment?: Appointment | null;
  /** The order is for the consultation's customer: it cannot be changed here (the server needs the same customer). */
  readonly fixed?: boolean;
}

/** Who the order is for — the same search-and-pick (and "+ add new customer") the Appointments form uses — and where it came from. */
export default function CustomerStep({ customers, customerId, onChange, onAdd, locked, onUnlock, channel, appointmentId, unnamedVisit, appointment, fixed }: Props) {
  const [peek, setPeek] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const picked = customers.find((c) => c.id.toString() === customerId);
  const SourceIcon = channel === 'online' ? ShoppingBag : Store;

  const create = async (payload: Record<string, string | null>) => {
    setSaving(true);
    setAddError('');
    try {
      const created = await onAdd(payload);
      onChange(created.id.toString());
      setAdding(false);
    } catch (err) {
      setAddError(getErrorMessage(err, 'Failed to create customer.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {locked && customerId ? (
        <div>
          <span className={LABEL}>Customer <span className="text-danger">*</span></span>
          <div className="flex min-h-12 items-center justify-between gap-3 border-y border-espresso/[0.06] py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{picked?.name ?? `Customer #${customerId}`}</p>
              {(picked?.phone || picked?.email) && <p className="truncate text-xs text-ink-muted">{picked.phone || picked.email}</p>}
            </div>
            {!fixed && <button type="button" onClick={onUnlock} className={BTN_SM}>Change</button>}
          </div>
        </div>
      ) : (
        <CustomerPicker plain customers={customers} value={customerId} onChange={onChange} onAdd={() => setAdding(true)} />
      )}
      {appointmentId ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-espresso/70">
            <SourceIcon size={15} className="shrink-0" />
            Written up from appointment <strong className="font-semibold text-espresso">{appointmentNo(Number(appointmentId))}</strong>
          </p>
          {appointment && <button type="button" onClick={() => setPeek(true)} className={BTN_SM}><Eye size={14} />View appointment</button>}
          <p className="basis-full text-xs text-espresso/60">It opens on top of this form, so nothing you typed is lost. This order only copies from the appointment; nothing the shop or branch manager wrote there is changed.</p>
          {appointment && peek && (
            <Modal isOpen onClose={() => setPeek(false)} title={`Appointment ${appointmentNo(Number(appointmentId))}`} maxWidth="max-w-2xl">
              <ConsultationRecap appointment={appointment} defaultOpen />
            </Modal>
          )}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-espresso/70">
          <SourceIcon size={15} className="shrink-0" />
          {channel === 'online' ? 'Online order' : 'Walk-in at the counter'}
        </p>
      )}
      {unnamedVisit && <p className="text-[13px] text-amber-800">This consultation has no name yet. Pick the customer it is for, or tap + to add them. The consultation moves to them.</p>}
      {picked?.is_trusted && <p className="flex items-center gap-2 text-[13px] font-medium text-espresso"><ShieldCheck size={14} className="shrink-0" />Trusted customer</p>}
      {/* The modal is portaled out of the page, but React still bubbles its submit up to the order form: stop it here. */}
      <div onSubmit={(e) => e.stopPropagation()}>
        <CustomerFormModal
          isOpen={adding} onClose={() => { setAdding(false); setAddError(''); }} editingCustomer={null}
          onSubmit={create} isSubmitting={saving} error={addError}
        />
      </div>
    </div>
  );
}
