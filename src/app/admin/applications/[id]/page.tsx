'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, PencilLine, X } from 'lucide-react';
import Badge, { type BadgeVariant } from '@/components/shared/Badge';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import ApplicationSummary from '@/components/admin/applications/ApplicationSummary';
import DocumentTile from '@/components/admin/applications/DocumentTile';
import ApproveModal from '@/components/admin/applications/ApproveModal';
import RequestChangesModal from '@/components/admin/applications/RequestChangesModal';
import CredentialsModal from '@/components/admin/applications/CredentialsModal';
import { useApplicationDetail, type IssuedCredentials } from '@/components/admin/applications/useApplicationDetail';
import ReasonModal from '@/components/admin/ui/ReasonModal';
import { ListState } from '@/components/admin/ui/AdminPrimitives';
import { formatDate } from '@/components/admin/useAdminList';

const STATUS_BADGE: Record<string, BadgeVariant> = { pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'danger' };

export default function ApplicationDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { store, documents, error, suggestedLogin, loginDomain, changeItems, approve, reject, requestChanges } = useApplicationDetail(id);
  const toast = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  // Set only when the change-request email failed: the admin sends this link themselves.
  const [manualLink, setManualLink] = useState<string | null>(null);
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

  const handleRequestChanges = async (items: string[], note: string) => {
    try {
      const result = await requestChanges(items, note);
      setChangesOpen(false);
      setManualLink(result.updateUrl);
      if (result.updateUrl) toast.error(result.message);
      else toast.success(result.message);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send the change request.'));
      throw err;
    }
  };

  const app = store.application;
  const labelOf = (key: string) => changeItems.find((i) => i.key === key)?.label ?? key;

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
        <Badge variant={STATUS_BADGE[store.status] ?? 'neutral'} className="capitalize">
          {store.status === 'pending' && app?.review_state === 'changes_requested' ? 'Waiting on owner'
            : store.status === 'pending' && app?.review_state === 'resubmitted' ? 'Updated — review again'
            : store.status}
        </Badge>
      </header>

      {store.status === 'pending' && app?.review_state === 'changes_requested' && (
        <div className="border-l-2 border-alert bg-alert/5 px-4 py-3 text-sm text-ink">
          <p>
            <span className="font-semibold">Changes requested</span>
            {app.change_requester ? ` by ${app.change_requester.name}` : ''} on {formatDate(app.change_requested_at, true)}. Waiting for the owner
            {app.update_token_expires_at ? ` — their link works until ${formatDate(app.update_token_expires_at)}` : ''}.
          </p>
          <p className="mt-1 text-ink-muted">Asked for: {(app.change_request_items ?? []).map(labelOf).join(', ')}</p>
          {app.change_request_note && <p className="mt-1 whitespace-pre-line text-ink-muted">“{app.change_request_note}”</p>}
        </div>
      )}
      {store.status === 'pending' && app?.review_state === 'resubmitted' && (
        <div className="border-l-2 border-sage bg-sage/5 px-4 py-3 text-sm text-ink">
          <p><span className="font-semibold">The owner sent their updates</span> on {formatDate(app.resubmitted_at, true)}.</p>
          <p className="mt-1 text-ink-muted">Updated: {(app.change_request_items ?? []).map(labelOf).join(', ')}. Check these below, then approve, reject or ask again.</p>
        </div>
      )}
      {manualLink && (
        <div className="border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-ink">
          <p className="font-semibold">The email didn&rsquo;t go out. Send the owner this private link yourself:</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all bg-surface px-2 py-1.5 text-xs">{manualLink}</code>
            <button type="button" onClick={() => { void navigator.clipboard.writeText(manualLink); toast.success('Link copied.'); }}
              className="min-h-10 border border-line-strong px-3 text-sm text-ink">Copy link</button>
          </div>
        </div>
      )}

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
          <p className="text-sm text-ink-muted">This shop was created before shop applications existed, so it has no documents on file.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {documents.map((doc) => <DocumentTile key={doc.key} storeId={store.id} storeName={store.name} doc={doc} />)}
          </div>
        )}
      </section>

      {store.status === 'pending' && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3 lg:left-60">
          <div className="mx-auto flex max-w-6xl justify-end gap-3">
            <button type="button" onClick={() => setRejectOpen(true)} className="inline-flex min-h-12 items-center gap-2 border border-danger px-5 text-sm font-semibold text-danger">
              <X size={16} /> Deny
            </button>
            {app && (
              <button type="button" onClick={() => setChangesOpen(true)} className="inline-flex min-h-12 items-center gap-2 border border-ink px-5 text-sm font-semibold text-ink">
                <PencilLine size={16} /> {app.review_state === 'changes_requested' ? 'Request Changes Again' : 'Request Changes'}
              </button>
            )}
            <button type="button" onClick={() => setApproveOpen(true)} className="inline-flex min-h-12 items-center gap-2 bg-ink px-5 text-sm font-semibold text-white">
              <Check size={16} /> Approve
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

      <RequestChangesModal
        isOpen={changesOpen}
        storeName={store.name}
        items={changeItems}
        onClose={() => setChangesOpen(false)}
        onConfirm={handleRequestChanges}
      />

      <ReasonModal
        isOpen={rejectOpen}
        title={`Deny ${store.name}?`}
        description="The owner sees this reason on their dashboard and in the email we send, so say exactly what to fix."
        placeholder="e.g. The DTI certificate is blurry — please upload a clearer copy."
        confirmLabel="Deny Application"
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
      />
    </div>
  );
}
