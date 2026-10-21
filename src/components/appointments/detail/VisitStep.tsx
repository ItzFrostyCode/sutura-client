import type { Appointment, StaffData } from '../appointmentHelpers';
import AssignStaffControl from '../AssignStaffControl';
import { Fact, StepCard, Sub } from './StepCard';
import ConsultationNotes from './ConsultationNotes';

interface Props {
  readonly apt: Appointment;
  readonly staff: StaffData[];
  readonly storeOwner: { id: number; name: string } | null;
  readonly canAssign: boolean;
  readonly onAssign: (aptId: number, staffId: number | null) => Promise<boolean>;
  readonly onSaved?: () => void;
  /** Step number: 1 when the customer asked for nothing beforehand (a walk-in), else 2. */
  readonly n?: number;
}

/** Step 2: the visit itself: who handles it, when the customer arrived, and what the shop wrote about it. */
export default function VisitStep({ apt, staff, storeOwner, canAssign, onAssign, onSaved, n = 2 }: Props) {
  const arrived = apt.checked_in_at ? new Date(apt.checked_in_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : null;
  const waiting = apt.status === 'confirmed' && apt.checked_in_at;
  const open = !['completed', 'cancelled', 'no_show', 'rejected'].includes(apt.status);

  return (
    <StepCard n={n} title="Visit" hint="Who handles it, and what happened." done={apt.status === 'completed' || apt.status === 'no_show'}>
      <div>
        <Sub>Assigned to</Sub>
        <AssignStaffControl
          assignedStaffId={apt.assigned_staff_id}
          assignedName={apt.assigned_staff?.name}
          branchId={apt.store_branch_id ?? apt.branch?.id}
          staff={staff}
          storeOwner={storeOwner}
          canAssign={canAssign && open}
          onAssign={(id) => onAssign(apt.id, id)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Fact label="Branch">{apt.branch?.name ?? 'Main branch'}</Fact>
        <Fact label="Arrival">
          <span>
            {arrived ? `Arrived at ${arrived}${apt.arrival_status === 'early' ? ' (early)' : apt.arrival_status === 'late' ? ' (late)' : ''}` : 'Not arrived yet'}
          </span>
          {apt.previous_scheduled_at && <span className="mt-1 block text-xs font-normal text-ink-muted">Moved from {new Date(apt.previous_scheduled_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.</span>}
        </Fact>
      </div>
      {waiting && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">The customer arrived early and is waiting for their time. Tap <strong>Start visit</strong> when the branch is free.</p>}

      {(open || apt.visit_notes || apt.people_count || apt.design_source) && <ConsultationNotes apt={apt} editable={open && apt.kind !== 'production'} onSaved={onSaved} />}
    </StepCard>
  );
}
