import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, X, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { Service, SERVICE_CATEGORIES, SERVICE_TYPES, SERVICE_TYPE_META, ServiceType, PricingTierInput, deriveTiersFromService } from './serviceHelpers';
import SizeChartEditor, { SizeChartValue, emptySizeChart } from '@/components/shared/SizeChartEditor';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface ServiceFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingId: number | null;
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
  readonly editingService: Service | null;
}

export default function ServiceFormModal({
  isOpen,
  onClose,
  editingId,
  onSubmit,
  isSubmitting,
  error,
  editingService,
}: ServiceFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<ServiceType[]>([]);
  const [basePrice, setBasePrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [minOrderQty, setMinOrderQty] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [tiers, setTiers] = useState<PricingTierInput[]>([]);
  const [tierLabelInput, setTierLabelInput] = useState('');
  const [tierAmountInput, setTierAmountInput] = useState('');

  const [sizeChart, setSizeChart] = useState<SizeChartValue>(emptySizeChart);

  const { shop } = useAuthStore();

  const toggleServiceType = (type: ServiceType) => {
    setSelectedServiceTypes(prev => (prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]));
  };

  const addCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed || selectedCategories.includes(trimmed)) return;
    setSelectedCategories(prev => [...prev, trimmed]);
  };

  const removeCategory = (cat: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== cat));
  };

  useEffect(() => {
    if (editingService && editingId) {
      Promise.resolve().then(() => {
        setFormData({
          name: editingService.name,
          description: editingService.description || '',
        });
        setSelectedCategories(editingService.categories || []);
        setCustomCategoryInput('');
        setSelectedServiceTypes(editingService.service_types || []);
        setBasePrice(editingService.base_price != null ? String(editingService.base_price) : '');
        setEstimatedDays(editingService.estimated_days != null ? String(editingService.estimated_days) : '');
        setMinOrderQty(editingService.min_order_qty != null ? String(editingService.min_order_qty) : '1');
        setTiers(deriveTiersFromService(editingService));
        setIsActive(editingService.is_active !== false);
        setImageUrl(editingService.image_url || null);
        setSizeChart({
          image_url: editingService.size_chart_image_url || null,
          columns: editingService.size_chart_columns || [],
          rows: editingService.size_chart_rows || [],
        });
      });
    } else {
      Promise.resolve().then(() => {
        setFormData({ name: '', description: '' });
        setSelectedCategories([]);
        setCustomCategoryInput('');
        setSelectedServiceTypes([]);
        setBasePrice('');
        setEstimatedDays('');
        setMinOrderQty('1');
        setTiers([]);
        setTierLabelInput('');
        setTierAmountInput('');
        setIsActive(true);
        setImageUrl(null);
        setSizeChart(emptySizeChart);
      });
    }
  }, [editingService, editingId, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !shop) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    setUploadingImage(true);
    try {
      const res = await api.post(`/shops/${shop.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.data?.url || res.data.url || null);
    } catch {
      // silently fail
    } finally {
      setUploadingImage(false);
    }
  };

  const addTier = () => {
    const label = tierLabelInput.trim();
    if (!label || tiers.some(t => t.label === label)) return;
    setTiers(prev => [...prev, { label, amount: tierAmountInput.trim() }]);
    setTierLabelInput('');
    setTierAmountInput('');
  };

  const handleTierLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTier();
    }
  };

  const removeTier = (label: string) => {
    setTiers(prev => prev.filter(t => t.label !== label));
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedServiceTypes.length === 0) return;

    const payload = {
      name: formData.name,
      description: formData.description,
      categories: selectedCategories,
      service_types: selectedServiceTypes,
      pricing_tiers: tiers.map(t => ({
        label: t.label,
        amount: t.amount.trim() === '' ? null : Number.parseFloat(t.amount),
      })),
      is_active: isActive,
      image_url: imageUrl,
      size_chart_image_url: sizeChart.image_url,
      size_chart_columns: sizeChart.columns.length > 0 ? sizeChart.columns : null,
      size_chart_rows: sizeChart.rows.length > 0 ? sizeChart.rows : null,
      base_price: basePrice.trim() === '' ? null : Number.parseFloat(basePrice),
      estimated_days: estimatedDays.trim() === '' ? null : Number.parseInt(estimatedDays, 10),
      min_order_qty: minOrderQty.trim() === '' ? 1 : Number.parseInt(minOrderQty, 10),
    };
    onSubmit(payload);
  };

  const labelClass = 'block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider';
  const sectionHeadingClass = 'text-xs font-bold text-[#9A8073] uppercase tracking-wider pb-2 border-b border-[#EBE6E0]';
  const inputClass = 'w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? 'Edit Service Group' : 'Add Service Group'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6 text-[#2D2A26]">
        {error && (
          <div className="p-3 text-sm text-[#B26959] bg-[#B26959]/10 border border-[#B26959]/20 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className={sectionHeadingClass}>Basic Info</p>

            <div>
              <label className={labelClass}>
                Group Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Alterations & Repairs"
              />
              <p className="text-xs text-[#A8A19A] mt-1">The name customers and staff see for this service group.</p>
            </div>

            <div>
              <label className={labelClass}>
                Service Type(s) * <span className="text-[#A8A19A] normal-case font-normal">(select one or more)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPES.map(t => {
                  const meta = SERVICE_TYPE_META[t.value];
                  const Icon = meta.icon;
                  const isSelected = selectedServiceTypes.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleServiceType(t.value)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-left transition-all focus:outline-none ${
                        isSelected ? 'border-taupe bg-taupe/10' : 'border-[#EBE6E0] hover:border-[#D1C7BD]'
                      }`}
                    >
                      <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${meta.bg} ${meta.border}`}>
                        <Icon size={14} className={meta.text} />
                      </span>
                      <span className="text-xs font-semibold text-[#2D2A26] leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#A8A19A] mt-1">
                {selectedServiceTypes.length > 0
                  ? SERVICE_TYPES.filter(t => selectedServiceTypes.includes(t.value)).map(t => t.hint).join(' • ')
                  : 'Determines which order fields apply when this service is booked (team roster, fitting schedule, damage notes, etc.) — all selected types\' fields will apply.'}
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Category <span className="text-[#A8A19A] normal-case font-normal">(select one or more, optional)</span>
              </label>
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedCategories.map(cat => (
                    <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 bg-taupe/10 text-taupe text-xs font-semibold rounded-full">
                      {cat}
                      <button type="button" onClick={() => removeCategory(cat)} className="hover:text-[#B26959] focus:outline-none">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <select
                value=""
                onChange={(e) => { if (e.target.value) addCategory(e.target.value); }}
                className={inputClass}
              >
                <option value="">+ Add from list...</option>
                {SERVICE_CATEGORIES.filter(group => group.group !== 'Other').map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.items.map(item => (
                      <option key={item} value={item} disabled={selectedCategories.includes(item)}>{item}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(customCategoryInput); setCustomCategoryInput(''); } }}
                  placeholder="Or type a custom category"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => { addCategory(customCategoryInput); setCustomCategoryInput(''); }}
                  className="shrink-0 px-3 rounded-lg bg-taupe/10 text-taupe text-xs font-semibold hover:bg-taupe/20 transition-colors focus:outline-none"
                >
                  Add
                </button>
              </div>
            </div>

            <p className={sectionHeadingClass}>Included Services & Pricing</p>

            <div>
              {tiers.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {tiers.map(tier => (
                    <div key={tier.label} className="flex items-center justify-between gap-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-1.5">
                      <span className="text-sm text-[#2D2A26] truncate">{tier.label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-[#7A8B76]">
                          {tier.amount ? `₱${Number(tier.amount).toLocaleString()}` : 'No price yet'}
                        </span>
                        <button type="button" onClick={() => removeTier(tier.label)} className="text-[#A8A19A] hover:text-[#B26959] focus:outline-none">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className={labelClass}>Item Name</label>
                  <input
                    type="text"
                    value={tierLabelInput}
                    onChange={(e) => setTierLabelInput(e.target.value)}
                    onKeyDown={handleTierLabelKeyDown}
                    className={`${inputClass} w-full`}
                    placeholder="e.g. Hem Pants"
                  />
                </div>
                <div className="w-28">
                  <label className={labelClass}>Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tierAmountInput}
                    onChange={(e) => setTierAmountInput(e.target.value)}
                    onKeyDown={handleTierLabelKeyDown}
                    className={`${inputClass} w-full`}
                    placeholder="Optional"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTier}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-taupe/10 text-taupe hover:bg-taupe/20 transition-colors"
                  title="Add"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className={`text-xs mt-1 ${tiers.length === 0 ? 'text-[#B26959] font-medium' : 'text-[#A8A19A]'}`}>
                {tiers.length === 0
                  // Save stays disabled with tiers.length === 0 but nothing
                  // ever explained that — typing a name into the field above
                  // without clicking the + button left the form silently
                  // stuck with no visible reason why. Confirmed by getting
                  // stuck on it directly: filled every other field, selected
                  // a service type, and still couldn't tell why Save wouldn't
                  // enable until reading the component's own disabled logic.
                  ? 'Click + to add at least one item below — a group needs at least one, even if you only ever charge one price.'
                  : 'Add each specific service under this group, with its own price — e.g. "Hem Pants — ₱300". Price is optional; add it later if it varies.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className={sectionHeadingClass}>Pricing, Turnaround &amp; Visibility</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Starting Price (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 1500"
                />
                <p className="text-[11px] text-[#A8A19A] mt-1">Headline price shown on the catalog card. Leave blank if it always depends on the items above.</p>
              </div>
              <div>
                <label className={labelClass}>
                  Turnaround (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 7"
                />
              </div>
            </div>

            {selectedServiceTypes.includes('bulk_sublimation') && (
              <div>
                <label className={labelClass}>
                  Minimum Order Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={minOrderQty}
                  onChange={(e) => setMinOrderQty(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 10"
                />
                <p className="text-xs text-[#A8A19A] mt-1">Team/bulk orders below this quantity will be blocked at job creation.</p>
              </div>
            )}

            <div>
              <label className={labelClass}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Describe this group of services..."
              />
            </div>

            <div>
              <label className={labelClass}>
                Service Group Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#EBE6E0] border-dashed rounded-xl relative overflow-hidden group bg-[#FAF6F3]/50">
                <div className="space-y-1 text-center relative z-10">
                  {uploadingImage ? (
                    <Loader2 className="mx-auto h-8 w-8 text-[#A8A19A] animate-spin" />
                  ) : imageUrl ? (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="mx-auto h-8 w-8 text-[#7A8B76] mb-2" />
                      <span className="text-sm text-[#7A8B76] font-medium">Image uploaded</span>
                      <button type="button" onClick={() => setImageUrl(null)} className="mt-2 text-xs text-[#B26959] hover:text-[#91544A] font-medium focus:outline-none">Remove image</button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-8 w-8 text-[#A8A19A]" />
                      <div className="flex text-sm text-[#827A73] justify-center">
                        <label htmlFor="service-image" className="relative cursor-pointer bg-transparent rounded-md font-medium text-taupe hover:underline focus-within:outline-none">
                          <span>Upload a file</span>
                          <input id="service-image" name="service-image" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                      </div>
                      <p className="text-xs text-[#A8A19A]">PNG, JPG up to 2MB</p>
                    </>
                  )}
                </div>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-10 transition-opacity" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-taupe border-[#EBE6E0] rounded focus:ring-taupe"
              />
              <label htmlFor="is_active" className="text-sm text-[#524A44]">
                Active &amp; Visible to Customers
              </label>
            </div>
          </div>
        </div>

        <SizeChartEditor key={editingId ?? 'new'} mode="table" value={sizeChart} onChange={setSizeChart} shopId={shop?.id ?? 0} />

        <div className="flex justify-end gap-3 pt-4 border-t border-[#EBE6E0]">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-[#524A44] hover:bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg transition-colors focus:outline-none">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || tiers.length === 0 || selectedServiceTypes.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-taupe rounded-lg hover:bg-taupe-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors focus:outline-none">
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> {editingId ? 'Saving...' : 'Adding...'}</>
            ) : (
              <>{editingId ? 'Save Changes' : 'Add Service Group'}</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
