'use client';

import { usePathname } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';

// /admin/login renders bare; every other /admin page sits inside the
// guarded console shell.
export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
