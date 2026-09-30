'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import PageHeader from '@/components/shared/PageHeader';
import { ListState } from '@/components/admin/ui/AdminPrimitives';
import PlanEditorCard, { type AdminPlan } from '@/components/admin/plans/PlanEditorCard';

// sutura2's Subscription Plans view. Plans are retired (unchecked) rather
// than deleted — existing subscriptions still point at them.
export default function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get('/admin/subscription-plans')
      .then((res) => setPlans(res.data.data))
      .catch(() => setError('Could not load plans.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Price changes apply to new applications and renewals, not subscriptions already running."
      />
      <ListState loading={loading} error={error} empty={!loading && plans.length === 0} emptyText="No plans yet." />
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanEditorCard key={plan.id} plan={plan} onSaved={(saved) => setPlans((all) => all.map((p) => (p.id === saved.id ? saved : p)))} />
        ))}
      </div>
    </div>
  );
}
