import { useAuthStore } from '@/store/useAuthStore';

// Services, packages and catalog designs are written only by the owner or a branch
// manager (role:store_owner,branch_manager on the API). Plain staff can read them.
export function useCanManageOfferings(): boolean {
  const { user } = useAuthStore();
  return Boolean(user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name)));
}
