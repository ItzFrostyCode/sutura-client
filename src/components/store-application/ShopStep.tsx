'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, MapPin } from 'lucide-react';
import { STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';
import { StepActions, TextField } from './ApplicationFields';
import type { StoreApplicationState } from './useStoreApplication';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

// Replaces sutura2's hardcoded Davao City coordinates with a real pin —
// the map, distance sort, and branch directions all read these.
export default function ShopStep({ app }: { readonly app: StoreApplicationState }) {
  const { shop, setShop, goTo, setError } = app;
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggle = (value: string) => {
    setError('');
    setShop({
      ...shop,
      specializations: shop.specializations.includes(value)
        ? shop.specializations.filter((s) => s !== value)
        : [...shop.specializations, value],
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (shop.specializations.length === 0) return setError('Pick at least one thing your shop specializes in.');
    if (!shop.location) return setError('Pin your shop on the map so customers can find it.');
    goTo(3);
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <TextField id="app-store-name" label="Shop Name" required placeholder="e.g. Dela Cruz Tailoring" value={shop.store_name} onChange={(e) => setShop({ ...shop, store_name: e.target.value })} />

      <fieldset>
        <legend className="text-sm text-ink mb-1">Specializations<span className="text-danger">*</span></legend>
        <p className="mobile-caption text-ink-muted mb-3">Customers filter shops by these on search and the map.</p>
        <div className="flex flex-wrap gap-2">
          {STORE_SPECIALIZATIONS.map((spec) => {
            const on = shop.specializations.includes(spec.value);
            return (
              <button
                key={spec.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(spec.value)}
                className={`inline-flex min-h-11 items-center gap-1.5 border px-3.5 text-sm transition-colors ${on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink hover:border-ink'}`}
              >
                {on && <Check size={14} />}
                {spec.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-5 border-t border-line pt-5">
        <TextField id="app-address" label="Street Address" required placeholder="Unit, building, street (e.g. Jasmin St)" value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} />
        <TextField id="app-barangay" label="Barangay" placeholder="e.g. Ubalde" value={shop.barangay} onChange={(e) => setShop({ ...shop, barangay: e.target.value })} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="app-city" label="City" required value={shop.city} onChange={(e) => setShop({ ...shop, city: e.target.value })} />
          <TextField id="app-province" label="Province" required value={shop.province} onChange={(e) => setShop({ ...shop, province: e.target.value })} />
        </div>

        <div>
          <p className="text-sm text-ink mb-2">Map Pin<span className="text-danger">*</span></p>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`flex w-full min-h-14 items-center gap-3 border px-4 py-3 text-left transition-colors hover:bg-sunken ${shop.location ? 'border-sage bg-sage/5' : 'border-dashed border-line-strong bg-surface'}`}
          >
            <MapPin size={20} className={shop.location ? 'shrink-0 text-sage' : 'shrink-0 text-ink-muted'} />
            <span className="min-w-0 flex-1 text-sm text-ink">
              {shop.location ? shop.location.address || `${shop.location.lat.toFixed(5)}, ${shop.location.lng.toFixed(5)}` : 'Pin your shop on the map'}
            </span>
            <span className="shrink-0 text-sm underline underline-offset-2">{shop.location ? 'Change' : 'Open map'}</span>
          </button>
        </div>
      </div>

      <StepActions onBack={() => goTo(1)} nextLabel="Continue" />

      {pickerOpen && (
        <LocationPicker
          initial={shop.location}
          confirmLabel="Confirm Shop Location"
          onClose={() => setPickerOpen(false)}
          onConfirm={(loc) => {
            setError('');
            setShop({ ...shop, location: loc, address: shop.address || loc.address });
            setPickerOpen(false);
          }}
        />
      )}
    </form>
  );
}
