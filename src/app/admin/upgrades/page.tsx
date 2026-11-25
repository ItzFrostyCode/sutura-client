import { redirect } from 'next/navigation';

// "Plan Payments" became "Payments" (every platform payment in one place).
export default function AdminUpgradesRedirect() {
  redirect('/admin/payments');
}
