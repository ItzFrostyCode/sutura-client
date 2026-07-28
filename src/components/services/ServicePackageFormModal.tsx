import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { AlertTriangle, Loader2, X, Search } from 'lucide-react';
import { Service, ServicePackage } from './serviceHelpers';

interface ServicePackageFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly services: Service[];
  readonly editingPackage: ServicePackage | null;
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

const defaultForm = {
  name: '', description: '', selectedIds: [] as number[], bundlePrice: '', isActive: true,
};

export default function ServicePackageFormModal({
  isOpen, onClose, services, editingPackage, onSubmit, isSubmitting, error,
}: ServicePackageFormModalProps) {
  const [formData, setFormData] = useState(defaultForm);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(editingPackage ? {
      name: editingPackage.name,
      description: editingPackage.description || '',
      selectedIds: editingPackage.services.map(s => s.id),
      bundlePrice: editingPackage.bundle_price || '',
      isActive: editingPackage.is_active,
    } : defaultForm);
    setSearch('');
  }, [isOpen, editingPackage]);

  const { name, description, selectedIds, bundlePrice, isActive } = formData;
  const selectedServices = services.filter(s => selectedIds.includes(s.id));
  const suggestions = services.filter(s =>
    !selectedIds.includes(s.id) &&
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  // A bundled service with no fixed price ("Custom Quote") would otherwise
  // silently contribute ₱0 to this sum — flagging it instead of letting the
  // owner unknowingly under-price a bundle that includes a variable-cost item.
  const noPriceServices = selectedServices.filter(s => s.base_price === null || s.base_price === undefined);
  const sumPrice = selectedServices.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0);

  const addService = (id: number) => {
    setFormData(prev => ({ ...prev, selectedIds: [...prev.selectedIds, id] }));
    setSearch('');
  };
  const removeService = (id: number) => {
    setFormData(prev => ({ ...prev, selectedIds: prev.selectedIds.filter(i => i !== id) }));
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || null,
      service_ids: selectedIds,
      bundle_price: bundlePrice ? Number(bundlePrice) : null,
      is_active: isActive,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingPackage ? 'Edit Package' : 'Create Package'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label htmlFor="package_name" className="block text-sm font-medium text-[#524A44] mb-1">
            Package Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="package_name"
            type="text"
            required
            value={name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Debut Package, Wedding Package"
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
          />
        </div>

        <div>
          <label htmlFor="package_description" className="block text-sm font-medium text-[#524A44] mb-1">Description (Optional)</label>
          <textarea
            id="package_description"
            rows={2}
            value={description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe resize-none"
            placeholder="What's this package for?"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-[#524A44] mb-1">
            Bundled Services <span className="text-rose-500">*</span>
            <span className="text-xs font-normal text-[#A8A19A] ml-1">(select at least 2 or more)</span>
          </span>

          {selectedServices.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedServices.map(s => (
                <span
                  key={s.id}
                  className="flex items-center gap-1.5 bg-taupe/10 text-taupe border border-taupe/20 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium"
                >
                  {s.name}
                  <button
                    type="button"
                    onClick={() => removeService(s.id)}
                    className="hover:bg-taupe/20 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your services to add..."
              className="w-full pl-9 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
            />
          </div>

          {search && (
            <div className="mt-1.5 max-h-40 overflow-y-auto border border-[#EBE6E0] rounded-lg bg-white shadow-sm">
              {suggestions.length === 0 ? (
                <p className="px-3 py-2 text-xs text-[#A8A19A]">No matching services.</p>
              ) : (
                suggestions.map(s => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => addService(s.id)}
                    className="w-full text-left px-3 py-2 text-sm text-[#2D2A26] hover:bg-[#FAF6F3] transition-colors flex items-center justify-between"
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-[#A8A19A]">₱{Number(s.base_price || 0).toLocaleString()}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="bundle_price" className="block text-sm font-medium text-[#524A44] mb-1">
            Bundle Price
            {selectedServices.length > 0 && (
              <span className="text-xs font-normal text-[#A8A19A] ml-1">(sum of selected: ₱{sumPrice.toLocaleString()})</span>
            )}
          </label>
          {noPriceServices.length > 0 && (
            <p className="text-xs text-[#B26959] mb-1.5 flex items-start gap-1.5">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>
                {noPriceServices.map(s => s.name).join(', ')} {noPriceServices.length === 1 ? 'has' : 'have'} no fixed price (Custom Quote) — not included in the sum above. Set the Bundle Price manually to account for it.
              </span>
            </p>
          )}
          <input
            id="bundle_price"
            type="number"
            min="0"
            step="0.01"
            value={bundlePrice}
            onChange={e => setFormData(prev => ({ ...prev, bundlePrice: e.target.value }))}
            placeholder={sumPrice > 0 ? `Leave blank to charge ₱${sumPrice.toLocaleString()}` : 'Optional discounted bundle price'}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
          />
        </div>

        <label htmlFor="package_is_active" className="flex items-center gap-2 cursor-pointer">
          <input
            id="package_is_active"
            type="checkbox"
            checked={isActive}
            onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
          />
          <span className="text-sm text-[#524A44]">Active (visible and orderable)</span>
        </label>

        <div className="pt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || selectedIds.length < 2}
            className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {editingPackage ? 'Save Changes' : 'Create Package'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
