'use client';

import { useCallback, useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';

export interface ApplicationDocument {
  key: string;
  /** The Request Changes item that covers this file (permit-0 → "permits"). */
  item: string;
  type: 'image' | 'pdf';
  uploaded_at: string | null;
  /** The version a re-upload replaced, streamed with ?version=previous. */
  previous: { type: 'image' | 'pdf'; uploaded_at: string | null } | null;
}

export interface ApplicationDetail {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  address: string;
  city: string;
  province: string;
  phone: string | null;
  email: string | null;
  latitude: string | null;
  longitude: string | null;
  specializations: string[] | null;
  /** Services the shop typed in at registration ("Add Service"). */
  custom_services?: string[] | null;
  declared_branches?: { name: string; address: string }[] | null;
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string;
  owner: { name: string; email: string; contact_email: string | null; phone: string | null } | null;
  approved_by: { name: string } | null;
  subscription: { status: string; ends_at: string | null; plan: { name: string } | null } | null;
  application: {
    first_name: string; middle_name: string | null; last_name: string; suffix: string | null;
    birthday: string; contact_number: string; billing_cycle: string; quoted_price: string;
    payment_method: string | null; government_id_type: string; reviewed_at: string | null;
    /** Asked for a 14-day free trial instead of paying (no plan payment exists). */
    free_trial?: boolean;
    /** Privacy consent + terms agreement (null on applications sent before they existed). */
    privacy_consent_at?: string | null; terms_accepted_at?: string | null; consent_version?: string | null;
    /** Set once the retention job deleted the selfie. */
    selfie_deleted_at?: string | null;
    /** On-device comparison of the selfie's face with the ID photo (a hint, not proof). Null = sent before the check. */
    face_match?: 'likely' | 'unsure' | 'no_match' | 'no_id_face' | 'not_checked' | null;
    face_match_distance?: number | string | null;
    requested_plan: { name: string } | null; reviewer: { name: string } | null;
    /** "Request Changes" round: waiting on the owner, or back for review. */
    review_state: 'changes_requested' | 'resubmitted' | null;
    change_request_items: string[] | null;
    change_request_note: string | null;
    change_requested_at: string | null;
    resubmitted_at: string | null;
    update_token_expires_at: string | null;
    change_requester: { name: string } | null;
  } | null;
}

/** The application's plan payment: a receipt upload, or GCash paid online (refundable). */
export interface PlanPayment {
  id: number;
  channel: 'online' | 'receipt';
  amount: number;
  paid: boolean | null;
  paid_at: string | null;
  reference: string | null;
  refundable: boolean;
  refund_status: 'pending' | 'succeeded' | 'failed' | null;
  refund_amount: number | null;
}

export interface ChangeItem {
  key: string;
  label: string;
}

export interface IssuedCredentials {
  login_email: string;
  temporary_password: string;
  sent_to: string;
}

export function useApplicationDetail(id: string) {
  const [store, setStore] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  // Recommended documents the owner skipped (TIN/BIR, business permits).
  const [missingDocuments, setMissingDocuments] = useState<{ key: string; label: string }[]>([]);
  const [planPayment, setPlanPayment] = useState<PlanPayment | null>(null);
  const [error, setError] = useState('');
  const [suggestedLogin, setSuggestedLogin] = useState('');
  const [loginDomain, setLoginDomain] = useState('');
  const [changeItems, setChangeItems] = useState<ChangeItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.get(`/admin/store-applications/${id}`);
      setStore(res.data.data.store);
      setChangeItems(res.data.data.change_items ?? []);
      setDocuments(res.data.data.documents);
      setMissingDocuments(res.data.data.missing_documents ?? []);
      setPlanPayment(res.data.data.plan_payment ?? null);
      setSuggestedLogin(res.data.data.suggested_login);
      setLoginDomain(res.data.data.login_domain);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load this application.'));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /** Returns the one-time credentials (null for pre-application stores). */
  const approve = async (loginEmail: string) => {
    const res = await adminApi.put(`/admin/store-applications/${id}/approve`, { login_email: loginEmail });
    await load();
    return { message: res.data.message as string, credentials: res.data.credentials as IssuedCredentials | null };
  };

  const reject = async (reason: string) => {
    const res = await adminApi.put(`/admin/store-applications/${id}/reject`, { reason });
    await load();
    return res.data.message as string;
  };

  /** update_url comes back only when the email could not be sent. */
  const requestChanges = async (items: string[], note: string) => {
    const res = await adminApi.put(`/admin/store-applications/${id}/request-changes`, { items, note });
    await load();
    return { message: res.data.message as string, updateUrl: (res.data.update_url as string | null) ?? null };
  };

  return { store, documents, missingDocuments, planPayment, error, suggestedLogin, loginDomain, changeItems, approve, reject, requestChanges };
}
