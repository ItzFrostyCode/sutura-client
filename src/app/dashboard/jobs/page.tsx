'use client';

import React, { Suspense, useState } from 'react';
import {
  Plus, Store, ShoppingBag, AlertCircle, Truck, Scissors, Zap, Trash2, X,
  AlertTriangle, Layers, Palette, Ruler, Printer,
  Shirt, UserCheck, CheckCircle2, CheckCheck, Pause, SlidersHorizontal, type LucideIcon
} from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import JobRejectModal from '@/components/jobs/JobRejectModal';
import JobKanbanBoard from '@/components/jobs/JobKanbanBoard';
import QuickJobModal from '@/components/jobs/QuickJobModal';
import JobTrashModal from '@/components/jobs/JobTrashModal';
import { useJobs } from '@/components/jobs/useJobs';
import { GARMENT_CATEGORY_LABELS } from '@/components/jobs/jobHelpers';
import { useAuthStore } from '@/store/useAuthStore';

interface StageIconFilter {
  id: string;
  title: string;
  icon: LucideIcon;
  dotColor?: string | null;
  iconColor?: string;
}

export default function JobOrdersPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-ink-faint">Loading…</div>}>
      <JobOrdersPageContent />
    </Suspense>
  );
}

function JobOrdersPageContent() {
  const { shop } = useAuthStore();
  const {
    jobs,
    loading,
    search,
    setSearch,
    tab,
    setTab,
    rejectModalOpen,
    setRejectModalOpen,
    actionLoadingId,
    updateJobStatus,
    handleApproveJob,
    openRejectModal,
    handleConfirmReject,
    activeColumns,
    groupedJobs,
    onHoldJobs,
    walkInCount,
    onlineCount,
    pendingReviewCount,
    fetchJobs,
    overdueOnly,
    garmentCategoryFilter,
  } = useJobs();

  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [highlightedJobId] = useState<number | null>(null);

  // All 11 configurable pipeline stages
  const DEFAULT_NOTIF_PREFS: Record<string, boolean> = {
    pending: true,
    design: true,
    pattern_making: true,
    mass_cutting_printing: true,
    cutting: true,
    sewing: true,
    ready_for_fitting: true,
    qc_ironing: true,
    ready_for_pickup: true,
    completed: true,
    on_hold: true,
  };

  // User configurable notification dot preferences (persisted in localStorage using lazy initialization)
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sutura_job_stage_notif_prefs');
        if (saved) return { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_NOTIF_PREFS;
  });

  const toggleNotifPref = (stageKey: string) => {
    setNotifPrefs(prev => {
      const next = { ...prev, [stageKey]: !prev[stageKey] };
      try {
        localStorage.setItem('sutura_job_stage_notif_prefs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Icon-only stage filter definitions with milestone notification indicator dots for ALL stages
  const STAGE_ICON_FILTERS: StageIconFilter[] = [
    { id: 'all', title: 'All Stages', icon: Layers },
    {
      id: 'pending',
      title: 'Pending Review',
      icon: AlertTriangle,
      dotColor: (notifPrefs.pending && pendingReviewCount > 0) ? 'bg-amber-500 ring-white' : null,
      iconColor: (notifPrefs.pending && pendingReviewCount > 0) ? 'text-amber-600' : ''
    },
    {
      id: 'design',
      title: 'Design',
      icon: Palette,
      dotColor: (notifPrefs.design && (groupedJobs['design']?.length || 0) > 0) ? 'bg-sky-500 ring-white' : null,
      iconColor: (notifPrefs.design && (groupedJobs['design']?.length || 0) > 0) ? 'text-sky-600' : ''
    },
    {
      id: 'pattern_making',
      title: 'Pattern Making',
      icon: Ruler,
      dotColor: (notifPrefs.pattern_making && (groupedJobs['pattern_making']?.length || 0) > 0) ? 'bg-indigo-500 ring-white' : null,
      iconColor: (notifPrefs.pattern_making && (groupedJobs['pattern_making']?.length || 0) > 0) ? 'text-indigo-600' : ''
    },
    {
      id: 'mass_cutting_printing',
      title: 'Mass Cutting & Printing',
      icon: Printer,
      dotColor: (notifPrefs.mass_cutting_printing && (groupedJobs['mass_cutting_printing']?.length || 0) > 0) ? 'bg-cyan-500 ring-white' : null,
      iconColor: (notifPrefs.mass_cutting_printing && (groupedJobs['mass_cutting_printing']?.length || 0) > 0) ? 'text-cyan-600' : ''
    },
    {
      id: 'cutting',
      title: 'Cutting',
      icon: Scissors,
      dotColor: (notifPrefs.cutting && (groupedJobs['cutting']?.length || 0) > 0) ? 'bg-amber-600 ring-white' : null,
      iconColor: (notifPrefs.cutting && (groupedJobs['cutting']?.length || 0) > 0) ? 'text-amber-600' : ''
    },
    {
      id: 'sewing',
      title: 'Sewing / Assembly',
      icon: Shirt,
      dotColor: (notifPrefs.sewing && (groupedJobs['sewing']?.length || 0) > 0) ? 'bg-teal-600 ring-white' : null,
      iconColor: (notifPrefs.sewing && (groupedJobs['sewing']?.length || 0) > 0) ? 'text-teal-600' : ''
    },
    {
      id: 'ready_for_fitting',
      title: 'Ready for Fitting',
      icon: UserCheck,
      dotColor: (notifPrefs.ready_for_fitting && (groupedJobs['ready_for_fitting']?.length || 0) > 0) ? 'bg-violet-500 ring-white' : null,
      iconColor: (notifPrefs.ready_for_fitting && (groupedJobs['ready_for_fitting']?.length || 0) > 0) ? 'text-violet-600' : ''
    },
    {
      id: 'qc_ironing',
      title: 'QC & Ironing',
      icon: CheckCircle2,
      dotColor: (notifPrefs.qc_ironing && (groupedJobs['qc_ironing']?.length || 0) > 0) ? 'bg-rose-500 ring-white' : null,
      iconColor: (notifPrefs.qc_ironing && (groupedJobs['qc_ironing']?.length || 0) > 0) ? 'text-rose-600' : ''
    },
    {
      id: 'ready_for_pickup',
      title: 'Ready for Pickup',
      icon: Store,
      dotColor: (notifPrefs.ready_for_pickup && (groupedJobs['ready_for_pickup']?.length || 0) > 0) ? 'bg-emerald-500 ring-white' : null,
      iconColor: (notifPrefs.ready_for_pickup && (groupedJobs['ready_for_pickup']?.length || 0) > 0) ? 'text-emerald-600' : ''
    },
    {
      id: 'completed',
      title: 'Completed Orders',
      icon: CheckCheck,
      dotColor: (notifPrefs.completed && (groupedJobs['completed']?.length || 0) > 0) ? 'bg-taupe ring-white' : null,
      iconColor: (notifPrefs.completed && (groupedJobs['completed']?.length || 0) > 0) ? 'text-taupe' : ''
    },
    {
      id: 'on_hold',
      title: 'On Hold (Paused)',
      icon: Pause,
      dotColor: (notifPrefs.on_hold && onHoldJobs.length > 0) ? 'bg-amber-500 ring-white' : null,
      iconColor: (notifPrefs.on_hold && onHoldJobs.length > 0) ? 'text-amber-700' : ''
    },
  ];

  return (
    <div className="space-y-5 h-full flex flex-col">
      {overdueOnly && (
        <div className="flex items-center justify-between gap-3 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg px-4 py-2.5">
          <span className="flex items-center gap-2"><AlertCircle size={16} /> Showing overdue jobs only</span>
          <Link href="/dashboard/jobs" className="flex items-center gap-1 text-xs font-semibold hover:underline">
            <X size={13} /> Clear filter
          </Link>
        </div>
      )}
      {garmentCategoryFilter && (
        <div className="flex items-center justify-between gap-3 bg-taupe/10 border border-taupe/20 text-taupe text-sm font-medium rounded-lg px-4 py-2.5">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> Showing {GARMENT_CATEGORY_LABELS[garmentCategoryFilter] ?? garmentCategoryFilter} jobs only
          </span>
          <Link href="/dashboard/jobs" className="flex items-center gap-1 text-xs font-semibold hover:underline">
            <X size={13} /> Clear filter
          </Link>
        </div>
      )}
      <PageHeader
        eyebrow={`${walkInCount + onlineCount} Active Orders`}
        title="Production Pipeline"
        description="Track garment production from intake through pickup — walk-in and online orders."
        actions={
          <>
            <button
              type="button"
              onClick={() => setTrashModalOpen(true)}
              title="View deleted job orders"
              aria-label="View deleted job orders"
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface border border-line text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
            >
              <Trash2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => setQuickModalOpen(true)}
              className="flex items-center gap-1.5 bg-surface border border-line hover:border-taupe text-ink-body hover:text-taupe px-3.5 py-2 rounded-lg font-semibold text-xs transition-colors h-10"
            >
              <Zap size={14} className="text-taupe" />
              <span>Quick Walk-in</span>
            </button>
            <Link
              href="/dashboard/jobs/new"
              className="flex items-center gap-1.5 bg-taupe hover:bg-taupe-hover text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors h-10 shadow-2xs"
            >
              <Plus size={15} />
              <span>Create Job Order</span>
            </Link>
          </>
        }
      />

      {/* ── Main White Surface Card Panel (Enclosing Toolbar + Kanban Board) ── */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs flex flex-col flex-1">
        {/* Inner Toolbar (Channel Tabs + Icon-Only Stage Filters + Search) */}
        <div className="p-3 sm:p-3.5 border-b border-line bg-canvas/20 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            {/* Channel Tabs + Settings Button Group (Row 1 on Mobile) */}
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <div className="h-9.5 flex items-center gap-1 p-1 bg-canvas border border-line rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setTab('all')}
                  className={`h-7 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    tab === 'all'
                      ? 'bg-surface text-ink shadow-xs border border-line/80'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <span>All Orders</span>
                  <span className="bg-sunken text-ink-muted text-[10px] px-1.5 py-0.2 rounded-full font-black tabular-nums">{jobs.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('walk_in')}
                  className={`h-7 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    tab === 'walk_in'
                      ? 'bg-surface text-ink shadow-xs border border-line/80'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <Store size={12} />
                  <span>Walk-in</span>
                  <span className="bg-sunken text-ink-muted text-[10px] px-1.5 py-0.2 rounded-full font-black tabular-nums">{walkInCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('online')}
                  className={`h-7 px-3 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    tab === 'online'
                      ? 'bg-surface text-ink shadow-xs border border-line/80'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <ShoppingBag size={12} />
                  <span>Online</span>
                  <span className="bg-sunken text-ink-muted text-[10px] px-1.5 py-0.2 rounded-full font-black tabular-nums">{onlineCount}</span>
                </button>
              </div>

              {/* ── Settings Button (Next to Channel Tabs) ── */}
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                title="Stage Notification Dot Settings"
                className="h-9.5 w-9.5 rounded-lg bg-canvas border border-line text-ink-muted hover:text-ink hover:bg-surface flex items-center justify-center transition-all shadow-2xs shrink-0 active:scale-95"
              >
                <SlidersHorizontal size={15} />
              </button>
            </div>

            {/* ── Icon-Only Stage Filters (Thumb-Friendly Touch Target Sizing) ── */}
            <div className="h-11 sm:h-9.5 flex items-center gap-1.5 sm:gap-1 p-1 bg-canvas border border-line rounded-xl sm:rounded-lg overflow-x-auto hide-scrollbar w-full sm:w-auto touch-pan-x">
              {STAGE_ICON_FILTERS.map(stage => {
                const Icon = stage.icon;
                const isSelected = stageFilter === stage.id;
                const count = stage.id === 'all'
                  ? jobs.length
                  : stage.id === 'on_hold'
                  ? onHoldJobs.length
                  : (groupedJobs[stage.id]?.length || 0);

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      setStageFilter(stage.id);
                      if (stage.id !== 'all') {
                        const el = document.getElementById(`kanban-col-${stage.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }
                    }}
                    title={`${stage.title} (${count})`}
                    className={`relative min-w-[38px] h-9 sm:min-w-8 sm:h-7 rounded-lg sm:rounded-md flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                      isSelected
                        ? 'bg-surface text-ink shadow-xs border border-line/90 font-bold'
                        : 'text-ink-muted hover:text-ink hover:bg-surface/50'
                    }`}
                  >
                    <Icon size={16} className={`transition-colors ${stage.iconColor ?? ''}`} />
                    {stage.dotColor && (
                      <span className={`absolute top-1 right-1 w-2 h-2 sm:w-1.5 sm:h-1.5 rounded-full ${stage.dotColor} ring-1.5 ring-white`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Input */}
          <div className="w-full lg:w-60 shrink-0">
            <SearchInput value={search} onChange={setSearch} placeholder="Search order or customer..." className="w-full" />
          </div>
        </div>

        {tab === 'online' && (
          <div className="px-4 py-2 bg-canvas/40 border-b border-line flex items-center gap-2 text-xs text-ink-muted">
            <Truck size={13} />
            <span>Online production flow: <strong>{activeColumns.map(c => c.title).join(' → ')}</strong>.</span>
          </div>
        )}

        {tab === 'walk_in' && (
          <div className="px-4 py-2 bg-canvas/40 border-b border-line flex items-center gap-2 text-xs text-ink-muted">
            <Scissors size={13} />
            <span>Walk-in production flow: <strong>{activeColumns.map(c => c.title).join(' → ')}</strong>.</span>
          </div>
        )}

        {/* Board Area */}
        <div className="p-3 sm:p-4 flex-1 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-ink-faint animate-pulse">Loading production pipeline...</div>
          ) : (
            <JobKanbanBoard
              groupedJobs={groupedJobs}
              activeColumns={activeColumns}
              onHoldJobs={onHoldJobs}
              actionLoadingId={actionLoadingId}
              onUpdateStatus={updateJobStatus}
              onApprove={handleApproveJob}
              onReject={openRejectModal}
              highlightedJobId={highlightedJobId}
              stageFilter={stageFilter}
            />
          )}
        </div>
      </div>

      {/* ── Notification Indicator Settings Modal (Full Screen on Mobile / Centered on Desktop) ── */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full h-full sm:h-auto sm:max-w-md bg-surface sm:rounded-2xl border-0 sm:border border-line shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-line bg-canvas/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-taupe/10 flex items-center justify-center text-taupe">
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-ink">Stage Notification Dots</h3>
                  <p className="text-xs text-ink-muted">Toggle which stages show indicator dots</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-line bg-surface hover:bg-canvas text-ink-muted hover:text-ink flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Checkbox Options List - All 11 Stages */}
            <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1 max-h-[60vh] sm:max-h-[50vh]">
              {[
                {
                  key: 'pending',
                  title: 'Pending Feasibility Review',
                  desc: 'Orders awaiting initial tailor approval',
                  dot: 'bg-amber-500',
                  icon: AlertTriangle,
                  iconCls: 'text-amber-600'
                },
                {
                  key: 'design',
                  title: 'Design',
                  desc: 'Custom sketching, mockup & fabric finalization',
                  dot: 'bg-sky-500',
                  icon: Palette,
                  iconCls: 'text-sky-600'
                },
                {
                  key: 'pattern_making',
                  title: 'Pattern Making',
                  desc: 'Drafting measurements and pattern templates',
                  dot: 'bg-indigo-500',
                  icon: Ruler,
                  iconCls: 'text-indigo-600'
                },
                {
                  key: 'mass_cutting_printing',
                  title: 'Mass Cutting & Printing',
                  desc: 'Sublimation printing, embroidery & bulk cutting',
                  dot: 'bg-cyan-500',
                  icon: Printer,
                  iconCls: 'text-cyan-600'
                },
                {
                  key: 'cutting',
                  title: 'Cutting',
                  desc: 'Precision fabric and lining panel cutting',
                  dot: 'bg-amber-600',
                  icon: Scissors,
                  iconCls: 'text-amber-600'
                },
                {
                  key: 'sewing',
                  title: 'Sewing / Assembly',
                  desc: 'Garment construction and main stitching',
                  dot: 'bg-teal-600',
                  icon: Shirt,
                  iconCls: 'text-teal-600'
                },
                {
                  key: 'ready_for_fitting',
                  title: 'Ready for Fitting',
                  desc: 'Garments ready for customer fitting session',
                  dot: 'bg-violet-500',
                  icon: UserCheck,
                  iconCls: 'text-violet-600'
                },
                {
                  key: 'qc_ironing',
                  title: 'QC & Ironing',
                  desc: 'Quality inspection, thread trimming & steam pressing',
                  dot: 'bg-rose-500',
                  icon: CheckCircle2,
                  iconCls: 'text-rose-600'
                },
                {
                  key: 'ready_for_pickup',
                  title: 'Ready for Pickup',
                  desc: 'Finished garments awaiting customer claim or delivery',
                  dot: 'bg-emerald-500',
                  icon: Store,
                  iconCls: 'text-emerald-600'
                },
                {
                  key: 'completed',
                  title: 'Completed Orders',
                  desc: 'Fully claimed and settled garment orders',
                  dot: 'bg-taupe',
                  icon: CheckCheck,
                  iconCls: 'text-taupe'
                },
                {
                  key: 'on_hold',
                  title: 'On Hold (Paused)',
                  desc: 'Jobs paused for materials or customer feedback',
                  dot: 'bg-amber-500',
                  icon: Pause,
                  iconCls: 'text-amber-700'
                },
              ].map(item => {
                const ItemIcon = item.icon;
                const isChecked = Boolean(notifPrefs[item.key]);
                return (
                  <label
                    key={item.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-canvas/40 border-taupe/50 shadow-2xs'
                        : 'bg-surface border-line hover:border-line-strong opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleNotifPref(item.key)}
                      className="mt-0.5 h-4 w-4 rounded text-taupe focus:ring-taupe border-line cursor-pointer accent-taupe shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ItemIcon size={14} className={`${item.iconCls} shrink-0`} />
                        <span className="font-bold text-xs sm:text-sm text-ink truncate">{item.title}</span>
                        <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
                      </div>
                      <p className="text-[11px] sm:text-xs text-ink-muted mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-line bg-canvas/20 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setNotifPrefs(DEFAULT_NOTIF_PREFS);
                  try {
                    localStorage.setItem('sutura_job_stage_notif_prefs', JSON.stringify(DEFAULT_NOTIF_PREFS));
                  } catch {}
                }}
                className="text-xs font-bold text-ink-muted hover:text-ink transition-colors"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="h-10 px-6 rounded-xl bg-taupe hover:bg-taupe-hover text-white font-bold text-xs shadow-2xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}



      <JobRejectModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
        }}
        onConfirm={handleConfirmReject}
        actionLoading={actionLoadingId !== null}
      />

      <QuickJobModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        onCreated={() => { if (fetchJobs) fetchJobs(); }}
      />

      {shop && (
        <JobTrashModal
          isOpen={trashModalOpen}
          onClose={() => setTrashModalOpen(false)}
          shopId={shop.id}
          onRestored={() => { if (fetchJobs) fetchJobs(); }}
        />
      )}
    </div>
  );
}
