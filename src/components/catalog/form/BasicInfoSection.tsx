import React from 'react';
import { CatalogFormData } from '../catalogTypes';
import { StoreServiceOption } from './formTypes';
import { FabricTextureUpload } from './FabricTextureUpload';
import { AvailableSizesField } from './AvailableSizesField';

interface BasicInfoSectionProps {
  readonly formData: CatalogFormData;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  readonly setFormData: React.Dispatch<React.SetStateAction<CatalogFormData>>;
  readonly storeServices: StoreServiceOption[];
  readonly fabricImageUploading: boolean;
  readonly fabricImageInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onFabricUpload: (file: File | undefined) => void;
  readonly showMoreDetails: boolean;
  readonly setShowMoreDetails: React.Dispatch<React.SetStateAction<boolean>>;
  readonly sizeInput: string;
  readonly setSizeInput: (v: string) => void;
  readonly onAddSize: () => void;
  readonly onRemoveSize: (size: string) => void;
}

export function BasicInfoSection({
  formData,
  onChange,
  setFormData,
  storeServices,
  fabricImageUploading,
  fabricImageInputRef,
  onFabricUpload,
  showMoreDetails,
  setShowMoreDetails,
  sizeInput,
  setSizeInput,
  onAddSize,
  onRemoveSize,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-6 space-y-6">
      <h2 className="text-lg font-medium text-ink border-b border-[#FAF6F3] pb-3">Basic Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="catalog-name" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">
            Product / Design Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="catalog-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="e.g. Traditional Jusi Barong"
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        <div>
          <label htmlFor="catalog-price" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">
            Price (PHP) <span className="text-rose-500">*</span>
            <span className="text-ink-faint normal-case font-normal"> — base/single-piece price; bulk pricing is arranged per job order</span>
          </label>
          <input
            id="catalog-price"
            type="number"
            name="price"
            value={formData.price}
            onChange={onChange}
            placeholder="e.g. 24999"
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="catalog-material" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">Fabric / Material</label>
          <input
            id="catalog-material"
            type="text"
            name="material"
            value={formData.material}
            onChange={onChange}
            placeholder="e.g. Cocoon Silk, Piña"
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
          />
          <FabricTextureUpload
            fabricImageUrl={formData.fabric_image_url}
            uploading={fabricImageUploading}
            inputRef={fabricImageInputRef}
            onRemove={() => setFormData(prev => ({ ...prev, fabric_image_url: '' }))}
            onUpload={onFabricUpload}
          />
        </div>

        <div>
          <label htmlFor="catalog-color" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">Color</label>
          <input
            id="catalog-color"
            type="text"
            name="color"
            value={formData.color}
            onChange={onChange}
            placeholder="e.g. Ivory, Navy Blue"
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        <div>
          <label htmlFor="catalog-garment" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">Garment Type</label>
          <input
            id="catalog-garment"
            type="text"
            name="garment_type"
            value={formData.garment_type}
            onChange={onChange}
            placeholder="e.g. Barong, Gown, Suit"
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="catalog-service" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">
          Link to Service <span className="text-ink-faint normal-case font-normal">— optional; a bulk_sublimation service enables the customer-facing Bulk Order flow on this item</span>
        </label>
        <select
          id="catalog-service"
          name="service_id"
          value={formData.service_id}
          onChange={onChange}
          className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:border-taupe text-sm"
        >
          <option value="">No linked service</option>
          {storeServices.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}{(s.service_types ?? []).includes('bulk_sublimation') ? ' (Bulk Sublimation)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="catalog-estimated-days" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">
            Estimated Days to Complete
          </label>
          <input
            id="catalog-estimated-days"
            type="number"
            min="1"
            name="estimated_days"
            value={formData.estimated_days}
            onChange={onChange}
            placeholder="e.g. 7"
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        <div>
          <label htmlFor="catalog-gallery" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">External Gallery Link (Optional)</label>
          <input
            id="catalog-gallery"
            type="url"
            name="external_gallery_url"
            value={formData.external_gallery_url}
            onChange={onChange}
            placeholder="e.g. Pinterest board, Google Drive link"
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
          />
        </div>
      </div>

      {/* Active / Paused toggle */}
      <div className="flex items-center gap-3 pt-1">
        <input
          id="catalog-is-active"
          type="checkbox"
          checked={formData.is_active}
          onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
          className="w-4 h-4 rounded border-line text-taupe focus:ring-taupe"
        />
        <label htmlFor="catalog-is-active" className="text-sm font-medium text-ink-body">
          Active &amp; Visible to Customers{' '}
          <span className="block text-xs font-normal text-ink-faint">
            Uncheck to pause this item (e.g. out of stock) without deleting it — it&apos;s hidden from your public storefront but stays in your own catalog list.
          </span>
        </label>
      </div>

      <AvailableSizesField
        showMoreDetails={showMoreDetails}
        setShowMoreDetails={setShowMoreDetails}
        sizes={formData.sizes}
        sizeInput={sizeInput}
        setSizeInput={setSizeInput}
        onAddSize={onAddSize}
        onRemoveSize={onRemoveSize}
      />

      <div>
        <label htmlFor="catalog-desc" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">Description</label>
        <textarea
          id="catalog-desc"
          rows={4}
          name="description"
          value={formData.description}
          onChange={onChange}
          placeholder="Tell clients about the design, silhouette details, and styling recommendations..."
          className="w-full px-4 py-3 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
        />
      </div>
    </div>
  );
}
