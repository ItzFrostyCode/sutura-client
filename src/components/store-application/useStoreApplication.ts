'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { clearShopIntent, readShopIntent } from '@/lib/shopIntent';
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
export function useStoreApplication({ signedInOwner = false }: { readonly signedInOwner?: boolean } = {}) {
  const setAuth = useAuthStore((st) => st.setAuth);
  const [step, setStep] = useState<ApplicationStep>(1);
  const [owner, setOwner] = useState<OwnerFields>(EMPTY_OWNER);
  const [shop, setShop] = useState<ShopFields>(EMPTY_SHOP);
  const [files, setFiles] = useState<Partial<Record<DocumentKey, File>>>({});
  const [permits, setPermits] = useState<File[]>([]);
  const [governmentIdType, setGovernmentIdType] = useState('');
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [planId, setPlanId] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  // The free 14 days on Basic: no payment method or receipt. Chosen here or from the landing page (?trial=1).
  const [trial, setTrial] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Set once submitted — the owner can't sign in until a System Admin
  // approves and emails their shop login here.
  const [submittedTo, setSubmittedTo] = useState<string | null>(null);
  const [submittedStoreId, setSubmittedStoreId] = useState<number | null>(null);
  const [submittedStoreName, setSubmittedStoreName] = useState<string>('');

  useEffect(() => {
    api.get('/public/subscription-plans')
      .then((res) => {
        const list: PublicPlan[] = res.data.data ?? [];
        setPlans(list);
        // What was clicked on /for-shops (the free trial, or a plan), remembered through the email sign-up.
        const intent = readShopIntent();
        const wanted = list.find((p) => p.slug === intent?.plan);
        if (intent?.trial) setTrial(true);
        if (intent?.cycle === 'yearly') setBillingCycle('yearly');
        setPlanId((current) => current ?? wanted?.id ?? list[0]?.id ?? null);
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
    const basic = plans.find((p) => p.slug === 'basic');
    const chosenPlanId = trial ? basic?.id ?? null : planId;
    if (!shop.location || !chosenPlanId) return;
    setSubmitting(true);
    setError('');

    const form = new FormData();
    const nameParts = owner.full_name.trim().split(/\s+/);
    const suffixes = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v'];
    let suffix = '';
    if (nameParts.length > 1 && suffixes.includes(nameParts[nameParts.length - 1].toLowerCase())) {
      suffix = nameParts.pop() ?? '';
    }
    const lastName = nameParts.length > 1 ? (nameParts.pop() ?? '') : (nameParts[0] ?? '');
    let middleName = '';
    if (nameParts.length > 1 && nameParts[nameParts.length - 1].replace(/\.$/, '').length === 1) {
      middleName = nameParts.pop() ?? '';
    }
    const firstName = nameParts.join(' ') || lastName;

    const resolvedOwner = {
      ...owner,
      first_name: owner.first_name || firstName,
      middle_name: owner.middle_name || middleName,
      last_name: owner.last_name || lastName,
      suffix: owner.suffix || suffix,
    };

    Object.entries(resolvedOwner).forEach(([key, value]) => { if (value) form.append(key, value); });
    form.append('store_name', shop.store_name);
    form.append('address', shop.address);
    if (shop.barangay.trim()) form.append('barangay', shop.barangay.trim());
    form.append('city', shop.city);
    form.append('province', shop.province);
    form.append('district', shop.location.district);
    form.append('latitude', String(shop.location.lat));
    form.append('longitude', String(shop.location.lng));
    shop.specializations.forEach((s) => form.append('specializations[]', s));
    Object.entries(files).forEach(([key, file]) => { if (!(trial && key === 'payment_receipt')) form.append(key, file); });
    permits.forEach((file) => form.append('business_permits[]', file));
    form.append('government_id_type', governmentIdType);
    form.append('plan_id', String(chosenPlanId));
    form.append('billing_cycle', trial ? 'trial' : billingCycle);
    if (!trial) form.append('payment_method', paymentMethod);

    try {
      // A signed-in owner (account made by email sign-up) sends the shop to their own account; the older public
      // form (still supported for admin-issued logins) creates the owner too.
      const res = await api.post(signedInOwner ? '/owner/store-application' : '/store-applications', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (signedInOwner) {
        clearShopIntent();
        const me = await api.get('/auth/me');
        const token = sessionStorage.getItem('sutura_token');
        if (me.data?.success && token) setAuth(me.data.data.user, token, me.data.data.store ?? undefined, me.data.data.staff_profile ?? undefined);
      }
      setSubmittedTo(res.data.data.contact_email);
      if (res.data.data.store_id) setSubmittedStoreId(res.data.data.store_id);
      if (res.data.data.store_name) setSubmittedStoreName(res.data.data.store_name);
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
    trial, setTrial, paymentMethod, setPaymentMethod, error, setError, submitting, submit, submittedTo,
    submittedStoreId, submittedStoreName,
  };
}

export type StoreApplicationState = ReturnType<typeof useStoreApplication>;
