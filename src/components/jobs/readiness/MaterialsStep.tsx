import React, { useState } from 'react';
import { BTN_SM, PLAIN_FIELD } from '@/components/shared/plainForm';
import type { OrderReadinessApi } from './useOrderReadiness';
import type { ReadinessData } from './readinessTypes';

/**
 * "Ready for production?": the shop says the materials are ready, or still on the way (with an optional note).
 * A yes/no check only: SUTURA keeps no stock, suppliers or purchases. The customer's own fabric is judged in the request.
 */
export default function MaterialsStep({ data, api }: Readonly<{ data: ReadinessData; api: OrderReadinessApi }>) {
  const m = data.materials;
  const [note, setNote] = useState(m?.note ?? '');
  if (!m) return null;
  const off = api.busy !== null;
  const status = `${m.ready ? 'Materials are ready.' : m.waiting ? 'Waiting for materials.' : 'Not checked yet.'}${m.note ? ` ${m.note}` : ''}`;

  // Checking the materials is the owner's / branch manager's job; staff read the answer.
  if (!data.permissions.can_prepare) {
    return <p className="text-[13px] text-ink-muted">{status}{!m.ready && ' The owner or branch manager checks the materials.'}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-muted">{status}</p>
      <input
        aria-label="Materials note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="Optional note, e.g. fabric arrives Friday"
        className={`${PLAIN_FIELD} max-w-md font-normal`}
      />
      <div className="flex flex-wrap gap-2">
        {!m.ready && <button type="button" disabled={off} onClick={() => api.actions.setMaterials('ready', note)} className={BTN_SM}>Materials are ready</button>}
        {!m.waiting && <button type="button" disabled={off} onClick={() => api.actions.setMaterials('waiting', note)} className={BTN_SM}>Waiting for materials</button>}
      </div>
    </div>
  );
}
