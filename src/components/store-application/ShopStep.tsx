'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, MapPin, Plus, X } from 'lucide-react';
import { STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';

// Registration asks only what services the shop offers (the apparel
// departments come from its catalog later). Still saved as specializations[],
// so search/map filtering works unchanged.
const SERVICE_OPTIONS = STORE_SPECIALIZATIONS.filter((s) => s.group === 'Services');
import { StepActions, TextField } from './ApplicationFields';
import type { StoreApplicationState } from './useStoreApplication';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

// Replaces sutura2's hardcoded Davao City coordinates with a real pin —
// the map, distance sort, and branch directions all read these.
export default function ShopStep({ app }: { readonly app: StoreApplicationState }) {
  const { shop, setShop, goTo, setError } = app;
  const [pickerOpen, setPickerOpen] = useState(false);
  // "Add Other Service": a short typed-in service that isn't in the list.
  const [adding, setAdding] = useState(false);
  const [otherDraft, setOtherDraft] = useState('');
  const MAX_OTHER = 5;

  const toggle = (value: string) => {
    setError('');
    setShop({
      ...shop,
      specializations: shop.specializations.includes(value)
        ? shop.specializations.filter((s) => s !== value)
        : [...shop.specializations, value],
    });
  };

  const addOther = () => {
    const name = otherDraft.trim().replace(/\s+/g, ' ');
    if (name.length < 2) return setError('Type the service name (at least 2 letters).');
    if (name.length > 40) return setError('Keep the service name under 40 characters.');
    const taken = [...shop.custom_services, ...SERVICE_OPTIONS.map((o) => o.label)]
      .some((s) => s.toLowerCase() === name.toLowerCase());
    if (taken) return setError(`"${name}" is already on your list.`);
    if (shop.custom_services.length >= MAX_OTHER) return setError(`You can add up to ${MAX_OTHER} other services.`);
    setError('');
    setShop({ ...shop, custom_services: [...shop.custom_services, name] });
    setOtherDraft('');
    setAdding(false);
  };
  const removeOther = (name: string) => setShop({ ...shop, custom_services: shop.custom_services.filter((s) => s !== name) });

  // "Branches (Optional)": other locations, name + address each.
  const MAX_BRANCHES = 10;
  const addBranch = () => setShop({ ...shop, branches: [...shop.branches, { key: crypto.randomUUID(), name: '', address: '' }] });
  const updateBranch = (key: string, field: 'name' | 'address', value: string) =>
    setShop({ ...shop, branches: shop.branches.map((b) => (b.key === key ? { ...b, [field]: value } : b)) });
  const removeBranch = (key: string) => setShop({ ...shop, branches: shop.branches.filter((b) => b.key !== key) });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (shop.specializations.length === 0 && shop.custom_services.length === 0) return setError('Pick at least one service your shop offers.');
    if (!shop.location) return setError('Pin your shop on the map so customers can find it.');
    const names = shop.branches.map((b) => b.name.trim().toLowerCase());
    if (names.some((n, i) => names.indexOf(n) !== i)) return setError('Each branch needs its own name.');
    goTo(3);
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <TextField id="app-store-name" label="Shop Name" required placeholder="e.g. Dela Cruz Tailoring" value={shop.store_name} onChange={(e) => setShop({ ...shop, store_name: e.target.value })} />

      <fieldset>
        <legend className="text-sm text-ink mb-1">Services<span className="text-danger">*</span></legend>
        <p className="mobile-caption text-ink-muted mb-3">What your shop offers. Customers filter shops by these on search and the map.</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((spec) => {
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
          {shop.custom_services.map((name) => (
            <span key={name} className="inline-flex min-h-11 items-center gap-1.5 border border-ink bg-ink pl-3.5 pr-1.5 text-sm text-white">
              <Check size={14} aria-hidden="true" />
              {name}
              <button type="button" onClick={() => removeOther(name)} aria-label={`Remove ${name}`}
                className="ml-0.5 flex h-8 w-8 items-center justify-center text-white/70 hover:text-white cursor-pointer">
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
          {!adding && shop.custom_services.length < MAX_OTHER && (
            <button
              type="button"
              onClick={() => { setAdding(true); setError(''); }}
              className="inline-flex min-h-11 items-center gap-1.5 border border-dashed border-ink/60 bg-surface px-3.5 text-sm text-ink transition-colors hover:border-ink cursor-pointer"
            >
              <Plus size={14} aria-hidden="true" /> Add Other Service
            </button>
          )}
        </div>

        {adding && (
          <div className="mt-3">
            <label htmlFor="app-other-service" className="mb-1.5 block text-sm text-ink">Can&rsquo;t find your service? Type it below</label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-11 min-w-0 flex-1 basis-64 border border-line-strong bg-surface focus-within:border-ink">
                <span className="flex items-center border-r border-line bg-sunken px-3 text-sm text-ink-muted" aria-hidden="true">Your Service</span>
                <input
                  id="app-other-service"
                  autoFocus
                  value={otherDraft}
                  maxLength={40}
                  onChange={(e) => setOtherDraft(e.target.value)}
                  // Enter adds the service instead of submitting the whole step.
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOther(); } if (e.key === 'Escape') { setAdding(false); setOtherDraft(''); } }}
                  placeholder="e.g., Costume Design"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                />
              </div>
              <button type="button" onClick={() => { setAdding(false); setOtherDraft(''); setError(''); }}
                className="min-h-11 px-3 text-sm text-ink-muted hover:text-ink cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={addOther}
                className="min-h-11 bg-ink px-5 text-sm font-semibold text-white hover:bg-black cursor-pointer">
                Add
              </button>
            </div>
            <p className="mt-1.5 mobile-caption text-ink-muted">Type it here to add it to your shop. SUTURA reviews these with your application.</p>
          </div>
        )}
      </fieldset>

      <div className="space-y-5 border-t border-line pt-5">
        <TextField id="app-address" label="Street Address" required placeholder="Unit, building, street (e.g. Jasmin St)" value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} />
        {/* City / province aren't asked: SUTURA only covers Davao City, so the
            form sends its defaults (Davao City, Davao del Sur — see
            EMPTY_SHOP in applicationTypes.ts), which the server requires. */}

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

      <fieldset className="border-t border-line pt-5">
        <legend className="sr-only">Branches (Optional)</legend>
        <p className="text-sm text-ink mb-1" aria-hidden="true">Branches <span className="text-ink-muted">(Optional)</span></p>
        <p className="mobile-caption text-ink-muted mb-3">
          Branches listed here are for display on your shop profile only. Upgrading to a Premium Plan is required to activate and set up individual branches.
        </p>

        {shop.branches.length > 0 && (
          <ul className="mb-3 space-y-3">
            {shop.branches.map((branch, i) => (
              <li key={branch.key} className="border border-line bg-surface p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">Branch {i + 1}</p>
                  <button type="button" onClick={() => removeBranch(branch.key)} aria-label={`Remove branch ${i + 1}`}
                    className="flex h-9 w-9 items-center justify-center text-ink-muted hover:bg-danger/10 hover:text-danger cursor-pointer">
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField id={`app-branch-name-${branch.key}`} label="Branch Name" required maxLength={191} placeholder="e.g. Downtown Branch"
                    value={branch.name} onChange={(e) => updateBranch(branch.key, 'name', e.target.value)} />
                  <TextField id={`app-branch-address-${branch.key}`} label="Branch Address" required maxLength={255} placeholder="Unit, building, street"
                    value={branch.address} onChange={(e) => updateBranch(branch.key, 'address', e.target.value)} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {shop.branches.length < MAX_BRANCHES && (
          <button
            type="button"
            onClick={addBranch}
            className="inline-flex min-h-11 items-center gap-1.5 border border-dashed border-ink/60 bg-surface px-3.5 text-sm text-ink transition-colors hover:border-ink cursor-pointer"
          >
            <Plus size={14} aria-hidden="true" /> Add Branch
          </button>
        )}      </fieldset>

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
