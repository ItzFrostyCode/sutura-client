import { useState } from 'react';
import { Store, ShoppingBag } from 'lucide-react';
import CustomerPicker from '@/components/appointments/CustomerPicker';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import { getErrorMessage } from '@/lib/apiError';
import { LABEL } from './FormStep';
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
  readonly onClearAppointment?: () => void;
}

/** Who the order is for — the same search-and-pick (and "+ add new customer") the Appointments form uses — and where it came from. */
export default function CustomerStep({ customers, customerId, onChange, onAdd, locked, onUnlock, channel, appointmentId, onClearAppointment }: Props) {
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
          <span className={LABEL}>Customer</span>
          <div className="flex min-h-11 items-center justify-between gap-3 border-b border-line pb-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{picked?.name ?? `Customer #${customerId}`}</p>
              {(picked?.phone || picked?.email) && <p className="truncate text-xs text-ink-muted">{picked.phone || picked.email}</p>}
            </div>
            <button type="button" onClick={onUnlock} className="shrink-0 cursor-pointer text-xs font-semibold text-taupe hover:underline">Change</button>
          </div>
        </div>
      ) : (
        <CustomerPicker customers={customers} value={customerId} onChange={onChange} onAdd={() => setAdding(true)} />
      )}
      <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
        <SourceIcon size={14} className="shrink-0" />
        <span>{channel === 'online' ? 'Online order' : 'Walk-in at the counter'}</span>
        {appointmentId && (
          <>
            <span>· from appointment #{appointmentId}, which is marked done when you save</span>
            {onClearAppointment && <button type="button" onClick={onClearAppointment} className="cursor-pointer font-semibold text-taupe hover:underline">Unlink</button>}
          </>
        )}
      </p>
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
