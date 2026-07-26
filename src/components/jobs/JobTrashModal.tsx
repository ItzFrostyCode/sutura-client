import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import { Loader2, RotateCcw, Trash2 } from 'lucide-react';
import api from '@/lib/axios';

interface TrashedJob {
  id: number;
  order_number: string;
  status: string;
  total_amount: string | number;
  customer: { id: number; name: string } | null;
  deleted_at: string;
}

interface JobTrashModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly shopId: number;
  readonly onRestored: () => void;
}

export default function JobTrashModal({ isOpen, onClose, shopId, onRestored }: JobTrashModalProps) {
  const [trashed, setTrashed] = useState<TrashedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const loadTrashed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/shops/${shopId}/jobs`, { params: { trashed: 1, per_page: 100 } });
      const raw = res.data.data;
      setTrashed(Array.isArray(raw) ? raw : (raw?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    const maybeLoad = () => {
      if (isOpen) loadTrashed();
    };
    maybeLoad();
  }, [isOpen, loadTrashed]);

  const handleRestore = async (job: TrashedJob) => {
    setRestoringId(job.id);
    try {
      await api.post(`/shops/${shopId}/jobs/${job.id}/restore`);
      setTrashed(prev => prev.filter(j => j.id !== job.id));
      onRestored();
    } catch (err) {
      console.error(err);
      alert('Failed to restore this job order.');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deleted Job Orders">
      <div className="space-y-4 text-[#2D2A26]">
        <p className="text-xs text-[#827A73]">
          Job orders you&apos;ve deleted stay here — restore any of them back into the production pipeline.
          Jobs with recorded payments can&apos;t be deleted in the first place, so nothing with money attached
          ever ends up here.
        </p>

        {loading ? (
          <div className="text-center py-10 text-xs text-[#A8A19A] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-taupe" />
            Loading deleted job orders...
          </div>
        ) : trashed.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#A8A19A] border border-dashed border-[#EBE6E0] rounded-xl flex flex-col items-center gap-2">
            <Trash2 size={20} className="text-[#C5BDBA]" />
            Nothing in the trash right now.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {trashed.map(job => (
              <div
                key={job.id}
                className="flex items-center justify-between p-3 bg-white border border-[#EBE6E0] rounded-lg"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#2D2A26] truncate">{job.order_number}</p>
                  <p className="text-[11px] text-[#A8A19A] truncate">
                    {job.customer?.name || 'Walk-in'} · ₱{Number(job.total_amount).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(job)}
                  disabled={restoringId === job.id}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#7A8B76]/10 text-[#7A8B76] hover:bg-[#7A8B76]/20 border border-[#7A8B76]/20 transition-colors disabled:opacity-50"
                >
                  {restoringId === job.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-[#EBE6E0] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
