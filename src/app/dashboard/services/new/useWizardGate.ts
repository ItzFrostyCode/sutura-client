import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCanManageOfferings } from '@/hooks/useCanManageOfferings';

// Only owners and branch managers can create services (same rule as the list page).
export function useWizardGate(back = '/dashboard/services'): boolean {
  const router = useRouter();
  const { user } = useAuthStore();
  const allowed = useCanManageOfferings();
  useEffect(() => { if (user && !allowed) router.replace(back); }, [user, allowed, router, back]);
  return allowed;
}
