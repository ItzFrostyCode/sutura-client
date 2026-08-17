import React from 'react';
import { Building2, CheckCircle, MapPin, Plus } from 'lucide-react';
import { ShopBranch } from './branchHelpers';
import BranchCard from './BranchCard';

interface BranchListViewProps {
  readonly branches: ShopBranch[];
  readonly onAddClick: () => void;
  readonly onEdit: (branch: ShopBranch) => void;
  readonly onDelete: (id: number) => void;
}

export default function BranchListView({
  branches,
  onAddClick,
  onEdit,
  onDelete,
}: BranchListViewProps) {
  if (branches.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-16 text-center">
        <div className="w-16 h-16 bg-sunken rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-taupe" />
        </div>
        <h3 className="text-lg font-semibold text-ink mb-2">No Branches Yet</h3>
        <p className="text-ink-muted text-sm mb-6 max-w-sm mx-auto">
          Add your first branch location. It will appear on the customer discovery map after admin verification.
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

  return (
    <div className="space-y-6">
      {/* Summary Bar — Active Branches leads since it's the one that
          actually answers "how many locations are live right now," not
          just three equal-weight counts. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-taupe rounded-2xl p-5 flex items-center gap-3 text-white sm:col-span-1">
          <div className="p-2.5 bg-white/15 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">
              {branches.filter(b => b.status === 'active').length}
            </div>
            <div className="text-xs text-white/70">Active Branches</div>
          </div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-sunken rounded-lg">
            <Building2 className="w-5 h-5 text-taupe" />
          </div>
          <div>
            <div className="text-xl font-bold text-ink">{branches.length}</div>
            <div className="text-xs text-ink-muted">Total Branches</div>
          </div>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-sunken rounded-lg">
            <MapPin className="w-5 h-5 text-taupe" />
          </div>
          <div>
            <div className="text-xl font-bold text-ink">
              {branches.filter(b => b.latitude && b.longitude).length}
            </div>
            <div className="text-xs text-ink-muted">Map-Pinned</div>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {branches.map(branch => (
          <BranchCard key={branch.id} branch={branch} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
