import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Plus, Ruler, Scissors, Sparkles, User, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Appointment, CustomerData, BranchData, StaffData, ServiceData, AppointmentType,
  TYPE_CONFIG, TYPE_DEFAULT_DURATIONS, getLocalDateString
} from './appointmentHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';
import CustomerPicker from './CustomerPicker';
import { WizardBar, WizardProgress } from './VisitWizardChrome';
import VisitItemPicker from './VisitItemPicker';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';
import PurposeLabelField from './PurposeLabelField';
import BookingTypeSelector from '@/components/booking/steps/schedule/BookingTypeSelector';
import { buildBookingTypes } from '@/components/booking/bookingTypes';
import RequestedItemsSection from '@/components/booking/RequestedItemsSection';
import type { CatalogDesignItem } from '@/components/booking/AddRequestedItemModal';
import type { RequestedServiceItem } from '@/store/useRequestedItemsStore';
import type { Service } from '@/components/booking/types';

interface AppointmentCreateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingApt?: Appointment | null;
  /** A customer to start with (Book appointment from their profile). */
  readonly presetCustomerId?: string;
  readonly customers?: CustomerData[];
  readonly branches?: BranchData[];
  readonly staff?: StaffData[];
  readonly services?: ServiceData[];
  readonly appointments?: Appointment[];
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly onCreateCustomer: (payload: Record<string, string | null>) => Promise<CustomerData>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

// Only these represent genuinely occupied time
const OCCUPYING_STATUSES = new Set(['pending', 'confirmed', 'in_progress']);

const SHOP_HINTS: Record<string, string> = {
  consultation: 'Talk through the garment idea, materials, design, and pricing.',
  measurement: 'Take the customer’s measurements in person.',
  alteration: 'The customer brings a garment to adjust or repair.',
  other: 'Something else, like choosing fabric or answering a question. Say what it is for.',
};

const defaultForm = {
  customer_id: '',
  appointment_type: 'consultation' as AppointmentType,
  purpose_label: '',
  when: 'later' as 'now' | 'later',
  store_branch_id: '',
  scheduled_date: '',
  scheduled_time: '',
  duration_minutes: String(TYPE_DEFAULT_DURATIONS.consultation),
  assigned_staff_id: '',
  notes: '',
};

export default function AppointmentCreateModal({
  isOpen,
  onClose,
  editingApt,
  presetCustomerId = '',
  customers = [],
  branches = [],
  staff = [],
  services = [],
  appointments = [],
  onSubmit,
  onCreateCustomer,
  isSubmitting,
  error,
}: AppointmentCreateModalProps) {
  const [formData, setFormData] = useState(defaultForm);
  const [walkInItems, setWalkInItems] = useState<RequestedServiceItem[]>([]);
  const { selectedBranchId } = useBranch();
  const { store, user } = useAuthStore();
  const storeOwner = store?.owner ?? (user?.roles?.some(r => r.name === 'store_owner') ? { id: user.id, name: user.name } : null);

  // 3-step wizard matching customer booking flow (Details -> Schedule -> Review)
  const [step, setStep] = useState(1);

  // Exclude the appointment being edited from its own conflict check
  const calendarAppointments = appointments
    .filter(a => OCCUPYING_STATUSES.has(a.status) && a.id !== editingApt?.id)
    .map(a => ({
      scheduled_at: a.scheduled_at,
      duration_minutes: a.duration_minutes,
      store_branch_id: a.store_branch_id ?? null,
      // A request a customer made online and is waiting on holds its time, as it does on the customer's own calendar.
      status: a.status === 'pending' ? 'confirmed' : a.status,
    }));

  // Quick "Add New Customer" for first-time walk-ins
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [addCustomerError, setAddCustomerError] = useState('');

  const handleAddCustomer = async (payload: Record<string, string | null>) => {
    setAddingCustomer(true);
    setAddCustomerError('');
    try {
      const newCustomer = await onCreateCustomer(payload);
      setFormData(prev => ({ ...prev, customer_id: newCustomer.id.toString() }));
      setShowAddCustomer(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAddCustomerError(e.response?.data?.message || 'Failed to create customer.');
    } finally {
      setAddingCustomer(false);
    }
  };

  // Seeding form data and requested items on open or edit
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);

    if (editingApt) {
      const d = new Date(editingApt.scheduled_at);
      const custId = editingApt.customer?.id?.toString() || '';
      const localDate = getLocalDateString(d);
      const today = getLocalDateString(new Date());

      setFormData({
        customer_id: custId,
        appointment_type: editingApt.appointment_type,
        purpose_label: editingApt.purpose_label || '',
        when: 'later',
        store_branch_id: editingApt.store_branch_id?.toString() || '',
        scheduled_date: localDate < today ? today : localDate,
        scheduled_time: d.toTimeString().substring(0, 5),
        duration_minutes: (editingApt.duration_minutes || TYPE_DEFAULT_DURATIONS[editingApt.appointment_type]).toString(),
        assigned_staff_id: editingApt.assigned_staff_id?.toString() || '',
        notes: editingApt.notes || '',
      });

      if (editingApt.items && editingApt.items.length > 0) {
        setWalkInItems(editingApt.items.map(it => ({
          id: `apt-item-${it.id}`,
          storeId: store?.id ? String(store.id) : '',
          serviceId: it.service_id ?? null,
          serviceName: it.service?.name ?? null,
          catalogItemId: it.catalog_item_id ?? null,
          catalogItemName: it.catalog_item?.name ?? null,
          name: it.item_name,
          quantity: it.quantity,
          minQuantity: 1,
          basePrice: it.unit_price ? Number(it.unit_price) : null,
          selectedSize: it.selected_size ?? null,
          selectedColor: it.selected_color ?? null,
          addOns: it.add_ons || [],
          notes: it.notes ?? null,
        })));
      } else if (editingApt.service) {
        setWalkInItems([{
          id: `apt-svc-${editingApt.service.id}`,
          storeId: store?.id ? String(store.id) : '',
          serviceId: editingApt.service.id,
          serviceName: editingApt.service.name,
          name: editingApt.service.name,
          quantity: 1,
          minQuantity: 1,
          basePrice: null,
          addOns: [],
        }]);
      } else {
        setWalkInItems([]);
      }
    } else {
      const defaultBranchId = selectedBranchId?.toString() || '';
      const today = getLocalDateString(new Date());
      setFormData({
        ...defaultForm,
        customer_id: presetCustomerId,
        scheduled_date: today,
        store_branch_id: defaultBranchId || (branches.length === 1 ? branches[0].id.toString() : '')
      });
      setWalkInItems([]);
    }
  }, [editingApt, isOpen, customers, branches, selectedBranchId, presetCustomerId, store?.id]);

  // The purposes of a visit, worded for the shop. A customer can only ask for a consultation, but the shop can also book a
  // measurement (it needs a service: there is nothing to measure without one).
  const availableBookingTypes = useMemo(() => {
    const firstItem = walkInItems[0];
    const kind = walkInItems.length > 0 ? 'service' : 'shop';
    const list = buildBookingTypes({
      kind,
      refName: firstItem?.catalogItemId ? firstItem.name : null,
      selectedService: (firstItem?.serviceId
        ? services.find(s => s.id === firstItem.serviceId)
        : null) as unknown as Service | null,
      serviceIdParam: firstItem?.serviceId ? String(firstItem.serviceId) : null,
      serviceNameParam: firstItem?.serviceName || null,
    }).map((t) => ({ ...t, hint: SHOP_HINTS[t.value] ?? t.hint }));
    if (kind === 'service' && !list.some((t) => t.value === 'measurement' || t.value === 'alteration')) {
      list.splice(1, 0, { value: 'measurement', label: 'Measurement', duration: 60, icon: React.createElement(Ruler, { size: 18 }), hint: SHOP_HINTS.measurement });
    }
    return list;
  }, [walkInItems, services]);

  // Auto-adjust appointment_type if current selection is not available
  useEffect(() => {
    if (availableBookingTypes.length > 0) {
      const isCurrentValid = availableBookingTypes.some(t => t.value === formData.appointment_type);
      if (!isCurrentValid) {
        const nextType = availableBookingTypes[0].value as AppointmentType;
        setFormData(prev => ({
          ...prev,
          appointment_type: nextType,
          duration_minutes: String(TYPE_DEFAULT_DURATIONS[nextType] || 60),
        }));
      }
    }
  }, [availableBookingTypes, formData.appointment_type]);

  // Handlers for adding and managing requested items
  const handleAddService = (service: Service, quantity = 1, customDetails?: string) => {
    const newItem: RequestedServiceItem = {
      id: `walkin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      storeId: store?.id ? String(store.id) : '',
      serviceId: service.id,
      serviceName: service.name,
      name: service.name,
      quantity: Math.max(service.min_order_qty || 1, quantity),
      minQuantity: service.min_order_qty || 1,
      basePrice: typeof service.base_price === 'number' ? service.base_price : Number(service.base_price) || null,
      addOns: [],
      customDetails: customDetails || null,
      notes: customDetails || null,
    };
    setWalkInItems([newItem]); // one service (and optionally one of its designs) per appointment
  };

  const handleAddCatalogDesign = (
    item: CatalogDesignItem,
    options: { quantity: number; size?: string; color?: string; customDetails?: string }
  ) => {
    const parentService = item.service_id
      ? services.find(s => s.id === item.service_id)
      : null;

    const primaryImage = item.images?.find(img => img.is_primary)?.image_url
      || item.images?.[0]?.image_url
      || null;

    const newItem: RequestedServiceItem = {
      id: `walkin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      storeId: store?.id ? String(store.id) : '',
      serviceId: item.service_id ?? parentService?.id ?? null,
      serviceName: parentService?.name ?? item.service?.name ?? null,
      catalogItemId: item.id,
      catalogItemName: item.name,
      name: item.name,
      image: primaryImage,
      selectedSize: options.size || null,
      selectedColor: options.color || null,
      quantity: Math.max(1, options.quantity || 1),
      minQuantity: 1,
      basePrice: typeof item.price === 'number' ? item.price : Number(item.price) || null,
      addOns: [],
      customDetails: options.customDetails || null,
      notes: options.customDetails || null,
    };
    setWalkInItems([newItem]); // one service (and optionally one of its designs) per appointment
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    setWalkInItems(prev => prev.map(it => it.id === id ? { ...it, quantity: qty } : it));
  };

  const handleRemoveItem = (id: string) => {
    setWalkInItems(prev => prev.filter(it => it.id !== id));
  };

  const step1Valid = !!formData.customer_id && !!formData.appointment_type
    && (!['other', 'alteration'].includes(formData.appointment_type) || formData.purpose_label.trim() !== '');

  const step2Valid = formData.when === 'now' || (!!formData.scheduled_date && !!formData.scheduled_time);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (step !== 3) return; // Enter in a field on an earlier step must not book the visit
    const now = new Date();
    const date = formData.when === 'now' ? getLocalDateString(now) : formData.scheduled_date;
    const time = formData.when === 'now' ? now.toTimeString().substring(0, 5) : formData.scheduled_time;

    const hasItems = walkInItems.length > 0;
    const effectiveKind = hasItems ? 'service' : 'shop';
    const firstItem = walkInItems[0];

    const itemsPayload = walkInItems.map(it => ({
      service_id: it.serviceId || null,
      catalog_item_id: it.catalogItemId || null,
      item_name: it.name,
      quantity: it.quantity,
      selected_size: it.selectedSize || null,
      selected_color: it.selectedColor || null,
      add_ons: it.addOns || null,
      notes: it.notes || it.customDetails || null,
    }));

    // A walk-in is already marked by its channel; the notes keep only what was typed.
    const notesPayload = formData.notes || '';

    const common = {
      customer_id: formData.customer_id,
      kind: effectiveKind,
      appointment_type: formData.appointment_type,
      purpose_label: ['other', 'alteration'].includes(formData.appointment_type) ? formData.purpose_label.trim() : null,
      scheduled_at: `${date} ${time}:00`,
      notes: notesPayload || null,
      store_branch_id: formData.store_branch_id || null,
      assigned_staff_id: formData.assigned_staff_id || null,
      service_id: firstItem?.serviceId || null,
      catalog_item_id: firstItem?.catalogItemId || null,
      selected_size: firstItem?.selectedSize || null,
      selected_color: firstItem?.selectedColor || null,
      items: itemsPayload.length > 0 ? itemsPayload : undefined,
    };

    onSubmit(editingApt
      ? { ...common, duration_minutes: Number.parseInt(formData.duration_minutes, 10) || TYPE_DEFAULT_DURATIONS[formData.appointment_type] }
      : common);
  };

  const selectedCustomer = customers.find(c => String(c.id) === String(formData.customer_id));

  return (
    <>
      <Modal
        isOpen={isOpen} onClose={onClose} title={editingApt ? 'Edit Appointment' : 'Schedule a visit'} maxWidth="max-w-2xl"
        footer={
          <WizardBar
            step={step as 1 | 2 | 3} formId="visit-form" submitting={isSubmitting} submitLabel={editingApt ? 'Save changes' : 'Confirm appointment'}
            nextLabel={step === 1 ? 'Continue' : 'Review & Confirm'} nextDisabled={step === 1 ? !step1Valid : step === 2 ? !step2Valid : false}
            onNext={() => setStep(step === 1 ? 2 : 3)}
          />
        }
        onBack={() => (step === 1 ? onClose() : setStep(step === 3 ? 2 : 1))}
      >
        <form id="visit-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <WizardProgress step={step as 1 | 2 | 3} store={store?.name} />

          {/* ── STEP 1: Client & Purpose (Identical to Online Booking + Walk-in Client Picker) ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="mobile-h2 text-ink">Who is it for?</h2>
              {/* 1. Customer selection */}
              <div>
                <CustomerPicker
                  customers={customers}
                  value={formData.customer_id}
                  onChange={(id) => setFormData(prev => ({ ...prev, customer_id: id }))}
                  onAdd={() => setShowAddCustomer(true)}
                />
              </div>

              {/* 2. Purpose of Visit (BookingTypeSelector from Online Booking) */}
              <div>
                <BookingTypeSelector
                  title="What is the visit for?"
                  availableBookingTypes={availableBookingTypes}
                  appointmentType={formData.appointment_type}
                  onSelectType={(val) => {
                    const nextType = val as AppointmentType;
                    setFormData(prev => ({
                      ...prev,
                      appointment_type: nextType,
                      duration_minutes: String(TYPE_DEFAULT_DURATIONS[nextType] || 60),
                    }));
                  }}
                />
                {formData.appointment_type === 'other' && (
                  <div className="mt-2.5">
                    <PurposeLabelField
                      value={formData.purpose_label}
                      onChange={(v) => setFormData(prev => ({ ...prev, purpose_label: v }))}
                      label="What is it for?"
                      placeholder="e.g. Fabric selection, Inquiry, Custom question"
                      helperText="Tell the tailor what your visit is about"
                    />
                  </div>
                )}
                {formData.appointment_type === 'alteration' && (
                  <div className="mt-2.5">
                    <PurposeLabelField
                      value={formData.purpose_label}
                      onChange={(v) => setFormData(prev => ({ ...prev, purpose_label: v }))}
                      label="What is it for?"
                      placeholder="e.g. Barong hem shortening, Replace zipper, Suit resizing"
                      helperText="Specify the garment and adjustment needed"
                    />
                  </div>
                )}
              </div>

              {/* 3. Service, then its design (optional): the same grids the job order uses */}
              <div className="border-t border-line pt-4">
                <VisitItemPicker
                  storeKey={store?.slug || String(store?.id || '')}
                  services={services as unknown as Service[]}
                  selected={walkInItems[0] ?? null}
                  onService={(svc) => handleAddService(svc, walkInItems[0]?.quantity ?? 1)}
                  onDesign={(d, svc) => (d ? handleAddCatalogDesign(d, { quantity: walkInItems[0]?.quantity ?? 1 }) : handleAddService(svc, walkInItems[0]?.quantity ?? 1))}
                  onQuantity={(qty) => walkInItems[0] && handleUpdateQuantity(walkInItems[0].id, qty)}
                  onClear={() => setWalkInItems([])}
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Schedule ────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="mobile-h2 text-ink">Pick a time</h2>
              <p className="text-xs text-ink-muted">Pick an open date and time slot from the store calendar. For a customer who is here now, use <strong>Start consultation</strong> instead.</p>

              <div className="flex items-center gap-2 text-xs text-ink-body bg-canvas/50 border border-line p-2.5 rounded-lg">
                <Clock size={14} className="text-taupe shrink-0" />
                <span>
                  Expected Duration:{' '}
                  <span className="font-semibold text-ink">{formData.duration_minutes} minutes</span>{' '}
                  (auto-set for {TYPE_CONFIG[formData.appointment_type]?.label || 'Consultation'})
                </span>
              </div>

              {/* Items Compact Preview */}
              {walkInItems.length > 0 && (
                <div className="pt-1">
                  <RequestedItemsSection
                    items={walkInItems}
                    storeSettings={{ name: store?.name || '', services: services as unknown as Service[] }}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    allowEdit={false}
                    compact={true}
                  />
                </div>
              )}

              {/* Interactive Calendar */}
              {(
                <div>
                  <InteractiveCalendar
                    selectedBranchId={formData.store_branch_id || null}
                    durationMinutes={Number.parseInt(formData.duration_minutes, 10) || 60}
                    operatingHours={store?.operating_hours ?? null}
                    specialHours={store?.special_hours ?? null}
                    appointments={calendarAppointments}
                    loadingAppts={false}
                    selectedDate={formData.scheduled_date}
                    selectedTime={formData.scheduled_time}
                    mode="walk_in"
                    onDateChange={date => setFormData(prev => ({ ...prev, scheduled_date: date }))}
                    onTimeChange={time => setFormData(prev => ({ ...prev, scheduled_time: time }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Review & Staff Assignment ──────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="mobile-h2 text-ink">Review</h2>
              {/* Assign Handler / Staff */}
              {(storeOwner || staff.length > 0) && (() => {
                const effectiveBranchId = formData.store_branch_id ? Number(formData.store_branch_id) : selectedBranchId;
                const branchStaff = staff.filter(s => {
                  const staffBranchId = s.branch?.id ?? s.store_branch_id;
                  if (effectiveBranchId && staffBranchId && Number(staffBranchId) !== Number(effectiveBranchId)) {
                    return false;
                  }
                  if (storeOwner && Number(s.user_id) === Number(storeOwner.id)) {
                    return false;
                  }
                  return true;
                });
                const branchManagers = branchStaff.filter(s => s.is_branch_manager);
                const regularStaff = branchStaff.filter(s => !s.is_branch_manager);

                return (
                  <div>
                    <label htmlFor="assigned_staff_id" className="block text-sm font-medium text-ink-body mb-1">
                      Assigned Handler / Tailor <span className="text-ink-faint text-xs font-normal">(Optional)</span>
                    </label>
                    <select
                      id="assigned_staff_id"
                      value={formData.assigned_staff_id}
                      onChange={e => setFormData({ ...formData, assigned_staff_id: e.target.value })}
                      className="w-full bg-canvas border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
                    >
                      <option value="">Unassigned</option>
                      {storeOwner && (
                        <option value={storeOwner.id}>
                          {storeOwner.name} — Shop Owner
                        </option>
                      )}
                      {branchManagers.map(s => (
                        <option key={`bm-${s.user_id}`} value={s.user_id}>
                          {s.user?.name || `Manager #${s.user_id}`} — Branch Manager
                        </option>
                      ))}
                      {regularStaff.map(s => {
                        const roles = [s.role, ...(s.additional_roles || [])].filter((r): r is string => Boolean(r)).map(roleLabel).join(', ');
                        const name = s.user?.name || `Staff #${s.user_id}`;
                        return (
                          <option key={`staff-${s.user_id}`} value={s.user_id}>
                            {name} {roles ? `— ${roles}` : '— Staff'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })()}

              {/* Branch Selection (if multi-branch) */}
              {branches.length > 1 && (
                <div>
                  <label htmlFor="store_branch_id" className="block text-sm font-medium text-ink-body mb-1">
                    Store Branch
                  </label>
                  <select
                    id="store_branch_id"
                    value={formData.store_branch_id}
                    onChange={e => setFormData({ ...formData, store_branch_id: e.target.value })}
                    className="w-full bg-canvas border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
                  >
                    <option value="">Select Branch</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-ink-body mb-1">
                  Appointment Notes <span className="text-ink-faint text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-canvas border border-line rounded-lg px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe resize-none"
                  placeholder="Special instructions, design requests, or customer remarks..."
                />
              </div>

              {/* Summary Overview */}
              <div className="p-4 bg-surface border border-line rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <span className="font-semibold text-ink text-sm">Appointment Overview</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-taupe/10 text-taupe uppercase tracking-wider">
                    Confirmed
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-ink-body pt-1">
                  <div>
                    <span className="text-ink-faint block text-[11px]">Client:</span>
                    <span className="font-semibold text-ink">{selectedCustomer?.name || 'Walk-in Customer'}</span>
                    {selectedCustomer?.phone && (
                      <span className="text-ink-muted block text-[11px]">{selectedCustomer.phone}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-ink-faint block text-[11px]">Purpose:</span>
                    <span className="font-semibold text-ink">
                      {formData.appointment_type === 'other' && formData.purpose_label
                        ? `Other — ${formData.purpose_label}`
                        : TYPE_CONFIG[formData.appointment_type]?.label || formData.appointment_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-faint block text-[11px]">Schedule:</span>
                    <span className="font-semibold text-ink">
                      {`${formData.scheduled_date} at ${formData.scheduled_time}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-faint block text-[11px]">Requested Items:</span>
                    <span className="font-semibold text-ink">
                      {walkInItems.length > 0
                        ? `${walkInItems.length} item(s) selected`
                        : 'General Visit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </form>
      </Modal>

      {/* Customer Quick Creation Modal */}
      <CustomerFormModal
        isOpen={showAddCustomer}
        onClose={() => { setShowAddCustomer(false); setAddCustomerError(''); }}
        editingCustomer={null}
        onSubmit={handleAddCustomer}
        isSubmitting={addingCustomer}
        error={addCustomerError}
      />

    </>
  );
}
