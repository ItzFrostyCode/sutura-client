'use client';

import React from 'react';
import {
  CreditCard, Check, X, ExternalLink, Calendar, ShoppingBag,
  CheckCircle2, Banknote, Smartphone, Scissors, Loader2, XCircle, Receipt,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePayments, Tab } from '@/components/payments/usePayments';
import SearchInput from '@/components/shared/SearchInput';

const METHOD_ICON: Record<string, React.ReactNode> = {
  cash:          <Banknote size={14} className="text-emerald-600" />,
  gcash:         <Smartphone size={14} className="text-blue-500" />,
  bank_transfer: <CreditCard size={14} className="text-violet-500" />,
};

const getPaymentStatusBadgeClass = (paymentStatus: string): string => {
  if (paymentStatus === 'paid') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (paymentStatus === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-600 border-red-200';
};

const getOrderStatusBadgeClass = (status: string): string => {
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'shipped') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-[#F0EAE3] text-[#827A73] border-[#EBE6E0]';
};

const humanizeStatus = (status: string): string =>
  status.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function PaymentQueuePage() {
  const {
    activeTab,
    setActiveTab,
    receipts,
    selectedReceipt,
    setSelectedReceipt,
    processingId,
    receiptsLoading,
    jobBalances,
    balancesLoading,
    balanceSearch,
    setBalanceSearch,
    logPaymentJob,
    setLogPaymentJob,
    payAmount,
    setPayAmount,
    payMethod,
    setPayMethod,
    payNotes,
    setPayNotes,
    payReference,
    setPayReference,
    payReceiptPath,
    setPayReceiptPath,
    payReceiptUploading,
    handlePayReceiptUpload,
    paySubmitting,
    catalogOrders,
    catalogLoading,
    handleVerify,
    handleLogPayment,
    filteredBalances,
  } = usePayments();

  const TAB_DEFS: { id: Tab; label: string; count?: number }[] = [
    { id: 'receipts',       label: 'GCash & Bank Receipts',  count: receipts.length },
    { id: 'job_balances',   label: 'Outstanding Balances',   count: jobBalances.length },
    { id: 'catalog_orders', label: 'Catalog Orders' },
  ];

  // ── TAB 1: Digital Receipts ───────────────────────────────────────
  const renderReceiptsTab = () => {
    if (receiptsLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-[#9A8073]" size={28} />
        </div>
      );
    }

    if (receipts.length === 0) {
      return (
        <div className="text-center py-20">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#7A8B76] mb-3" />
          <h3 className="font-semibold text-[#2D2A26]">Payment Queue Clean!</h3>
          <p className="text-sm text-[#827A73] mt-1">No pending GCash or Bank receipts to verify.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2 divide-y divide-[#EBE6E0]">
          {receipts.map(item => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => setSelectedReceipt(item)}
              className={`w-full flex items-center justify-between p-4 text-left hover:bg-[#FAF6F3] transition-colors ${
                selectedReceipt?.id === item.id && selectedReceipt.type === item.type ? 'bg-[#F0EAE3]' : ''
              }`}
            >
              <div className="flex gap-3 items-center min-w-0">
                <div className={`p-2.5 rounded-xl ${
                  item.type === 'appointment' ? 'bg-[#7A8B76]/10 text-[#7A8B76]' : 'bg-[#9A8073]/10 text-[#9A8073]'
                }`}>
                  {item.type === 'appointment' ? <Calendar size={18} /> : <ShoppingBag size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#2D2A26] truncate">{item.itemName}</p>
                  <p className="text-xs text-[#827A73] mt-0.5">
                    {item.customer_name} · <span className="capitalize">{item.payment_method.replaceAll('_', ' ')}</span> · <span className="font-mono">{item.payment_reference}</span>
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="font-bold text-sm">₱{Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-[#A8A19A] mt-0.5">{new Date(item.date).toLocaleDateString('en-PH')}</p>
              </div>
            </button>
          ))}
        </div>
        {/* Detail panel */}
        <div className="lg:col-span-1 border-l border-[#EBE6E0]">
          {selectedReceipt ? (
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs text-[#A8A19A] uppercase font-semibold mb-1">{selectedReceipt.type.replaceAll('_', ' ')}</p>
                <h3 className="font-bold text-[#2D2A26]">{selectedReceipt.itemName}</h3>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  ['Customer', selectedReceipt.customer_name],
                  ['Amount', `₱${Number(selectedReceipt.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`],
                  ['Method', selectedReceipt.payment_method.replaceAll('_', ' ')],
                  ['Reference', selectedReceipt.payment_reference],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-[#827A73]">{k}</span>
                    <span className="font-medium text-[#2D2A26]">{v}</span>
                  </div>
                ))}
              </div>
              {selectedReceipt.payment_receipt_path ? (
                <div className="relative aspect-3/4 rounded-xl overflow-hidden border border-[#EBE6E0] bg-zinc-50">
                  <Image src={selectedReceipt.payment_receipt_path} alt="Receipt" fill className="object-contain" unoptimized />
                  <a href={selectedReceipt.payment_receipt_path} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-lg text-[10px] flex items-center gap-1">
                    <ExternalLink size={11} /> Open
                  </a>
                </div>
              ) : (
                <div className="aspect-3/4 rounded-xl border-2 border-dashed border-[#EBE6E0] bg-[#FAF6F3]/60 flex flex-col items-center justify-center gap-2 text-[#A8A19A]">
                  <Receipt size={28} className="text-[#C5BDBA]" />
                  <p className="text-xs font-medium">No receipt screenshot uploaded</p>
                  <p className="text-[10px] text-[#C5BDBA] px-6 text-center">The customer&apos;s GCash/bank transfer proof would appear here</p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleVerify(selectedReceipt, 'paid')}
                  disabled={processingId !== null}
                  className="flex-1 bg-[#7A8B76] hover:bg-[#7A8B76]/90 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  {processingId === selectedReceipt.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Approve
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Reject this receipt? Use this when the reference number or screenshot looks fake or doesn\'t match — the customer will need to resubmit proof of payment.')) {
                      handleVerify(selectedReceipt, 'rejected');
                    }
                  }}
                  disabled={processingId !== null}
                  className="flex-1 border border-[#B26959]/30 text-[#B26959] hover:bg-[#B26959]/10 disabled:opacity-50 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <XCircle size={15} />
                  Reject
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-3 border border-[#EBE6E0] hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center h-full flex flex-col items-center justify-center bg-zinc-50/50">
              <div className="w-16 h-16 bg-white border border-[#EBE6E0] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Receipt className="text-[#C5BDBA]" size={28} strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-[#2D2A26]">No Receipt Selected</p>
              <p className="text-sm text-[#827A73] mt-1 max-w-[220px]">
                Choose a payment from the queue to review the proof and approve it.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── TAB 2: Job Balances ────────────────────────────────────────────
  const renderJobBalancesTab = () => {
    if (balancesLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-[#9A8073]" size={28} />
        </div>
      );
    }

    if (filteredBalances.length === 0) {
      return (
        <div className="text-center py-16">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#7A8B76] mb-3" />
          <p className="font-semibold text-[#2D2A26]">No Outstanding Balances</p>
          <p className="text-sm text-[#827A73] mt-1">All active job orders have been paid in full.</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-[#EBE6E0]">
        {/* Header row — desktop/tablet only, the grid columns below only make sense at that width */}
        <div className="hidden md:grid grid-cols-12 px-5 py-2.5 text-[10px] font-semibold text-[#A8A19A] uppercase tracking-wider bg-[#FAF6F3]">
          <div className="col-span-3">Order</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-2 text-right">Balance Due</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        {filteredBalances.map(job => {
          // applyDiscount reduces balance directly, not total_amount — without
          // subtracting it here too, a discounted job's "Paid" figure would
          // silently include the discount as if it were cash received.
          const amountPaid = job.total_amount - job.balance - (job.discount_amount || 0);
          const psConfig = {
            unpaid:  { label: 'Unpaid',   cls: 'bg-red-50 text-red-600 border-red-200' },
            partial: { label: 'Partial',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
          }[job.payment_status as 'unpaid' | 'partial'] ?? { label: job.payment_status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };

          return (
            <React.Fragment key={job.id}>
              {/* Mobile card */}
              <div className="md:hidden px-5 py-4 space-y-2.5 hover:bg-[#FAF6F3] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/dashboard/jobs/${job.id}`} className="font-mono text-sm font-semibold text-[#9A8073] hover:underline">
                      {job.order_number}
                    </Link>
                    <p className="text-[10px] text-[#A8A19A] mt-0.5 capitalize">{job.status.replaceAll('_', ' ')}</p>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase shrink-0 ${psConfig.cls}`}>{psConfig.label}</span>
                </div>
                <p className="text-sm text-[#2D2A26]">{job.customer?.name || <span className="text-[#A8A19A] italic">Walk-in</span>}</p>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-[#524A44]">Total: <span className="font-medium text-[#2D2A26]">₱{job.total_amount.toFixed(2)}</span></p>
                    <p className="text-[10px] text-[#7A8B76]">Paid: ₱{amountPaid.toFixed(2)}</p>
                  </div>
                  <p className="text-base font-bold text-[#B26959]">₱{job.balance.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => { setLogPaymentJob(job); setPayAmount(String(job.balance)); }}
                  className="w-full text-xs font-semibold px-3 py-2 bg-taupe hover:bg-taupe/90 text-white rounded-lg transition-colors"
                >
                  Log Payment
                </button>
              </div>

              {/* Desktop/tablet row */}
              <div className="hidden md:grid grid-cols-12 px-5 py-3.5 items-center hover:bg-[#FAF6F3] transition-colors">
                <div className="col-span-3">
                  <Link href={`/dashboard/jobs/${job.id}`} className="font-mono text-sm font-semibold text-[#9A8073] hover:underline">
                    {job.order_number}
                  </Link>
                  <p className="text-[10px] text-[#A8A19A] mt-0.5 capitalize">{job.status.replaceAll('_', ' ')}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-[#2D2A26]">{job.customer?.name || <span className="text-[#A8A19A] italic">Walk-in</span>}</p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm font-medium text-[#2D2A26]">₱{job.total_amount.toFixed(2)}</p>
                  <p className="text-[10px] text-[#7A8B76]">Paid: ₱{amountPaid.toFixed(2)}</p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-base font-bold text-[#B26959]">₱{job.balance.toFixed(2)}</p>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase ${psConfig.cls}`}>{psConfig.label}</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => { setLogPaymentJob(job); setPayAmount(String(job.balance)); }}
                    className="text-xs font-semibold px-3 py-1.5 bg-taupe hover:bg-taupe/90 text-white rounded-lg transition-colors"
                  >
                    Log Payment
                  </button>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ── TAB 3: Catalog Orders ──────────────────────────────────────────
  const renderCatalogOrdersTab = () => {
    if (catalogLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-[#9A8073]" size={28} />
        </div>
      );
    }

    if (catalogOrders.length === 0) {
      return (
        <div className="text-center py-16">
          <ShoppingBag className="mx-auto h-10 w-10 text-[#C5BDBA] mb-3" />
          <p className="font-semibold text-[#2D2A26]">No Catalog Orders</p>
          <p className="text-sm text-[#827A73] mt-1">No ready-to-wear orders have been placed yet.</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-[#EBE6E0]">
        <div className="hidden md:grid grid-cols-12 gap-x-3 px-5 py-2.5 text-[10px] font-semibold text-[#A8A19A] uppercase tracking-wider bg-[#FAF6F3]">
          <div className="col-span-3">Item</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2">Payment Status</div>
          <div className="col-span-2">Order Status</div>
          <div className="col-span-1" />
        </div>
        {catalogOrders.map(ord => (
          <Link
            key={ord.id}
            href={`/dashboard/orders?order=${ord.id}`}
            className="block md:hidden px-5 py-4 space-y-2 hover:bg-[#FAF6F3] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{ord.catalog_item?.name || 'Catalog Item'}</p>
                <p className="text-[10px] text-[#A8A19A]">{new Date(ord.created_at).toLocaleDateString('en-PH')}</p>
              </div>
              <p className="text-sm font-bold text-[#2D2A26] shrink-0">₱{Number(ord.total_amount).toFixed(2)}</p>
            </div>
            <p className="text-sm text-[#2D2A26]">{ord.customer?.name || <span className="italic text-[#A8A19A]">Guest</span>}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                {METHOD_ICON[ord.payment_method] ?? <CreditCard size={13} />}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${getPaymentStatusBadgeClass(ord.payment_status)}`}>
                  {humanizeStatus(ord.payment_status)}
                </span>
              </span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${getOrderStatusBadgeClass(ord.status)}`}>
                {humanizeStatus(ord.status)}
              </span>
            </div>
          </Link>
        ))}
        {catalogOrders.map(ord => (
          <Link
            key={`desktop-${ord.id}`}
            href={`/dashboard/orders?order=${ord.id}`}
            className="hidden md:grid grid-cols-12 gap-x-3 px-5 py-3.5 items-center hover:bg-[#FAF6F3] transition-colors group"
          >
            <div className="col-span-3">
              <p className="text-sm font-semibold text-[#2D2A26] truncate">{ord.catalog_item?.name || 'Catalog Item'}</p>
              <p className="text-[10px] text-[#A8A19A]">{new Date(ord.created_at).toLocaleDateString('en-PH')}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-[#2D2A26] truncate">{ord.customer?.name || <span className="italic text-[#A8A19A]">Guest</span>}</p>
            </div>
            <div className="col-span-2 text-right">
              <p className="text-sm font-bold text-[#2D2A26]">₱{Number(ord.total_amount).toFixed(2)}</p>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-1.5">
                {METHOD_ICON[ord.payment_method] ?? <CreditCard size={13} />}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${getPaymentStatusBadgeClass(ord.payment_status)}`}>
                  {humanizeStatus(ord.payment_status)}
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${getOrderStatusBadgeClass(ord.status)}`}>
                {humanizeStatus(ord.status)}
              </span>
            </div>
            <div className="col-span-1 flex justify-end">
              <ExternalLink size={14} className="text-[#C5BDBA] group-hover:text-taupe transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-[#2D2A26]">
      <div>
        <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Collect Payments</h1>
        <p className="text-sm text-[#827A73] mt-1">Verify GCash &amp; bank receipts, collect job balances, and manage catalog order payments.</p>
      </div>

      {/* Tabs — wraps to a second line on narrow screens instead of
          scrolling sideways; only 3 tabs, so wrapping never looks cramped. */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
        <div className="flex flex-wrap border-b border-[#EBE6E0]">
          {TAB_DEFS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === t.id
                  ? 'border-taupe text-taupe'
                  : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  t.count > 0
                    ? 'bg-[#B26959]/10 text-[#B26959]'
                    : 'bg-[#F0EAE3] text-[#A8A19A]'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'receipts' && renderReceiptsTab()}
        {activeTab === 'job_balances' && (
          <div>
            <div className="p-4 border-b border-[#EBE6E0] flex items-center gap-3">
              <SearchInput value={balanceSearch} onChange={setBalanceSearch} placeholder="Search order # or customer..." className="flex-1 max-w-xs" />
              <span className="text-xs text-[#A8A19A]">{filteredBalances.length} orders with balance</span>
            </div>
            {renderJobBalancesTab()}
          </div>
        )}
        {activeTab === 'catalog_orders' && (
          <div>
            <div className="px-5 py-3 border-b border-[#EBE6E0] bg-[#FAF6F3] text-xs text-[#827A73]">
              Payment status only. To mark an order ready, cancel it, or manage fulfillment, go to{' '}
              <Link href="/dashboard/orders" className="font-semibold text-taupe hover:underline">
                Ready-to-Wear Orders
              </Link>.
            </div>
            {renderCatalogOrdersTab()}
          </div>
        )}
      </div>

      {/* ── Log Payment Modal ──────────────────────────────────────────────── */}
      {logPaymentJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EBE6E0] w-full max-w-md">
            <div className="p-6 border-b border-[#EBE6E0]">
              <h3 className="font-bold text-[#2D2A26] text-lg">Log Payment</h3>
              <p className="text-sm text-[#827A73] mt-0.5">
                {logPaymentJob.order_number} · {logPaymentJob.customer?.name || 'Walk-in'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-[#A8A19A] mb-1">Balance Due</p>
                <p className="text-2xl font-bold text-[#B26959]">₱{logPaymentJob.balance.toFixed(2)}</p>
              </div>
              <div>
                <label htmlFor="pay-amount-input" className="text-xs font-medium text-[#524A44] block mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]">₱</span>
                  <input
                    id="pay-amount-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={logPaymentJob.balance}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="w-full pl-7 pr-4 py-2.5 border border-[#D1C7BD] rounded-lg focus:outline-none focus:border-taupe text-[#2D2A26] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="pay-method-select" className="text-xs font-medium text-[#524A44] block mb-1">Payment Method</label>
                <select
                  id="pay-method-select"
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#D1C7BD] rounded-lg focus:outline-none focus:border-taupe text-[#2D2A26] text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              {(payMethod === 'gcash' || payMethod === 'bank_transfer') && (
                <div>
                  <label htmlFor="pay-reference-input" className="text-xs font-medium text-[#524A44] block mb-1">
                    {payMethod === 'gcash' ? 'GCash Reference #' : 'Bank Transfer Reference #'}
                  </label>
                  <input
                    id="pay-reference-input"
                    type="text"
                    value={payReference}
                    onChange={e => setPayReference(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2.5 border border-[#D1C7BD] rounded-lg focus:outline-none focus:border-taupe text-sm text-[#2D2A26]"
                  />
                </div>
              )}
              {(payMethod === 'gcash' || payMethod === 'bank_transfer') && (
                <div>
                  <label htmlFor="pay-receipt-upload" className="text-xs font-medium text-[#524A44] block mb-1">
                    Receipt Screenshot (optional)
                  </label>
                  {payReceiptPath ? (
                    <div className="flex items-center justify-between px-3 py-2.5 border border-[#D1C7BD] rounded-lg text-sm">
                      <span className="flex items-center gap-1.5 text-[#7A8B76] font-medium"><Check size={14} /> Screenshot attached</span>
                      <button type="button" onClick={() => setPayReceiptPath('')} className="text-[#B26959] text-xs font-medium hover:underline">Remove</button>
                    </div>
                  ) : (
                    <label
                      htmlFor="pay-receipt-upload"
                      className="flex items-center justify-center gap-2 px-3 py-3 border border-dashed border-[#D1C7BD] rounded-lg text-sm text-[#827A73] cursor-pointer hover:bg-[#FAF6F3] transition-colors"
                    >
                      {payReceiptUploading ? <Loader2 size={15} className="animate-spin" /> : <Receipt size={15} />}
                      {payReceiptUploading ? 'Uploading…' : 'Attach GCash/bank screenshot'}
                      <input
                        id="pay-receipt-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={payReceiptUploading}
                        onChange={e => { if (e.target.files?.[0]) handlePayReceiptUpload(e.target.files[0]); }}
                      />
                    </label>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="pay-notes-input" className="text-xs font-medium text-[#524A44] block mb-1">Notes (optional)</label>
                <input
                  id="pay-notes-input"
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="Internal notes..."
                  className="w-full px-3 py-2.5 border border-[#D1C7BD] rounded-lg focus:outline-none focus:border-taupe text-sm text-[#2D2A26]"
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => { setLogPaymentJob(null); setPayAmount(''); setPayNotes(''); setPayReference(''); setPayReceiptPath(''); }}
                className="flex-1 py-2.5 border border-[#EBE6E0] rounded-xl text-sm font-medium text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogPayment}
                disabled={paySubmitting || !payAmount || Number.parseFloat(payAmount) <= 0}
                className="flex-1 bg-taupe hover:bg-taupe/90 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {paySubmitting ? <Loader2 size={15} className="animate-spin" /> : <Scissors size={15} />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
