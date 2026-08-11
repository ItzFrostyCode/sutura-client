'use client';

import { Layers } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';

/**
 * Customers, Design Catalog, Services, and Packages are shop-wide entities
 * in the schema — none of them carry a shop_branch_id, unlike Jobs,
 * Appointments, Reports, and Staff. The header's branch selector can't
 * filter what has no branch to filter by, so this makes that explicit
 * instead of the page silently ignoring the selector with no explanation.
 */
export default function ShopWideNote() {
  const { branches, selectedBranchId } = useBranch();
  if (selectedBranchId === null) return null;
  const branchName = branches.find(b => b.id === selectedBranchId)?.name;
  if (!branchName) return null;

  return (
    <p className="flex items-center gap-1 text-xs text-[#827A73] mt-1.5">
      <Layers size={11} />
      Shop-wide — not specific to {branchName}. The branch switcher doesn&apos;t filter this page.
    </p>
  );
}
