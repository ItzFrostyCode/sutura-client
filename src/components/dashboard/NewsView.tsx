import React, { useEffect, useState } from 'react';
import { GitCommit, Loader2, Server, Monitor } from 'lucide-react';
import api from '@/lib/axios';

interface NewsItem {
  hash: string;
  date: string;
  subject: string;
  source: 'Backend' | 'Frontend';
}

// Used to be a hardcoded array describing features that don't exist in this
// app (rental configs, Lalamove/Toktok/Grab Express shipping — both
// explicitly out of SUTURA's approved scope) — actively misleading, not just
// stale placeholder copy. Reads real commit history from both repos instead,
// via GET /system-news, so this tab always reflects what actually shipped.
export default function NewsView() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/system-news')
      .then(res => setItems(res.data.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-[#2D2A26]">
      <div>
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-1">System News & Updates</h2>
        <p className="text-[#827A73] text-sm">Recent development activity, straight from the project&apos;s own commit history.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#A8A19A]" size={24} />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#EBE6E0] text-[#827A73]">
          No recent updates to show.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const SourceIcon = item.source === 'Backend' ? Server : Monitor;
            return (
              <div key={item.hash} className="bg-white border border-[#EBE6E0] rounded-2xl p-5 shadow-xs hover:border-[#D1C7BD] transition-all">
                <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                  <h3 className="font-medium text-sm text-[#2D2A26] flex items-center gap-2">
                    <GitCommit size={15} className="text-[#9A8073] shrink-0" />
                    {item.subject}
                  </h3>
                  <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border bg-[#F0EAE3] text-[#827A73] border-[#EBE6E0] flex items-center gap-1 shrink-0">
                    <SourceIcon size={11} />
                    {item.source}
                  </span>
                </div>
                <p className="text-xs text-[#A8A19A]">
                  {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  {' · '}
                  <span className="font-mono">{item.hash}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
