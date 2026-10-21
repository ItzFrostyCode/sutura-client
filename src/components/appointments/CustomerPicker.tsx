import React from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import SearchPicker from '@/components/shared/SearchPicker';
import type { CustomerData } from './appointmentHelpers';

interface CustomerPickerProps {
  readonly customers: CustomerData[];
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly onAdd?: () => void;
  /** A consultation can start with no customer yet. */
  readonly optional?: boolean;
  readonly plain?: boolean;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

/** Search a customer by name. Each result is the customer's picture and full name. The + beside the label adds a new one. */
export default function CustomerPicker({ customers, value, onChange, onAdd, optional, plain }: CustomerPickerProps) {
  return (
    <div>
      <label htmlFor="customer_id" className="mb-1 block text-sm font-medium text-ink-body">Customer {!optional && <span className="text-danger">*</span>}</label>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
      <SearchPicker
        id="customer_id" plain={plain} required={!optional} items={customers} value={value} onChange={onChange}
        getId={(c) => String(c.id)} getText={(c) => c.name}
        placeholder="Search a customer" emptyText="No customer found. Tap + to add one."
        renderItem={(c) => (
          <>
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sunken text-sm font-semibold text-ink-body">
              {c.profile_picture ? <Image src={getMediaUrl(c.profile_picture)} alt="" fill sizes="40px" className="object-cover" /> : initials(c.name)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{c.name}</span>
          </>
        )}
      />
        </div>
        {onAdd && <button type="button" onClick={onAdd} aria-label="Add new customer" title="Add new customer" className={plain ? 'flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md border border-espresso/25 bg-white text-espresso hover:bg-espresso/[0.06]' : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-taupe hover:border-taupe hover:bg-taupe/10'}>
          <Plus size={20} />
        </button>}
      </div>
    </div>
  );
}
