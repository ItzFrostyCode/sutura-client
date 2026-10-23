import { useAuthStore } from '@/store/useAuthStore';

/**
 * What the signed-in shop account is. Only the owner and a branch manager make orders, set them up, quote, confirm,
 * cancel and handle money; plain staff only work on production. Use `isOwnerOrManager` to decide what to show.
 */
export function useShopRole() {
  const { user } = useAuthStore();
  const names = user?.roles?.map((r) => r.name) ?? [];
  const isOwner = names.includes('store_owner');
  const isBranchManager = names.includes('branch_manager');
  const isOwnerOrManager = isOwner || isBranchManager || names.includes('super_admin');
  return { isOwner, isBranchManager, isOwnerOrManager, isStaffOnly: !isOwnerOrManager && names.includes('staff') };
}
