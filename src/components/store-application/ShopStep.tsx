'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Check, Plus, X } from 'lucide-react';
import PinTools from '@/components/shared/PinTools';
import { STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';
import type { SavedLocation } from '@/lib/customerLocation';
import { revealField } from '@/lib/revealField';
import { areaCenter, displayAddress, EMPTY_PSGC_ADDRESS, pinOutsideCityWarning, type PsgcAddress } from '@/lib/psgc';
import AddressFields, { addressErrors } from './AddressFields';

// Registration asks only what services the shop offers (the apparel
// departments come from its catalog later). Still saved as specializations[],
// so search/map filtering works unchanged.
const SERVICE_OPTIONS = STORE_SPECIALIZATIONS.filter((s) => s.group === 'Services');
import { FIELD_CLASS, Section, StepActions, TextField } from './ApplicationFields';
import type { StoreApplicationState } from './useStoreApplication';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

// Replaces sutura2's hardcoded Davao City coordinates with a real pin —
// the map, distance sort, and branch directions all read these.
export default function ShopStep({ app }: { readonly app: StoreApplicationState }) {
  const { shop, setShop, goTo, setError } = app;
  const [pickerOpen, setPickerOpen] = useState(false);
  // "Add Service": a short typed-in service that isn't in the list.
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
    if (shop.custom_services.length >= MAX_OTHER) return setError(`You can add up to ${MAX_OTHER} services of your own.`);
    setError('');
    setShop({ ...shop, custom_services: [...shop.custom_services, name] });
    setOtherDraft('');
    setAdding(false);
  };
  const removeOther = (name: string) => setShop({ ...shop, custom_services: shop.custom_services.filter((s) => s !== name) });

  // "Branches (Optional)": other locations, name + area + street each.
  const MAX_BRANCHES = 10;
  const addBranch = () => setShop({ ...shop, branches: [...shop.branches, { key: crypto.randomUUID(), name: '', address: '', area: EMPTY_PSGC_ADDRESS }] });
  const updateBranch = (key: string, patch: Partial<{ name: string; address: string; area: PsgcAddress }>) =>
    setShop({ ...shop, branches: shop.branches.map((b) => (b.key === key ? { ...b, ...patch } : b)) });
  const removeBranch = (key: string) => setShop({ ...shop, branches: shop.branches.filter((b) => b.key !== key) });

  // Address picks: errors show once Continue was pressed. Manila-style cities need a district.
  const [showAddressErrors, setShowAddressErrors] = useState(false);
  // Set by Next: which section was missing, so its message shows right there too.
  const [missing, setMissing] = useState<'services' | 'pin' | null>(null);
  const [districtRequired, setDistrictRequired] = useState(false);
  const [branchDistrictRequired, setBranchDistrictRequired] = useState<Record<string, boolean>>({});
  const onBranchDistrictRequired = useCallback((key: string, required: boolean) =>
    setBranchDistrictRequired((m) => (m[key] === required ? m : { ...m, [key]: required })), []);

  // "Open map" starts at the chosen barangay (or city) until a pin is set.
  const [mapStart, setMapStart] = useState<SavedLocation | null>(null);
  useEffect(() => {
    if (!shop.area.city_code) { setMapStart(null); return; }
    let alive = true;
    areaCenter(shop.area).then((c) => {
      if (alive) setMapStart(c ? { ...c, address: displayAddress('', shop.area), district: shop.area.district_name } : null);
    });
    return () => { alive = false; };
  }, [shop.area]);

  // Warn (never block) when the pin looks clearly outside the chosen city.
  const [pinWarning, setPinWarning] = useState('');
  useEffect(() => {
    if (!shop.location || !shop.area.city_code) { setPinWarning(''); return; }
    let alive = true;
    pinOutsideCityWarning(shop.location, shop.area).then((w) => { if (alive) setPinWarning(w ?? ''); });
    return () => { alive = false; };
  }, [shop.location, shop.area]);

  // Each check takes the person to the field that needs fixing (lib/revealField).
  const stop = (message: string, field: string, section: 'services' | 'pin' | null = null) => {
    setMissing(section);
    setError(message);
    revealField(field);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAddressErrors(true);
    setMissing(null);
    if (shop.specializations.length === 0 && shop.custom_services.length === 0) {
      return stop('Pick at least one service your shop offers.', 'app-services', 'services');
    }
    const areaProblem = Object.keys(addressErrors(shop.area, districtRequired))[0];
    if (areaProblem) {
      return stop('Choose your province, city or municipality, and barangay.', `app-area-${areaProblem.replace('_code', '')}`);
    }
    if (!shop.location) return stop('Pin your shop on the map so customers can find it.', 'app-pin', 'pin');
    for (const b of shop.branches) {
      const branchProblem = Object.keys(addressErrors(b.area, !!branchDistrictRequired[b.key]))[0];
      if (branchProblem) {
        return stop('Each branch needs its province, city or municipality, and barangay.', `app-branch-${b.key}-${branchProblem.replace('_code', '')}`);
      }
    }
    const names = shop.branches.map((b) => b.name.trim().toLowerCase());
    const dup = names.findIndex((n, i) => names.indexOf(n) !== i);
    if (dup !== -1) return stop('Each branch needs its own name.', `app-branch-name-${shop.branches[dup].key}`);
    goTo(3);
  };

  return (
    <form onSubmit={handleNext} className="space-y-8">
      <Section label="Shop">
        <TextField id="app-store-name" label="Shop name" required placeholder="e.g. Dela Cruz Tailoring" value={shop.store_name} onChange={(e) => setShop({ ...shop, store_name: e.target.value })} />
      </Section>

      <Section
        label={<>Services<span className="text-danger" aria-hidden="true">*</span></>}
        note="What your shop offers. Customers filter shops by these on search and the map."
      >
      <fieldset data-field="app-services">
        <legend className="sr-only">Services (required)</legend>
        <div className="flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((spec) => {
            const on = shop.specializations.includes(spec.value);
            return (
              <button
                key={spec.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(spec.value)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors ${on ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface text-ink hover:border-ink'}`}
              >
                {on && <Check size={14} aria-hidden="true" />}
                {spec.label}
              </button>
            );
          })}
          {shop.custom_services.map((name) => (
            <span key={name} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ink bg-ink pl-4 pr-1.5 text-sm text-white">
              <Check size={14} aria-hidden="true" />
              {name}
              <button type="button" onClick={() => removeOther(name)} aria-label={`Remove ${name}`}
                className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:text-white cursor-pointer">
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
          {!adding && shop.custom_services.length < MAX_OTHER && (
            <button
              type="button"
              onClick={() => { setAdding(true); setError(''); }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-line-strong bg-surface px-4 text-sm text-ink transition-colors hover:border-ink cursor-pointer"
            >
              <Plus size={14} aria-hidden="true" /> Add service
            </button>
          )}
        </div>

        {adding && (
          <div className="mt-4">
            <label htmlFor="app-other-service" className="mb-2 block text-sm font-medium text-ink-body">Can&rsquo;t find your service? Type it below</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="app-other-service"
                autoFocus
                value={otherDraft}
                maxLength={40}
                onChange={(e) => setOtherDraft(e.target.value)}
                // Enter adds the service instead of submitting the whole step.
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOther(); } if (e.key === 'Escape') { setAdding(false); setOtherDraft(''); } }}
                placeholder="e.g. Costume Design"
                className={`${FIELD_CLASS} min-w-0 flex-1 basis-64`}
              />
              <button type="button" onClick={() => { setAdding(false); setOtherDraft(''); setError(''); }}
                className="min-h-11 rounded-xl px-4 text-sm text-ink-muted hover:text-ink cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={addOther}
                className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink/85 cursor-pointer">
                Add
              </button>
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">Type it here to add it to your shop. SUTURA reviews these with your application.</p>
          </div>
        )}
        {missing === 'services' && shop.specializations.length === 0 && shop.custom_services.length === 0 && (
          <p className="mt-3 text-xs text-danger">Pick at least one service your shop offers.</p>
        )}
      </fieldset>
      </Section>

      <Section label="Location">
        <div className="space-y-5">
          <AddressFields
            idPrefix="app-area"
            value={shop.area}
            onChange={(area) => { setError(''); setShop({ ...shop, area }); }}
            showErrors={showAddressErrors}
            onDistrictRequiredChange={setDistrictRequired}
          />
          <TextField id="app-address" label="Street address" required placeholder="Unit, building, street (e.g. Jasmin St)" value={shop.address} onChange={(e) => setShop({ ...shop, address: e.target.value })} />
          {shop.area.barangay_code && shop.address.trim() && (
            <p className="text-xs leading-relaxed text-ink-muted">
              Shown to customers as: <span className="text-ink">{displayAddress(shop.address, shop.area)}</span>
            </p>
          )}
        </div>
      </Section>

      <section data-field="app-pin">
        <h3 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Map pin<span className="text-danger" aria-hidden="true">*</span>
        </h3>
        <PinTools
          variant="list"
          current={shop.location}
          onPickOnMap={() => setPickerOpen(true)}
          onPin={(pin) => { setError(''); setShop({ ...shop, location: pin }); }}
        />
        {missing === 'pin' && !shop.location && (
          <p className="mt-2 px-1 text-xs text-danger">Pin your shop on the map so customers can find it.</p>
        )}
        {!shop.location && mapStart && (
          <p className="mt-2 px-1 text-xs text-ink-muted">At your shop now? Use your current location. Otherwise the map opens at {shop.area.barangay_name || shop.area.city_name} — move the pin to your exact shop.</p>
        )}
        {pinWarning && (
          <p role="status" className="mt-2.5 flex gap-2 rounded-xl border border-alert/40 bg-alert/5 px-3.5 py-2.5 text-xs text-ink">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-alert" aria-hidden="true" />
            {pinWarning}
          </p>
        )}
      </section>

      <fieldset>
        <legend className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Branches <span className="font-normal normal-case tracking-normal text-ink-faint">· Optional</span>
        </legend>

        {shop.branches.length > 0 && (
          <ul className="mb-3 space-y-3">
            {shop.branches.map((branch, i) => (
              <li key={branch.key} className="rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(45,42,38,0.04)] sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">Branch {i + 1}</p>
                  <button type="button" onClick={() => removeBranch(branch.key)} aria-label={`Remove branch ${i + 1}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-danger/10 hover:text-danger cursor-pointer">
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="space-y-5">
                  <TextField id={`app-branch-name-${branch.key}`} label="Branch name" required maxLength={191} placeholder="e.g. Downtown Branch"
                    value={branch.name} onChange={(e) => updateBranch(branch.key, { name: e.target.value })} />
                  <AddressFields
                    idPrefix={`app-branch-${branch.key}`}
                    value={branch.area}
                    onChange={(area) => { setError(''); updateBranch(branch.key, { area }); }}
                    showErrors={showAddressErrors}
                    onDistrictRequiredChange={(required) => onBranchDistrictRequired(branch.key, required)}
                  />
                  <TextField id={`app-branch-address-${branch.key}`} label="Street address" required maxLength={255} placeholder="Unit, building, street"
                    value={branch.address} onChange={(e) => updateBranch(branch.key, { address: e.target.value })} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {shop.branches.length < MAX_BRANCHES && (
          <button
            type="button"
            onClick={addBranch}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-sunken px-4 text-sm font-semibold text-ink transition-colors hover:bg-sunken-hover cursor-pointer"
          >
            <Plus size={14} aria-hidden="true" /> Add branch
          </button>
        )}
        <p className="mt-2.5 px-1 text-xs leading-relaxed text-ink-muted">
          Branches listed here are for display on your shop profile only. Upgrading to a Premium Plan is required to activate and set up individual branches.
        </p>
      </fieldset>

      <StepActions onBack={() => goTo(1)} nextLabel="Continue" />

      {pickerOpen && (
        <LocationPicker
          initial={shop.location ?? mapStart}
          confirmLabel="Confirm Shop Location"
          onClose={() => setPickerOpen(false)}
          onConfirm={(loc) => {
            setError('');
            // The street stays as typed: barangay/city/province now come from the pickers.
            setShop({ ...shop, location: loc });
            setPickerOpen(false);
          }}
        />
      )}
    </form>
  );
}
