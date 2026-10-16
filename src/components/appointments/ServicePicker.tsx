import React from 'react';
import Image from 'next/image';
import { Scissors, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import SearchPicker from '@/components/shared/SearchPicker';
import type { ServiceData } from './appointmentHelpers';

interface ServicePickerProps {
  readonly services: ServiceData[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

/** Search a service by name. Each result shows its picture, name, starting price and rating. */
export default function ServicePicker({ services, value, onChange }: ServicePickerProps) {
  return (
    <SearchPicker
      id="walkin_service" required items={services} value={value} onChange={onChange}
      getId={(s) => String(s.id)} getText={(s) => s.name}
      placeholder="Search a service" emptyText="No service found"
      renderItem={(s) => {
        const price = Number(s.base_price);
        const rating = s.reviews_avg_rating;
        return (
          <>
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sunken text-ink-faint">
              {s.image_url ? <Image src={getMediaUrl(s.image_url)} alt="" fill sizes="48px" className="object-cover" /> : <Scissors size={18} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{s.name}</span>
              <span className="flex items-center gap-2 text-xs text-ink-muted">
                {Number.isFinite(price) && price > 0 && <span>From {peso(price)}</span>}
                {rating ? <span className="flex items-center gap-0.5"><Star size={11} className="fill-amber-400 text-amber-400" />{rating}{s.reviews_count ? ` (${s.reviews_count})` : ''}</span> : <span>No ratings yet</span>}
              </span>
            </span>
          </>
        );
      }}
    />
  );
}
