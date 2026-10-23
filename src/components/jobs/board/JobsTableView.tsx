'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, Store, ShoppingBag, Clock, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { getDueStatus, type Job } from '../jobHelpers';
import { nextTask, shopStageOf, stageNote, SHOP_STAGES } from '../jobStage';

interface JobsTableViewProps {
  readonly jobs: Job[];
  readonly canSeeMoney: boolean;
  readonly canDecline: boolean;
  readonly busyId: number | null;
  readonly onAdvance: (job: Job) => void;
  readonly onDecline: (jobId: number) => void;
}

const formatShortDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

const STAGE_BADGE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  request: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  confirmed: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  making: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  ready: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  done: { bg: 'bg-sunken', text: 'text-ink-muted', border: 'border-line' },
};

/**
 * High-efficiency, operational table view for tailoring shop managers,
 * cutters, and senior tailors. Fast to scan, with clear columns, strong contrast,
 * and unambiguous status badges.
 */
export default function JobsTableView({
  jobs,
  canSeeMoney,
  canDecline,
  busyId,
  onAdvance,
  onDecline,
}: JobsTableViewProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-espresso/[0.08] bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-ink-muted mb-3">
          <Clock size={24} />
        </div>
        <h3 className="text-base font-bold text-ink">No matching job orders</h3>
        <p className="mt-1 max-w-md text-xs text-ink-muted leading-relaxed">
          No orders match the current filter selection. Try clearing filters or checking another order stage.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-espresso/[0.08] bg-white">
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm text-ink-body">
          <thead className="border-b border-espresso/[0.08] bg-sunken text-[13px] font-medium text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Order #</th>
              <th scope="col" className="px-4 py-3">Customer</th>
              <th scope="col" className="px-4 py-3">Garment and service</th>
              <th scope="col" className="px-3 py-3 text-center">Qty</th>
              <th scope="col" className="px-4 py-3">Stage</th>
              <th scope="col" className="px-4 py-3">Due date</th>
              {canSeeMoney && <th scope="col" className="px-4 py-3 text-right">Payment</th>}
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-espresso/[0.06]">
            {jobs.map((job) => {
              const due = getDueStatus(job.due_date, job.status);
              const next = nextTask(job);
              const stageKey = shopStageOf(job) ?? 'making';
              const stageConfig = SHOP_STAGES.find((s) => s.key === stageKey);
              const stageStyle = STAGE_BADGE_STYLE[stageKey] ?? STAGE_BADGE_STYLE.making;
              const note = stageNote(job);
              const itemName = job.catalog_item?.name ?? job.service?.name ?? 'Tailoring Order';
              const balance = Number.parseFloat(String(job.balance)) || 0;
              const total = Number.parseFloat(String(job.total_amount)) || 0;
              const isBusy = busyId === job.id;

              return (
                <tr
                  key={job.id}
                  className="transition-colors group hover:bg-espresso/[0.02]"
                >
                  {/* Order # & Channel */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="font-bold text-ink hover:text-taupe transition-colors flex items-center gap-1.5"
                      >
                        <span>{job.order_number ?? `ORD-${job.id}`}</span>
                        {job.is_rush && (
                          <span
                            title="Rush Order"
                            className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700"
                          >
                            <Flame size={10} /> RUSH
                          </span>
                        )}
                      </Link>
                      <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                        {job.intake_channel === 'online' ? (
                          <span className="flex items-center gap-0.5">
                            <ShoppingBag size={11} /> Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <Store size={11} /> Walk-in
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink truncate max-w-[160px]">
                          {job.customer?.name ?? 'Walk-in Customer'}
                        </span>
                        {job.customer?.suki_tag && (
                          <span className="shrink-0 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">
                            Suki
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-muted">
                        Received {formatShortDate(job.created_at)}
                      </span>
                    </div>
                  </td>

                  {/* Garment & Service */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink truncate max-w-[200px]" title={itemName}>
                        {itemName}
                      </span>
                      {job.service?.name && job.catalog_item?.name && (
                        <span className="text-[11px] text-ink-muted truncate max-w-[200px]">
                          {job.service.name}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-3 py-3.5 align-middle text-center">
                    <span className="inline-flex items-center justify-center rounded-md bg-sunken px-2 py-0.5 text-xs font-bold text-ink">
                      {job.quantity ?? 1}
                    </span>
                  </td>

                  {/* Stage & Status Note */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
                      >
                        {stageConfig?.label ?? 'In Progress'}
                      </span>
                      <span className="text-xs text-ink-muted truncate max-w-[170px]" title={note}>
                        {note}
                      </span>
                    </div>
                  </td>

                  {/* Due Date & Urgency */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`text-xs ${due ? 'font-bold text-danger' : 'text-ink-body'}`}>
                        {formatShortDate(job.due_date)}
                      </span>
                      {due ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            due.label === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <AlertTriangle size={10} /> {due.label}
                        </span>
                      ) : job.due_date ? (
                        <span className="text-[11px] text-ink-muted flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-emerald-600" /> On track
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Financials (if permitted) */}
                  {canSeeMoney && (
                    <td className="px-4 py-3.5 align-middle text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-ink">
                          ₱{total.toLocaleString()}
                        </span>
                        {balance > 0 ? (
                          <span className="text-xs font-semibold text-amber-700">
                            ₱{balance.toLocaleString()} due
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700">
                            Fully Paid
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Actions */}
                  <td className="px-4 py-3.5 align-middle text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {next && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onAdvance(job)}
                          className="h-8 rounded-lg bg-espresso px-2.5 text-xs font-bold text-white hover:bg-espresso/90 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          {isBusy ? 'Moving…' : `Next: ${next.label}`}
                        </button>
                      )}
                      {canDecline && job.status === 'pending' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onDecline(job.id)}
                          className="h-8 rounded-lg border border-line px-2 text-xs font-medium text-ink-muted hover:text-danger hover:border-danger/30 transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      )}
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
                        title="View job details"
                        aria-label={`View details for order ${job.order_number ?? job.id}`}
                      >
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (< 640px) */}
      <div className="sm:hidden divide-y divide-line">
        {jobs.map((job) => {
          const due = getDueStatus(job.due_date, job.status);
          const next = nextTask(job);
          const stageKey = shopStageOf(job) ?? 'making';
          const stageConfig = SHOP_STAGES.find((s) => s.key === stageKey);
          const stageStyle = STAGE_BADGE_STYLE[stageKey] ?? STAGE_BADGE_STYLE.making;
          const note = stageNote(job);
          const itemName = job.catalog_item?.name ?? job.service?.name ?? 'Tailoring Order';
          const balance = Number.parseFloat(String(job.balance)) || 0;
          const isBusy = busyId === job.id;

          return (
            <div key={job.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="text-base font-bold text-ink hover:text-taupe flex items-center gap-1.5"
                  >
                    <span>{job.order_number ?? `ORD-${job.id}`}</span>
                    {job.is_rush && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                        <Flame size={10} /> RUSH
                      </span>
                    )}
                  </Link>
                  <p className="font-semibold text-sm text-ink mt-0.5">
                    {job.customer?.name ?? 'Walk-in Customer'}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
                >
                  {stageConfig?.label ?? 'In Progress'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-ink-body bg-sunken/40 rounded-lg p-2.5">
                <div>
                  <span className="font-medium text-ink">{itemName}</span>
                  {(job.quantity ?? 1) > 1 && (
                    <span className="ml-1.5 font-bold text-ink-muted">× {job.quantity}</span>
                  )}
                  <p className="text-[11px] text-ink-muted mt-0.5">{note}</p>
                </div>

                {canSeeMoney && (
                  <div className="text-right">
                    {balance > 0 ? (
                      <span className="font-bold text-amber-700">₱{balance.toLocaleString()} due</span>
                    ) : (
                      <span className="font-bold text-emerald-700">Paid in full</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
                <span>
                  Due: {formatShortDate(job.due_date)}
                  {due && <span className="ml-1 font-bold text-danger">({due.label})</span>}
                </span>

                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-taupe hover:underline"
                >
                  <span>Details</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {(next || (canDecline && job.status === 'pending')) && (
                <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5">
                  {next ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onAdvance(job)}
                      className="h-10 flex-1 rounded-lg bg-espresso px-3 text-xs font-bold text-white hover:bg-espresso/90 disabled:opacity-50 transition-colors shadow-2xs"
                    >
                      {isBusy ? 'Moving…' : `Next Task: ${next.label}`}
                    </button>
                  ) : <span />}

                  {canDecline && job.status === 'pending' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onDecline(job.id)}
                      className="h-10 px-3 rounded-lg border border-line text-xs font-medium text-ink-muted hover:text-danger hover:border-danger/30 transition-colors"
                    >
                      Decline
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
