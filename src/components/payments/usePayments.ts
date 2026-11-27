import { depositFraction, paymentPolicyLabel, type PaymentPolicy } from '@/components/jobs/requirements';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';

export type Tab = 'receipts' | 'job_balances' | 'cash' | 'methods' | 'statements';

export interface PaymentAccount { id: number; kind: string; name: string; account_name: string; account_number: string; qr_path?: string | null; instructions?: string | null; is_active: boolean; store_branch_id?: number | null; branch?: { id: number; name: string } | null }

export interface ReceiptItem {
  id: number;
  type: 'appointment' | 'catalog_order' | 'job_payment';
  /** job_payment only: the order the payment belongs to (verify/reject go through it). */
  job_order_id?: number;
  /** job_payment only: what the payment was for (labels the card). */
  payment_type?: 'deposit' | 'partial' | 'full' | 'balance' | null;
  customer_name: string;
  customer_email: string;
  itemName: string;
  payment_method: string;
  payment_reference: string;
  payment_receipt_path: string;
  amount: string | number;
  date: string;
  status: string;
  payment_status: string;
}

export interface JobBalanceItem {
  id: number;
  order_number: string;
  customer: { id: number; name: string } | null;
  total_amount: number;
  balance: number;
  discount_amount: number;
  payment_status: string;
  status: string;
  payment_policy?: PaymentPolicy | null;
  payment_policy_percent?: number | null;
}

/** GET /stores/{id}/job-payments row (non-cash job-order payment). */
interface JobPaymentReceiptSource {
  id: number;
  job_order_id: number;
  order_number?: string | null;
  payment_type?: 'deposit' | 'partial' | 'full' | 'balance' | null;
  customer?: { name: string; email?: string | null } | null;
  amount: string | number;
  payment_method: string;
  reference?: string | null;
  receipt_path?: string | null;
  created_at: string;
  payment_status: 'pending' | 'paid' | 'rejected';
}

interface RawJobData {
  id: number;
  order_number?: string;
  customer: { id: number; name: string } | null;
  total_amount: string | number;
  balance: string | number;
  discount_amount?: string | number | null;
  payment_status: string;
  status: string;
}

/** What a receipt is for, shown on its card: never call an order payment an appointment deposit. */
export function receiptKindLabel(item: Pick<ReceiptItem, 'type' | 'payment_type'>): string {
  if (item.type === 'catalog_order') return 'Catalog Order';
  if (item.type === 'appointment') return 'Appointment Deposit';
  switch (item.payment_type) {
    case 'deposit': return 'Order Deposit';
    case 'balance': return 'Order Balance';
    case 'full': return 'Order Full Payment';
    default: return 'Order Payment';
  }
}

const VALID_TABS: Tab[] = ['receipts', 'job_balances', 'cash', 'methods', 'statements'];

export function usePayments() {
  const { store } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const toast = useToast();
  const searchParams = useSearchParams();
  // Lets the Home dashboard's "Pending Deposits"/etc. cards deep-link
  // straight to the relevant tab instead of always landing on Receipts.
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<Tab>(
    VALID_TABS.includes(initialTab as Tab) ? (initialTab as Tab) : 'receipts'
  );

  // Receipts tab
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [receiptsLoading, setReceiptsLoading] = useState(true);

  // Job Balances tab
  const [jobBalances, setJobBalances] = useState<JobBalanceItem[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balanceSearch, setBalanceSearch] = useState('');
  const [logPaymentJob, setLogPaymentJob] = useState<JobBalanceItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  // What the payment is for ('' = let the server work it out) and which of the shop's accounts it went to.
  const [payType, setPayType] = useState('');
  const [payAccountId, setPayAccountId] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [payNotes, setPayNotes] = useState('');
  const [payReference, setPayReference] = useState('');
  const [payReceiptPath, setPayReceiptPath] = useState('');
  const [payReceiptUploading, setPayReceiptUploading] = useState(false);
  const [payCashTendered, setPayCashTendered] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  // Same two-step process as the Job Detail cashier desk: review before it
  // actually submits.
  const [payReviewing, setPayReviewing] = useState(false);

  // Fetch receipts queue
  const fetchReceipts = useCallback(async () => {
    if (!store) return;
    setReceiptsLoading(true);
    try {
      const branchParams = selectedBranchId !== null ? { branch_id: selectedBranchId } : {};
      // Order payments only: GCash logged on job orders (Cashier Desk, online-order
      // deposits, balance payments). Appointment deposits and catalog orders were
      // taken off the Payments page.
      const jobPayRes = await api.get(`/stores/${store.id}/job-payments`, { params: branchParams }).catch(() => ({ data: { data: [] } }));
      const items: ReceiptItem[] = [];
      (jobPayRes.data?.data ?? []).forEach((p: JobPaymentReceiptSource) => {
        items.push({
          id: p.id, type: 'job_payment', job_order_id: p.job_order_id, payment_type: p.payment_type ?? null,
          customer_name: p.customer?.name || 'Walk-in Customer',
          customer_email: p.customer?.email || '',
          itemName: `Order ${p.order_number ?? `#${p.job_order_id}`}`,
          payment_method: p.payment_method,
          payment_reference: p.reference || 'N/A',
          payment_receipt_path: p.receipt_path || '',
          amount: p.amount,
          date: p.created_at,
          status: p.payment_status,
          payment_status: p.payment_status,
        });
      });
      setReceipts(items);
    } catch (err) {
      console.error(err);
    } finally {
      setReceiptsLoading(false);
    }
  }, [store, selectedBranchId]);

  // Fetch job balances — filtered server-side (unpaid_only) rather than
  // fetching the store's entire job history and filtering client-side. The
  // old approach was capped at per_page=500 including every already-paid
  // job, so a store with more than 500 total historical jobs could have an
  // older still-unpaid one silently drop out — same undercounting shape as
  // the other capped-array bugs fixed this session. Filtering server-side
  // also means the response only ever contains genuinely-relevant rows.
  const fetchJobBalances = useCallback(async () => {
    if (!store) return;
    setBalancesLoading(true);
    try {
      const params: Record<string, number> = { per_page: 500, unpaid_only: 1 };
      if (selectedBranchId !== null) params.branch_id = selectedBranchId;
      const res = await api.get(`/stores/${store.id}/jobs`, { params });
      const raw = res.data.data;
      const jobs: RawJobData[] = Array.isArray(raw) ? raw : (raw?.data || []);
      const withBalance = jobs
        .map(j => ({
          id: j.id,
          order_number: j.order_number || `#${j.id}`,
          customer: j.customer || null,
          total_amount: Number.parseFloat(String(j.total_amount)),
          balance: Number.parseFloat(String(j.balance)),
          discount_amount: Number.parseFloat(String(j.discount_amount || 0)),
          payment_status: j.payment_status,
          status: j.status,
        }));
      setJobBalances(withBalance);
    } catch (err) {
      console.error(err);
    } finally {
      setBalancesLoading(false);
    }
  }, [store, selectedBranchId]);

  // Job Balances → "Paid": orders settled in full. Loaded only when that filter is
  // opened, and kept apart from jobBalances so the outstanding totals never include them.
  const [paidJobs, setPaidJobs] = useState<JobBalanceItem[]>([]);
  const [paidJobsLoading, setPaidJobsLoading] = useState(false);
  const fetchPaidJobs = useCallback(async () => {
    if (!store) return;
    setPaidJobsLoading(true);
    try {
      const params: Record<string, number> = { per_page: 100, paid_only: 1 };
      if (selectedBranchId !== null) params.branch_id = selectedBranchId;
      const res = await api.get(`/stores/${store.id}/jobs`, { params });
      const raw = res.data.data;
      const jobs: RawJobData[] = Array.isArray(raw) ? raw : (raw?.data || []);
      setPaidJobs(jobs.map(j => ({
        id: j.id,
        order_number: j.order_number || `#${j.id}`,
        customer: j.customer || null,
        total_amount: Number.parseFloat(String(j.total_amount)),
        balance: Number.parseFloat(String(j.balance)),
        discount_amount: Number.parseFloat(String(j.discount_amount || 0)),
        payment_status: j.payment_status,
        status: j.status,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setPaidJobsLoading(false);
    }
  }, [store, selectedBranchId]);

  // Both fetch on mount regardless of which tab is active — the summary cards
  // and the pending dot need the numbers right away.
  useEffect(() => {
    if (!store) return;
    const timer = setTimeout(() => {
      fetchReceipts();
      fetchJobBalances();
    }, 0);
    return () => clearTimeout(timer);
  }, [store, fetchReceipts, fetchJobBalances]);

  // The shop's own payment accounts (for the walk-in dialog's "which account" picker).
  useEffect(() => {
    if (!store) return;
    api.get(`/stores/${store.id}/payment-methods`).then(r => setPaymentAccounts((r.data?.data ?? []).filter((m: PaymentAccount) => m.is_active))).catch(() => setPaymentAccounts([]));
  }, [store]);

  // Verify receipt
  const handleVerify = async (item: ReceiptItem, status: 'paid' | 'pending' | 'rejected', reason?: string) => {
    if (!store) return;
    setProcessingId(item.id);
    try {
      // Job-order payments use the order's own Verify / Reject (same as the order page),
      // so the order's balance updates the same way.
      if (item.type === 'job_payment' && item.job_order_id) {
        const base = `/stores/${store.id}/jobs/${item.job_order_id}/payments/${item.id}`;
        if (status === 'rejected') {
          await api.post(`${base}/reject`, { reason: reason?.trim() || 'Receipt could not be confirmed.' });
        } else if (status === 'paid') {
          await api.post(`${base}/verify`);
        }
        toast.success(status === 'rejected' ? 'Receipt rejected.' : 'Payment verified successfully!');
        setSelectedReceipt(null);
        fetchReceipts();
        fetchJobBalances(); // the order's balance changes once a payment is verified
        return;
      }
      const endpoint = item.type === 'appointment'
        ? `/stores/${store.id}/appointments/${item.id}/verify-payment`
        : `/stores/${store.id}/catalog-orders/${item.id}/verify-payment`;
      await api.put(endpoint, { payment_status: status });
      toast.success(status === 'rejected' ? 'Receipt rejected.' : 'Payment verified successfully!');
      setSelectedReceipt(null);
      fetchReceipts();
    } catch {
      toast.error('Failed to verify payment. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Log job payment
  const handlePayReceiptUpload = async (file: File) => {
    if (!store) return;
    setPayReceiptUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/stores/${store.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPayReceiptPath(res.data.data?.url || res.data.url || '');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload receipt screenshot.'));
    } finally {
      setPayReceiptUploading(false);
    }
  };

  const handleLogPayment = async () => {
    if (!store || !logPaymentJob) return;
    const amt = Number.parseFloat(payAmount);
    if (!amt || amt <= 0) return;
    if (payMethod === 'cash' && (!payCashTendered || Number.parseFloat(payCashTendered) < amt)) return;
    if (payMethod !== 'cash' && !payReceiptPath) return;
    setPaySubmitting(true);
    try {
      await api.post(`/stores/${store.id}/jobs/${logPaymentJob.id}/pay`, {
        amount: amt,
        payment_method: payMethod,
        source: 'walk_in',
        type: payType || undefined,
        payment_method_id: payMethod !== 'cash' && payAccountId ? Number(payAccountId) : undefined,
        reference: payReference || undefined,
        notes: payNotes || undefined,
        receipt_path: payReceiptPath || undefined,
        cash_tendered: payMethod === 'cash' ? Number.parseFloat(payCashTendered) : undefined,
      });
      if (payMethod !== 'cash') {
        toast.success(`₱${amt.toFixed(2)} payment submitted for ${logPaymentJob.order_number} — pending verification before it applies to the balance.`);
      } else {
        // Same shortfall-aware messaging as the Job Detail page's own payment
        // form — a payment below the 50% downpayment threshold still counts
        // toward it, but shouldn't read as an unqualified "done".
        const totalAmt = Number.parseFloat(String(logPaymentJob.total_amount)) || 0;
        const paidSoFar = (totalAmt - (Number.parseFloat(String(logPaymentJob.balance)) || 0)) + amt;
        const requiredDp = totalAmt * depositFraction(logPaymentJob.payment_policy, logPaymentJob.payment_policy_percent);
        if (paidSoFar < requiredDp) {
          toast.success(`₱${amt.toFixed(2)} payment logged for ${logPaymentJob.order_number}. ₱${(requiredDp - paidSoFar).toFixed(2)} more is needed to reach the required ${paymentPolicyLabel(logPaymentJob.payment_policy, logPaymentJob.payment_policy_percent)}.`);
        } else {
          toast.success(`₱${amt.toFixed(2)} payment logged for ${logPaymentJob.order_number}`);
        }
      }
      setLogPaymentJob(null);
      setPayAmount('');
      setPayNotes('');
      setPayReference('');
      setPayReceiptPath('');
      setPayCashTendered('');
      setPayReviewing(false);
      fetchJobBalances();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setPaySubmitting(false);
    }
  };

  const matchesSearch = (j: JobBalanceItem) => !balanceSearch
    || j.order_number.toLowerCase().includes(balanceSearch.toLowerCase())
    || (j.customer?.name || '').toLowerCase().includes(balanceSearch.toLowerCase());
  const filteredBalances = jobBalances.filter(matchesSearch);
  const filteredPaidJobs = paidJobs.filter(matchesSearch);

  return {
    store,
    activeTab,
    setActiveTab,
    receipts,
    selectedReceipt,
    setSelectedReceipt,
    processingId,
    receiptsLoading,
    jobBalances,
    balancesLoading,
    balanceSearch,
    setBalanceSearch,
    logPaymentJob,
    setLogPaymentJob,
    payAmount,
    setPayAmount,
    payMethod,
    payType,
    setPayType,
    payAccountId,
    setPayAccountId,
    paymentAccounts,
    setPayMethod,
    payNotes,
    setPayNotes,
    payReference,
    setPayReference,
    payReceiptPath,
    setPayReceiptPath,
    payReceiptUploading,
    handlePayReceiptUpload,
    payCashTendered,
    setPayCashTendered,
    payReviewing,
    setPayReviewing,
    paySubmitting,
    handleVerify,
    handleLogPayment,
    filteredBalances,
    filteredPaidJobs,
    paidJobsLoading,
    fetchPaidJobs,
  };
}
