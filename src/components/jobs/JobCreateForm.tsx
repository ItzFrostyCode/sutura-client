'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import { ArrowLeft, Loader2, Store, ShoppingBag, User, Users, FileText, Receipt, Trash2, HelpCircle, Shirt, AlertTriangle, Gift } from 'lucide-react';
import Link from 'next/link';
import { SERVICE_TYPE_META, SERVICE_TYPES } from '@/components/services/serviceHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';
import { MetricPill, humanizeMetricKey } from '@/components/measurements/measurementHelpers';
import { STAFF_STAGES, STAFF_STAGE_LABELS } from '@/components/jobs/jobHelpers';
import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CollapsibleSection from '@/components/jobs/CollapsibleSection';

interface CustomerData {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

interface ServiceData {
  id: number;
  name: string;
  category?: string;
  service_type?: 'custom_tailoring' | 'bulk_sublimation' | 'fashion_bridal' | 'alteration_repair' | null;
  base_price?: string | number;
  min_order_qty?: number;
  custom_fields?: ServiceField[] | null;
  tags?: string[];
  estimated_days?: number | null;
}

interface StaffData {
  id: number;
  user: {
    id: number;
    name: string;
  };
  role: string;
  additional_roles?: string[] | null;
}

interface CustomerMeasurement {
  id: number;
  profile_name: string;
  updated_at: string;
  metrics?: Record<string, string | undefined>;
  notes?: string | null;
  superseded_at?: string | null;
  version?: number;
}

function sanitizeServiceCustomFields(servicesRaw: unknown[]): ServiceData[] {
  return servicesRaw.map((s) => {
    const serviceObj = s as Record<string, unknown>;
    const customFieldsRaw = Array.isArray(serviceObj.custom_fields) ? serviceObj.custom_fields : [];
    const sanitizedFields = customFieldsRaw.map((f) => {
      const fieldObj = f as Record<string, unknown>;
      const fieldType = String(fieldObj.type || 'text');
      const resolvedType = fieldType === 'dropdown' ? 'select' : (fieldType === 'short_text' ? 'text' : fieldType);
      return {
        id: String(fieldObj.id || fieldObj.name || Math.random().toString(36).substring(2, 11)),
        label: String(fieldObj.label || ''),
        type: resolvedType as 'text' | 'number' | 'select' | 'radio' | 'checkbox',
        required: Boolean(fieldObj.required),
        options: Array.isArray(fieldObj.options) ? fieldObj.options.map(String) : [],
      };
    });
    return {
      ...serviceObj,
      id: Number(serviceObj.id),
      name: String(serviceObj.name || ''),
      category: typeof serviceObj.category === 'string' ? serviceObj.category : undefined,
      base_price: serviceObj.base_price !== null && serviceObj.base_price !== undefined ? String(serviceObj.base_price) : undefined,
      custom_fields: sanitizedFields,
      tags: Array.isArray(serviceObj.tags) ? serviceObj.tags : [],
    } as ServiceData;
  });
}

export default function JobCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shop, user } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  // Optional — most jobs are fully custom and have no linked catalog design.
  // When set, the backend auto-carries the item's photo into reference_images
  // (see JobOrderController@store) so tailoring staff see what was picked
  // right alongside the Production Instructions cut sheet.
  const [catalogItemId, setCatalogItemId] = useState('');

  const [customerMeasurements, setCustomerMeasurements] = useState<CustomerMeasurement[]>([]);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  // The intake channel is auto-tagged, not a manual toggle — 'online' only
  // when this job is linked to an appointment that was itself booked online;
  // otherwise it's a walk-in created directly at the shop counter. Mirrors
  // JobOrderController@store's own server-authoritative computation exactly.
  const [linkedAppointmentChannel, setLinkedAppointmentChannel] = useState<'walk_in' | 'online' | null>(null);
  const effectiveIntakeChannel: 'walk_in' | 'online' = appointmentId ? (linkedAppointmentChannel ?? 'walk_in') : 'walk_in';
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceLink, setReferenceLink] = useState('');
  const [uploadingReference, setUploadingReference] = useState(false);
  // When arriving pre-filled from a confirmed appointment/booking, the customer
  // is already known — skip making the owner search the dropdown again and just
  // show who it is. Manual "New Job" creation (no pre-fill) keeps the dropdown.
  const [customerLocked, setCustomerLocked] = useState(false);
  const [isTotalAmountCustom, setIsTotalAmountCustom] = useState(false);
  const [isDueDateCustom, setIsDueDateCustom] = useState(false);

  // Bulk Team Roster State
  const [isBulkOrder, setIsBulkOrder] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [roster, setRoster] = useState<{ id: string; name: string; print_name: string; number: string; size: string }[]>([
    { id: 'roster-0', name: '', print_name: '', number: '', size: 'M' }
  ]);

  // Alteration/Repair — protects the shop from false damage claims by logging
  // the garment's condition before work starts.
  const [preExistingDamageNotes, setPreExistingDamageNotes] = useState('');

  const [formData, setFormData] = useState({
    customer_id: '',
    service_id: '',
    measurement_id: '',
    total_amount: '',
    downpayment: '',
    due_date: '',
    notes: '',
    po_number: '',
    is_outsourced: false,
    partner_shop_name: '',
    outsourcing_cost: '',
    is_rush: false,
    rush_fee: '',
    material_source: 'shop_supplied' as 'shop_supplied' | 'customer_supplied',
    garment_category: '' as '' | 'barong' | 'gown' | 'suit' | 'filipiniana' | 'uniform' | 'lab_gown' | 'scrub_suit' | 'corporate_wear' | 'alteration_repair',
  });
  // Same stage model as the Job Detail page's Multi-Stage Staff Assignment
  // — replaces the old single "Assigned Staff" field so Create and View show
  // the same staffing concept instead of two disconnected ones.
  const [staffStageAssignments, setStaffStageAssignments] = useState<Record<string, string>>({
    design: '', pattern_making: '', cutting: '', sewing: '', qc_ironing: '',
  });
  const [showOutsourcingHelp, setShowOutsourcingHelp] = useState(false);

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const renderMeasurementSelector = () => {
    if (isBulkOrder) {
      return (
        <p className="text-xs text-[#827A73] italic py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 h-[38px] flex items-center">
          Bulk Order (Roster Sheet will be used)
        </p>
      );
    }

    if (!formData.customer_id) {
      return (
        <p className="text-xs text-[#A8A19A] italic py-3">
          Please select a customer first.
        </p>
      );
    }

    if (customerMeasurements.length === 0) {
      return (
        <div className="text-xs text-[#B26959] bg-[#B26959]/5 border border-[#B26959]/10 rounded-lg p-2.5 flex items-center justify-between">
          <span>No measurement profiles found.</span>
          <Link
            href={`/dashboard/measurements?customer_id=${formData.customer_id}`}
            className="font-semibold underline text-[#B26959] hover:text-[#B26959]/80 ml-2"
          >
            Record Measurements
          </Link>
        </div>
      );
    }

    // customerMeasurements is already filtered to one row per profile (the
    // current, non-superseded version — see the fetch above), so this is
    // one option per distinct profile, using the real backend version
    // number rather than re-deriving one from array position.
    const displayMeasurements = [...customerMeasurements].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    const mostRecentId = displayMeasurements[0]?.id?.toString();

    return (
      <div className="space-y-1">
        <select
          id="measurement_id"
          value={formData.measurement_id}
          onChange={(e) =>
            setFormData({ ...formData, measurement_id: e.target.value })
          }
          className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
        >
          <option value="">
            No profile selected / Consultation Only
          </option>
          {displayMeasurements.map((m) => (
            <option key={m.id} value={m.id}>
              V{m.version} - {m.profile_name}
            </option>
          ))}
        </select>
        {formData.measurement_id && formData.measurement_id === mostRecentId && (
          <p className="text-[11px] text-[#7A8B76] font-medium">
            ✓ Retrieved this customer&apos;s last saved measurements — no need to re-measure a returning client.
          </p>
        )}
      </div>
    );
  };

  // Read-only preview of the selected measurement profile — so the owner
  // doesn't have to leave this form to see the customer's saved fit while
  // creating the job.
  const renderMeasurementSummary = () => {
    if (isBulkOrder || !formData.measurement_id) return null;
    const selected = customerMeasurements.find((m) => m.id.toString() === formData.measurement_id);
    if (!selected) return null;

    const filledMetrics = Object.entries(selected.metrics || {}).filter(([, v]) => v);

    return (
      <div className="bg-[#FAF6F3]/60 border border-[#EBE6E0]/60 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#827A73] uppercase tracking-wider">
            {selected.profile_name} — Saved Measurements
          </span>
          <Link
            href={`/dashboard/measurements?customer_id=${formData.customer_id}`}
            className="text-[11px] font-semibold text-taupe hover:underline shrink-0"
          >
            View / Edit
          </Link>
        </div>
        {filledMetrics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {filledMetrics.map(([key, value]) => (
              <MetricPill key={key} label={humanizeMetricKey(key)} value={value} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#A8A19A] italic">No measurement fields recorded yet.</p>
        )}
        {selected.notes && (
          <p className="text-xs text-[#524A44] border-t border-[#EBE6E0]/60 pt-2 mt-1">
            <span className="font-semibold text-[#827A73]">Notes: </span>
            {selected.notes}
          </p>
        )}
      </div>
    );
  };

  const handleCheckboxChange = (
    fieldLabel: string,
    opt: string,
    selected: string[],
    checked: boolean
  ) => {
    let nextSelected = [...selected];
    if (checked) {
      if (!nextSelected.includes(opt)) {
        nextSelected.push(opt);
      }
    } else {
      nextSelected = nextSelected.filter((s) => s !== opt);
    }
    setCustomFieldValues({
      ...customFieldValues,
      [fieldLabel]: nextSelected.join(', '),
    });
  };

  const renderCustomField = (field: ServiceField) => {
    if (field.type === 'select') {
      return (
        <select
          id={field.id}
          required={field.required}
          value={customFieldValues[field.label] || ''}
          onChange={(e) =>
            setCustomFieldValues({
              ...customFieldValues,
              [field.label]: e.target.value,
            })
          }
          className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
        >
          <option value="">Select an option</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'radio') {
      return (
        <div className="flex flex-wrap gap-2 pt-1">
          {field.options?.map((opt) => {
            const isSelected = customFieldValues[field.label] === opt;
            return (
              <label
                key={opt}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'border-taupe bg-[#FAF6F3] text-[#2D2A26]'
                    : 'border-[#EBE6E0] bg-white text-[#827A73] hover:border-[#D1C7BD] hover:text-[#2D2A26]'
                }`}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={isSelected}
                  onChange={() =>
                    setCustomFieldValues({
                      ...customFieldValues,
                      [field.label]: opt,
                    })
                  }
                  className="sr-only"
                />
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-taupe bg-taupe text-white'
                      : 'border-[#A8A19A]'
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </div>
                {opt}
              </label>
            );
          })}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div className="flex flex-wrap gap-2 pt-1">
          {field.options?.map((opt) => {
            const currentVal = customFieldValues[field.label] || '';
            const selected = currentVal
              ? currentVal
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];
            const isChecked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  isChecked
                    ? 'border-taupe bg-[#FAF6F3] text-[#2D2A26]'
                    : 'border-[#EBE6E0] bg-white text-[#827A73] hover:border-[#D1C7BD] hover:text-[#2D2A26]'
                }`}
              >
                <input
                  type="checkbox"
                  name={field.id}
                  value={opt}
                  checked={isChecked}
                  onChange={(e) =>
                    handleCheckboxChange(field.label, opt, selected, e.target.checked)
                  }
                  className="sr-only"
                />
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    isChecked
                      ? 'border-taupe bg-taupe text-white'
                      : 'border-[#A8A19A]'
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-2 h-2 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>
                {opt}
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <input
        id={field.id}
        type={field.type === 'number' ? 'number' : 'text'}
        required={field.required}
        value={customFieldValues[field.label] || ''}
        onChange={(e) =>
          setCustomFieldValues({
            ...customFieldValues,
            [field.label]: e.target.value,
          })
        }
        className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
        placeholder={`Enter ${field.label.toLowerCase()}...`}
      />
    );
  };

  const renderBalanceBadge = () => {
    const total = Number.parseFloat(formData.total_amount) || 0;
    const down = Number.parseFloat(formData.downpayment) || 0;
    
    if (total <= 0) {
      return (
        <span className="text-[9px] bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          —
        </span>
      );
    }

    if (down >= total) {
      return (
        <span className="text-[9px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          Paid
        </span>
      );
    }

    if (down > 0) {
      return (
        <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
          Partial
        </span>
      );
    }

    return (
      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
        Unpaid
      </span>
    );
  };

  useEffect(() => {
    if (shop) {
      Promise.all([
        api.get(`/shops/${shop.id}/customers`),
        api.get(`/shops/${shop.id}/services`),
        api.get(`/shops/${shop.id}/staff`),
        api.get(`/shops/${shop.id}/catalog`),
      ])
        .then(([resCustomers, resServices, resStaff, resCatalog]) => {
          const custs = resCustomers.data.data || [];
          const servs = sanitizeServiceCustomFields(resServices.data.data || []);
          setCustomers(custs);
          setServices(servs);
          setStaff(resStaff.data.data || []);
          setCatalogItems(resCatalog.data.data || []);

          // Prefill from query params
          const qCust = searchParams.get('customer_id') || '';
          const qServ = searchParams.get('service_id') || '';
          const qNotes = searchParams.get('notes') || '';
          const qAptId = searchParams.get('appointment_id') || '';

          setAppointmentId(qAptId || null);
          setCustomerLocked(!!qCust);

          // The design-reference photos/link a customer attached at booking live
          // on the Appointment, not passed through the URL — fetch them here so
          // the owner can see what was requested while filling in the job (the
          // backend also inherits these automatically from appointment_id on
          // submit, this is purely so they're visible/editable in the form too).
          if (qAptId && shop) {
            api.get(`/shops/${shop.id}/appointments`)
              .then(res => {
                const apt = (res.data.data || []).find((a: { id: number }) => a.id === Number(qAptId));
                if (apt?.reference_images?.length) setReferenceImages(apt.reference_images);
                if (apt?.reference_link) setReferenceLink(apt.reference_link);
                setLinkedAppointmentChannel(apt?.intake_channel === 'online' ? 'online' : 'walk_in');
                // The backend already inherits garment_category from the
                // appointment on submit if this field is left blank (see
                // JobOrderController@store) — but leaving the dropdown blank
                // here is misleading (it visually says "not specified" when
                // it's actually about to save as e.g. "Alterations & Repair"),
                // and for alteration/repair specifically, this value is also
                // what triggers the required damage-notes field below, so a
                // service lookup mismatch could otherwise silently skip it.
                if (apt?.garment_category) {
                  setFormData(prev => ({ ...prev, garment_category: apt.garment_category }));
                }
              })
              .catch(() => { /* non-critical — job can still be created without the preview */ });
          }

          setFormData((prev) => ({
            ...prev,
            customer_id: qCust,
            service_id: qServ,
            notes: qNotes,
          }));

          if (qServ) {
            const selectedService = servs.find(
              (s: ServiceData) => s.id.toString() === qServ
            );
            const fields = selectedService?.custom_fields || [];
            const initialValues: Record<string, string> = {};
            fields.forEach((f: ServiceField) => {
              initialValues[f.label] = '';
            });
            setCustomFieldValues(initialValues);
          }

          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load data.');
          setLoading(false);
        });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user, searchParams]);

  // Load customer measurements when customer is selected
  useEffect(() => {
    if (shop && formData.customer_id) {
      api
        .get(`/shops/${shop.id}/measurements?customer_id=${formData.customer_id}`)
        .then((res) => {
          // MeasurementController@index returns every version of every
          // profile (the Measurements page needs the full history for its
          // version selector) — but a job order should only ever offer the
          // CURRENT version of each profile. Nothing about creating a new
          // job legitimately calls for deliberately using a customer's old,
          // already-corrected measurements; a superseded version showing up
          // here as a selectable option is just a trap for a mis-click.
          const measurements = (res.data.data || []).filter(
            (m: CustomerMeasurement) => !m.superseded_at
          );
          setCustomerMeasurements(measurements);

          // Suki retrieval: a returning customer's most recently saved
          // measurement is auto-selected so staff don't have to re-measure
          // them — must sort by recency, not just take the API's raw order.
          const mostRecent = [...measurements].sort(
            (a: CustomerMeasurement, b: CustomerMeasurement) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0];

          const qMeas = searchParams.get('measurement_id') || '';
          setFormData((prev) => ({
            ...prev,
            measurement_id: qMeas || (mostRecent?.id?.toString() || ''),
          }));
        })
        .catch((err) => {
          console.error('Failed to load customer measurements', err);
        });
    } else {
      const timer = setTimeout(() => {
        setCustomerMeasurements([]);
        setFormData((prev) => ({ ...prev, measurement_id: '' }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [shop, formData.customer_id, searchParams]);

  // Auto-calculate suggested total price based on service base price and rush fee
  useEffect(() => {
    if (!isTotalAmountCustom && formData.service_id) {
      const selected = services.find((s) => s.id.toString() === formData.service_id);
      if (selected) {
        const basePrice = Number.parseFloat(selected.base_price?.toString() || '0');
        const rushFee = formData.is_rush ? (Number.parseFloat(formData.rush_fee) || 0) : 0;
        const suggested = basePrice + rushFee;
        Promise.resolve().then(() => {
          setFormData((prev) => ({
            ...prev,
            total_amount: suggested > 0 ? suggested.toFixed(2) : '',
          }));
        });
      }
    }
  }, [formData.service_id, formData.is_rush, formData.rush_fee, services, isTotalAmountCustom]);

  // Auto-suggest a due date from the service's own documented turnaround
  // (Service.estimated_days, already shown as "Xd turnaround" on the
  // Services list) — the due date picker previously had zero connection to
  // it, so nothing stopped staff from promising a 15-day bespoke suit
  // "tomorrow." Rush jobs are expected to beat the normal estimate, so this
  // intentionally doesn't touch the date once is_rush is on.
  useEffect(() => {
    if (!isDueDateCustom && !formData.is_rush && formData.service_id) {
      const selected = services.find((s) => s.id.toString() === formData.service_id);
      if (selected?.estimated_days) {
        const suggested = new Date();
        suggested.setDate(suggested.getDate() + selected.estimated_days);
        setFormData((prev) => ({
          ...prev,
          due_date: suggested.toISOString().split('T')[0],
        }));
      }
    }
  }, [formData.service_id, formData.is_rush, services, isDueDateCustom]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop) return;

    setSubmitting(true);
    setError('');

    const totalAmt = Number.parseFloat(formData.total_amount) || 0;
    const downPay = Number.parseFloat(formData.downpayment || '0');
    const rushFee = formData.is_rush ? (Number.parseFloat(formData.rush_fee) || 0) : 0;

    if (formData.is_rush && totalAmt < rushFee) {
      setError(`Total Amount must be greater than or equal to the Rush Fee (₱${rushFee.toFixed(2)}).`);
      setSubmitting(false);
      return;
    }

    // Cash tendered can exceed the total (change is handed back at the
    // counter) — only cap what's actually applied to the job's own balance.
    const appliedDownPay = Math.min(downPay, totalAmt);

    const selectedForSubmit = services.find((s) => s.id.toString() === formData.service_id);

    if (isBulkOrder && selectedForSubmit?.min_order_qty && roster.length < selectedForSubmit.min_order_qty) {
      setError(`This service requires a minimum of ${selectedForSubmit.min_order_qty} pieces — the roster currently has ${roster.length}.`);
      setSubmitting(false);
      return;
    }

    // Checks garment_category too, not just the selected service's type — a
    // job created from an alteration appointment (see the appointment-fetch
    // prefill above) is just as much an alteration job even if, for
    // whatever reason, the service lookup doesn't resolve to one tagged
    // 'alteration_repair'.
    const isAlterationJob = selectedForSubmit?.service_type === 'alteration_repair' || formData.garment_category === 'alteration_repair';
    if (isAlterationJob && !preExistingDamageNotes.trim()) {
      setError('Please log the garment\'s pre-existing condition before creating an alteration/repair job.');
      setSubmitting(false);
      return;
    }

    const balance = totalAmt - appliedDownPay;

    try {
      const assignedStages = Object.entries(staffStageAssignments).filter(([, userId]) => userId);
      await api.post(`/shops/${shop.id}/jobs`, {
        // Server-authoritative anyway (see JobOrderController@store) — sent
        // here only as a best-effort hint, never trusted as-is.
        intake_channel: effectiveIntakeChannel,
        fulfillment_type: 'pickup',
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        // Only send an explicit branch when no staff is being assigned yet —
        // JobOrderController@store's fallback chain already derives the
        // correct branch from the assigned staff's own branch when one IS
        // picked (needed so assigning a different branch's staff, e.g.
        // "borrowing a tailor," isn't blocked by this). With no staff
        // assigned, that chain has nothing to derive from and always lands
        // on the shop's main branch — silently dropping the job out of
        // whichever non-main branch the owner had selected in the header.
        shop_branch_id: assignedStages.length === 0 ? (selectedBranchId ?? undefined) : undefined,
        staff_stages: assignedStages
          .map(([stage, userId]) => ({ stage, user_id: Number(userId) })),
        measurement_id: formData.measurement_id
          ? Number(formData.measurement_id)
          : null,
        total_amount: formData.total_amount,
        balance: balance,
        due_date: formData.due_date || null,
        notes: formData.notes,
        custom_order_data: {
          ...customFieldValues,
          po_number: formData.po_number || null,
          team_name: teamName || null,
          team_roster: isBulkOrder
            ? roster.map(({ name, print_name, number, size }) => ({ name, print_name, number, size }))
            : null,
          pre_existing_damage_notes: isAlterationJob
            ? preExistingDamageNotes.trim()
            : null,
        },
        is_outsourced: formData.is_outsourced,
        partner_shop_name: formData.is_outsourced ? formData.partner_shop_name : null,
        outsourcing_cost: formData.is_outsourced && formData.outsourcing_cost ? Number.parseFloat(formData.outsourcing_cost) : null,
        appointment_id: appointmentId ? Number(appointmentId) : null,
        catalog_item_id: catalogItemId ? Number(catalogItemId) : null,
        reference_images: referenceImages.length > 0 ? referenceImages : null,
        reference_link: referenceLink.trim() || null,
        material_source: formData.material_source,
        garment_category: formData.garment_category || null,
        is_rush: formData.is_rush,
        rush_fee: formData.is_rush ? Number(formData.rush_fee) : 0,
      });
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Failed to create job order.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-[#A8A19A] animate-pulse flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-taupe" />
        <span>Loading form data...</span>
      </div>
    );
  }

  const selectedService = services.find(
    (s) => s.id.toString() === formData.service_id
  );

  // Same reasoning as the submit-time check above: garment_category is the
  // more reliable signal when a job is being created from an alteration
  // appointment (see the appointment-fetch prefill), since it doesn't
  // depend on the service lookup resolving correctly.
  const isSelectedAlterationRepair = selectedService?.service_type === 'alteration_repair' || formData.garment_category === 'alteration_repair';

  // Alteration/repair jobs are typically same-day or short-turnaround work on an
  // existing garment, so a due date isn't mandatory the way it is for a fresh build.
  const isCustomTailoring = !isSelectedAlterationRepair;

  // Ties the "Custom Specifications" section's icon/color to whichever service_type is
  // selected, so the form visibly reacts to the choice instead of staying visually static.
  const sectionTwoMeta = selectedService?.service_type
    ? SERVICE_TYPE_META[selectedService.service_type]
    : { icon: FileText, bg: 'bg-[#F0EAE3]', border: 'border-[#EBE6E0]', text: 'text-[#A8A19A]' };
  const SectionTwoIcon = sectionTwoMeta.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/jobs"
          className="p-2 bg-white shadow-sm border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#827A73] hover:text-[#2D2A26] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">
            Create Job Order
          </h1>
          <p className="text-[#827A73] text-sm mt-1">
            Start a new garment production workflow.
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        {error && (
          <div className="mb-6 bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {appointmentId && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <div>
              <span className="font-semibold">Linked Booking:</span> This Job Order will automatically link to and update Appointment <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs font-bold">#{appointmentId}</span>.
            </div>
            <button
              type="button"
              onClick={() => setAppointmentId(null)}
              className="text-blue-500 hover:text-blue-700 text-xs font-semibold"
            >
              Clear Link
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
        <CollapsibleSection
          icon={<Shirt size={16} className="text-taupe" />}
          title="Garment Type & Design"
          description="Category, material source, catalog link, and reference photos — optional, fill in what's relevant."
          defaultOpen={false}
        >
        <div className="mb-6 space-y-1.5">
          <label htmlFor="garment_category" className="text-sm font-medium text-[#524A44]">
            Garment Category <span className="text-xs font-normal text-[#A8A19A]">(optional)</span>
          </label>
          <p className="text-[11px] text-[#A8A19A]">
            Matches this job to your shop&apos;s garment specializations — helps customers find you for the right kind of work.
          </p>
          <select
            id="garment_category"
            value={formData.garment_category}
            onChange={(e) => setFormData(prev => ({ ...prev, garment_category: e.target.value as typeof prev.garment_category }))}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
          >
            <option value="">Not specified</option>
            <option value="barong">Barong Tagalog</option>
            <option value="gown">Gown</option>
            <option value="suit">Suit</option>
            <option value="filipiniana">Filipiniana</option>
            <option value="uniform">School Uniform</option>
            <option value="lab_gown">Lab Gown</option>
            <option value="scrub_suit">Scrub Suit</option>
            <option value="corporate_wear">Corporate Wear</option>
            <option value="alteration_repair">Alterations & Repair</option>
          </select>
        </div>

        <div className="mb-6 space-y-1.5">
          <span className="text-sm font-medium text-[#524A44]">Fabric / Material Source</span>
          <p className="text-[11px] text-[#A8A19A]">
            Some walk-ins bring their own fabric or an existing garment instead of using shop stock — flagging it here keeps it from getting mixed up with other jobs during cutting.
          </p>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, material_source: 'shop_supplied' }))}
              className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                formData.material_source === 'shop_supplied'
                  ? 'border-taupe bg-taupe/10 text-taupe'
                  : 'border-[#EBE6E0] text-[#827A73] hover:bg-[#FAF6F3]'
              }`}
            >
              Shop-Supplied
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, material_source: 'customer_supplied' }))}
              className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                formData.material_source === 'customer_supplied'
                  ? 'border-taupe bg-taupe/10 text-taupe'
                  : 'border-[#EBE6E0] text-[#827A73] hover:bg-[#FAF6F3]'
              }`}
            >
              Customer&apos;s Own Fabric/Garment
            </button>
          </div>
          {formData.material_source === 'customer_supplied' && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1.5 flex items-start gap-2">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>
                Add a photo of the fabric/garment they brought in the <strong>Design Reference / Notes Photo</strong> section further below — it&apos;ll print on the Work Ticket so whoever cuts/sews this doesn&apos;t reach for shop stock instead.
              </span>
            </p>
          )}
        </div>

        {catalogItems.length > 0 && (
          <div className="mb-6 space-y-1.5">
            <span className="text-sm font-medium text-[#524A44] flex items-center gap-1.5">
              Link to Design Catalog Item <span className="text-xs font-normal text-[#A8A19A]">(optional)</span>
            </span>
            <p className="text-[11px] text-[#A8A19A]">
              If the customer picked one of your showcased designs, link it here — its photo carries over automatically as a reference for whoever works the job.
            </p>
            <select
              value={catalogItemId}
              onChange={(e) => {
                const newId = e.target.value;
                setCatalogItemId(newId);
                const picked = catalogItems.find((c) => c.id.toString() === newId);
                const pickedImage = picked?.images?.find((img) => img.is_primary)?.image_url
                  || picked?.images?.[0]?.image_url
                  || picked?.fabric_image_url;
                if (pickedImage && referenceImages.length === 0) {
                  setReferenceImages([pickedImage]);
                }
              }}
              className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            >
              <option value="">Not from the catalog / custom design</option>
              {catalogItems.map((item) => (
                <option key={item.id} value={item.id.toString()}>{item.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-6 space-y-1.5">
          <span className="text-sm font-medium text-[#524A44] flex items-center gap-1.5">
            {isSelectedAlterationRepair ? 'Damage / Condition Photo' : 'Design Reference / Notes Photo'} <span className="text-xs font-normal text-[#A8A19A]">(optional)</span>
          </span>
          <p className="text-[11px] text-[#A8A19A]">
            {(() => {
              if (isSelectedAlterationRepair) {
                return 'A photo of the garment as received — pairs with the Pre-Existing Damage notes below as evidence if the customer later disputes when a stain/tear happened.';
              }
              if (appointmentId) {
                return 'Photos/link the customer attached when booking — carries over automatically to this job.';
              }
              return 'A photo the customer showed you, a link to what they want made (e.g. a jersey design or gown reference) — or if you jotted the specs on paper, just snap a photo of that note here so it stays attached to the job.';
            })()}
          </p>
          {referenceImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {referenceImages.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Design reference" className="h-20 w-20 object-cover rounded-lg border border-[#EBE6E0]" />
                  <button
                    type="button"
                    onClick={() => setReferenceImages(prev => prev.filter(u => u !== url))}
                    className="absolute -top-2 -right-2 bg-white border border-[#EBE6E0] text-[#827A73] hover:text-[#B26959] rounded-full p-1 shadow-sm"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#9A8073] hover:text-[#8A7063] bg-[#FAF6F3] hover:bg-[#F0EAE3] border border-[#EBE6E0] px-3 py-1.5 rounded-lg transition-colors mt-1">
            {uploadingReference ? <Loader2 size={14} className="animate-spin text-taupe" /> : null}
            <span>{uploadingReference ? 'Uploading...' : '+ Add reference photo'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingReference || referenceImages.length >= 10}
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file || !shop) return;
                setUploadingReference(true);
                const fd = new FormData();
                fd.append('file', file);
                try {
                  const res = await api.post(`/shops/${shop.id}/upload`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  const url = res.data?.data?.url || res.data?.url;
                  if (url) setReferenceImages(prev => [...prev, url]);
                } catch {
                  alert('Failed to upload reference photo.');
                } finally {
                  setUploadingReference(false);
                }
              }}
            />
          </label>
          <input
            type="text"
            value={referenceLink}
            onChange={e => setReferenceLink(e.target.value)}
            placeholder="Reference link (Pinterest, Facebook post, Google Drive, etc.)"
            className="w-full mt-1.5 px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
          />
        </div>
        </CollapsibleSection>

          <CollapsibleSection
            icon={<User size={16} className="text-taupe" />}
            title="Customer & Service Details"
            defaultOpen
          >
            {/* Order source — auto-detected, not a manual toggle. 'Online'
                only when this job is linked to an appointment that was
                itself booked online; otherwise it's tagged Walk-in. */}
            <div>
              <span className="block text-xs font-semibold text-[#827A73] mb-2 uppercase tracking-wider">
                Order Source <span className="text-[10px] font-normal normal-case text-[#A8A19A]">(auto-detected)</span>
              </span>
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm ${
                effectiveIntakeChannel === 'online'
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : 'border-taupe bg-[#FAF6F3] text-[#2D2A26]'
              }`}>
                {effectiveIntakeChannel === 'online' ? <ShoppingBag size={18} /> : <Store size={18} />}
                <span>{effectiveIntakeChannel === 'online' ? 'Online' : 'Walk-in'}</span>
                <span className="text-[10px] font-normal opacity-70 ml-1">
                  {appointmentId
                    ? `From linked Appointment #${appointmentId}`
                    : 'Created directly at the shop counter'}
                </span>
              </div>
            </div>

            {/* PO Number — shown only for Online/Corporate orders */}
            {effectiveIntakeChannel === 'online' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="po_number"
                    className="block text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wider"
                  >
                    PO Number / Reference Code
                    <span className="text-[10px] font-normal text-blue-500 ml-1 normal-case">(for corporate orders)</span>
                  </label>
                  <input
                    id="po_number"
                    type="text"
                    value={formData.po_number}
                    onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                    placeholder="e.g. PO-2025-00142 or company ref number"
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="customer_id"
                  className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                >
                  Customer <span className="text-[#B26959]">*</span>
                </label>
                {customerLocked && formData.customer_id ? (
                  (() => {
                    const lockedCustomer = customers.find((c) => c.id.toString() === formData.customer_id);
                    return (
                      <div className="flex items-center justify-between gap-3 bg-[#FAF6F3] border border-taupe/30 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-taupe/15 text-taupe flex items-center justify-center text-xs font-bold shrink-0">
                            {(lockedCustomer?.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#2D2A26] truncate">
                              {lockedCustomer?.name || `Customer #${formData.customer_id}`}
                            </p>
                            {lockedCustomer?.email && (
                              <p className="text-[11px] text-[#A8A19A] truncate">{lockedCustomer.email}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomerLocked(false)}
                          className="text-taupe hover:underline text-xs font-semibold shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <select
                    id="customer_id"
                    required
                    value={formData.customer_id}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_id: e.target.value })
                    }
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                  >
                    <option value="" disabled>
                      Select a customer
                    </option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.phone ? ` — ${c.phone}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label
                  htmlFor="measurement_id"
                  className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                >
                  Measurement Profile
                </label>
                {renderMeasurementSelector()}
              </div>
            </div>

            {renderMeasurementSummary()}

            <div>
              <label
                htmlFor="service_id"
                className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
              >
                Type of Service <span className="text-[#B26959]">*</span>
              </label>
              <select
                id="service_id"
                required
                value={formData.service_id}
                onChange={(e) => {
                  const val = e.target.value;
                  setIsTotalAmountCustom(false); // Reset custom price flag on service change
                  setIsDueDateCustom(false); // Reset custom due-date flag on service change
                  setFormData({ ...formData, service_id: val });
                  const selected = services.find(
                    (s) => s.id.toString() === val
                  );
                  const fields = selected?.custom_fields || [];
                  const initialValues: Record<string, string> = {};
                  fields.forEach((f) => {
                    initialValues[f.label] = '';
                  });
                  setCustomFieldValues(initialValues);

                  // Bulk/team-order services always need the roster; fall back to
                  // name-sniffing for older services that predate service_type.
                  if (selected) {
                    const name = selected.name.toLowerCase();
                    const looksBulk =
                      name.includes('jersey') ||
                      name.includes('sublimation') ||
                      name.includes('uniform') ||
                      name.includes('esports');
                    if (selected.service_type === 'bulk_sublimation' || looksBulk) {
                      setIsBulkOrder(true);
                    }
                  }
                }}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
              >
                <option value="" disabled>
                  Select a service
                </option>
                {services.map((s) => {
                  const label = s.tags && s.tags.length > 0
                    ? `${s.name} (${s.tags.slice(0, 3).join(', ')}${s.tags.length > 3 ? '...' : ''})`
                    : s.name;
                  return (
                    <option key={s.id} value={s.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            icon={<SectionTwoIcon size={16} className={sectionTwoMeta.text} />}
            iconBoxClassName={`${sectionTwoMeta.bg} border ${sectionTwoMeta.border}`}
            title="Custom Specifications & Notes"
            description={selectedService?.service_type
              ? `Fields adapted for ${SERVICE_TYPES.find(t => t.value === selectedService.service_type)?.label}`
              : undefined}
            defaultOpen={false}
            forceOpenWhen={isBulkOrder || isSelectedAlterationRepair}
          >

            {selectedService?.service_type === 'fashion_bridal' && (
              <div className={`flex items-start gap-2 text-xs ${sectionTwoMeta.text} ${sectionTwoMeta.bg} border ${sectionTwoMeta.border} rounded-xl p-3`}>
                <SectionTwoIcon size={14} className="shrink-0 mt-0.5" />
                <span>Fashion/bridal garments typically need <strong>two fittings</strong> — book the base-fit and final-drape sessions separately from the Appointments tab once cutting begins.</span>
              </div>
            )}

            {isSelectedAlterationRepair && (
              <div className={`space-y-1 border ${sectionTwoMeta.border} ${sectionTwoMeta.bg} rounded-xl p-4`}>
                <label htmlFor="pre_existing_damage_notes" className={`flex items-center gap-1.5 text-xs font-bold ${sectionTwoMeta.text} uppercase tracking-wider`}>
                  <SectionTwoIcon size={12} />
                  Pre-Existing Damage / Condition Notes <span className="text-[#B26959]">*</span>
                </label>
                <p className="text-[11px] text-amber-700 mb-1">
                  Log any existing stains, tears, or missing parts before starting work — protects the shop from false damage claims later. Consider also attaching a photo in the Damage / Condition Photo section above.
                </p>
                <textarea
                  id="pre_existing_damage_notes"
                  value={preExistingDamageNotes}
                  onChange={(e) => setPreExistingDamageNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe resize-y"
                  placeholder="e.g. Small stain near hemline, missing one button on left cuff. No damage noted if left blank is not allowed — describe condition even if 'No visible damage.'"
                />
              </div>
            )}

            {/* Dynamic Custom Fields Section */}
            {formData.service_id && selectedService?.custom_fields && selectedService.custom_fields.length > 0 ? (
              <div className={`space-y-4 border ${sectionTwoMeta.border} rounded-xl p-4`}>
                <h4 className={`flex items-center gap-1.5 text-xs font-bold ${sectionTwoMeta.text} border-b border-[#EBE6E0] pb-2 uppercase tracking-wider`}>
                  <SectionTwoIcon size={12} />
                  Custom Service Fields
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedService.custom_fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label
                        htmlFor={field.id}
                        className="block text-xs font-semibold text-[#524A44]"
                      >
                        {field.label}{' '}
                        {field.required && <span className="text-[#B26959]">*</span>}
                      </label>
                      {renderCustomField(field)}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label
                htmlFor="notes"
                className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
              >
                Notes & Instructions
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe min-h-24 resize-y"
                placeholder="Enter measurements, specific requests, or design notes here..."
              />
            </div>

            {/* Team Roster / Size Sheet Toggle */}
            <div className="border-t border-[#EBE6E0] pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBulkOrder}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsBulkOrder(checked);
                    if (checked) {
                      setFormData((prev) => ({ ...prev, measurement_id: '' }));
                    }
                  }}
                  className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                />
                <span className="text-sm font-semibold text-[#524A44]">
                  Include Team Roster / Size Sheet (For Bulk Sublimation / Uniforms)
                </span>
              </label>

              {isBulkOrder && (
                <div className={`mt-4 ${SERVICE_TYPE_META.bulk_sublimation.bg} border ${SERVICE_TYPE_META.bulk_sublimation.border} rounded-xl p-4 space-y-3`}>
                  <div>
                    <label htmlFor="team-name-input" className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider">
                      Team Name
                    </label>
                    <input
                      id="team-name-input"
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Gilas Pilipinas, Blacklist Esports"
                      className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe max-w-md"
                    />
                  </div>

                  {selectedService?.min_order_qty && selectedService.min_order_qty > 1 && (
                    <p className={`text-xs font-semibold px-3 py-2 rounded-lg border ${
                      roster.length < selectedService.min_order_qty
                        ? 'bg-[#B26959]/5 border-[#B26959]/20 text-[#B26959]'
                        : 'bg-[#7A8B76]/5 border-[#7A8B76]/20 text-[#7A8B76]'
                    }`}>
                      {roster.length} / {selectedService.min_order_qty} minimum pieces
                      {roster.length < selectedService.min_order_qty && ' — add more players/items to meet this service\'s minimum order quantity'}
                    </p>
                  )}

                  {roster.length >= 10 && (
                    <p className="text-xs font-semibold px-3 py-2 rounded-lg border bg-amber-50 border-amber-200 text-amber-700 flex items-start gap-2">
                      <Gift size={14} className="mt-0.5 shrink-0" />
                      <span>
                        Freebies unlocked: {roster.length >= 20 ? 'Free Layout + Free Banner + Free Coach Shirt' : roster.length >= 15 ? 'Free Layout + Free Banner' : 'Free Layout Design'} (remember to apply manually to pricing)
                      </span>
                    </p>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-xs font-bold text-[#827A73] uppercase tracking-wider">Roster List</h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newRow = { id: `${Date.now()}-${Math.random()}`, name: '', print_name: '', number: '', size: 'M' };
                            setRoster([...roster, newRow]);
                          }}
                          className="bg-[#FAF6F3] hover:bg-[#EBE6E0] border border-[#EBE6E0] text-[#2D2A26] px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors"
                        >
                          + Add 1 Player
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newRows = Array.from({ length: 5 }).map((_, idx) => ({
                              id: `${Date.now()}-${Math.random()}-${idx}`,
                              name: '',
                              print_name: '',
                              number: '',
                              size: 'M'
                            }));
                            setRoster([...roster, ...newRows]);
                          }}
                          className="bg-[#FAF6F3] hover:bg-[#EBE6E0] border border-[#EBE6E0] text-[#2D2A26] px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors"
                        >
                          + Add 5 Players
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newRows = Array.from({ length: 10 }).map((_, idx) => ({
                              id: `${Date.now()}-${Math.random()}-${idx}`,
                              name: '',
                              print_name: '',
                              number: '',
                              size: 'M'
                            }));
                            setRoster([...roster, ...newRows]);
                          }}
                          className="bg-[#FAF6F3] hover:bg-[#EBE6E0] border border-[#EBE6E0] text-[#2D2A26] px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors"
                        >
                          + Add 10 Players
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hidden sm:grid grid-cols-[28px_1fr_1fr_72px_72px_28px] gap-2 text-[10px] font-semibold text-blue-700/70 uppercase tracking-wider px-1">
                    <span></span>
                    <span>Player/Employee Name</span>
                    <span>Print Name / Nickname</span>
                    <span>Number</span>
                    <span>Size</span>
                    <span></span>
                  </div>
                  <div className="space-y-1.5">
                    {roster.map((row, idx) => (
                      <div
                        key={row.id}
                        className={`grid grid-cols-2 sm:grid-cols-[28px_1fr_1fr_72px_72px_28px] gap-2 items-center p-2 rounded-lg border border-blue-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'}`}
                      >
                        <span className="hidden sm:flex items-center justify-center text-[10px] font-bold text-blue-700 w-6 h-6 rounded-full bg-blue-100 shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={row.name}
                          placeholder="e.g. J. Arabejo"
                          onChange={(e) => {
                            const newRoster = [...roster];
                            newRoster[idx].name = e.target.value;
                            setRoster(newRoster);
                          }}
                          className="col-span-2 sm:col-span-1 w-full bg-white border border-[#EBE6E0] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-taupe"
                        />
                        <input
                          type="text"
                          value={row.print_name}
                          placeholder="e.g. FROSTY"
                          onChange={(e) => {
                            const newRoster = [...roster];
                            newRoster[idx].print_name = e.target.value;
                            setRoster(newRoster);
                          }}
                          className="w-full bg-white border border-[#EBE6E0] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-taupe"
                        />
                        <input
                          type="text"
                          value={row.number}
                          placeholder="e.g. 12"
                          onChange={(e) => {
                            const newRoster = [...roster];
                            newRoster[idx].number = e.target.value;
                            setRoster(newRoster);
                          }}
                          className="w-full bg-white border border-[#EBE6E0] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-taupe"
                        />
                        <select
                          value={row.size}
                          onChange={(e) => {
                            const newRoster = [...roster];
                            newRoster[idx].size = e.target.value;
                            setRoster(newRoster);
                          }}
                          className="w-full bg-white border border-[#EBE6E0] rounded px-2 py-1.5 text-xs focus:outline-none"
                        >
                          {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                        {roster.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setRoster(roster.filter((r) => r.id !== row.id))}
                            title="Remove"
                            className="flex items-center justify-center w-6 h-6 rounded-md text-[#B26959] hover:bg-[#B26959]/10 transition-colors shrink-0 justify-self-end sm:justify-self-auto"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : <span />}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-[#EBE6E0] pt-2 text-xs text-[#827A73] font-semibold">
                    <span>Total Items: {roster.length}</span>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            icon={<Store size={16} className="text-blue-700" />}
            iconBoxClassName="bg-blue-50 border border-blue-200"
            title="Production & Fulfillment"
            defaultOpen={false}
          >

            {/* Outsourcing Details — same design as the Job Detail page's
                Outsourcing card, so this doesn't feel like a different
                feature depending on whether you're creating or viewing.
                Owner/Manager Only: this is a backend production/sourcing
                decision, not something Front-Desk intake needs to set. */}
            <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4">
              <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Owner/Manager Only
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_outsourced}
                    onChange={(e) =>
                      setFormData({ ...formData, is_outsourced: e.target.checked })
                    }
                    className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                  />
                  <span className="text-sm font-semibold text-[#524A44]">
                    Outsource this production (Sent to external shop/tailor)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowOutsourcingHelp(p => !p)}
                  className="text-[#A8A19A] hover:text-[#9A8073] transition-colors"
                  title="What is this?"
                >
                  <HelpCircle size={14} />
                </button>
              </div>

              {showOutsourcingHelp && (
                <div className="mt-2 max-w-md p-3 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-xs text-[#524A44] leading-relaxed">
                  Turn this on when you&apos;re subcontracting this job — or part of it, like beadwork or embroidery — to another shop or freelance artisan, usually because you&apos;re overbooked or don&apos;t have that skill or machine in-house. The customer still pays your full Total Amount either way — enter what <strong>you</strong> pay the partner below so you can see your real profit on this job, not just what the customer paid.
                </div>
              )}

              {formData.is_outsourced && (
                <div className="mt-3 max-w-md space-y-3">
                  <div>
                    <label
                      htmlFor="partner_shop_name"
                      className="block text-xs font-semibold text-[#827A73] mb-1"
                    >
                      Partner Shop / Sewer Name <span className="text-[#B26959]">*</span>
                    </label>
                    <input
                      id="partner_shop_name"
                      type="text"
                      required
                      value={formData.partner_shop_name}
                      onChange={(e) =>
                        setFormData({ ...formData, partner_shop_name: e.target.value })
                      }
                      placeholder="e.g. Maria's Dressmaking Shop"
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="outsourcing_cost"
                      className="block text-xs font-semibold text-[#827A73] mb-1"
                    >
                      What You&apos;re Paying Them <span className="font-normal normal-case text-[#A8A19A]">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] font-medium text-sm">₱</span>
                      <input
                        id="outsourcing_cost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.outsourcing_cost}
                        onChange={(e) =>
                          setFormData({ ...formData, outsourcing_cost: e.target.value })
                        }
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {Number.parseFloat(formData.outsourcing_cost || '0') > 0 && (() => {
                    const total = Number.parseFloat(formData.total_amount) || 0;
                    const cost = Number.parseFloat(formData.outsourcing_cost) || 0;
                    const profit = total - cost;
                    const isLoss = profit <= 0;
                    return (
                      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${isLoss ? 'bg-red-50 border-red-200 text-red-600' : 'bg-[#7A8B76]/10 border-[#7A8B76]/20 text-[#7A8B76]'}`}>
                        <span className="font-medium">{isLoss ? "You're losing money on this job" : 'Your profit on this job'}</span>
                        <span className="font-bold">₱{profit.toFixed(2)}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Fulfillment — store pickup only. The approved thesis excludes
                logistics/courier/delivery management from the system's scope. */}
            <div className="bg-[#FAF6F3]/50 border border-[#EBE6E0]/60 rounded-xl p-4 mt-4">
              <span className="block text-xs font-semibold text-[#827A73] mb-2 uppercase tracking-wider">
                Fulfillment Method
              </span>
              <div className="bg-[#FAF6F3]/60 border border-[#EBE6E0]/60 rounded-lg p-3 text-xs text-[#827A73] flex items-center gap-2">
                <Store size={16} className="shrink-0" />
                <span>
                  Customer will pick up the garments in-store. (Shop address will be used)
                </span>
              </div>
            </div>
          </CollapsibleSection>

          {/* Multi-Stage Staff Assignment — same model as the Job Detail
              page's card, settable at creation time too instead of only via
              a single generic "Assigned Staff" field afterward. Owner/Manager
              Only: backroom production staffing is a Shop Owner decision,
              not part of Front-Desk intake. */}
          <CollapsibleSection
            icon={<Users size={16} className="text-[#9A8073]" />}
            iconBoxClassName="bg-[#9A8073]/10 border border-[#9A8073]/20"
            title={
              <span className="flex items-center gap-2 flex-wrap">
                Multi-Stage Staff Assignment <span className="font-normal text-[#A8A19A] text-xs">(Optional)</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Owner/Manager Only
                </span>
              </span>
            }
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STAFF_STAGES.map((stage) => (
                <div key={stage}>
                  <label
                    htmlFor={`stage_${stage}`}
                    className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                  >
                    {STAFF_STAGE_LABELS[stage]} Staff
                  </label>
                  <select
                    id={`stage_${stage}`}
                    value={staffStageAssignments[stage]}
                    onChange={(e) =>
                      setStaffStageAssignments({ ...staffStageAssignments, [stage]: e.target.value })
                    }
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => {
                      const roles = [s.role, ...(s.additional_roles || [])].filter(Boolean).map(roleLabel).join(', ');
                      return (
                        <option key={s.id} value={s.user.id}>
                          {s.user.name} ({roles})
                        </option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            icon={<Receipt size={16} className="text-[#7A8B76]" />}
            iconBoxClassName="bg-[#7A8B76]/10 border border-[#7A8B76]/20"
            title="Timeline & Invoice Summary"
            defaultOpen
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="due_date"
                  className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                >
                  Due Date {isCustomTailoring && <span className="text-[#B26959]">*</span>}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <input
                      id="due_date"
                      type="date"
                      required={isCustomTailoring}
                      value={formData.due_date}
                      onChange={(e) => {
                        setIsDueDateCustom(true);
                        setFormData({ ...formData, due_date: e.target.value });
                      }}
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {(() => {
                      if (formData.is_rush || !selectedService?.estimated_days || !formData.due_date) return null;
                      const minDueDate = new Date();
                      minDueDate.setDate(minDueDate.getDate() + selectedService.estimated_days);
                      const picked = new Date(formData.due_date + 'T00:00:00');
                      if (picked >= minDueDate) return null;
                      return (
                        <p className="text-[11px] text-amber-700 mt-1">
                          {selectedService.name} usually takes {selectedService.estimated_days} days — this date is sooner than that. If it genuinely needs to be faster, check &quot;Rush Order&quot; below so staff know it&apos;s a priority.
                        </p>
                      );
                    })()}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 sm:h-[38px] sm:mt-0 mt-1" title="Owner/Manager Only — Priority is set during Job Order approval, not Front-Desk intake">
                    <input
                      type="checkbox"
                      checked={formData.is_rush}
                      onChange={(e) =>
                        setFormData({ ...formData, is_rush: e.target.checked })
                      }
                      className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                    />
                    <span className="text-sm font-semibold text-[#524A44]">
                      Mark as Rush Order
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Owner/Manager Only
                    </span>
                  </label>
                </div>
              </div>

              {/* Rush Order Details — Owner/Manager Only: Priority/Rush is
                  set by the Shop Owner during Job Order approval, not
                  captured as part of Front-Desk intake. */}
              <div>
                {formData.is_rush && (
                  <div>
                    <label
                      htmlFor="rush_fee"
                      className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                    >
                      Rush Fee (₱) <span className="text-[#B26959]">*</span>
                    </label>
                    <input
                      id="rush_fee"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.rush_fee}
                      onChange={(e) =>
                        setFormData({ ...formData, rush_fee: e.target.value })
                      }
                      placeholder="0.00"
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                    />
                    <p className="text-[10px] text-[#827A73] mt-1">
                      This fee is automatically added to the Total Amount below.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Invoice Box */}
            <div className="space-y-4 mt-2">
              <span className="text-xs font-bold text-[#827A73] uppercase tracking-wider block border-b border-[#EBE6E0] pb-2">
                Invoice & Balance Summary
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Total Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="total_amount"
                      className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider"
                    >
                      Total Amount (₱) <span className="text-[#B26959]">*</span>
                    </label>
                    {isTotalAmountCustom && selectedService && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsTotalAmountCustom(false);
                          const basePrice = Number.parseFloat(selectedService.base_price?.toString() || '0');
                          const rushFee = formData.is_rush ? (Number.parseFloat(formData.rush_fee) || 0) : 0;
                          const suggested = basePrice + rushFee;
                          setFormData((prev) => ({
                            ...prev,
                            total_amount: suggested.toFixed(2),
                          }));
                        }}
                        className="text-[10px] font-bold text-taupe hover:underline uppercase tracking-wider"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                  <input
                    id="total_amount"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => {
                      setIsTotalAmountCustom(true);
                      setFormData({ ...formData, total_amount: e.target.value });
                    }}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                    placeholder={selectedService && (selectedService.base_price === null || selectedService.base_price === undefined) ? 'Enter your quote for this job' : '0.00'}
                  />
                  {selectedService && (selectedService.base_price === null || selectedService.base_price === undefined) && !formData.total_amount && (
                    <p className="text-[10px] text-[#827A73] mt-1">
                      This service has no fixed price (Custom Quote) — enter the amount you&apos;re charging for this specific job.
                    </p>
                  )}
                  {formData.is_rush && Number.parseFloat(formData.total_amount) < (Number.parseFloat(formData.rush_fee) || 0) && (
                    <p className="text-[10px] text-[#B26959] mt-1 font-semibold">
                      Must be ≥ Rush Fee (₱{Number.parseFloat(formData.rush_fee).toFixed(2)})
                    </p>
                  )}
                </div>

                {/* Downpayment Input */}
                <div>
                  <label
                    htmlFor="downpayment"
                    className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-1"
                  >
                    Downpayment (₱)
                  </label>
                  <input
                    id="downpayment"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.downpayment}
                    onChange={(e) =>
                      setFormData({ ...formData, downpayment: e.target.value })
                    }
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                    placeholder="0.00"
                  />
                  {/* A customer handing over more cash than owed (e.g. ₱200 for a
                      ₱150 total) is normal real-world change-making, not invalid
                      data — only the amount actually applied toward the job is
                      capped at the total; the rest is just change given back. */}
                  {(Number.parseFloat(formData.downpayment) || 0) > (Number.parseFloat(formData.total_amount) || 0) && (
                    <p className="text-[10px] text-[#7A8B76] mt-1 font-semibold">
                      Change Due: ₱{((Number.parseFloat(formData.downpayment) || 0) - (Number.parseFloat(formData.total_amount) || 0)).toFixed(2)} — only ₱{Number.parseFloat(formData.total_amount || '0').toFixed(2)} will be applied to the job.
                    </p>
                  )}
                </div>

                {/* Remaining Balance card */}
                <div>
                  <span className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-1">
                    Remaining Balance
                  </span>
                  <div className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 flex items-center justify-between h-[38px] select-none">
                    <span className="font-bold text-sm text-[#2D2A26]">
                      ₱{Math.max(0, (Number.parseFloat(formData.total_amount) || 0) - Math.min(Number.parseFloat(formData.downpayment) || 0, Number.parseFloat(formData.total_amount) || 0)).toFixed(2)}
                    </span>
                    {renderBalanceBadge()}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <div className="pt-6 border-t border-[#EBE6E0] flex justify-end gap-4">
            <Link
              href="/dashboard/jobs"
              className="px-6 py-2.5 rounded-lg font-medium text-[#827A73] hover:text-[#2D2A26] hover:bg-[#F0EAE3] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-[#9A8073]/20"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              Create Job Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
