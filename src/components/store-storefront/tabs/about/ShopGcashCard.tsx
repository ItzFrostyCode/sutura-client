'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import api from '@/lib/axios';
import { useImageUpload } from '@/components/services/detail/ImageUploadField';
import { emptyMethodForm, usePaymentMethods } from '@/components/payments/usePaymentMethods';
import type { PaymentAccount } from '@/components/payments/usePayments';
import EditableCard from './EditableCard';
import PaymentChannelEdit from './PaymentChannelEdit';
import PaymentChannelView from './PaymentChannelView';
import QrZoomModal from './QrZoomModal';

type ZoomQr = { url: string; title: string; number?: string | null; name?: string | null };

const GCASH_BLUE = '#005CE6';
const TITLE = 'Payment Method';

/** The shop-wide GCash account (the one online orders and deposits are paid to); a branch's own GCash comes after it. */
const shopGcash = (methods: PaymentAccount[]) =>
  methods.find((m) => m.kind === 'gcash' && !m.store_branch_id && m.is_active !== false)
  ?? methods.find((m) => m.kind === 'gcash' && m.is_active !== false)
  ?? null;

function GcashView({ gcash, onZoom }: Readonly<{ gcash: PaymentAccount; onZoom: (qr: ZoomQr) => void }>) {
  return (
    <PaymentChannelView
      title="GCash"
      brandColor={GCASH_BLUE}
      numberLabel="Number"
      numberValue={gcash.account_number}
      nameValue={gcash.account_name}
      qrPath={gcash.qr_path}
      onPreviewQr={(url, title, number, name) => onZoom({ url, title, number, name })}
    />
  );
}

/**
 * The owner's Payment Method card. It edits the shop's GCash payment method itself (Dashboard → Payments → Payment
 * Methods), so a change here is what customers pay to on online orders and deposits — and what that page shows.
 */
export function ShopGcashOwnerCard({ isEditing, onEdit, onDone }: Readonly<{ isEditing: boolean; onEdit: () => void; onDone: () => void }>) {
  const { methods, loading, saving, save, storeId } = usePaymentMethods();
  const { upload, uploading } = useImageUpload(storeId);
  const gcash = shopGcash(methods);
  const editingShopWide = gcash && !gcash.store_branch_id ? gcash : null;
  const [form, setForm] = useState({ account_number: '', account_name: '', qr_path: '' });
  const [zoom, setZoom] = useState<ZoomQr | null>(null);

  const startEdit = () => {
    setForm({
      account_number: editingShopWide?.account_number ?? '',
      account_name: editingShopWide?.account_name ?? '',
      qr_path: editingShopWide?.qr_path ?? '',
    });
    onEdit();
  };

  const submit = async () => {
    const ok = await save({
      ...emptyMethodForm(),
      account_number: form.account_number.trim(),
      account_name: form.account_name.trim(),
      qr_path: form.qr_path,
      instructions: editingShopWide?.instructions ?? '',
      is_active: editingShopWide?.is_active ?? true,
    }, editingShopWide?.id);
    if (ok) onDone();
  };

  return (
    <>
      <EditableCard
        icon={<Wallet size={16} className="text-taupe" />}
        title={TITLE}
        isEditing={isEditing}
        saving={saving || uploading}
        onEdit={startEdit}
        onCancel={onDone}
        onSave={submit}
        editBody={
          <div className="space-y-3">
            <p className="text-xs text-ink-muted">
              The GCash account customers pay to for online orders and deposits. It is the same account as in Payments → Payment Methods.
            </p>
            <PaymentChannelEdit
              title="GCash"
              badgeLabel="Entire shop"
              dotColor={GCASH_BLUE}
              numberId="shop-gcash-number"
              numberName="account_number"
              numberLabel="GCash number"
              numberPlaceholder="09XX XXX XXXX"
              numberValue={form.account_number}
              nameId="shop-gcash-name"
              nameName="account_name"
              nameValue={form.account_name}
              qrPath={form.qr_path || null}
              onUpload={async (e) => {
                const url = await upload(e.target.files?.[0]);
                if (url) setForm((f) => ({ ...f, qr_path: url }));
                e.target.value = '';
              }}
              onRemoveQr={() => setForm((f) => ({ ...f, qr_path: '' }))}
              onChange={(e) => {
                const { name, value } = e.target;
                setForm((f) => ({ ...f, [name]: value }));
              }}
            />
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-ink-faint">Loading…</p>
        ) : gcash ? (
          <GcashView gcash={gcash} onZoom={setZoom} />
        ) : (
          <p className="text-sm text-ink-muted">No GCash account yet. Add one so customers can pay online orders and deposits.</p>
        )}
        <Link href="/dashboard/payments?tab=methods" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-taupe hover:underline">
          All payment methods and branch accounts <ArrowRight size={13} />
        </Link>
      </EditableCard>
      <QrZoomModal qr={zoom} onClose={() => setZoom(null)} />
    </>
  );
}

/** The customer's Payment Method card: the shop's active GCash account, read-only (or that it has none yet). */
export function ShopGcashPublicCard({ storeSlug }: Readonly<{ storeSlug: string }>) {
  const [methods, setMethods] = useState<PaymentAccount[]>([]);
  const [zoom, setZoom] = useState<ZoomQr | null>(null);

  useEffect(() => {
    let alive = true;
    api.get(`/public/stores/${storeSlug}/payment-methods`)
      .then((r) => { if (alive) setMethods(r.data?.data ?? []); })
      .catch(() => { if (alive) setMethods([]); });
    return () => { alive = false; };
  }, [storeSlug]);

  const gcash = shopGcash(methods);
  return (
    <>
      <EditableCard icon={<Wallet size={16} className="text-taupe" />} title={TITLE} canEdit={false}>
        {gcash ? (
          <GcashView gcash={gcash} onZoom={setZoom} />
        ) : (
          <p className="text-sm text-ink-muted">This shop has not added a GCash account yet. You can pay at the shop.</p>
        )}
      </EditableCard>
      <QrZoomModal qr={zoom} onClose={() => setZoom(null)} />
    </>
  );
}
