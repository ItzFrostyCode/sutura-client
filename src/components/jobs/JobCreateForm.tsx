'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import { garmentLabel, categoryOfGarment, GARMENT_CATEGORIES } from '@/lib/garmentTaxonomy';
import { useJobCreateForm } from './form/useJobCreateForm';
import FormStep from './form/FormStep';
import CustomerStep from './form/CustomerStep';
import WhatStep from './form/WhatStep';
import DetailsStep from './form/DetailsStep';
import AssignStaffSection from './form/AssignStaffSection';
import PriceStep from './form/PriceStep';

export default function JobCreateForm() {
  const searchParams = useSearchParams();
  // Arrived from a specific page (e.g. a design's "Tailor this Design")? Back and Cancel return there. Dashboard paths only.
  const returnParam = searchParams.get('return');
  const backHref = returnParam?.startsWith('/dashboard/') && !returnParam.startsWith('//') ? returnParam : '/dashboard/jobs';
  // Select the stored roles array itself: a selector that builds a new array each call loops forever.
  const roles = useAuthStore((s) => s.user?.roles);
  const canCollectMoney = !!roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name));
  const { selectedBranchId } = useBranch();
  const form = useJobCreateForm();
  const { store, formData, set } = form;

  if (form.loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-ink-faint">
        <Loader2 className="h-6 w-6 animate-spin text-taupe" />
        <span>Loading form data...</span>
      </div>
    );
  }

  // Staff open a job from an approved appointment, never from scratch.
  if (!canCollectMoney && !form.appointmentId) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-12 text-center">
        <h1 className="mobile-h2 font-semibold text-ink">Start from an appointment</h1>
        <p className="mobile-body-md text-ink-muted">Staff open a job order from an approved appointment. Pick the appointment and tap Create Job Order.</p>
        <Link href="/dashboard/appointments" className="inline-flex h-[52px] items-center justify-center bg-taupe px-6 font-semibold text-white hover:bg-taupe-hover">Go to Appointments</Link>
      </div>
    );
  }

  const garmentCategoryLabel = categoryOfGarment(formData.garment_type) ? GARMENT_CATEGORIES[categoryOfGarment(formData.garment_type)!].label : '';
  const jobTerms = [garmentLabel(formData.garment_type) ?? formData.garment_type, garmentCategoryLabel, form.service?.name ?? ''].filter(Boolean);
  const staffStep = canCollectMoney && store;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={backHref} aria-label="Back" className="flex h-11 w-11 shrink-0 items-center justify-center border border-line bg-surface text-ink-muted hover:bg-sunken hover:text-ink">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Create Job Order</h1>
          <p className="mt-1 text-sm text-ink-muted">Who it is for, what is being made, and the price. The tailors’ steps come next.</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit} className="space-y-6 border border-line bg-surface p-5 sm:p-6">
        {(form.error || form.formError) && <div role="alert" className="border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">{form.error || form.formError}</div>}

        <FormStep n={1} title="Customer">
          <CustomerStep
            customers={form.customers} customerId={formData.customer_id} onChange={(id) => set({ customer_id: id })} onAdd={form.addCustomer}
            locked={form.customerLocked} onUnlock={() => form.setCustomerLocked(false)} channel={form.intakeChannel}
            appointmentId={form.appointmentId} onClearAppointment={canCollectMoney ? () => form.setAppointmentId(null) : undefined}
          />
        </FormStep>
        <FormStep n={2} title="What is being made" hint="Same garments and services your customers search by.">
          <WhatStep form={form} />
        </FormStep>
        <FormStep n={3} title="Details" hint="Shaped by the service you picked.">
          <DetailsStep form={form} />
        </FormStep>
        {staffStep && (
          <FormStep n={4} title="Who works on it" hint="They are told right away. Staff with a matching skill are listed first.">
            <AssignStaffSection storeId={store.id} branchId={selectedBranchId ?? null} assignees={form.assignees} setAssignees={form.setAssignees} jobTerms={jobTerms} />
          </FormStep>
        )}
        <FormStep n={staffStep ? 5 : 4} title="Price and date">
          <PriceStep form={form} canCollectMoney={canCollectMoney} />
        </FormStep>

        <div className="flex justify-end gap-3 border-t border-line pt-6">
          <Link href={backHref} className="inline-flex h-12 items-center px-6 font-medium text-ink-muted hover:bg-sunken hover:text-ink">Cancel</Link>
          <button type="submit" disabled={form.submitting} className="inline-flex h-12 cursor-pointer items-center gap-2 bg-taupe px-6 font-semibold text-white hover:bg-taupe-hover disabled:opacity-50">
            {form.submitting && <Loader2 size={18} className="animate-spin" />}
            Create Job Order
          </button>
        </div>
      </form>
    </div>
  );
}
