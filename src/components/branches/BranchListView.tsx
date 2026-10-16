import React from 'react';
import Link from 'next/link';
import { Building2, Lock, Plus } from 'lucide-react';
import { StoreBranch } from './branchHelpers';
import BranchCard from './BranchCard';

interface BranchListViewProps {
  readonly branches: StoreBranch[];
  /** Omitted for accounts that can't add branches (branch managers/staff) — the add buttons are hidden. */
  readonly onAddClick?: () => void;
  /** The plan's branch limit is reached (admin Plans page): adding more needs an upgrade. */
  readonly addLocked?: boolean;
  /** e.g. "Your plan allows 1 branch." */
  readonly lockedText?: string;
  readonly onEdit: (branch: StoreBranch) => void;
  readonly onDelete?: (id: number) => void;
  readonly onSetMain?: (branch: StoreBranch) => void;
}

export default function BranchListView({
  branches,
  onAddClick,
  addLocked = false,
  lockedText = 'Your plan limit has been reached.',
  onEdit,
  onDelete,
  onSetMain,
}: BranchListViewProps) {
  const safeBranches = Array.isArray(branches) ? branches : [];

  if (safeBranches.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-sunken rounded-2xl flex items-center justify-center mx-auto mb-3 text-taupe">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-ink mb-1.5">No locations yet</h3>
        <p className="text-ink-muted text-xs sm:text-sm mb-5 leading-relaxed">
          Add your primary store location so customers can find your shop, book fittings, and view your business hours.
        </p>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-2 bg-ink hover:bg-ink/90 text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-sm"
          >
            <Plus size={16} />
            Add Store Location
          </button>
        )}
      </div>
    );
  }

  const mainBranch = safeBranches.find(b => b.is_main) || safeBranches[0];
  const otherBranches = safeBranches.filter(b => b.id !== mainBranch?.id);
  const sortedBranches = mainBranch ? [mainBranch, ...otherBranches] : safeBranches;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-ink">
            Locations
            <span className="ml-2 text-xs font-normal text-ink-muted">
              ({safeBranches.length} {safeBranches.length === 1 ? 'branch' : 'branches'})
            </span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Your physical storefronts and tailor workshops.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {sortedBranches.map(branch => (
          <BranchCard
            key={branch.id}
            branch={branch}
            onEdit={onEdit}
            onDelete={onDelete}
            onSetMain={onSetMain}
          />
        ))}

        {/* Add Another Location Card */}
        {onAddClick && (
          addLocked ? (
            <Link
              href="/dashboard/billing"
              className="group flex flex-col items-center justify-center min-h-[200px] rounded-2xl border border-line bg-surface/50 hover:bg-surface p-6 text-center transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center text-ink-muted mb-2.5">
                <Lock size={16} />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-ink">Add another location</p>
              <p className="text-xs text-ink-muted mt-1 max-w-[220px]">
                {lockedText} Upgrade your plan to open more branches.
              </p>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAddClick}
              className="group flex flex-col items-center justify-center min-h-[200px] rounded-2xl border-2 border-dashed border-line hover:border-taupe/60 bg-surface/30 hover:bg-surface p-6 text-center transition-all duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-sunken group-hover:bg-taupe/10 flex items-center justify-center text-ink-muted group-hover:text-taupe transition-colors mb-2.5">
                <Plus size={18} />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-ink group-hover:text-taupe transition-colors">Add location</p>
              <p className="text-xs text-ink-muted mt-1 max-w-[220px]">
                Opening a second shop or workshop? Add it here.
              </p>
            </button>
          )
        )}
      </div>
    </div>
  );
}
