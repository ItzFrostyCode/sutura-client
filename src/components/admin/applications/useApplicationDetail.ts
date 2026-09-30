'use client';

import { useCallback, useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';

export interface ApplicationDocument {
  key: string;
  type: 'image' | 'pdf';
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
    requested_plan: { name: string } | null; reviewer: { name: string } | null;
  } | null;
}

export interface IssuedCredentials {
  login_email: string;
  temporary_password: string;
  sent_to: string;
}

export function useApplicationDetail(id: string) {
  const [store, setStore] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [error, setError] = useState('');
  const [suggestedLogin, setSuggestedLogin] = useState('');
  const [loginDomain, setLoginDomain] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await adminApi.get(`/admin/store-applications/${id}`);
      setStore(res.data.data.store);
      setDocuments(res.data.data.documents);
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

  return { store, documents, error, suggestedLogin, loginDomain, approve, reject };
}
