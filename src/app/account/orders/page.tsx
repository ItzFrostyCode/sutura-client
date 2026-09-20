'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Store, Shirt, CalendarDays, Wallet, Package, Eye,
  Clock, Palette, Ruler, Scissors, Wrench, Sparkles, Flag, AlertCircle, Ban, PauseCircle,
} from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';

interface MyOrder {
  id: number;
  order_number: string;
  tracking_code: string;
  status: string;
  garment_category: string | null;
  catalog_item_name: string | null;
  service_name: string | null;
  is_rush: boolean;
  due_date: string | null;
  total_amount: number;
  balance: number;
  payment_status: string;
  created_at: string;
  shop: { name: string; slug: string; logo_path: string | null } | null;
}

// Same JobOrder::STATUSES pipeline as /track/[code]'s buildStages(), just
// flattened to a single icon+label+tone per status for a compact list
// badge — a full 10-stage stepper per card would be unreadable with more
// than a couple of orders. Tapping a card goes to its own detail page for
// the full stepper.
const STATUS_META: Record<string, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: 'Pending', Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  design: { label: 'Design', Icon: Palette, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  pattern_making: { label: 'Pattern Making', Icon: Ruler, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  mass_cutting_printing: { label: 'Cutting & Printing', Icon: Scissors, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  cutting: { label: 'Cutting', Icon: Scissors, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  sewing: { label: 'Sewing', Icon: Shirt, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  ready_for_fitting: { label: 'Ready for Fitting', Icon: Ruler, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  final_adjustments: { label: 'Final Adjustments', Icon: Wrench, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  qc_ironing: { label: 'QC & Ironing', Icon: Sparkles, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  ready_for_pickup: { label: 'Ready for Pickup', Icon: Package, tone: 'text-sage bg-sage/10 border-sage/20' },
  completed: { label: 'Completed', Icon: Flag, tone: 'text-sage bg-sage/10 border-sage/20' },
  cancelled: { label: 'Cancelled', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
  rejected: { label: 'Rejected', Icon: AlertCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  on_hold: { label: 'On Hold', Icon: PauseCircle, tone: 'text-ink-muted bg-sunken border-line' },
};

// Real tailoring pipeline groups, not Shopee's shipping-oriented ones
// (there's no "To Ship"/"To Receive" here — no logistics/delivery in this
// system's scope) — the actual real-world phases a bespoke order goes
// through: still being made, waiting at the counter, done, or stopped.
const IN_PRODUCTION = new Set([
  'pending', 'design', 'pattern_making', 'mass_cutting_printing', 'cutting',
  'sewing', 'ready_for_fitting', 'final_adjustments', 'qc_ironing', 'on_hold',
]);

const TABS: { key: string; label: string; match: (status: string) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'production', label: 'In Production', match: (s) => IN_PRODUCTION.has(s) },
  { key: 'pickup', label: 'Ready for Pickup', match: (s) => s === 'ready_for_pickup' },
  { key: 'completed', label: 'Completed', match: (s) => s === 'completed' },
  { key: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' || s === 'rejected' },
];

export default function MyOrdersPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-sm text-ink-muted">Loading…</div>}>
      <MyOrdersPageContent />
    </Suspense>
  );
}

function MyOrdersPageContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'all');

  useEffect(() => {
    setLoading(true);
    api.get('/my-orders', { params: { per_page: 100 } })
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const activeMatch = TABS.find((t) => t.key === activeTab)?.match ?? TABS[0].match;
  const filteredOrders = useMemo(() => orders.filter((o) => activeMatch(o.status)), [orders, activeMatch]);

  return (
    <div>
      <AccountHeader title="My Job Orders" backHref="/account" />

      <div className="flex items-center gap-1 mb-5 border-b border-line overflow-x-auto">
        {TABS.map((tab) => {
          const count = orders.filter((o) => tab.match(o.status)).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 whitespace-nowrap px-4 py-[5px] text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-taupe text-taupe'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label} {!loading && <span className="text-ink-faint font-normal">({count})</span>}
            </button>
          );
        })}
      </div>

      {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading your orders…</div>}

      {!loading && filteredOrders.length === 0 && (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center">
          <Package size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-body mb-1">
            {orders.length === 0 ? 'No orders yet' : 'Nothing in this tab yet'}
          </p>
          <p className="text-xs text-ink-muted mb-5">
            {orders.length === 0 ? 'Once you book a fitting or place an order, it’ll show up here.' : 'Try a different tab.'}
          </p>
          {orders.length === 0 && (
            <Link href="/shops" className="text-sm font-semibold text-taupe hover:text-taupe-hover">
              Browse Shops →
            </Link>
          )}
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const meta = STATUS_META[order.status] ?? STATUS_META.pending;
            const StatusIcon = meta.Icon;
            const itemName = order.catalog_item_name ?? order.service_name ?? order.garment_category ?? 'Garment';
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex gap-3 bg-surface border border-line rounded-2xl p-4 hover:border-line-strong transition-colors"
              >
                <div className="w-[52px] h-[52px] rounded-xl bg-sunken overflow-hidden relative shrink-0 border-[0.5px] border-line-strong">
                  {order.shop?.logo_path ? (
                    <Image src={getMediaUrl(order.shop.logo_path)} alt="" fill unoptimized className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store size={18} className="text-ink-faint" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-ink-muted truncate">{order.shop?.name ?? 'Shop'}</span>
                    {order.is_rush && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20 shrink-0">
                        Rush
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-ink truncate flex-1">{itemName}</p>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${meta.tone}`}>
                      <StatusIcon size={12} /> {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-ink-muted mb-3">
                    <span className="truncate">{order.order_number}</span>
                    {order.due_date && (
                      <span className="flex items-center gap-1 shrink-0">
                        <CalendarDays size={11} />
                        Due {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-line">
                    <div className="flex items-center gap-1 min-w-0 text-xs text-ink-muted whitespace-nowrap overflow-hidden">
                      <Wallet size={11} className="shrink-0" />
                      <span className="truncate">₱{order.balance.toLocaleString()} balance of ₱{order.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-sunken flex items-center justify-center shrink-0 text-ink-muted">
                      <Eye size={13} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
