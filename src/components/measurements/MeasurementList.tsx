'use client';

import React from 'react';
import { ChevronDown, ChevronUp, Copy, Pencil, Trash2, StickyNote, RefreshCw } from 'lucide-react';
import { MeasurementRecord } from './measurementTypes';
import { MetricPill, CustomerInitial, humanizeMetricKey } from './measurementHelpers';

interface MeasurementListProps {
  readonly grouped: Record<string, MeasurementRecord[]>;
  readonly expandedIds: Set<number>;
  readonly toggleExpand: (id: number) => void;
  readonly selectedVersionIds: Record<string, number>;
  readonly setSelectedVersionIds: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  readonly openClone: (rec: MeasurementRecord) => void;
  readonly openEdit: (rec: MeasurementRecord) => void;
  readonly openDelete: (id: number) => void;
}

export default function MeasurementList({
  grouped,
  expandedIds,
  toggleExpand,
  selectedVersionIds,
  setSelectedVersionIds,
  openClone,
  openEdit,
  openDelete,
}: MeasurementListProps) {
  const handleVersionChange = (rKey: string, activeRecId: number, newVerId: number) => {
    setSelectedVersionIds(prev => ({ ...prev, [rKey]: newVerId }));
    if (expandedIds.has(activeRecId)) {
      toggleExpand(activeRecId);
      toggleExpand(newVerId);
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([customerName, recs]) => {
        const firstRec = recs[0];
        return (
          <div key={customerName} className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            {/* Customer Header */}
            <div className="bg-canvas/50 px-5 py-4 border-b border-line flex items-center gap-3">
              <CustomerInitial name={customerName} />
              <div>
                <h3 className="font-bold text-ink text-sm">{customerName}</h3>
                {firstRec.customer?.email && (
                  <p className="text-xs text-ink-muted">{firstRec.customer.email}</p>
                )}
              </div>
            </div>

            {/* Profiles */}
            <div className="divide-y divide-line">
              {Object.entries(
                recs.reduce((acc, r) => {
                  const key = r.profile_name.trim();
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(r);
                  return acc;
                }, {} as Record<string, MeasurementRecord[]>)
              ).map(([profileName, versions]) => {
                // Sort versions by ID ascending
                versions.sort((a, b) => a.id - b.id);
                
                const rKey = `c_${firstRec.customer_id}_p_${profileName}`;
                const selectedId = selectedVersionIds[rKey];
                const activeRec = versions.find(v => v.id === selectedId) || versions.at(-1)!;
                const activeIndex = versions.indexOf(activeRec);
                
                const isExpanded = expandedIds.has(activeRec.id);
                const filledCount = Object.values(activeRec.metrics || {}).filter(Boolean).length;
                
                return (
                  <div key={profileName}>
                    {/* Profile Row */}
                    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-canvas/70 transition-colors">
                      <button
                        onClick={() => toggleExpand(activeRec.id)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-ink text-sm">{profileName}</p>
                            {activeRec.source === 'customer' ? (
                              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">Customer-Side</span>
                            ) : (
                              <span className="text-[10px] bg-sage/10 text-sage border border-sage/20 px-2 py-0.5 rounded-full font-medium">Shop Owner</span>
                            )}
                            <span className="text-[10px] bg-taupe/10 text-taupe border border-taupe/20 px-2 py-0.5 rounded-full font-medium">
                              {filledCount} field{filledCount === 1 ? '' : 's'}
                            </span>
                            <span className="text-[10px] text-ink-faint">
                              Version {activeIndex + 1} of {versions.length}
                            </span>
                            {versions.length > 1 && (
                              <select
                                value={activeRec.id}
                                onChange={(e) => handleVersionChange(rKey, activeRec.id, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-body font-semibold focus:outline-none cursor-pointer"
                              >
                                {versions.map((v, idx) => (
                                  <option key={v.id} value={v.id}>
                                    Ver {idx + 1}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <p className="text-xs text-ink-faint mt-0.5 flex items-center gap-1">
                            <RefreshCw size={10} />
                            Updated {new Date(activeRec.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {activeRec.notes && (
                              <span className="flex items-center gap-1 ml-2">
                                <StickyNote size={10} /> Notes
                              </span>
                            )}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-ink-faint shrink-0" /> : <ChevronDown size={16} className="text-ink-faint shrink-0" />}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openClone(activeRec)}
                          className="p-1.5 text-ink-faint hover:text-ink hover:bg-sunken rounded-lg transition-colors cursor-pointer"
                          title="Create new version"
                        >
                          <Copy size={15} />
                        </button>
                        {activeIndex === versions.length - 1 && (
                          <button
                            onClick={() => openEdit(activeRec)}
                            className="p-1.5 text-ink-faint hover:text-ink hover:bg-sunken rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => openDelete(activeRec.id)}
                          className="p-1.5 text-ink-faint hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Metrics */}
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1 bg-canvas/40 border-t border-line/50 animate-fade-in">
                        <div className="mt-3">
                          <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider mb-2">Measurements</p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(activeRec.metrics || {})
                              .filter(([, v]) => v)
                              .map(([key, value]) => (
                                <MetricPill key={key} label={humanizeMetricKey(key)} value={value} />
                              ))}
                            {Object.values(activeRec.metrics || {}).every(v => !v) && (
                              <p className="text-xs text-ink-faint italic">No measurements recorded.</p>
                            )}
                          </div>
                        </div>
                        {activeRec.notes && (
                          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            <p className="text-xs text-amber-700 flex items-start gap-2">
                              <StickyNote size={12} className="shrink-0 mt-0.5" />
                              {activeRec.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
