'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import { useAuthStore } from '@/store/useAuthStore';
import { garmentLabel, categoryOfGarment, GARMENT_CATEGORIES } from '@/lib/garmentTaxonomy';
import ApplePage, { AppleBar } from './ui/ApplePage';
import { useJobCreateForm } from './form/useJobCreateForm';
import FormStep from './form/FormStep';
import CustomerStep from './form/CustomerStep';
import { isWalkInEmail } from '@/components/customers/customerHelpers';
import WhatStep from './form/WhatStep';
import { newExtraLine } from './form/ExtraServices';
import MeasurementSection from './form/MeasurementSection';
import RosterEditor from './form/RosterEditor';
import ReferenceNotes from './form/ReferenceNotes';
import DesignAndConsultation from './form/DesignAndConsultation';
import ConsultationRecap from './form/ConsultationRecap';
import AssignStaffSection from './form/AssignStaffSection';
import PriceStep from './form/PriceStep';
import { chartFor, peso } from './form/jobFormHelpers';

export default function JobCreateForm() {
  const searchParams = useSearchParams();
  // Arrived from a specific page (e.g. a design's "Tailor this Design")? Back and Cancel return there. Dashboard paths only.
  const returnParam = searchParams.get('return');
  const backHref = returnParam?.startsWith('/dashboard/') && !returnParam.startsWith('//') ? returnParam : '/dashboard/jobs';
  // Select the stored roles array itself: a selector that builds a new array each call loops forever.
  const roles = useAuthStore((s) => s.user?.roles);
  const canCollectMoney = !!roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name));
  const form = useJobCreateForm();
  const { store, formData, set, service, isBulk, isRepair } = form;

  if (form.loading) {
    return (
      <ApplePage>
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-faint">
          <Loader2 className="h-6 w-6 animate-spin text-espresso" />
          <span>Loading…</span>
        </div>
      </ApplePage>
    );
  }

  const category = categoryOfGarment(formData.garment_type);
  const jobTerms = [garmentLabel(formData.garment_type) ?? formData.garment_type, category ? GARMENT_CATEGORIES[category].label : '', service?.name ?? ''].filter(Boolean);
  const placeholderVisit = !!form.appointment && isWalkInEmail(form.appointment.customer?.email);
  const customerName = form.customers.find((c) => c.id.toString() === formData.customer_id)?.name;

  return (
    <ApplePage plain>
      <form onSubmit={form.handleSubmit}>
        <AppleBar stuck>
          <Link href={backHref} aria-label="Back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-espresso/[0.05] hover:text-ink">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-semibold text-ink">New Job Order</h1>
            {customerName && <p className="truncate text-[13px] text-ink-muted">{customerName}{service ? ` · ${service.name}` : ''}</p>}
          </div>
          {form.pricing.total > 0 && <p className="hidden text-sm text-ink-muted sm:block">Total <strong className="text-base text-espresso">{peso(form.pricing.total)}</strong></p>}
          <Link href={backHref} className={BTN}>Cancel</Link>
          <button type="submit" disabled={form.submitting} className={BTN_PRIMARY}>
            {form.submitting && <Loader2 size={16} className="animate-spin" />}
            Create Job Order
          </button>
        </AppleBar>

        <p className="mx-4 mt-3 text-xs text-ink-muted sm:mx-6">Fields marked <span className="font-semibold text-danger">*</span> are required.</p>

        {form.below && (
          <div role="alert" className="mx-4 mt-4 flex flex-col gap-3 rounded-lg border border-espresso/30 bg-white px-4 py-3 text-sm text-espresso sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
            <p>{form.below.message}</p>
            {form.below.canContinue && (
              <button type="button" onClick={form.continueAnyway} disabled={form.submitting} className={BTN_PRIMARY}>Continue anyway</button>
            )}
          </div>
        )}
        {(form.error || form.formError) && <div role="alert" className="mx-4 mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger sm:mx-6">{form.error || form.formError}</div>}

        <div className="@container">
        <div className="grid items-start gap-6 p-4 sm:p-6 @[880px]:grid-cols-[minmax(0,1fr)_400px] @[1240px]:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-6">
            <FormStep title="Customer">
              <CustomerStep
                customers={form.customers} customerId={formData.customer_id} onChange={(id) => set({ customer_id: id })} onAdd={form.addCustomer}
                locked={form.customerLocked && !placeholderVisit} unnamedVisit={placeholderVisit} appointment={form.appointment} fixed={!!form.appointment && !placeholderVisit} onUnlock={() => form.setCustomerLocked(false)} channel={form.intakeChannel} appointmentId={form.appointmentId}
              />
            </FormStep>
            <FormStep
              title="What is being made" hint="The service from the booking is already chosen. Pick a design, or add more services: each one becomes its own order."
              action={<button type="button" onClick={() => form.setExtras((cur) => [...cur, newExtraLine()])} className={BTN}><Plus size={16} />Add service</button>}
            >
              <WhatStep form={form} />
            </FormStep>
            <MeasurementSection form={form} />
            {isBulk && service && (
              <FormStep title="Team" hint="One row per person. Rename, add or remove columns to fit this order.">
                <RosterEditor
                  teamName={form.teamName} onTeamName={form.setTeamName} roster={form.roster} onRoster={form.setRoster} newRow={form.blankRow}
                  minQty={service.min_order_qty} columns={form.rosterColumns} onColumns={form.setRosterColumns} chart={chartFor(form.design, service)}
                />
              </FormStep>
            )}
            <FormStep title="Design and style" hint="Where the design comes from, and how it should look.">
              <DesignAndConsultation form={form} />
            </FormStep>
            <FormStep title="Photos and notes">
              <ReferenceNotes
                storeId={store?.id} images={form.referenceImages} onImages={form.setReferenceImages} link={form.referenceLink}
                onLink={form.setReferenceLink} notes={formData.notes} onNotes={(v) => set({ notes: v })}
                photoLabel={isRepair ? 'Photo of the garment as received' : 'Photo of what they want'}
                sources={{
                  ...Object.fromEntries((form.design?.images ?? []).map((i) => [i.image_url, 'From the design'])),
                  ...Object.fromEntries((form.appointment?.reference_images ?? []).map((u) => [u, 'Sent with the booking'])),
                }}
              />
            </FormStep>
          </div>

          <aside className="space-y-6">
            <FormStep title="Price and date">
              <PriceStep form={form} canCollectMoney={canCollectMoney} />
            </FormStep>
            {form.appointment && <ConsultationRecap appointment={form.appointment} />}
            {canCollectMoney && store && (
              <FormStep title="Who works on it" hint="They are told right away. Staff with a matching skill are listed first.">
                <AssignStaffSection storeId={store.id} branchId={form.branchId} assignees={form.assignees} setAssignees={form.setAssignees} jobTerms={jobTerms} />
              </FormStep>
            )}

          </aside>
        </div>
        </div>
      </form>
    </ApplePage>
  );
}
