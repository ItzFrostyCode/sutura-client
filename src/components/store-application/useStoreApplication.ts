'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { appendFaceMatch, faceMatchOf, rememberFaceMatch } from './faceMatch';
import { revealFirstProblem } from './ApplicationFields';
import { MAX_TOTAL_BYTES, megabytes } from './uploadPrep';
import { clearDraft, isReload, readDraft, readDraftFiles, writeDraft, writeDraftFiles } from './applicationDraft';
import { useAuthStore } from '@/store/useAuthStore';
import { clearShopIntent } from '@/lib/shopIntent';
import { offeredSpecializations } from '@/lib/storeSpecializations';
import { authToken } from '@/lib/authStorage';
import {
  EMPTY_OWNER, EMPTY_SHOP,
  type ApplicationStep, type BillingCycle, type BranchDraft, type DocumentKey, type OwnerFields,
  type PaymentMethod, type PublicPlan, type ShopFields,
} from './applicationTypes';

/** Where a server error belongs: the step, and the element id of the field (or its box). */
const SERVER_FIELDS: Record<string, [ApplicationStep, string]> = {
  first_name: [1, 'app-first'], full_name: [1, 'app-first'], middle_name: [1, 'app-middle'], last_name: [1, 'app-last'],
  suffix: [1, 'app-suffix'], birthday: [1, 'app-birthday'], email: [1, 'app-email'], contact_number: [1, 'app-phone'], gender: [1, 'app-first'],
  store_name: [2, 'app-store-name'], address: [2, 'app-address'], province_code: [2, 'app-area-city'], city_code: [2, 'app-area-city'],
  district_code: [2, 'app-area-district'], district: [2, 'app-area-district'], barangay_code: [2, 'app-area-barangay'],
  latitude: [2, 'app-pin'], longitude: [2, 'app-pin'], specializations: [2, 'app-services'], custom_services: [2, 'app-services'], branches: [2, 'app-branches'],
  landmark_image: [3, 'app-doc-landmark_image'], dti_registration: [3, 'app-doc-dti_registration'], tin_id: [3, 'app-doc-tin_id'],
  brgy_clearance: [3, 'app-doc-brgy_clearance'], government_id: [3, 'app-doc-government_id'], government_id_type: [3, 'app-gov-id-type'],
  selfie_with_id: [3, 'app-selfie'], face_match: [3, 'app-selfie'], face_match_distance: [3, 'app-selfie'], business_permits: [3, 'app-permits'],
  privacy_consent: [3, 'app-privacy-consent'],
  plan_id: [4, 'app-plans'], billing_cycle: [4, 'app-plans'], payment_method: [4, 'app-pay-method'], pay_online: [4, 'app-pay-method'],
  free_trial: [4, 'app-pay-method'], payment_receipt: [4, 'app-doc-payment_receipt'], terms_accepted: [4, 'app-terms'],
};
const BRANCH_FIELDS: Record<string, (key: string) => string> = {
  name: (k) => `app-branch-name-${k}`, address: (k) => `app-branch-address-${k}`,
  province_code: (k) => `app-branch-${k}-city`, city_code: (k) => `app-branch-${k}-city`,
  district_code: (k) => `app-branch-${k}-district`, barangay_code: (k) => `app-branch-${k}-barangay`,
};

/** PHP refused a file that was too big before Laravel saw it: say what to do, not "failed to upload". */
const friendly = (key: string, message: string) => {
  if (/failed to upload/i.test(message)) return 'This file is too big to send. Use a photo of it, or a smaller file.';
  if (/^(specializations|custom_services)\./.test(key) && /invalid/i.test(message)) return 'One of the services you picked isn’t offered anymore. Check your services and pick again.';
  return message;
};

/**
 * The server's 422 errors, placed on their fields: { element id: message }, the earliest step that has one,
 * and anything that has no field of its own.
 */
function placeServerErrors(errors: Record<string, string[] | string>, branches: BranchDraft[]) {
  const byId: Record<string, string> = {};
  const general: string[] = [];
  let step: ApplicationStep | null = null;
  Object.entries(errors).forEach(([key, list]) => {
    const message = friendly(key, Array.isArray(list) ? String(list[0] ?? '') : String(list));
    const branch = /^branches\.(\d+)\.(\w+)/.exec(key);
    let place: [ApplicationStep, string] | undefined;
    if (branch && branches[Number(branch[1])] && BRANCH_FIELDS[branch[2]]) {
      place = [2, BRANCH_FIELDS[branch[2]](branches[Number(branch[1])].key)];
    } else {
      place = SERVER_FIELDS[key.split('.')[0]];
    }
    if (!place) { general.push(message); return; }
    if (!byId[place[1]]) byId[place[1]] = message;
    step = step === null ? place[0] : (Math.min(step, place[0]) as ApplicationStep);
  });
  return { byId, step, general };
}

// How many forms are on screen right now: leaving the page clears the draft only once none is left
// (React's development mode unmounts and remounts once on purpose; that must not clear it).
let liveForms = 0;

/**
 * All state for the four-step shop application. Each step is its own
 * <form>, so the browser's `required` checks gate "Continue"; this hook only
 * holds values across steps and builds the one multipart submit at the end.
 */
/**
 * signedInOwner: the owner already has an account (email sign-up, then /onboarding), so the shop is sent to their own
 * account at /owner/store-application; the public form (/register/store) creates the owner too.
 */
export function useStoreApplication({ signedInOwner = false, keepDraft = false }: {
  readonly signedInOwner?: boolean;
  /** Keep the answers through a page refresh (the public /register/store form). */
  readonly keepDraft?: boolean;
} = {}) {
  const setAuth = useAuthStore((state) => state.setAuth);
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
  // Errors the server sent back on submit, keyed by the element id of their field. A step clears its own on Continue.
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  // Fields to bring into view once the step they are on has rendered.
  const [reveal, setReveal] = useState<string[] | null>(null);
  // Set when a draft was put back after a refresh (its choices win over the link's ?trial=1).
  const restoredDraft = useRef(false);
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
        // "Start free trial" on /for-shops: the trial is picked already (a draft kept through a refresh wins).
        if (!restoredDraft.current && /^(1|true|yes)/i.test(params.get('trial') ?? '')) { setFreeTrialRaw(true); setPayOnlineRaw(false); }
        // A plan kept from before a refresh stays only while it is still offered.
        setPlanId((current) => (current && list.some((p) => p.id === current) ? current : wanted?.id ?? list[0]?.id ?? null));
      })
      .catch(() => setError('Could not load subscription plans. Please refresh the page.'));
  }, []);

  const goTo = (next: ApplicationStep) => {
    setError('');
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const clearServerErrors = useCallback(() => setServerErrors({}), []);

  // After the server sent the owner back to a step: show the first problem once that step is on screen.
  useEffect(() => {
    if (!reveal) return;
    revealFirstProblem(reveal);
    setReveal(null);
  }, [reveal, step]);

  // ----- Keeping the answers through a refresh (see applicationDraft.ts) -----
  const [draftReady, setDraftReady] = useState(!keepDraft);
  const restoredOnce = useRef(false);
  useEffect(() => {
    if (!keepDraft || restoredOnce.current) return;
    restoredOnce.current = true;
    if (!isReload()) {
      // A fresh visit: whatever an earlier visit left behind is not this one.
      void clearDraft();
      setDraftReady(true);
      return;
    }
    const d = readDraft();
    if (!d) { setDraftReady(true); return; }
    restoredDraft.current = true;
    setOwner(d.owner);
    setShop(d.shop);
    setGovernmentIdType(d.governmentIdType);
    if (d.planId) setPlanId(d.planId);
    setBillingCycle(d.billingCycle);
    setPayOnlineRaw(d.payOnline);
    setFreeTrialRaw(d.freeTrial);
    setPrivacyConsent(d.privacyConsent);
    setTermsAccepted(d.termsAccepted);
    setStep(d.step);
    readDraftFiles().then(({ files: kept, permits: keptPermits }) => {
      if (kept.selfie_with_id && d.selfieMatch) rememberFaceMatch(kept.selfie_with_id, d.selfieMatch);
      setFiles((now) => ({ ...kept, ...now }));
      setPermits((now) => (now.length ? now : keptPermits));
    }).finally(() => setDraftReady(true));
  }, [keepDraft]);

  useEffect(() => {
    if (!keepDraft || !draftReady) return;
    const t = window.setTimeout(() => writeDraft({
      step, owner, shop, governmentIdType, planId, billingCycle, payOnline, freeTrial, privacyConsent, termsAccepted,
      selfieMatch: files.selfie_with_id ? faceMatchOf(files.selfie_with_id) : null,
    }), 250);
    return () => window.clearTimeout(t);
  }, [keepDraft, draftReady, step, owner, shop, governmentIdType, planId, billingCycle, payOnline, freeTrial, privacyConsent, termsAccepted, files.selfie_with_id]);

  useEffect(() => {
    if (!keepDraft || !draftReady) return;
    void writeDraftFiles({ files, permits });
  }, [keepDraft, draftReady, files, permits]);

  // Leaving the form (Back, a link) forgets it; a reload or closing the tab does not run this.
  useEffect(() => {
    if (!keepDraft) return;
    liveForms += 1;
    let unloading = false;
    const onHide = () => { unloading = true; };
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      liveForms -= 1;
      if (unloading) return;
      window.setTimeout(() => { if (liveForms === 0) void clearDraft(); }, 0);
    };
  }, [keepDraft]);

  const setFile = (key: DocumentKey, file: File | null) =>
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });

  /** Sends the owner back to where something needs fixing. */
  const sendBack = (to: ApplicationStep, byId: Record<string, string>) => {
    setServerErrors(byId);
    if (to !== step) goTo(to);
    setReveal(Object.keys(byId));
  };

  const submit = async () => {
    if (!shop.location) { sendBack(2, { 'app-pin': 'Set your shop’s pin: use Current location or Choose on map.' }); return; }
    if (offeredSpecializations(shop.specializations).length === 0 && shop.custom_services.length === 0) { sendBack(2, { 'app-services': 'Pick at least one service your shop offers.' }); return; }
    if (!planId) { sendBack(4, { 'app-plans': 'Choose a plan.' }); return; }
    if (!privacyConsent) { sendBack(3, { 'app-privacy-consent': 'Tick this box to agree before you continue.' }); return; }
    if (!termsAccepted) { sendBack(4, { 'app-terms': 'Tick this box to agree before you submit.' }); return; }
    // Everything goes in one request; PHP's stock limit for one is 8 MB. Photos are already shrunk, so only
    // large PDFs get here: point at the biggest one.
    const sending: [string, File][] = [
      ...Object.entries(files).filter(([k]) => k !== 'payment_receipt' || !(payOnline || freeTrial)).map(([k, f]) => [`app-doc-${k}`, f as File] as [string, File]),
      ...permits.map((f) => ['app-permits', f] as [string, File]),
    ];
    const total = sending.reduce((sum, [, f]) => sum + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      const [biggestId] = [...sending].sort((a, b) => b[1].size - a[1].size)[0];
      const id = biggestId === 'app-doc-selfie_with_id' ? 'app-selfie' : biggestId;
      sendBack(id === 'app-doc-payment_receipt' ? 4 : 3, {
        [id]: `Your files add up to ${megabytes(total)}; the limit is ${megabytes(MAX_TOTAL_BYTES)}. Replace this one with a photo or a smaller file.`,
      });
      return;
    }
    setSubmitting(true);
    setError('');
    setServerErrors({});

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
    offeredSpecializations(shop.specializations).forEach((s) => form.append('specializations[]', s));
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
      const res = await api.post(signedInOwner ? '/owner/store-application' : '/store-applications', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (signedInOwner) {
        // The account now has a shop: refresh it so the dashboard and the guards see it.
        clearShopIntent();
        const me = await api.get('/auth/me');
        const token = authToken();
        if (me.data?.success && token) setAuth(me.data.data.user, token, me.data.data.store ?? undefined, me.data.data.staff_profile ?? undefined);
      }
      const payment = res.data.data.payment as { token: string; checkout_url: string | null } | null;
      if (payment) {
        // Saved: go pay. If GCash couldn't be reached, the payment page lets them try again.
        window.location.assign(`/register/store/payment/${payment.token}${payment.checkout_url ? '?pay=1' : ''}`);
        return;
      }
      if (keepDraft) void clearDraft();
      setSubmittedTo(res.data.data.contact_email);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSubmitting(false);
    } catch (err) {
      setSubmitting(false);
      const res = (err as { response?: { status?: number; data?: { errors?: Record<string, string[] | string> } } }).response;
      if (res?.status === 413) {
        sendBack(3, { 'app-doc-dti_registration': 'Your files are too big to send together. Use photos instead of large PDFs.' });
        return;
      }
      if (res?.status === 422 && res.data?.errors) {
        const placed = placeServerErrors(res.data.errors, shop.branches);
        if (placed.general.length) setError(placed.general.join(' '));
        if (placed.step !== null) { sendBack(placed.step, placed.byId); return; }
      }
      setError(getErrorMessage(err, 'Could not submit your application. Please try again.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return {
    step, goTo, owner, setOwner, shop, setShop, files, setFile, permits, setPermits,
    governmentIdType, setGovernmentIdType, plans, planId, setPlanId, billingCycle, setBillingCycle,
    paymentMethod, setPaymentMethod, payOnline, setPayOnline, freeTrial, setFreeTrial, error, setError, submitting, submit, submittedTo,
    serverErrors, clearServerErrors,
    privacyConsent, setPrivacyConsent, termsAccepted, setTermsAccepted,
  };
}

export type StoreApplicationState = ReturnType<typeof useStoreApplication>;
