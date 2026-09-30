'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';
import Badge, { type BadgeVariant } from '@/components/shared/Badge';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import ApplicationSummary from '@/components/admin/applications/ApplicationSummary';
import DocumentTile from '@/components/admin/applications/DocumentTile';
import ApproveModal from '@/components/admin/applications/ApproveModal';
import CredentialsModal from '@/components/admin/applications/CredentialsModal';
import { useApplicationDetail, type IssuedCredentials } from '@/components/admin/applications/useApplicationDetail';
import ReasonModal from '@/components/admin/ui/ReasonModal';
import { ListState } from '@/components/admin/ui/AdminPrimitives';
import { formatDate } from '@/components/admin/useAdminList';

const STATUS_BADGE: Record<string, BadgeVariant> = { pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'danger' };

export default function ApplicationDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { store, documents, error, suggestedLogin, loginDomain, approve, reject } = useApplicationDetail(id);
  const toast = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [credentials, setCredentials] = useState<IssuedCredentials | null>(null);

  if (!store) return <ListState loading={!error} error={error} empty={false} emptyText="" />;

  const handleApprove = async (loginEmail: string) => {
    try {
      const result = await approve(loginEmail);
      setApproveOpen(false);
      toast.success(result.message);
      setCredentials(result.credentials);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not approve this application.'));
      throw err;
    }
  };

  const handleReject = async (reason: string) => {
    try {
      toast.success(await reject(reason));
      setRejectOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reject this application.'));
      throw err;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <Link href="/admin/applications" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> Applications
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div className="min-w-0">
          <p className="text-eyebrow-accent">Shop application</p>
          <h1 className="text-display mt-2 text-3xl font-semibold text-ink">{store.name}</h1>
        </div>
        <Badge variant={STATUS_BADGE[store.status] ?? 'neutral'} className="capitalize">{store.status}</Badge>
      </header>

      {store.status === 'rejected' && store.rejection_reason && (
        <p className="border-l-2 border-danger bg-danger/5 px-4 py-3 text-sm text-ink">
          <span className="font-semibold">Rejected{store.application?.reviewer ? ` by ${store.application.reviewer.name}` : ''}:</span> {store.rejection_reason}
        </p>
      )}
      {store.status === 'approved' && (
        <p className="border-l-2 border-sage bg-sage/5 px-4 py-3 text-sm text-ink">
          Approved {formatDate(store.approved_at, true)}{store.approved_by ? ` by ${store.approved_by.name}` : ''}.
        </p>
      )}

      <ApplicationSummary store={store} />

      <section>
        <h2 className="tablet-h3 text-ink mb-3">Documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-ink-muted">This store was created before shop applications existed, so it has no documents on file.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {documents.map((doc) => <DocumentTile key={doc.key} storeId={store.id} doc={doc} />)}
          </div>
        )}
      </section>

      {store.status === 'pending' && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3 lg:left-60">
          <div className="mx-auto flex max-w-6xl justify-end gap-3">
            <button type="button" onClick={() => setRejectOpen(true)} className="inline-flex min-h-12 items-center gap-2 border border-danger px-5 text-sm font-semibold text-danger">
              <X size={16} /> Reject
            </button>
            <button type="button" onClick={() => setApproveOpen(true)} className="inline-flex min-h-12 items-center gap-2 bg-ink px-5 text-sm font-semibold text-white">
              <Check size={16} /> Approve & Go Live
            </button>
          </div>
        </div>
      )}

      <ApproveModal
        isOpen={approveOpen}
        storeName={store.name}
        suggestedLogin={suggestedLogin}
        loginDomain={loginDomain}
        contactEmail={store.owner?.contact_email ?? store.email ?? ''}
        onClose={() => setApproveOpen(false)}
        onConfirm={handleApprove}
      />
      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />

      <ReasonModal
        isOpen={rejectOpen}
        title={`Reject ${store.name}?`}
        description="The owner sees this reason on their dashboard and in the email we send, so say exactly what to fix."
        placeholder="e.g. The DTI certificate is blurry — please upload a clearer copy."
        confirmLabel="Reject Application"
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
      />
    </div>
  );
}
