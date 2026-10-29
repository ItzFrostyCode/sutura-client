import { serviceHasType } from '@/components/jobs/jobHelpers';
import FormStep, { Chip } from '../FormStep';
import MeasurementSection from '../MeasurementSection';
import MeasureGuide from '../MeasureGuide';
import RosterEditor from '../RosterEditor';
import { chartFor } from '../jobFormHelpers';
import type { JobCreateForm } from '../useJobCreateForm';

/**
 * Step 3: who wears it and how they are sized. A wearer is a person and a piece is a garment: one person can need several pieces,
 * and a person with three measurement profiles still needs only the pieces they ordered. One wearer is sized right here; two or more
 * go in a team list, one row each with their own size (a second set is another row).
 */
export default function StepSizing({ form }: Readonly<{ form: JobCreateForm }>) {
  const { service, formData, isBulk, isRepair, pricing } = form;
  const teamOnly = serviceHasType(service, 'bulk_sublimation');
  const wearers = isBulk ? form.roster.length : 1;
  const pieces = pricing.quantity;

  const justOne = () => { form.setBulkChosen(false); form.set({ quantity: String(Math.max(1, pieces)) }); };
  const aTeam = () => {
    form.setBulkChosen(true);
    const n = Math.max(2, Number(formData.quantity) || 1);
    form.setRoster((cur) => (cur.length >= n ? cur : [...cur, ...Array.from({ length: n - cur.length }, form.blankRow)]));
  };

  const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;
  const things = (n: number) => `${n} ${n === 1 ? 'piece' : 'pieces'}`;

  return (
    <div className="space-y-6">
      {!isRepair && (
        <FormStep title="Who is this for?" hint={isBulk ? 'A team or group: one row per person, each with their own size. A person who needs a second set gets another row.' : 'One person gets all the pieces.'}>
          {teamOnly ? (
            <p className="text-sm text-espresso/70">This service is always for a team or group: list each person below.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Chip active={!isBulk} onClick={justOne}>One person</Chip>
              <Chip active={isBulk} onClick={aTeam}>A team or group</Chip>
            </div>
          )}
          <p className="text-sm font-semibold text-espresso">
            {people(wearers)} · {things(pieces)}
            {!isBulk && <span className="font-normal text-espresso/60"> (set in Order details)</span>}
          </p>
        </FormStep>
      )}

      {isBulk ? (
        <FormStep title="Team list" hint="One row per person. Pick Custom Fit under Size for someone who needs to be measured, then choose Top, Bottom or both.">
          <MeasureGuide design={form.design} service={service} />
          <RosterEditor
            teamName={form.teamName} onTeamName={form.setTeamName} roster={form.roster} onRoster={form.setRoster} newRow={form.blankRow}
            minQty={service?.min_order_qty} columns={form.rosterColumns} onColumns={form.setRosterColumns} chart={chartFor(form.design, service)} profiles={form.measurements} unit={form.store?.default_measurement_unit === 'cm' ? 'cm' : 'in'} areaLocked={form.areaLocked}
          />
        </FormStep>
      ) : (
        <MeasurementSection form={form} />
      )}
    </div>
  );
}
