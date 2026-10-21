import { cleanCustomerNotes } from '@/components/appointments/appointmentHelpers';

interface OrderSourceAppointment {
  id: number;
  notes?: string | null;
  selected_size?: string | null;
  customer?: { id: number } | null;
  service?: { id: number } | null;
  catalog_item?: { id: number } | null;
  items?: Array<{
    quantity?: number | null;
    service_id?: number | null;
    catalog_item_id?: number | null;
    selected_size?: string | null;
  }> | null;
}

/**
 * Builds the URL to create a Job Order from a completed appointment/consultation.
 * Seamlessly carries over customer, service, catalog item, accurate quantity, size, and clean notes.
 */
export function newOrderHref(apt: OrderSourceAppointment): string {
  const params = new URLSearchParams();

  if (apt.customer?.id) {
    params.set('customer_id', String(apt.customer.id));
  }

  // Pre-fill service ID
  const serviceId = apt.service?.id ?? apt.items?.[0]?.service_id;
  if (serviceId) {
    params.set('service_id', String(serviceId));
  }

  // Pre-fill catalog item ID (if booked from design)
  const catalogItemId = apt.catalog_item?.id ?? apt.items?.[0]?.catalog_item_id;
  if (catalogItemId) {
    params.set('catalog_item_id', String(catalogItemId));
  }

  // Pre-fill size if customer booked a specific size
  const bookedSize = apt.selected_size ?? apt.items?.[0]?.selected_size;
  if (bookedSize) {
    params.set('size', String(bookedSize));
  }

  // Pre-fill quantity if items were booked
  if (apt.items && apt.items.length > 0) {
    const totalQty = apt.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    if (totalQty > 0) {
      params.set('quantity', String(totalQty));
    }
  }

  // Clean customer notes (strip raw consultation brackets)
  const cleanedNotes = cleanCustomerNotes(apt.notes);
  if (cleanedNotes) {
    params.set('notes', cleanedNotes);
  }

  // Link appointment ID for auto-completion on order save
  params.set('appointment_id', String(apt.id));
  // Back and Cancel on the form return to this appointment.
  params.set('return', `/dashboard/appointments?open=${apt.id}`);

  return `/dashboard/jobs/new?${params.toString()}`;
}

export interface OrderSourceJob {
  id: number;
  order_number?: string;
  notes?: string | null;
  measurement_id?: number | null;
  catalog_item_id?: number | null;
  service_id?: number | null;
  customer?: { id: number } | null;
  customer_id?: number | null;
  service?: { id: number } | null;
  catalog_item?: { id: number } | null;
  custom_order_data?: Record<string, unknown> | null;
  quantity?: number | null;
}

/**
 * Builds the URL to create a linked repeat or follow-up Job Order from an existing Job Order (Scenario D).
 * Preserves customer, service, catalog design, measurement profile, and standard size.
 */
export function newFollowUpOrderHref(job: OrderSourceJob): string {
  const params = new URLSearchParams();

  const customerId = job.customer?.id ?? job.customer_id;
  if (customerId) {
    params.set('customer_id', String(customerId));
  }

  const serviceId = job.service?.id ?? job.service_id;
  if (serviceId) {
    params.set('service_id', String(serviceId));
  }

  const catalogItemId = job.catalog_item?.id ?? job.catalog_item_id;
  if (catalogItemId) {
    params.set('catalog_item_id', String(catalogItemId));
  }

  if (job.measurement_id) {
    params.set('measurement_id', String(job.measurement_id));
  }

  const size = job.custom_order_data?.standard_size;
  if (typeof size === 'string' && size) {
    params.set('size', size);
  }

  if (job.quantity && job.quantity > 0) {
    params.set('quantity', String(job.quantity));
  }

  if (job.order_number) {
    params.set('notes', `Follow-up to Order #${job.order_number}`);
  }

  return `/dashboard/jobs/new?${params.toString()}`;
}

