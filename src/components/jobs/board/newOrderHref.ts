/** The Create Job Order link for an appointment, carrying what the appointment already knows. */
export function newOrderHref(apt: { id: number; notes?: string | null; customer?: { id: number } | null; service?: { id: number } | null }): string {
  const service = apt.service?.id ? `&service_id=${apt.service.id}` : '';
  const notes = encodeURIComponent(`From appointment. Notes: ${apt.notes || ''}`);
  return `/dashboard/jobs/new?customer_id=${apt.customer?.id ?? ''}${service}&notes=${notes}&appointment_id=${apt.id}`;
}
