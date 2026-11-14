'use client';

import React, { useState, useMemo } from 'react';
import { Clock, MapPin, Phone, PhoneCall, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { hoursLine, type OperatingHours } from '@/lib/storeStatus';
import { formatPhone } from '@/lib/formatPhone';
import { formatTime12h } from '@/components/store-storefront/storeStorefrontHelpers';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function ShopQuickInfo({
  address,
  hours,
  phone,
  landmark,
  coords,
  mapUrl,
  storeName,
}: {
  readonly address: string | null;
  readonly hours: OperatingHours | null | undefined;
  readonly phone: string | null | undefined;
  readonly landmark?: string | null;
  readonly coords?: { lat: number; lng: number } | null;
  readonly mapUrl?: string | null;
  readonly storeName?: string | null;
}) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const line = hoursLine(hours);

  const googleMapsUrl = useMemo(() => {
    if (mapUrl) return mapUrl;
    if (coords?.lat && coords?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    }
    if (address) {
      const q = storeName ? `${storeName}, ${address}` : address;
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    }
    return null;
  }, [mapUrl, coords, address, storeName]);

  // Parse operating hours object safely
  let parsedHours: OperatingHours | null = null;
  if (hours) {
    if (typeof hours === 'string') {
      try {
        parsedHours = JSON.parse(hours);
      } catch {
        parsedHours = null;
      }
    } else if (typeof hours === 'object') {
      parsedHours = hours;
    }
  }

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 1800);
    } catch {
      // fallback
    }
  };

  const handleCopyPhone = async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1800);
    } catch {
      // fallback
    }
  };

  const currentDayKey = DAYS.map((d) => d.key)[(new Date().getDay() + 6) % 7];

  return (
    <ul className="shrink-0 w-full pb-1">
      {/* 1. Address row: flat clean divider, icon-only copy button */}
      {address && (
        <li className="flex min-h-11 items-center justify-between gap-3 border-b border-line py-2 text-sm text-ink">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="shrink-0 text-taupe-dark">
              <MapPin size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-ink">{address}</span>
              {landmark && (
                <span className="block truncate text-xs text-ink-muted mt-0.5">{landmark}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded transition-colors cursor-pointer"
                title="Open in Google Maps"
                aria-label="Open in Google Maps"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              type="button"
              onClick={handleCopyAddress}
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded transition-colors cursor-pointer"
              aria-label="Copy address"
              title="Copy address"
            >
              {copiedAddress ? (
                <Check size={16} className="text-emerald-600" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </li>
      )}

      {/* 2. Single-line hours status with dropdown chevron button */}
      <li className="border-b border-line py-2 text-sm text-ink">
        <div
          onClick={() => setHoursOpen(!hoursOpen)}
          className="flex min-h-7 items-center justify-between gap-3 cursor-pointer select-none"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1 text-sm">
            <span className="shrink-0 text-taupe-dark">
              <Clock size={18} />
            </span>
            <div className="min-w-0 flex-1 truncate text-sm">
              {line ? (
                <span>
                  <span className={`font-semibold ${line.open ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {line.open ? 'Open' : 'Closed'}
                  </span>
                  <span className="text-ink-muted"> · {line.text}</span>
                </span>
              ) : (
                <span className="text-ink-muted font-medium">Hours not set</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHoursOpen(!hoursOpen);
            }}
            aria-expanded={hoursOpen}
            aria-label="Toggle weekly operating hours"
            className="shrink-0 p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded transition-colors cursor-pointer"
          >
            <ChevronDown
              size={17}
              className={`transition-transform duration-200 ${hoursOpen ? 'rotate-180 text-ink' : 'text-ink-muted'}`}
            />
          </button>
        </div>

        {/* Weekly hours dropdown accordion with matching text-sm font size */}
        {hoursOpen && (
          <div className="pt-2.5 pb-1 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {DAYS.map(({ key, label }) => {
              const dayData = parsedHours?.[key];
              const isToday = key === currentDayKey;
              const isOpen = Boolean(dayData?.is_open && dayData?.open && dayData?.close);

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between py-1 text-sm transition-colors ${
                    isToday ? 'font-semibold text-ink' : 'text-ink-body font-normal'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{label}</span>
                    {isToday && <span className="text-xs font-bold text-taupe">(Today)</span>}
                  </span>
                  <span>
                    {isOpen ? (
                      <span className="tabular-nums">
                        {formatTime12h(dayData!.open)} – {formatTime12h(dayData!.close)}
                      </span>
                    ) : (
                      <span className="text-ink-faint">Closed</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </li>

      {/* 3. Phone row: flat clean divider, call & copy icon buttons */}
      {phone && (
        <li className="flex min-h-11 items-center justify-between gap-3 border-b border-line last:border-b-0 py-2 text-sm text-ink">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="shrink-0 text-taupe-dark">
              <Phone size={18} />
            </span>
            <a
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              className="font-medium tabular-nums text-ink hover:text-taupe hover:underline truncate"
            >
              {formatPhone(phone)}
            </a>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded transition-colors"
              title="Call phone number"
              aria-label="Call phone number"
            >
              <PhoneCall size={16} />
            </a>
            <button
              type="button"
              onClick={handleCopyPhone}
              className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded transition-colors cursor-pointer"
              title="Copy phone number"
              aria-label="Copy phone number"
            >
              {copiedPhone ? (
                <Check size={16} className="text-emerald-600" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </li>
      )}
    </ul>
  );
}
