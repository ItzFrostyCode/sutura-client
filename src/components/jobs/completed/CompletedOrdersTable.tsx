import React, { useEffect, useRef, useState } from 'react';
import { Check, Eye, MoreHorizontal, PackageCheck } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { GARMENT_CATEGORY_LABELS } from '../jobHelpers';
import type { CompletedOrder } from './useCompletedOrders';

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const peso = (value?: string | number | null) =>
  `₱${Number(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** What was made: the design, combo package or service, then its garment type. */
function productLines(order: CompletedOrder): { title: string; detail: string | null } {
  const category = order.garment_category ? GARMENT_CATEGORY_LABELS[order.garment_category] ?? null : null;
  const title = order.catalog_item?.name ?? order.service_package?.name ?? order.service?.name ?? category ?? 'Custom order';
  const qty = (order.quantity ?? 1) > 1 ? `${order.quantity} pcs` : null;
  const detail = [category !== title ? category : null, qty].filter(Boolean).join(' · ') || null;
  return { title, detail };
}

function CustomerAvatar({ order }: { readonly order: CompletedOrder }) {
  const [broken, setBroken] = useState(false);
  const name = order.customer?.name ?? 'Customer';
  const src = getMediaUrl(order.customer?.profile_picture);
  return (
    <div className="w-9 h-9 rounded-full bg-sunken border border-line overflow-hidden shrink-0 flex items-center justify-center">
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span className="text-sm font-bold text-taupe" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export function CompletedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
      <Check size={12} strokeWidth={3} />
      Completed
    </span>
  );
}

/**
 * The ⋯ button. The menu is position: fixed under the button, because the
 * table's sideways-scroll wrapper would clip it on the last rows. Closes on
 * outside click, Escape, or scroll.
 */
function RowMenu({ order, onView }: { readonly order: CompletedOrder; readonly onView: (o: CompletedOrder) => void }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (open) { setPos(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  };

  return (
    <div ref={ref} className="inline-block">
      <button
        type="button"
        aria-label={`Actions for ${order.order_number ?? 'order'}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="h-9 w-9 rounded-lg border border-line bg-surface text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taupe"
      >
        <MoreHorizontal size={16} />
      </button>
      {pos && (
        <div role="menu" style={{ top: pos.top, right: pos.right }} className="fixed z-30 min-w-40 bg-surface border border-line rounded-xl shadow-lg py-1 text-left">
          <button
            type="button"
            role="menuitem"
            autoFocus
            onClick={(e) => { e.stopPropagation(); setPos(null); onView(order); }}
            className="w-full px-3 py-2 text-sm text-ink-body hover:bg-canvas flex items-center gap-2 cursor-pointer"
          >
            <Eye size={14} /> View Details
          </button>
        </div>
      )}
    </div>
  );
}

interface TableProps {
  readonly orders: CompletedOrder[];
  readonly onView: (order: CompletedOrder) => void;
  readonly emptyMessage: string;
}

export default function CompletedOrdersTable({ orders, onView, emptyMessage }: TableProps) {
  if (orders.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <PackageCheck size={32} className="mx-auto mb-3 text-ink-faint" />
        <p className="text-sm text-ink-muted max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Phones: one card per order */}
      <ul className="md:hidden divide-y divide-line">
        {orders.map((order) => {
          const product = productLines(order);
          return (
            <li key={order.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CustomerAvatar order={order} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">#{order.order_number}</p>
                    <p className="text-xs text-ink-muted truncate">{order.customer?.name ?? 'Walk-in customer'}</p>
                  </div>
                </div>
                <RowMenu order={order} onView={onView} />
              </div>
              <p className="text-sm text-ink-body truncate">{product.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-muted">
                <span>Completed {formatDate(order.completed_at)}</span>
                <span className="font-bold text-ink tabular-nums">{peso(order.total_amount)}</span>
                <CompletedBadge />
              </div>
            </li>
          );
        })}
      </ul>

      {/* md and up: the table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-220 text-left border-collapse">
          <thead>
            <tr className="bg-canvas/50 border-b border-line text-[11px] uppercase tracking-wider text-ink-muted font-bold">
              <th scope="col" className="px-4 py-3">Order ID</th>
              <th scope="col" className="px-4 py-3">Customer</th>
              <th scope="col" className="px-4 py-3">Product / Service</th>
              <th scope="col" className="px-4 py-3">Order Date</th>
              <th scope="col" className="px-4 py-3">Completion Date</th>
              <th scope="col" className="px-4 py-3 text-right">Price</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((order) => {
              const product = productLines(order);
              return (
                <tr key={order.id} className="hover:bg-canvas/60 transition-colors">
                  <td className="px-4 py-3.5 text-sm font-bold text-ink whitespace-nowrap">#{order.order_number}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <CustomerAvatar order={order} />
                      <span className="text-sm font-semibold text-ink truncate max-w-44">{order.customer?.name ?? 'Walk-in customer'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-ink-body truncate max-w-56">{product.title}</p>
                    {product.detail && <p className="text-[11px] text-ink-muted truncate max-w-56">{product.detail}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-ink-body whitespace-nowrap">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3.5 text-sm text-ink-body whitespace-nowrap">{formatDate(order.completed_at)}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-ink text-right tabular-nums whitespace-nowrap">{peso(order.total_amount)}</td>
                  <td className="px-4 py-3.5"><CompletedBadge /></td>
                  <td className="px-4 py-3.5 text-right"><RowMenu order={order} onView={onView} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
