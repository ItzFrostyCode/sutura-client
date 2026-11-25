'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { appendFaceMatch } from './faceMatch';
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
  // Pay with GCash right after submitting (default), or attach a receipt of a payment already sent.
  const [payOnline, setPayOnlineRaw] = useState(true);
  // Or a 14-day free trial of the picked plan: nothing to pay now (one per shop).
  const [freeTrial, setFreeTrialRaw] = useState(false);
  const setPayOnline = (online: boolean) => { setPayOnlineRaw(online); setFreeTrialRaw(false); };
  const setFreeTrial = (trial: boolean) => { setFreeTrialRaw(trial); if (trial) setPayOnlineRaw(false); };
  // Privacy consent (Documents step) and the terms agreement (last step).
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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
        // /for-shops "Choose <plan>" links arrive with ?plan=<slug>&cycle=monthly|yearly.
        const params = new URLSearchParams(window.location.search);
        const wanted = list.find((p) => p.slug === params.get('plan'));
        const cycle = params.get('cycle');
        if (cycle === 'monthly' || cycle === 'yearly') setBillingCycle(cycle);
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
    if (!shop.location || !planId) return;
    if (!privacyConsent) { setError('Please agree to the privacy consent on the Documents step.'); return; }
    if (!termsAccepted) { setError('Please agree to the Terms of Service before submitting.'); return; }
    setSubmitting(true);
    setError('');

    const form = new FormData();
    Object.entries(owner).forEach(([key, value]) => { if (value) form.append(key, value); });
    form.append('store_name', shop.store_name);
    form.append('address', shop.address.trim());
    form.append('province_code', shop.area.province_code);
    form.append('city_code', shop.area.city_code);
    if (shop.area.district_code) form.append('district_code', shop.area.district_code);
    form.append('barangay_code', shop.area.barangay_code);
    // The pin's district: used for Davao City's district filter when none was picked.
    form.append('district', shop.location.district);
    form.append('latitude', String(shop.location.lat));
    form.append('longitude', String(shop.location.lng));
    shop.specializations.forEach((s) => form.append('specializations[]', s));
    shop.custom_services.forEach((s) => form.append('custom_services[]', s));
    shop.branches.forEach((b, i) => {
      form.append(`branches[${i}][name]`, b.name.trim());
      form.append(`branches[${i}][address]`, b.address.trim());
      form.append(`branches[${i}][province_code]`, b.area.province_code);
      form.append(`branches[${i}][city_code]`, b.area.city_code);
      if (b.area.district_code) form.append(`branches[${i}][district_code]`, b.area.district_code);
      form.append(`branches[${i}][barangay_code]`, b.area.barangay_code);
    });
    Object.entries(files).forEach(([key, file]) => {
      if (key === 'payment_receipt' && (payOnline || freeTrial)) return;
      form.append(key, file);
    });
    permits.forEach((file) => form.append('business_permits[]', file));
    form.append('government_id_type', governmentIdType);
    appendFaceMatch(form, files.selfie_with_id);
    form.append('plan_id', String(planId));
    form.append('billing_cycle', billingCycle);
    if (freeTrial) {
      form.append('free_trial', '1');
    } else {
      form.append('payment_method', paymentMethod);
      if (payOnline) form.append('pay_online', '1');
    }
    form.append('privacy_consent', '1');
    form.append('terms_accepted', '1');

    try {
      const res = await api.post('/store-applications', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const payment = res.data.data.payment as { token: string; checkout_url: string | null } | null;
      if (payment) {
        // Saved: go pay. If GCash couldn't be reached, the payment page lets them try again.
        window.location.assign(`/register/store/payment/${payment.token}${payment.checkout_url ? '?pay=1' : ''}`);
        return;
      }
      setSubmittedTo(res.data.data.contact_email);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSubmitting(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit your application. Please try again.'));
      setSubmitting(false);
    }
  };

  return {
    step, goTo, owner, setOwner, shop, setShop, files, setFile, permits, setPermits,
    governmentIdType, setGovernmentIdType, plans, planId, setPlanId, billingCycle, setBillingCycle,
    paymentMethod, setPaymentMethod, payOnline, setPayOnline, freeTrial, setFreeTrial, error, setError, submitting, submit, submittedTo,
    privacyConsent, setPrivacyConsent, termsAccepted, setTermsAccepted,
  };
}

export type StoreApplicationState = ReturnType<typeof useStoreApplication>;
