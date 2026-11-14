'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderData } from './useOrderData';
import { useOrderForm } from './useOrderForm';
import { orderMoney } from './orderMath';
import { partOptions, priceLines } from './orderLines';
import { clampDeposit } from '@/components/jobs/requirements';
import { isPhoneValid, pointsFor, type Area } from './orderPoints';
import { stepProblem } from './orderRules';
import { submitOrder, type PlacedOrder } from './orderSubmit';

export const STEPS = [
  { key: 'details', label: 'Details' },
  { key: 'order', label: 'Order' },
  { key: 'sizes', label: 'Sizes' },
  { key: 'style', label: 'Style' },
  { key: 'review', label: 'Review' },
] as const;

/**
 * Online order for one service (or one of its designs), as one customer-facing job order: Details → Order → Sizes →
 * Style → Review. Nothing is paid here; the shop confirms the price, then the deposit is paid from My Orders.
 */
export function useServiceOrder(storeId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const serviceId = params.get('service_id');
  const designParam = params.get('design_id');
  const { user, hydrated } = useAuthStore();

  // Sign in before filling anything out (same as booking).
  useEffect(() => {
    if (!hydrated || user) return;
    const q = params.toString();
    router.replace(`/login?redirect=${encodeURIComponent(`${pathname}${q ? `?${q}` : ''}`)}`);
  }, [hydrated, user, pathname, params, router]);

  const data = useOrderData(storeId, serviceId, Boolean(user));
  const f = useOrderForm(data, designParam ? Number(designParam) : null, user?.phone ?? '');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const service = data.service;
  const pricing = service?.pricing ?? [];
  const option = pricing.find((p) => p.id === f.pricingId) ?? (pricing.length === 1 ? pricing[0] : null);
  const area: Area | '' = (option?.covers as Area | undefined) ?? f.areaChoice;
  // Body measurements (typed, on file, or taken by the shop) vs sizes: a jersey or uniform service with a size chart
  // takes no body measurements but still needs every person's chart size.
  const measurementsNeeded = service?.order_requirements?.measurement_requirement !== 'none';
  const hasChart = (service?.size_chart_rows ?? []).length > 0 || Boolean(service?.size_chart_image_url);
  // A group order always takes a size for every person (from the chart, else the usual XS–3XL), whatever the service says.
  const sizesNeeded = measurementsNeeded || hasChart || f.mode === 'group';
  // A group sizes people by the shop's chart only when the shop has one and the customer chose "Standard sizes";
  // otherwise each person's measurements are typed in the table.
  const chartSizes = hasChart && f.groupSizing === 'standard';
  const design = data.designs.find((d) => d.id === f.designId) ?? null;
  const designPricing = (design as { pricing?: { mode: string; amount: number | null; extra_charge: number | null; needs_quote: boolean } | null } | null)?.pricing ?? null;
  const groupMin = (service?.capabilities ?? []).includes('bulk_orders') ? Math.max(2, service?.min_order_qty ?? 2) : 0;
  // A team / uniform service sold by the batch takes group orders only: no "one person" choice, the list starts at the minimum.
  const groupOnly = groupMin > 0 && (service?.service_types ?? []).length === 1 && service?.service_types?.[0] === 'bulk_sublimation';
  // A group may give each person their own option (Complete set for most, Blouse only for some) when the service has
  // two or more options that say what they cover. Then the part follows each person's option instead of being locked.
  const personOptions = f.mode === 'group' ? partOptions(pricing) : [];
  const perPerson = personOptions.length > 1;
  const areaLocked = Boolean(option?.covers) && !perPerson;
  const pieces = f.mode === 'group' ? f.roster.length : f.quantity;
  // The service's own list columns (Jersey Number, Position…) asked for every person on a group.
  const rosterColumns = (service?.roster_fields ?? []).map((c) => c.label?.trim()).filter((l): l is string => Boolean(l));
  const { startGroup } = f;
  useEffect(() => { if (groupOnly) startGroup(groupMin); }, [groupOnly, groupMin, startGroup]);

  const terms = data.terms;
  // Production starts only after at least half is paid (the server holds the same floor), so an older "pay at pick-up" reads as 50%.
  const policy = (terms?.payment_policy ?? service?.order_requirements?.payment_policy) === 'full' ? 'full' : 'deposit';
  const depositPercent = policy === 'full' ? 100 : clampDeposit(Number(terms?.payment_policy_percent ?? service?.order_requirements?.payment_policy_percent ?? 50));
  // A design picked as the style prices the order its own way: the service's price, its own price, the service's
  // price plus an extra charge, or a quotation (same as DesignPricing on the server).
  const quoted = service?.price_display === 'quotation' || Boolean(designPricing?.needs_quote);
  const lines = useMemo(() => priceLines({
    group: f.mode === 'group', roster: f.roster, quantity: f.quantity, pricing, option, service: service ?? null, design: designPricing, quoted,
  }), [f.mode, f.roster, f.quantity, pricing, option, service, designPricing, quoted]);
  const rushAvailable = terms ? terms.rush_available : Boolean(data.store && (data.store as { rush_available?: boolean }).rush_available !== false);
  const rushPercent = terms?.rush_fee_percent ?? Number((data.store as { rush_fee_percent?: number } | null)?.rush_fee_percent ?? 30);
  const rushPerPiece = terms?.rush_fee_mode === 'per_piece' ? terms.rush_fee_per_piece : null;
  const money = orderMoney({
    lines,
    fabricEach: f.material === 'own' ? Number(service?.own_fabric_deduction ?? 0) || 0 : 0,
    rushAsked: f.rush && rushAvailable, rushPerPiece, rushPercent, depositPercent, payFull: f.payFull || policy === 'full',
  });

  // What the shop's questions can be answered from (team, names, sizes, fabric): one context for every step.
  const answerContext = { area, areaLocked, optionLabel: option?.label ?? '', customerName: user?.name ?? '' };
  const ctx = {
    phoneOk: isPhoneValid(f.phone), branches: data.store?.branches ?? [], f, pricing, answerContext, area, areaLocked, measurementsNeeded, sizesNeeded, chartSizes, groupMin,
    points: pointsFor(area), service, gcash: data.methods.some((m) => m.kind === 'gcash'),
  };
  const problem = (n: number) => stepProblem(n, ctx);

  const submit = async () => {
    if (!service || !data.store || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      setPlaced(await submitOrder(data.store.slug, service.id, f, { area, areaLocked, answerContext, questions: service.custom_fields ?? [], measurementsNeeded, sizesNeeded, chartSizes, rush: f.rush && rushAvailable, payFull: f.payFull || policy === 'full' }));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Your order wasn't sent. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    router, user, storeId, data, f, step, setStep, problem, submit, submitting, error, placed,
    service, store: data.store, pricing, option, area, areaLocked, answerContext, measurementsNeeded, sizesNeeded, hasChart, chartSizes, groupMin, groupOnly, rosterColumns, pieces, design,
    policy, depositPercent, quoted, unitPrice: money.unitPrice, rushAvailable, rushPercent, rushPerPiece, money, personOptions, perPerson,
    isRepairOnly: !!service && (service.service_types ?? []).length === 1 && service.service_types![0] === 'alteration_repair',
  };
}

export type ServiceOrderState = ReturnType<typeof useServiceOrder>;
