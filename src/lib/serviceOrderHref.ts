/**
 * Where "Online Order" / "Place Order" on a service goes: repair-only
 * services keep their own repair request form; everything else opens the
 * online order wizard (/store/{shop}/order).
 */
export function serviceOrderHref(storeId: string, service: { id: number; service_types?: string[] | null }): string {
  const types = service.service_types ?? [];
  const repairOnly = types.length === 1 && types[0] === 'alteration_repair';
  return repairOnly
    ? `/store/${storeId}/repair-request?service_id=${service.id}`
    : `/store/${storeId}/order?service_id=${service.id}`;
}
