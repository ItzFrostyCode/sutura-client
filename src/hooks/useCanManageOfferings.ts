import { useAuthStore } from '@/store/useAuthStore';

// Services and catalog designs are shop-wide, so only the shop owner writes them (role:store_owner on the API).
// Branch managers and staff can read them, so every edit control is hidden for them.
export function useCanManageOfferings(): boolean {
  const { user } = useAuthStore();
  return Boolean(user?.roles?.some((r) => ['store_owner', 'super_admin'].includes(r.name)));
}
