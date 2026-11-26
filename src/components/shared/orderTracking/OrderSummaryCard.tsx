import Link from 'next/link';
import { LinkIcon, Wrench } from 'lucide-react';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import CopyTrackingCode from './CopyTrackingCode';
import { getPhaseMeta } from './orderPhases';
import { safeHref } from '@/lib/safeHref';
import type { TrackedOrder } from '@/components/shared/OrderTrackingView';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

/** The order's own type, from the server's pipeline. 'Team Set' is this app's word for a bulk order (team list / uniforms). */
function orderType(order: TrackedOrder): string | null {
  if (order.pipeline === 'repair') return 'Repair';
  if (order.pipeline === 'bulk') return 'Team Set';
  return null;
}

function DataCell({ label, value, sub }: Readonly<{ label: string; value: string; sub?: string }>) {
  return (
    <div className="min-w-0">
      <p className="mobile-caption text-ink-faint">{label}</p>
      <p className="mobile-body-sm mt-1 font-semibold text-ink">{value}</p>
      {sub && <p className="mobile-caption mt-1 text-ink-muted">{sub}</p>}
    </div>
  );
}

/** The top card of an order: the shop, what this order is, the four numbers that matter, then where it stands. */
export default function OrderSummaryCard({ order }: Readonly<{ order: TrackedOrder }>) {
  const meta = getPhaseMeta(order.status);
  const StatusIcon = meta.Icon;
  const itemName = order.catalog_item_name ?? order.service_name ?? order.garment_category ?? 'Garment';
  const type = orderType(order);
  const pending = order.pending_payment_amount ?? 0;
  const hasMaterialNote = order.customer_material_status && order.customer_material_status !== 'safe';
  const hasReferences =
    (order.reference_images && order.reference_images.length > 0) || !!order.design_link || !!order.reference_link;

  // A request the shop has not priced yet (quotation-priced service): ₱0 here is "no price yet", not "free" or "unpaid".
  // A ₱0 free fix starts Confirmed, so it is never caught by this.
  const awaitingPrice = order.status === 'pending' && !order.quotation_flow?.quotation_status && Number(order.total_amount || 0) <= 0;

  return (
    <div className="card-soft p-4">
      <div className="flex items-start gap-3">
        <StoreLogoAvatar
          src={order.store?.logo_path}
          name={order.store?.name ?? 'Store'}
          className="h-12 w-12 rounded-full border border-line-strong shadow-none"
          textClassName="text-lg font-serif font-bold text-taupe-dark"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            {order.store?.slug ? (
              <Link href={`/store/${order.store.slug}`} className="mobile-h3 min-w-0 truncate text-ink hover:underline">
                {order.store.name}
              </Link>
            ) : (
              <p className="mobile-h3 text-ink">Store</p>
            )}
            <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>
              <StatusIcon size={12} /> {meta.label}
            </span>
          </div>

          <div className="mobile-caption mt-1 flex flex-wrap items-center gap-1.5 text-ink-faint">
            <span className="truncate">#{order.order_number}</span>
            {type && <span className="rounded-full bg-sunken px-2 py-0.5 font-semibold text-ink-muted">{type}</span>}
            {order.is_rush && <span className="rounded-full bg-danger/10 px-2 py-0.5 font-semibold text-danger">Rush</span>}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="mobile-body-md text-ink">
          {itemName}
          {(order.quantity ?? 1) > 1 && <span className="text-ink-muted"> × {order.quantity}</span>}
        </p>
        {order.repair_note && (
          <div className="mt-2 rounded-xl bg-sunken p-3">
            <div className="mobile-caption mb-1 flex items-center gap-2 text-ink-muted">
              <Wrench size={14} className="text-ink-faint" />
              Repair request
            </div>
            <p className="mobile-body-sm text-ink">&ldquo;{order.repair_note}&rdquo;</p>
          </div>
        )}
        {hasMaterialNote && (
          <p className="mobile-body-sm mt-2">
            <span className="font-semibold text-ink">Your material: </span>
            <span className="capitalize text-ink-muted">{order.customer_material_status}</span>
          </p>
        )}

        {hasReferences && (
          <div className="mt-3">
            <p className="mobile-caption mb-2 text-ink-muted">Design reference</p>
            {order.reference_images && order.reference_images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {order.reference_images.map((url, i) => (
                  <a
                    key={`${url}-${i}`}
                    href={safeHref(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View the full image"
                    className="block h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line-strong bg-sunken active:opacity-80"
                  >
                    <img src={url} alt={`Your reference image ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
            )}
            {order.design_link && (
              <a
                href={safeHref(order.design_link)}
                target="_blank"
                rel="noopener noreferrer"
                title={order.design_link}
                className="mobile-caption flex items-center gap-1.5 text-taupe hover:underline"
              >
                <LinkIcon size={13} className="shrink-0" />
                <span className="truncate">{order.design_link}</span>
              </a>
            )}
            {order.reference_link && (
              <a
                href={safeHref(order.reference_link)}
                target="_blank"
                rel="noopener noreferrer"
                title={order.reference_link}
                className="mobile-caption mt-1 flex items-center gap-1.5 text-taupe hover:underline"
              >
                <LinkIcon size={13} className="shrink-0" />
                <span className="truncate">{order.reference_link}</span>
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-4 md:grid-cols-4">
        {awaitingPrice ? (
          <>
            <DataCell label="Total" value="Waiting for the shop's price" />
            <DataCell label="Balance" value="—" sub="Nothing to pay yet" />
          </>
        ) : (
          <>
            <DataCell label="Total" value={peso(order.total_amount)} />
            <DataCell label="Balance" value={peso(order.balance)} sub={String(order.payment_status).replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
          </>
        )}
        <DataCell label="Placed" value={new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} sub={new Date(order.created_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })} />
        <DataCell
          label="Due"
          value={order.due_date ? new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          sub={order.estimated_ready_at ? `Ready ${new Date(order.estimated_ready_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : undefined}
        />
      </div>

      {pending > 0 && (
        <p className="mobile-caption mt-3 rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
          {peso(pending)} payment submitted — pending shop verification, not yet reflected in the balance
        </p>
      )}

      {order.tracking_code && <CopyTrackingCode code={order.tracking_code} />}
    </div>
  );
}
