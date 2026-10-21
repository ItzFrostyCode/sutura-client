'use client';

import React from 'react';
import { LayoutList, Kanban, RotateCcw } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import { SHOP_STAGES, type ShopStageKey } from '../jobStage';
import type { UrgencyFilter, PaymentFilter, SortOption, ViewMode } from './useJobsBoard';

interface BoardToolbarProps {
  readonly search: string;
  readonly onSearch: (v: string) => void;
  readonly viewMode: ViewMode;
  readonly onViewMode: (mode: ViewMode) => void;
  readonly stageFilter: ShopStageKey | 'all';
  readonly onStageFilter: (s: ShopStageKey | 'all') => void;
  readonly urgencyFilter: UrgencyFilter;
  readonly onUrgencyFilter: (u: UrgencyFilter) => void;
  readonly paymentFilter: PaymentFilter;
  readonly onPaymentFilter: (p: PaymentFilter) => void;
  readonly sortBy: SortOption;
  readonly onSortBy: (s: SortOption) => void;
  readonly stageCounts: Record<ShopStageKey | 'all' | 'closed', number>;
  readonly urgencyCounts: { overdue: number; dueSoon: number; rush: number };
  readonly showMine: boolean;
  readonly mine: boolean;
  readonly onMine: (v: boolean) => void;
  readonly closedCount: number;
  readonly showClosed: boolean;
  readonly onShowClosed: (v: boolean) => void;
  readonly canSeeMoney: boolean;
  /** Orders released with a balance whose pay-by date has passed. */
  readonly lateBalanceCount?: number;
  readonly hasActiveFilters: boolean;
  readonly onResetFilters: () => void;
}

const STAGES: { key: ShopStageKey | 'all'; label: string }[] = [{ key: 'all', label: 'All' }, ...SHOP_STAGES.map((s) => ({ key: s.key, label: s.label }))];

const CHIP = 'flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors';
const chip = (on: boolean) => `${CHIP} ${on ? 'border-ink bg-ink text-white' : 'border-espresso/[0.12] bg-white text-ink-body hover:bg-espresso/[0.03]'}`;

/** Search, view switch and sort on one row; the quick filters below it. Stage tabs appear only in the table (the board already has its columns). */
export default function BoardToolbar({
  search, onSearch, viewMode, onViewMode, stageFilter, onStageFilter, urgencyFilter, onUrgencyFilter, paymentFilter, onPaymentFilter,
  sortBy, onSortBy, stageCounts, urgencyCounts, showMine, mine, onMine, closedCount, showClosed, onShowClosed, canSeeMoney, lateBalanceCount = 0, hasActiveFilters, onResetFilters,
}: BoardToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px] flex-1 sm:max-w-md">
          <SearchInput value={search} onChange={onSearch} placeholder="Search order #, customer, garment" className="w-full" onCanvasBackground />
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortBy(e.target.value as SortOption)}
          className="h-11 cursor-pointer rounded-lg border border-espresso/[0.12] bg-white px-3 text-sm text-ink focus:outline-hidden"
          aria-label="Sort orders by"
        >
          <option value="due_date">Due date</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="customer">Customer</option>
          <option value="order_number">Order #</option>
        </select>
        <div role="group" aria-label="View" className="ml-auto flex rounded-lg bg-espresso/[0.06] p-0.5">
          {([['table', LayoutList, 'Table'], ['board', Kanban, 'Board']] as const).map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={`flex h-10 cursor-pointer items-center gap-1.5 rounded-md px-3.5 text-[13px] font-medium transition-colors ${viewMode === mode ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
            >
              <Icon size={15} />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {urgencyCounts.overdue > 0 && <button type="button" onClick={() => onUrgencyFilter(urgencyFilter === 'overdue' ? 'all' : 'overdue')} className={chip(urgencyFilter === 'overdue')}>Overdue <span className={urgencyFilter === 'overdue' ? '' : 'text-danger'}>{urgencyCounts.overdue}</span></button>}
        {urgencyCounts.dueSoon > 0 && <button type="button" onClick={() => onUrgencyFilter(urgencyFilter === 'due_soon' ? 'all' : 'due_soon')} className={chip(urgencyFilter === 'due_soon')}>Due in 2 days {urgencyCounts.dueSoon}</button>}
        {urgencyCounts.rush > 0 && <button type="button" onClick={() => onUrgencyFilter(urgencyFilter === 'rush' ? 'all' : 'rush')} className={chip(urgencyFilter === 'rush')}>Rush {urgencyCounts.rush}</button>}
        {canSeeMoney && <button type="button" onClick={() => onPaymentFilter(paymentFilter === 'has_balance' ? 'all' : 'has_balance')} className={chip(paymentFilter === 'has_balance')}>Has balance</button>}
        {canSeeMoney && lateBalanceCount > 0 && <button type="button" onClick={() => onPaymentFilter(paymentFilter === 'balance_late' ? 'all' : 'balance_late')} className={chip(paymentFilter === 'balance_late')}>Pay-by passed <span className={paymentFilter === 'balance_late' ? '' : 'text-danger'}>{lateBalanceCount}</span></button>}
        {showMine && <button type="button" onClick={() => onMine(!mine)} className={chip(mine)}>My assigned</button>}
        <button type="button" onClick={() => onShowClosed(!showClosed)} className={chip(showClosed)}>Closed{closedCount > 0 ? ` ${closedCount}` : ''}</button>
        {hasActiveFilters && (
          <button type="button" onClick={onResetFilters} className={`${CHIP} border-transparent text-ink-muted hover:text-danger`} title="Reset all filters">
            <RotateCcw size={13} />Reset
          </button>
        )}
      </div>

      {viewMode === 'table' && (
        <div role="tablist" aria-label="Order stages" className="flex gap-1 overflow-x-auto border-b border-espresso/[0.08] hide-scrollbar">
          {STAGES.map((s) => {
            const selected = stageFilter === s.key && !showClosed;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => { if (showClosed) onShowClosed(false); onStageFilter(s.key); }}
                className={`-mb-px flex h-11 shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors ${selected ? 'border-espresso/25 text-espresso' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                {s.label}
                <span className="text-xs text-ink-faint">{stageCounts[s.key]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
