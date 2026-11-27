'use client';

import React from 'react';
import { CheckCircle2, History, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '@/components/Modal';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ReceiptItem } from '../usePayments';
import DeckReceiptViewer from '../receipts/DeckReceiptViewer';
import TableReceiptList from '../receipts/TableReceiptList';
import { scrollToListTop } from '@/lib/scrollToListTop';

const LIST_PAGE_SIZE = 7;

interface DigitalReceiptsTabProps {
  receiptsLoading: boolean;
  activeReceipts: ReceiptItem[];
  receiptFilter: 'pending' | 'approved' | 'rejected';
  setReceiptFilter: (filter: 'pending' | 'approved' | 'rejected') => void;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
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
  copiedRef,
  onCopyRef,
  onOpenRejectModal,
  onVerify,
  processingId,
}: DigitalReceiptsTabProps) {
  // A list, 7 per page; Inspect opens the receipt in a popup (same viewer as the deck).
  const [page, setPage] = React.useState(0);
  const [inspecting, setInspecting] = React.useState<number | null>(null);
  const pageCount = Math.max(1, Math.ceil(activeReceipts.length / LIST_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageReceipts = activeReceipts.slice(safePage * LIST_PAGE_SIZE, (safePage + 1) * LIST_PAGE_SIZE);
  // A receipt approved/rejected in the popup leaves this tab's list; close if it's gone.
  const inspected = inspecting !== null ? activeReceipts[inspecting] ?? null : null;
  React.useEffect(() => { setPage(0); setInspecting(null); }, [receiptFilter]);
  // Changing page brings the list (from its filter bar) back into view.
  const listTopRef = React.useRef<HTMLDivElement>(null);
  const goToPage = (n: number) => { setPage(n); scrollToListTop(listTopRef.current); };

  return (
    <div ref={listTopRef} className="scroll-mt-24">
      {/* Inner Toolbar (Pending/Approved/Rejected Sub-filters & View Switcher) */}
      <div className="p-2.5 border-b border-line bg-canvas/20 flex items-center justify-between gap-2.5 flex-wrap">
        <div className="h-[38px] flex items-center gap-1 p-1 bg-canvas border border-line rounded-lg">
          <button
            type="button"
            onClick={() => setReceiptFilter('pending')}
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
            onClick={() => setReceiptFilter('approved')}
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
            onClick={() => setReceiptFilter('rejected')}
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

      </div>

      {receiptsLoading ? (
        <TableSkeleton rows={LIST_PAGE_SIZE} cols={5} />
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
      ) : (
        <>
          <TableReceiptList
            receipts={pageReceipts}
            onInspect={(idx) => setInspecting(safePage * LIST_PAGE_SIZE + idx)}
            onVerify={onVerify}
            onOpenRejectModal={onOpenRejectModal}
            processingId={processingId}
          />
          {activeReceipts.length > LIST_PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-ink-muted">
              <span className="tabular-nums">Page {safePage + 1} of {pageCount} · {activeReceipts.length} total</span>
              <div className="flex gap-1">
                <button type="button" aria-label="Previous page" disabled={safePage === 0} onClick={() => goToPage(safePage - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-line hover:bg-canvas disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" aria-label="Next page" disabled={safePage >= pageCount - 1} onClick={() => goToPage(safePage + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-line hover:bg-canvas disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={inspected !== null} onClose={() => setInspecting(null)} title="Payment receipt" maxWidth="max-w-4xl">
        {inspected && inspecting !== null && (
          <DeckReceiptViewer
            receipt={inspected}
            receiptFilter={receiptFilter}
            deckIndex={inspecting}
            totalCount={activeReceipts.length}
            onPrev={() => setInspecting((i) => (i === null ? i : Math.max(0, i - 1)))}
            onNext={() => setInspecting((i) => (i === null ? i : Math.min(activeReceipts.length - 1, i + 1)))}
            onCopyRef={onCopyRef}
            copiedRef={copiedRef}
            onOpenRejectModal={onOpenRejectModal}
            onVerify={onVerify}
            processingId={processingId}
          />
        )}
      </Modal>
    </div>
  );
}
