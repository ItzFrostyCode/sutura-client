import { redirect } from 'next/navigation';

// Combo packages now live in the Packages tab of Services.
export default function ServicePackagesRedirect() {
  redirect('/dashboard/services?tab=packages');
}
