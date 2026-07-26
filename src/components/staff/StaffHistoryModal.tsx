'use client';

import { useEffect, useState } from 'react';
import { Loader2, Clock, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface Assignment {
  job_order_id: number;
  order_number: string | null;
  job_status: string;
  stage: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  customer_name: string | null;
}

interface HistoryData {
  total_assigned: number;
  total_completed: number;
  active: number;
  assignments: Assignment[];
}

export default function StaffHistoryModal({
  staffId,
  staffName,
  isOpen,
  onClose,
}: {
  readonly staffId: number | null;
  readonly staffName: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}) {
  const { shop } = useAuthStore();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!(isOpen && shop?.id && staffId)) return;
      setLoading(true);
      setData(null);
      try {
        const res = await api.get(`/shops/${shop.id}/staff/${staffId}`);
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [isOpen, shop?.id, staffId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Work History — ${staffName}`}>
      {loading && (
        <div className="flex items-center justify-center py-10 text-[#827A73]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}
      {!loading && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#2D2A26]">{data.total_assigned}</p>
              <p className="text-xs text-[#827A73]">Assigned</p>
            </div>
            <div className="bg-[#7A8B76]/10 border border-[#7A8B76]/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#7A8B76]">{data.total_completed}</p>
              <p className="text-xs text-[#827A73]">Completed</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{data.active}</p>
              <p className="text-xs text-[#827A73]">Active</p>
            </div>
          </div>

          {data.assignments.length === 0 ? (
            <p className="text-sm text-[#827A73] text-center py-6">No job assignments yet.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-[#EBE6E0] border border-[#EBE6E0] rounded-xl">
              {data.assignments.map(a => (
                <div key={`${a.job_order_id}-${a.stage}`} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-semibold text-[#2D2A26]">{a.order_number || `#${a.job_order_id}`}</p>
                    <p className="text-xs text-[#827A73]">
                      {a.customer_name || 'Walk-in'}{a.stage ? ` · ${a.stage}` : ''}
                    </p>
                  </div>
                  {a.completed_at ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-[#7A8B76]">
                      <CheckCircle2 size={13} /> Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 capitalize">
                      <Clock size={13} /> {a.job_status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {!loading && !data && (
        <p className="text-sm text-[#827A73] text-center py-6">Could not load work history.</p>
      )}
    </Modal>
  );
}
