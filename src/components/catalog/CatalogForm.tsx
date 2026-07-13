'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  ImageOff,
} from 'lucide-react';
import { BulletItem, ImageItem, CatalogFormData } from './catalogTypes';
import { uploadSectionImage, uploadCatalogImage, buildSavePayload } from './catalogHelpers';
import SizeChartEditor, { SizeChartValue, emptySizeChart } from '@/components/shared/SizeChartEditor';
import api from '@/lib/axios';

interface SectionImageUploadProps {
  readonly imageUrl: string;
  readonly uploading: boolean;
  readonly uploadId: string;
  readonly alt: string;
  readonly onRemove: () => void;
  readonly onChange: (file: File | undefined) => void;
}

function SectionImageUpload({ imageUrl, uploading, uploadId, alt, onRemove, onChange }: SectionImageUploadProps) {
  if (imageUrl) {
    return (
      <div className="relative max-w-md aspect-video bg-white shadow-sm border border-[#EBE6E0] rounded-lg overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#FAF6F3] text-xs font-medium"
        >
          Remove Image
        </button>
      </div>
    );
  }
  return (
    <div className="border-2 border-dashed border-[#EBE6E0] rounded-lg p-4 text-center max-w-md bg-white">
      {uploading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-[#827A73]">
          <Loader2 className="w-4 h-4 animate-spin text-taupe" />
          <span>Uploading visual guide...</span>
        </div>
      ) : (
        <input
          id={uploadId}
          type="file"
          accept="image/*"
          onChange={e => onChange(e.target.files?.[0])}
          className="text-xs text-[#827A73] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#F0EAE3] file:text-taupe hover:file:bg-[#EBE6E0] cursor-pointer"
        />
      )}
    </div>
  );
}

interface CatalogFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialData?: {
    features: BulletItem[];
    featuresImage: string;
    sizeChart: SizeChartValue;
    careImage: string;
    formData: CatalogFormData;
    images: ImageItem[];
  };
  onSubmit: (payload: ReturnType<typeof buildSavePayload>) => Promise<void>;
  submitting: boolean;
}

export default function CatalogForm({
  title,
  description,
  submitLabel,
  initialData,
  onSubmit,
  submitting,
}: Readonly<CatalogFormProps>) {
  const { shop } = useAuthStore();

  const [formData, setFormData] = useState<CatalogFormData>({
    name: '',
    price: '',
    estimated_days: '',
    material: '',
    color: '',
    fabric_image_url: '',
    description: '',
    care_instructions: '',
    garment_type: '',
    sizes: [],
    external_gallery_url: '',
    is_active: true,
  });

  const [fabricImageUploading, setFabricImageUploading] = useState(false);
  const fabricImageInputRef = useRef<HTMLInputElement>(null);
  const [sizeInput, setSizeInput] = useState('');

  const addSize = () => {
    const size = sizeInput.trim();
    if (!size || formData.sizes.includes(size)) return;
    setFormData(prev => ({ ...prev, sizes: [...prev.sizes, size] }));
    setSizeInput('');
  };
  const removeSize = (size: string) => {
    setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== size) }));
  };

  const [features, setFeatures] = useState<BulletItem[]>([{ id: 'init', text: '' }]);
  const [sizeChart, setSizeChart] = useState<SizeChartValue>(emptySizeChart);
  const [images, setImages] = useState<ImageItem[]>([
    { id: 'init', url: '', angle: 'Default', is_primary: true },
  ]);

  const [featuresImage, setFeaturesImage] = useState<string>('');
  const [careImage, setCareImage] = useState<string>('');
  const [uploadingSection, setUploadingSection] = useState<'specs' | 'care' | null>(null);

  const [accordionOpen, setAccordionOpen] = useState({
    specs: false,
    care: false,
  });

  const [showMoreDetails, setShowMoreDetails] = useState(false);

  useEffect(() => {
    if (!initialData) return;
    setTimeout(() => {
      setFormData(initialData.formData);
      setFeatures(initialData.features);
      setSizeChart(initialData.sizeChart);
      setImages(initialData.images);
      setFeaturesImage(initialData.featuresImage);
      setCareImage(initialData.careImage);
    }, 0);
  }, [initialData]);

  const toggleAccordion = (section: 'specs' | 'care') => {
    setAccordionOpen(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSectionUpload = (file: File | undefined, section: 'specs' | 'care') => {
    if (!file || !shop?.id) return;
    uploadSectionImage({
      file,
      shopId: shop.id,
      section,
      setUploadingSection,
      setFeaturesImage,
      setCareImage,
    });
  };

  const handleFormSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = buildSavePayload(
      formData,
      features,
      featuresImage,
      sizeChart,
      careImage,
      images
    );
    await onSubmit(payload);
  };

  const handleFabricImageUpload = async (file: File | undefined) => {
    if (!file || !shop?.id) return;
    setFabricImageUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/shops/${shop.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url || '';
      setFormData(prev => ({ ...prev, fabric_image_url: url }));
    } catch {
      alert('Failed to upload fabric image.');
    } finally {
      setFabricImageUploading(false);
    }
  };

  // Blocks Save while any image slot is still mid-upload — otherwise
  // buildSavePayload's url.trim() !== '' filter silently drops that slot
  // entirely (its url is still '' until the upload resolves), losing the
  // image with no warning.
  const saveDisabled = submitting || !formData.name || !formData.price || images.every(i => !i.url) || images.some(i => i.uploading);

  return (
    <form onSubmit={handleFormSubmit} className="bg-[#FAF6F3] min-h-screen text-[#2D2A26] pb-16 font-sans selection:bg-[#EBE6E0]">
      {/* Top Header Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EBE6E0] pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/catalog"
              className="p-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#827A73] hover:text-[#2D2A26] hover:shadow-xs transition-all shrink-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#2D2A26] tracking-tight">{title}</h1>
              <p className="text-[#827A73] text-sm mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/catalog"
              className="px-5 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-sm font-semibold text-[#524A44] hover:bg-[#FAF6F3] transition-colors flex items-center justify-center animate-fade-in"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saveDisabled}
              className="px-5 py-2.5 bg-taupe hover:bg-taupe/90 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer animate-fade-in"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {submitLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-medium text-[#2D2A26] border-b border-[#FAF6F3] pb-3">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="catalog-name" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">
                    Product / Design Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="catalog-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Traditional Jusi Barong"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="catalog-price" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">
                    Price (PHP) <span className="text-rose-500">*</span>
                    <span className="text-[#A8A19A] normal-case font-normal"> — base/single-piece price; bulk pricing is arranged per job order</span>
                  </label>
                  <input
                    id="catalog-price"
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g. 24999"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="catalog-material" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Fabric / Material</label>
                  <input
                    id="catalog-material"
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    placeholder="e.g. Cocoon Silk, Piña"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                  {/* Fabric Texture Image Upload — a real button, styled distinctly
                      from the main Images panel on the right, so it isn't mistaken
                      for that gallery's own upload slots. */}
                  <div className="mt-2">
                    {formData.fabric_image_url ? (
                      <div className="relative inline-flex items-center gap-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.fabric_image_url} alt="Fabric texture" className="w-10 h-10 object-cover rounded border border-[#EBE6E0]" />
                        <span className="text-[#524A44] font-medium">Fabric texture uploaded</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, fabric_image_url: '' }))}
                          className="ml-1 text-[#B26959] hover:text-[#B26959]/80 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={fabricImageUploading}
                        onClick={() => fabricImageInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D5CEC8] bg-[#FAF6F3] text-xs font-semibold text-[#524A44] hover:bg-[#F0EAE3] hover:border-taupe transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {fabricImageUploading ? (
                          <Loader2 size={14} className="animate-spin text-taupe" />
                        ) : (
                          <UploadCloud size={14} />
                        )}
                        <span>{fabricImageUploading ? 'Uploading texture...' : 'Upload fabric texture image (optional)'}</span>
                        <input
                          ref={fabricImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={fabricImageUploading}
                          onChange={e => handleFabricImageUpload(e.target.files?.[0])}
                        />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="catalog-color" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Color</label>
                  <input
                    id="catalog-color"
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="e.g. Ivory, Navy Blue"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="catalog-garment" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Garment Type</label>
                  <input
                    id="catalog-garment"
                    type="text"
                    name="garment_type"
                    value={formData.garment_type}
                    onChange={handleChange}
                    placeholder="e.g. Barong, Gown, Suit"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="catalog-estimated-days" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">
                    Estimated Days to Complete
                  </label>
                  <input
                    id="catalog-estimated-days"
                    type="number"
                    min="1"
                    name="estimated_days"
                    value={formData.estimated_days}
                    onChange={handleChange}
                    placeholder="e.g. 7"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="catalog-gallery" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">External Gallery Link (Optional)</label>
                  <input
                    id="catalog-gallery"
                    type="url"
                    name="external_gallery_url"
                    value={formData.external_gallery_url}
                    onChange={handleChange}
                    placeholder="e.g. Pinterest board, Google Drive link"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
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
                  className="w-4 h-4 rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                />
                <label htmlFor="catalog-is-active" className="text-sm font-medium text-[#524A44]">
                  Active &amp; Visible to Customers{' '}
                  <span className="block text-xs font-normal text-[#A8A19A]">
                    Uncheck to pause this item (e.g. out of stock) without deleting it — it&apos;s hidden from your public storefront but stays in your own catalog list.
                  </span>
                </label>
              </div>

              {/* ── More Details Toggle ────────────────────────────────── */}
              <div className="border-t border-[#EBE6E0] pt-4">
                <button
                  type="button"
                  onClick={() => setShowMoreDetails(v => !v)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#9A8073] hover:text-[#2D2A26] transition-colors"
                >
                  <span className={`w-5 h-5 rounded-full border border-[#EBE6E0] bg-[#FAF6F3] flex items-center justify-center transition-transform ${showMoreDetails ? 'rotate-180' : ''}`}>
                    <ChevronDown size={12} />
                  </span>
                  {showMoreDetails ? 'Hide optional details' : 'Add available sizes →'}
                </button>

                {showMoreDetails && (
                  <div className="mt-5 grid grid-cols-1 gap-5">
                    <div>
                      <label htmlFor="catalog-sizes" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">
                        Available Sizes <span className="text-[#A8A19A] normal-case">— reference range for this design; leave blank if fully custom-measured</span>
                      </label>
                      {formData.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.sizes.map(size => (
                            <span key={size} className="flex items-center gap-1 px-3 py-1 bg-taupe text-white text-sm rounded-full">
                              {size}
                              <button type="button" onClick={() => removeSize(size)} className="hover:text-white/70 focus:outline-none">
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          id="catalog-sizes"
                          type="text"
                          value={sizeInput}
                          onChange={(e) => setSizeInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
                          placeholder="e.g. S, then press Enter"
                          className="flex-1 px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                        />
                        <button
                          type="button"
                          onClick={addSize}
                          className="shrink-0 px-4 rounded-xl bg-taupe/10 text-taupe hover:bg-taupe/20 transition-colors text-sm font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="catalog-desc" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Description</label>
                <textarea
                  id="catalog-desc"
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell clients about the design, silhouette details, and styling recommendations..."
                  className="w-full px-4 py-3 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                />
              </div>
            </div>

            {/* Accordion Sections for Specifications, Fit Guide, Care */}
            <div className="space-y-4">
              {/* Accordion 1: Specifications */}
              <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between p-5 text-left font-medium text-[#2D2A26] hover:bg-[#FAF6F3]/50 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-sm">Product Specifications</span>
                    <p className="text-xs text-[#827A73] mt-0.5">Collar designs, cuffs, embroidery details, linings</p>
                  </div>
                  {accordionOpen.specs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {accordionOpen.specs && (
                  <div className="p-5 border-t border-[#EBE6E0] bg-[#FAF6F3]/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#827A73]">Dynamic details that list out product specifications.</span>
                      <button
                        type="button"
                        onClick={() => setFeatures([...features, { id: Math.random().toString(), text: '' }])}
                        className="text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Bullet
                      </button>
                    </div>
                    <div className="space-y-3">
                      {features.map((feat, idx) => (
                        <div key={feat.id} className="flex gap-2">
                          <input
                            type="text"
                            value={feat.text}
                            onChange={e => {
                              const newF = [...features];
                              newF[idx] = { ...newF[idx], text: e.target.value };
                              setFeatures(newF);
                            }}
                            placeholder="e.g. Hand-stitched lapel, horn buttons"
                            className="flex-1 px-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                            className="p-2 text-[#A8A19A] hover:text-[#B26959] transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#EBE6E0] pt-4 mt-4">
                      <label htmlFor="features-upload" className="block text-xs font-semibold text-[#524A44] mb-2">
                        Section Visual Guide / Image (Optional)
                      </label>
                      <SectionImageUpload
                        imageUrl={featuresImage}
                        uploading={uploadingSection === 'specs'}
                        uploadId="features-upload"
                        alt="Features Spec Guide"
                        onRemove={() => setFeaturesImage('')}
                        onChange={file => handleSectionUpload(file, 'specs')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fit & Sizing Guidelines — the same Size Chart builder used on Services */}
              <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-5">
                <SizeChartEditor
                  mode="table"
                  value={sizeChart}
                  onChange={setSizeChart}
                  shopId={shop?.id ?? 0}
                  title="Fit & Sizing Guidelines"
                  description="Show customers exactly how you measure — upload your own reference chart image and/or build a size & measurement table."
                />
              </div>

              {/* Accordion 3: Garment Care & Alteration FAQ */}
              <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('care')}
                  className="w-full flex items-center justify-between p-5 text-left font-medium text-[#2D2A26] hover:bg-[#FAF6F3]/50 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-sm">Garment Care & Alterations FAQ</span>
                    <p className="text-xs text-[#827A73] mt-0.5">Dry-cleaning rules, laundry instructions, alteration limits</p>
                  </div>
                  {accordionOpen.care ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {accordionOpen.care && (
                  <div className="p-5 border-t border-[#EBE6E0] bg-[#FAF6F3]/20 space-y-4">
                    <div>
                      <span className="block text-xs text-[#827A73] mb-1">Detailed text description for garment upkeep and store policies:</span>
                      <textarea
                        rows={4}
                        name="care_instructions"
                        value={formData.care_instructions}
                        onChange={handleChange}
                        placeholder="Dry clean only. Minor alterations (hem, sleeves) are free within 30 days of purchase..."
                        className="w-full px-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                      />
                    </div>

                    <div className="border-t border-[#EBE6E0] pt-4 mt-2">
                      <label htmlFor="care-upload" className="block text-xs font-semibold text-[#524A44] mb-2">
                        Section Visual Guide / Image (Optional)
                      </label>
                      <SectionImageUpload
                        imageUrl={careImage}
                        uploading={uploadingSection === 'care'}
                        uploadId="care-upload"
                        alt="Garment Care Guide"
                        onRemove={() => setCareImage('')}
                        onChange={file => handleSectionUpload(file, 'care')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Images Upload Section */}
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-[#2D2A26]">Images</h2>
                <button
                  type="button"
                  onClick={() => setImages([...images, { id: Math.random().toString(), url: '', angle: 'Default', is_primary: false }])}
                  className="text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1"
                >
                  <Plus size={14} /> Add Image Slot
                </button>
              </div>
              <div className="space-y-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="space-y-3 p-4 bg-white border border-[#EBE6E0] rounded-xl relative group hover:border-[#9A8073]/50 transition-colors shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-white border border-[#EBE6E0] text-[#827A73] hover:text-rose-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                    >
                      <X size={14} />
                    </button>

                    {img.url ? (
                      <div className="relative aspect-3/4 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg overflow-hidden group/img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImages(prev => prev.map(im => (im.id === img.id ? { ...im, url: '' } : im)));
                          }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white text-sm font-medium gap-2"
                        >
                          <ImageOff size={16} /> Remove
                        </button>
                      </div>
                    ) : (
                      <label className="relative flex flex-col items-center justify-center aspect-3/4 border-2 border-dashed border-[#D5CEC8] rounded-lg bg-[#FAF6F3] hover:bg-[#F0EAE3] hover:border-[#9A8073] transition-colors cursor-pointer group/upload">
                        {img.uploading ? (
                          <div className="flex flex-col items-center gap-2 text-[#9A8073]">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs font-medium">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 bg-white rounded-full shadow-sm text-[#9A8073] mb-2 group-hover/upload:scale-110 transition-transform">
                              <UploadCloud size={20} />
                            </div>
                            <span className="text-sm font-semibold text-[#524A44]">Click to upload image</span>
                            <span className="text-xs text-[#827A73] mt-1">JPEG, PNG up to 5MB</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={img.uploading}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file && shop?.id) {
                              uploadCatalogImage({
                                file,
                                shopId: shop.id,
                                imageId: img.id,
                                setImages,
                              });
                            }
                          }}
                        />
                      </label>
                    )}

                    <div className="flex items-end gap-3 mt-3">
                      <div className="flex-1">
                        <label htmlFor={`img-angle-${img.id}`} className="block text-[11px] font-semibold text-[#827A73] uppercase tracking-wider mb-1">
                          Photo Label <span className="text-[#A8A19A] normal-case font-normal">— shown as a caption on this photo (e.g. Front, Back, Detail)</span>
                        </label>
                        <input
                          id={`img-angle-${img.id}`}
                          type="text"
                          value={img.angle}
                          onChange={e => {
                            const newAngle = e.target.value;
                            setImages(prev => prev.map(im => (im.id === img.id ? { ...im, angle: newAngle } : im)));
                          }}
                          placeholder="e.g. Front, Back, Detail"
                          className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-md text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073] transition-shadow"
                        />
                      </div>
                      <label className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md border cursor-pointer transition-colors shrink-0 ${img.is_primary ? 'bg-[#9A8073]/10 border-[#9A8073] text-[#9A8073] font-medium' : 'bg-white border-[#EBE6E0] text-[#827A73] hover:bg-[#FAF6F3]'}`}>
                        <input
                          type="radio"
                          name="is_primary"
                          checked={img.is_primary}
                          onChange={() => {
                            setImages(prev => prev.map(im => ({ ...im, is_primary: im.id === img.id })));
                          }}
                          className="accent-[#9A8073] w-4 h-4"
                        />
                        <span>Primary</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-[#EBE6E0] pt-6">
                <button
                  type="submit"
                  disabled={saveDisabled}
                  className="w-full bg-taupe hover:bg-taupe/90 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                  {submitLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
