import React from 'react';
import { Building2, CheckCircle, MapPin, Plus, Star, Compass } from 'lucide-react';
import { ShopBranch } from './branchHelpers';
import BranchCard from './BranchCard';

interface BranchListViewProps {
  readonly branches: ShopBranch[];
  readonly onAddClick: () => void;
  readonly onEdit: (branch: ShopBranch) => void;
  readonly onDelete: (id: number) => void;
  readonly onSetMain?: (branch: ShopBranch) => void;
}

export default function BranchListView({
  branches,
  onAddClick,
  onEdit,
  onDelete,
  onSetMain,
}: BranchListViewProps) {
  const safeBranches = Array.isArray(branches) ? branches : [];

  if (safeBranches.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-16 text-center">
        <div className="w-16 h-16 bg-sunken rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-taupe" />
        </div>
        <h3 className="text-lg font-semibold text-ink mb-2">No Branches Yet</h3>
        <p className="text-ink-muted text-sm mb-6 max-w-sm mx-auto">
          Add your first branch location. It will serve as your primary headquarters and appear on the customer discovery map.
        </p>
        <button
          onClick={onAddClick}
          className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus size={18} />
          Add Main Branch
        </button>
      </div>
    );
  }

  const mainBranch = safeBranches.find(b => b.is_main) || safeBranches[0];
  const satelliteBranches = safeBranches.filter(b => b.id !== mainBranch?.id);

  return (
    <div className="space-y-8">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-taupe rounded-2xl p-5 flex items-center gap-3 text-white sm:col-span-1 shadow-xs">
          <div className="p-2.5 bg-white/15 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {safeBranches.filter(b => b.status === 'active').length}
            </div>
            <div className="text-xs text-white/70">Active Locations</div>
          </div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-sunken rounded-lg">
            <Building2 className="w-5 h-5 text-taupe" />
          </div>
          <div>
            <div className="text-xl font-bold text-ink">{safeBranches.length}</div>
            <div className="text-xs text-ink-muted">Total Network Branches</div>
          </div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-sunken rounded-lg">
            <MapPin className="w-5 h-5 text-taupe" />
          </div>
          <div>
            <div className="text-xl font-bold text-ink">
              {safeBranches.filter(b => b.latitude && b.longitude).length}
            </div>
            <div className="text-xs text-ink-muted">Map-Pinned on Discovery</div>
          </div>
        </div>
      </div>

      {/* 🌟 TIER 1: Primary Headquarters (Main Branch) */}
      {mainBranch && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-lg">
                <Star size={16} className="fill-amber-500 text-amber-600" />
              </span>
              <div>
                <h2 className="text-base font-bold text-ink">Primary Headquarters / Main Atelier</h2>
                <p className="text-xs text-ink-muted">The flagship hub where administrative records, master stock, and default appointments are rooted.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-3">
              <BranchCard
                branch={mainBranch}
                onEdit={onEdit}
                onDelete={onDelete}
                onSetMain={onSetMain}
              />
            </div>
          </div>
        </div>
      )}

      {/* 🏢 TIER 2: Satellite Network (Companion Branches / Mga Kasama Niya) */}
      <div className="space-y-4 pt-2 border-t border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sunken text-taupe rounded-lg">
              <Compass size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">Satellite Branches & Companion Locations</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sunken text-ink-muted border border-line">
                  {satelliteBranches.length} {satelliteBranches.length === 1 ? 'Location' : 'Locations'}
                </span>
              </div>
              <p className="text-xs text-ink-muted">Branch locations sharing the shop workspace with designated managers and staff.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddClick}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-taupe hover:text-ink px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-sunken transition-colors"
          >
            <Plus size={14} /> Add Satellite Branch
          </button>
        </div>

        {satelliteBranches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {satelliteBranches.map(branch => (
              <BranchCard
                key={branch.id}
                branch={branch}
                onEdit={onEdit}
                onDelete={onDelete}
                onSetMain={onSetMain}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-line rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-ink mb-1">No Satellite Branches Yet</p>
            <p className="text-xs text-ink-muted max-w-md mx-auto mb-4">
              Expand your business across multiple locations (e.g. Lanang, Matina, downtown). Each branch gets its own staff roster, job queue, and booking calendar.
            </p>
            <button
              type="button"
              onClick={onAddClick}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-taupe hover:bg-taupe/90 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={15} />
              Add Satellite Branch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
