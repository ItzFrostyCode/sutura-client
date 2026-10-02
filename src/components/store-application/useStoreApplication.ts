'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import {
  EMPTY_OWNER, EMPTY_SHOP,
  type ApplicationStep, type BillingCycle, type DocumentKey, type OwnerFields,
  type PaymentMethod, type PublicPlan, type ShopFields,
} from './applicationTypes';

/**
 * All state for the four-step shop application. Each step is its own
 * <form>, so the browser's `required` checks gate "Continue"; this hook only
 * holds values across steps and builds the one multipart submit at the end.
 */
export function useStoreApplication() {
  const [step, setStep] = useState<ApplicationStep>(1);
  const [owner, setOwner] = useState<OwnerFields>(EMPTY_OWNER);
  const [shop, setShop] = useState<ShopFields>(EMPTY_SHOP);
  const [files, setFiles] = useState<Partial<Record<DocumentKey, File>>>({});
  const [permits, setPermits] = useState<File[]>([]);
  const [governmentIdType, setGovernmentIdType] = useState('');
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [planId, setPlanId] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Set once submitted — the owner can't sign in until a System Admin
  // approves and emails their shop login here.
  const [submittedTo, setSubmittedTo] = useState<string | null>(null);

  useEffect(() => {
    api.get('/public/subscription-plans')
      .then((res) => {
        const list: PublicPlan[] = res.data.data ?? [];
        setPlans(list);
        setPlanId((current) => current ?? list[0]?.id ?? null);
      })
      .catch(() => setError('Could not load subscription plans. Please refresh the page.'));
  }, []);

  const goTo = (next: ApplicationStep) => {
    setError('');
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setFile = (key: DocumentKey, file: File | null) =>
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });

  const submit = async () => {
    if (!shop.location || !planId) return;
    setSubmitting(true);
    setError('');

    const form = new FormData();
    Object.entries(owner).forEach(([key, value]) => { if (value) form.append(key, value); });
    form.append('store_name', shop.store_name);
    form.append('address', shop.address);
    if (shop.barangay.trim()) form.append('barangay', shop.barangay.trim());
    form.append('city', shop.city);
    form.append('province', shop.province);
    form.append('district', shop.location.district);
    form.append('latitude', String(shop.location.lat));
    form.append('longitude', String(shop.location.lng));
    shop.specializations.forEach((s) => form.append('specializations[]', s));
    Object.entries(files).forEach(([key, file]) => form.append(key, file));
    permits.forEach((file) => form.append('business_permits[]', file));
    form.append('government_id_type', governmentIdType);
    form.append('plan_id', String(planId));
    form.append('billing_cycle', billingCycle);
    form.append('payment_method', paymentMethod);

    try {
      const res = await api.post('/store-applications', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmittedTo(res.data.data.contact_email);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit your application. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    step, goTo, owner, setOwner, shop, setShop, files, setFile, permits, setPermits,
    governmentIdType, setGovernmentIdType, plans, planId, setPlanId, billingCycle, setBillingCycle,
    paymentMethod, setPaymentMethod, error, setError, submitting, submit, submittedTo,
  };
}

export type StoreApplicationState = ReturnType<typeof useStoreApplication>;
