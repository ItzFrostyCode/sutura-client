'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Check, Plus, X } from 'lucide-react';
import PinTools from '@/components/shared/PinTools';
import { offeredSpecializations, STORE_SPECIALIZATIONS } from '@/lib/storeSpecializations';
import type { SavedLocation } from '@/lib/customerLocation';
import { areaCenter, displayAddress, EMPTY_PSGC_ADDRESS as EMPTY_AREA, pinOutsideCityWarning, type PsgcAddress } from '@/lib/psgc';
import AddressFields, { addressErrors, DAVAO_AREA } from './AddressFields';

// Registration asks only what services the shop offers (the apparel
// departments come from its catalog later). Still saved as specializations[],
// so search/map filtering works unchanged.
const SERVICE_OPTIONS = STORE_SPECIALIZATIONS.filter((s) => s.group === 'Services');
import { BTN_PILL, BTN_PRIMARY, enterMovesOn, FIELD, FieldError, Group, Req, revealFirstProblem, StepActions, TextField } from './ApplicationFields';
import type { StoreApplicationState } from './useStoreApplication';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

// Replaces sutura2's hardcoded Davao City coordinates with a real pin —
// the map, distance sort, and branch directions all read these.
// Every problem on this step, keyed by the element id it belongs to (page order is worked out when shown).
function shopErrors(shop: StoreApplicationState['shop']): Record<string, string> {
  const e: Record<string, string> = {};
  if (!shop.store_name.trim()) e['app-store-name'] = 'Enter your shop’s name.';
  if (shop.specializations.length === 0 && shop.custom_services.length === 0) e['app-services'] = 'Pick at least one service your shop offers.';
  const area = addressErrors(shop.area);
  if (area.city_code) e['app-area-city'] = area.city_code;
  if (area.district_code) e['app-area-district'] = area.district_code;
  if (area.barangay_code) e['app-area-barangay'] = area.barangay_code;
  if (!shop.address.trim()) e['app-address'] = 'Enter the street address (unit, building, street).';
  if (!shop.location) e['app-pin'] = 'Set your shop’s pin: use Current location or Choose on map.';
  const seen = new Set<string>();
  shop.branches.forEach((b) => {
    const name = b.name.trim().toLowerCase();
    if (!name) e[`app-branch-name-${b.key}`] = 'Enter the branch name.';
    else if (seen.has(name)) e[`app-branch-name-${b.key}`] = 'Each branch needs its own name.';
    seen.add(name);
    const ba = addressErrors(b.area);
    if (ba.district_code) e[`app-branch-${b.key}-district`] = ba.district_code;
    if (ba.barangay_code) e[`app-branch-${b.key}-barangay`] = ba.barangay_code;
    if (!b.address.trim()) e[`app-branch-address-${b.key}`] = 'Enter the branch’s street address.';
  });
  return e;
}

export default function ShopStep({ app }: { readonly app: StoreApplicationState }) {
  const { shop, setShop, goTo, setError } = app;
  // After the first Continue, problems show (and clear) as the owner types.
  const [tried, setTried] = useState(false);
  const errors: Record<string, string> = { ...app.serverErrors, ...(tried ? shopErrors(shop) : {}) };
  const [pickerOpen, setPickerOpen] = useState(false);
  // "Add Service": a short typed-in service that isn't in the list.
  const [adding, setAdding] = useState(false);
  const [otherDraft, setOtherDraft] = useState('');
  const [otherError, setOtherError] = useState('');
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
    if (name.length < 2) return setOtherError('Type the service name (at least 2 letters).');
    if (name.length > 40) return setOtherError('Keep the service name under 40 characters.');
    const taken = [...shop.custom_services, ...SERVICE_OPTIONS.map((o) => o.label)]
      .some((s) => s.toLowerCase() === name.toLowerCase());
    if (taken) return setOtherError(`"${name}" is already on your list.`);
    if (shop.custom_services.length >= MAX_OTHER) return setOtherError(`You can add up to ${MAX_OTHER} services of your own.`);
    setOtherError('');
    setShop({ ...shop, custom_services: [...shop.custom_services, name] });
    setOtherDraft('');
    setAdding(false);
  };
  const removeOther = (name: string) => setShop({ ...shop, custom_services: shop.custom_services.filter((s) => s !== name) });

  // "Branches (Optional)": other locations, name + area + street each.
  const MAX_BRANCHES = 10;
  // crypto.randomUUID needs https; a phone opening the site by its network address (http) doesn't have it.
  const newKey = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);
  const addBranch = () => setShop({ ...shop, branches: [...shop.branches, { key: newKey(), name: '', address: '', area: { ...EMPTY_AREA, ...DAVAO_AREA } }] });
  const updateBranch = (key: string, patch: Partial<{ name: string; address: string; area: PsgcAddress }>) =>
    setShop({ ...shop, branches: shop.branches.map((b) => (b.key === key ? { ...b, ...patch } : b)) });
  const removeBranch = (key: string) => setShop({ ...shop, branches: shop.branches.filter((b) => b.key !== key) });

  // A service the list no longer has can't stay picked out of sight (the server would refuse the whole application).
  useEffect(() => {
    const offered = offeredSpecializations(shop.specializations);
    if (offered.length !== shop.specializations.length) setShop((s) => ({ ...s, specializations: offeredSpecializations(s.specializations) }));
  }, [shop.specializations, setShop]);

  // Stable handlers for the address pickers (they keep their lists in sync with the value).
  const onArea = useCallback((area: PsgcAddress) => { setError(''); setShop((s) => ({ ...s, area })); }, [setError, setShop]);
  const onBranchArea = useCallback((key: string, area: PsgcAddress) =>
    setShop((s) => ({ ...s, branches: s.branches.map((b) => (b.key === key ? { ...b, area } : b)) })), [setShop]);

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

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    app.clearServerErrors();
    setTried(true);
    const problems = shopErrors(shop);
    if (Object.keys(problems).length > 0) { revealFirstProblem(Object.keys(problems)); return; }
    goTo(3);
  };

  return (
    <form onSubmit={handleNext} onKeyDown={enterMovesOn} noValidate className="space-y-7">
      <Group title="Shop">
        <TextField id="app-store-name" label="Shop name" required placeholder="e.g. Dela Cruz Tailoring" value={shop.store_name}
          error={errors['app-store-name']} onChange={(e) => setShop({ ...shop, store_name: e.target.value })} />
      </Group>

      <Group id="app-services" title="Services" required invalid={!!errors['app-services']}
        footer={errors['app-services'] ? <FieldError id="app-services-error" message={errors['app-services']} /> : 'What your shop offers. Customers filter shops by these on search and the map.'}>
        <div className="flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((spec) => {
            const on = shop.specializations.includes(spec.value);
            return (
              <button
                key={spec.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(spec.value)}
                className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[15px] transition-colors active:scale-[0.97] ${on ? 'bg-ink text-white' : 'bg-sunken text-ink hover:bg-line/70'}`}
              >
                {on && <Check size={15} strokeWidth={2.5} aria-hidden="true" />}
                {spec.label}
              </button>
            );
          })}
          {shop.custom_services.map((name) => (
            <span key={name} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink pl-4 pr-1.5 text-[15px] text-white">
              <Check size={15} strokeWidth={2.5} aria-hidden="true" />
              {name}
              <button type="button" onClick={() => removeOther(name)} aria-label={`Remove ${name}`}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-white/75 hover:bg-white/15 hover:text-white">
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
          {!adding && shop.custom_services.length < MAX_OTHER && (
            <button
              type="button"
              onClick={() => { setAdding(true); setOtherError(''); }}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-line-strong px-4 text-[15px] text-ink hover:bg-sunken"
            >
              <Plus size={15} aria-hidden="true" /> Add service
            </button>
          )}
        </div>

        {adding && (
          <div>
            <label htmlFor="app-other-service" className="mb-1.5 block text-[13px] font-medium text-ink-body">Can&rsquo;t find your service? Type it</label>
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
                className={`${FIELD} min-w-0 flex-1 basis-56`}
              />
              <button type="button" onClick={() => { setAdding(false); setOtherDraft(''); setOtherError(''); }}
                className="min-h-12 cursor-pointer rounded-xl px-4 text-[15px] font-semibold text-ink-muted hover:text-ink">
                Cancel
              </button>
              <button type="button" onClick={addOther} className={BTN_PRIMARY}>Add</button>
            </div>
            {otherError
              ? <FieldError id="app-other-service-error" message={otherError} />
              : <p className="mt-1.5 text-[13px] text-ink-muted">SUTURA reviews these with your application.</p>}
          </div>
        )}
      </Group>

      <Group title="Location">
        <AddressFields idPrefix="app-area" value={shop.area} onChange={onArea} showErrors={tried} />
        <TextField id="app-address" label="Street address" required placeholder="Unit, building, street (e.g. Jasmin St)" value={shop.address}
          error={errors['app-address']} onChange={(e) => setShop({ ...shop, address: e.target.value })} />
        {shop.area.barangay_code && shop.address.trim() && (
          <p className="text-[13px] text-ink-muted">
            Shown to customers as: <span className="text-ink">{displayAddress(shop.address, shop.area)}</span>
          </p>
        )}
      </Group>

      <section id="app-pin" data-field="app-pin" className="scroll-mt-24">
        <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Map pin<Req /></h3>
        <PinTools
          variant="rounded"
          current={shop.location}
          onPickOnMap={() => setPickerOpen(true)}
          onPin={(pin) => { setError(''); setShop({ ...shop, location: pin }); }}
        />
        <FieldError id="app-pin-error" message={errors['app-pin']} />
        {!shop.location && mapStart && (
          <p className="mt-2 px-1 text-[13px] text-ink-muted">At your shop now? Use your current location. Otherwise the map opens at {shop.area.barangay_name || shop.area.city_name}; move the pin to your exact shop.</p>
        )}
        {pinWarning && (
          <p role="status" className="mt-2 flex gap-2 rounded-xl bg-alert/10 px-3 py-2.5 text-[13px] text-ink">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-alert" aria-hidden="true" />
            {pinWarning}
          </p>
        )}
      </section>

      <section id="app-branches" data-field="app-branches" className="scroll-mt-24">
        <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-muted">Branches <span className="font-normal normal-case tracking-normal">· Optional</span></h3>
        {shop.branches.length > 0 && (
          <ul className="mb-3 space-y-3">
            {shop.branches.map((branch, i) => (
              <li key={branch.key} className="space-y-5 rounded-2xl bg-surface p-4 ring-1 ring-line/80 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-semibold text-ink">Branch {i + 1}</p>
                  <button type="button" onClick={() => removeBranch(branch.key)} aria-label={`Remove branch ${i + 1}`}
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-danger/10 hover:text-danger">
                    <X size={17} aria-hidden="true" />
                  </button>
                </div>
                <TextField id={`app-branch-name-${branch.key}`} label="Branch name" required maxLength={191} placeholder="e.g. Downtown Branch"
                  error={errors[`app-branch-name-${branch.key}`]} value={branch.name} onChange={(e) => updateBranch(branch.key, { name: e.target.value })} />
                <BranchArea branchKey={branch.key} value={branch.area} onChange={onBranchArea} showErrors={tried} />
                <TextField id={`app-branch-address-${branch.key}`} label="Street address" required maxLength={255} placeholder="Unit, building, street"
                  error={errors[`app-branch-address-${branch.key}`]} value={branch.address} onChange={(e) => updateBranch(branch.key, { address: e.target.value })} />
              </li>
            ))}
          </ul>
        )}
        {shop.branches.length < MAX_BRANCHES && (
          <button type="button" onClick={addBranch} className={BTN_PILL}>
            <Plus size={15} aria-hidden="true" /> Add branch
          </button>
        )}
        <FieldError id="app-branches-error" message={errors['app-branches']} />
        <p className="mt-2 px-1 text-[13px] leading-relaxed text-ink-muted">
          Branches listed here are for display on your shop profile only. Upgrading to a Premium Plan is required to activate and set up individual branches.
        </p>
      </section>

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

/** One branch's address pickers, with a change handler that stays the same between renders. */
function BranchArea({ branchKey, value, onChange, showErrors }: Readonly<{
  branchKey: string; value: PsgcAddress; onChange: (key: string, area: PsgcAddress) => void; showErrors: boolean;
}>) {
  const change = useCallback((area: PsgcAddress) => onChange(branchKey, area), [branchKey, onChange]);
  return <AddressFields idPrefix={`app-branch-${branchKey}`} value={value} onChange={change} showErrors={showErrors} />;
}
