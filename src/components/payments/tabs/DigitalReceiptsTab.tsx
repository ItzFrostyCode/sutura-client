'use client';

import React from 'react';
import { Layers, LayoutList, CheckCircle2, History } from 'lucide-react';
import { DeckSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { ReceiptItem } from '../usePayments';
import DeckReceiptViewer from '../receipts/DeckReceiptViewer';
import TableReceiptList from '../receipts/TableReceiptList';

interface DigitalReceiptsTabProps {
  receiptsLoading: boolean;
  activeReceipts: ReceiptItem[];
  receiptFilter: 'pending' | 'approved' | 'rejected';
  setReceiptFilter: (filter: 'pending' | 'approved' | 'rejected') => void;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  deckIndex: number;
  setDeckIndex: React.Dispatch<React.SetStateAction<number>>;
  receiptViewMode: 'deck' | 'list';
  setReceiptViewMode: (mode: 'deck' | 'list') => void;
  copiedRef: string | null;
  onCopyRef: (ref: string) => void;
  onOpenRejectModal: (receipt: ReceiptItem) => void;
  onVerify: (receipt: ReceiptItem, status: 'paid' | 'rejected') => void;
  processingId: number | null;
}

export default function DigitalReceiptsTab({
  receiptsLoading,
  activeReceipts,
  receiptFilter,
  setReceiptFilter,
  pendingCount,
  approvedCount,
  rejectedCount,
  deckIndex,
  setDeckIndex,
  receiptViewMode,
  setReceiptViewMode,
  copiedRef,
  onCopyRef,
  onOpenRejectModal,
  onVerify,
  processingId,
}: DigitalReceiptsTabProps) {
  const currentDeckReceipt = activeReceipts[deckIndex] || null;

  return (
    <div>
      {/* Inner Toolbar (Pending/Approved/Rejected Sub-filters & View Switcher) */}
      <div className="p-2.5 border-b border-line bg-canvas/20 flex items-center justify-between gap-2.5 flex-wrap">
        <div className="h-[38px] flex items-center gap-1 p-1 bg-canvas border border-line rounded-lg">
          <button
            type="button"
            onClick={() => { setReceiptFilter('pending'); setDeckIndex(0); }}
            className={`h-7 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              receiptFilter === 'pending'
                ? 'bg-surface text-ink shadow-2xs border border-line/60'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" title={`${pendingCount} pending`} />
            )}
          </button>

          <button
            type="button"
            onClick={() => { setReceiptFilter('approved'); setDeckIndex(0); }}
            className={`h-7 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              receiptFilter === 'approved'
                ? 'bg-surface text-emerald-700 shadow-2xs border border-line/60'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span>Approved</span>
            {approvedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title={`${approvedCount} approved`} />
            )}
          </button>

          <button
            type="button"
            onClick={() => { setReceiptFilter('rejected'); setDeckIndex(0); }}
            className={`h-7 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              receiptFilter === 'rejected'
                ? 'bg-surface text-rose-700 shadow-2xs border border-line/60'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span>Rejected</span>
            {rejectedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" title={`${rejectedCount} rejected`} />
            )}
          </button>
        </div>

        {/* View Switcher */}
        <div className="h-[38px] flex items-center gap-[10px] bg-canvas border border-line rounded-lg px-1.5 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setReceiptViewMode('deck')}
            title="Deck View"
            aria-label="Deck View"
            className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
              receiptViewMode === 'deck'
                ? 'bg-surface text-ink shadow-xs border border-line/60'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Layers size={15} />
          </button>
          <button
            type="button"
            onClick={() => setReceiptViewMode('list')}
            title="List / Table View"
            aria-label="List / Table View"
            className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
              receiptViewMode === 'list'
                ? 'bg-surface text-ink shadow-xs border border-line/60'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <LayoutList size={15} />
          </button>
        </div>
      </div>

      {receiptsLoading ? (
        receiptViewMode === 'deck' ? <DeckSkeleton /> : <TableSkeleton rows={5} cols={5} />
      ) : activeReceipts.length === 0 ? (
        <div className="text-center py-16 px-4 space-y-2">
          {receiptFilter === 'pending' ? (
            <>
              <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2 opacity-90" />
              <h3 className="font-bold text-base text-ink">No Pending Receipts</h3>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">All customer GCash and Bank transfer receipts are verified.</p>
            </>
          ) : receiptFilter === 'approved' ? (
            <>
              <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2 opacity-70" />
              <h3 className="font-bold text-base text-ink">No Approved Receipts Yet</h3>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">Approved digital payment proofs will appear here for audit and records.</p>
            </>
          ) : (
            <>
              <History size={32} className="mx-auto text-ink-faint mb-2 opacity-70" />
              <h3 className="font-bold text-base text-ink">No Rejected Receipts</h3>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">Rejected receipts requiring customer resubmission will appear here.</p>
            </>
          )}
        </div>
      ) : receiptViewMode === 'deck' && currentDeckReceipt ? (
        <DeckReceiptViewer
          receipt={currentDeckReceipt}
          receiptFilter={receiptFilter}
          deckIndex={deckIndex}
          totalCount={activeReceipts.length}
          onPrev={() => setDeckIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setDeckIndex(prev => Math.min(activeReceipts.length - 1, prev + 1))}
          onCopyRef={onCopyRef}
          copiedRef={copiedRef}
          onOpenRejectModal={onOpenRejectModal}
          onVerify={onVerify}
          processingId={processingId}
        />
      ) : (
        <TableReceiptList
          receipts={activeReceipts}
          onInspect={idx => { setDeckIndex(idx); setReceiptViewMode('deck'); }}
          onVerify={onVerify}
          onOpenRejectModal={onOpenRejectModal}
          processingId={processingId}
        />
      )}
    </div>
  );
}
