'use client';

import React, { useEffect, useState } from 'react';
import { Check, Copy, Link2, Share2 } from 'lucide-react';
import EditableCard from './EditableCard';

/**
 * The shop's own SUTURA page, kept apart from its social links: the link a shop shares (on Facebook, in a chat) so
 * customers open the shop here and order online.
 */
export default function ShopLinkCard({ slug, shopName, isOwner = false }: Readonly<{ slug: string; shopName: string; isOwner?: boolean }>) {
  const [url, setUrl] = useState(`/store/${slug}`);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // The full address is only known in the browser (it differs between this computer and the live site).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(`${window.location.origin}/store/${slug}`);
    setCanShare(typeof navigator.share === 'function');
  }, [slug]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the link stays selectable below */
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: shopName, text: `Order from ${shopName} on SUTURA`, url });
    } catch {
      /* closed the share sheet */
    }
  };

  return (
    <EditableCard icon={<Link2 size={16} className="text-taupe" />} title="Shop Link" canEdit={false}>
      <p className="text-sm text-ink-muted mb-3">
        {isOwner
          ? 'Share this link so customers open your shop on SUTURA and order online.'
          : `Open or share this link to order from ${shopName} on SUTURA.`}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="min-w-0 flex-1 flex items-center min-h-11 px-3 bg-canvas border border-line text-sm text-ink-body select-all break-all">
          {url}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={copy}
            className="flex-1 sm:flex-none min-h-11 px-4 border border-line bg-surface text-sm font-semibold text-ink hover:bg-sunken flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={share}
              className="flex-1 sm:flex-none min-h-11 px-4 bg-ink text-white text-sm font-semibold hover:bg-black flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 size={15} /> Share
            </button>
          )}
        </div>
      </div>
    </EditableCard>
  );
}
