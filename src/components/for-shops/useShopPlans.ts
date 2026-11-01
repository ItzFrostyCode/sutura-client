'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import type { PublicPlan } from '@/components/store-application/applicationTypes';

/** The live plans (name, price, features) from the same endpoint the application form uses, so this page never drifts from the admin's Plans page. */
export function useShopPlans() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get('/public/subscription-plans')
      .then((res) => setPlans(res.data.data ?? []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  return { plans, loading, failed };
}
