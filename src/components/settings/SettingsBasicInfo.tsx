import React from 'react';

import { Trash2, Plus, Upload, Loader2 } from 'lucide-react';
import { ShopSettingsData } from './SettingsRentalPolicies';

interface SettingsBasicInfoProps {
  readonly formData: ShopSettingsData;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly handleSocialChange: (newLinks: { label: string; url: string }[]) => void;
  readonly setFormData: React.Dispatch<React.SetStateAction<ShopSettingsData>>;
  readonly activeTab: 'basic_info' | 'social_links' | 'booking_flow' | 'map_coordinates' | 'business_type';
  readonly onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SettingsBasicInfo({ formData, onChange, handleSocialChange, setFormData, activeTab, onLogoUpload, onBannerUpload }: SettingsBasicInfoProps) {
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [uploadingBanner, setUploadingBanner] = React.useState(false);
  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      booking_questions: [...prev.booking_questions, ''],
    }));
  };

  const handleQuestionChange = (idx: number, value: string) => {
    setFormData(prev => {
      const qs = [...prev.booking_questions];
      qs[idx] = value;
      return { ...prev, booking_questions: qs };
    });
  };

  const handleRemoveQuestion = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      booking_questions: prev.booking_questions.filter((_, i) => i !== idx),
    }));
  };
  return (
    <div className="space-y-6">
      {/* Shop Branding — logo and banner */}
      {activeTab === 'basic_info' && (
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-1">Shop Branding</h2>
        <p className="text-sm text-[#827A73] mb-6">
          Your logo and banner are the first thing customers see on your storefront and in search results.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="text-sm font-medium text-[#524A44]">Logo</span>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border border-[#EBE6E0] bg-[#FAF6F3] overflow-hidden shrink-0 flex items-center justify-center">
                {formData.logo_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.logo_path} alt="Shop logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={18} className="text-[#C5BDBA]" />
                )}
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#9A8073] hover:text-[#8A7063] bg-[#FAF6F3] hover:bg-[#F0EAE3] border border-[#EBE6E0] px-3.5 py-2 rounded-lg transition-colors">
                {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={async e => {
                    setUploadingLogo(true);
                    await onLogoUpload(e);
                    setUploadingLogo(false);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-[#524A44]">Banner</span>
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 rounded-xl border border-[#EBE6E0] bg-[#FAF6F3] overflow-hidden shrink-0 flex items-center justify-center">
                {formData.banner_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.banner_path} alt="Shop banner" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={18} className="text-[#C5BDBA]" />
                )}
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#9A8073] hover:text-[#8A7063] bg-[#FAF6F3] hover:bg-[#F0EAE3] border border-[#EBE6E0] px-3.5 py-2 rounded-lg transition-colors">
                {uploadingBanner ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                <span>{uploadingBanner ? 'Uploading...' : 'Upload Banner'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingBanner}
                  onChange={async e => {
                    setUploadingBanner(true);
                    await onBannerUpload(e);
                    setUploadingBanner(false);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Basic Info & Contact */}
      {activeTab === 'basic_info' && (
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Basic Info & Contact</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="shop-name" className="text-sm font-medium text-[#524A44]">Shop Name</label>
              <input
                id="shop-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-email" className="text-sm font-medium text-[#524A44]">Contact Email</label>
              <input
                id="shop-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="shop-description" className="text-sm font-medium text-[#524A44]">Description</label>
            <textarea
              id="shop-description"
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={3}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="shop-address" className="text-sm font-medium text-[#524A44]">Address</label>
              <input
                id="shop-address"
                type="text"
                name="address"
                value={formData.address}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-landmark" className="text-sm font-medium text-[#524A44]">Landmark</label>
              <input
                id="shop-landmark"
                type="text"
                name="landmark"
                value={formData.landmark ?? ''}
                onChange={onChange}
                placeholder="e.g. Near City Hall, Beside Jollibee"
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-city" className="text-sm font-medium text-[#524A44]">City</label>
              <input
                id="shop-city"
                type="text"
                name="city"
                value={formData.city}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-province" className="text-sm font-medium text-[#524A44]">Province</label>
              <input
                id="shop-province"
                type="text"
                name="province"
                value={formData.province}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="shop-phone" className="text-sm font-medium text-[#524A44]">Phone Number</label>
              <input
                id="shop-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={onChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
              />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Social Media Links */}
      {activeTab === 'social_links' && (
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Social Media Links</h2>
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#827A73]">These links will be displayed on your public shop profile.</p>
          <button
            type="button"
            onClick={() => handleSocialChange([...(formData.social_links || []), { label: '', url: '' }])}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#9A8073] bg-[#FAF6F3] rounded-lg hover:bg-[#F0EAE3] transition-colors"
          >
            <Plus size={16} /> Add Link
          </button>
        </div>
        <div className="space-y-4">
          {(formData.social_links || []).map((link, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-full md:w-1/3">
                <input
                  type="text"
                  value={link.label}
                  onChange={e => {
                    const newLinks = [...formData.social_links];
                    newLinks[idx].label = e.target.value;
                    handleSocialChange(newLinks);
                  }}
                  placeholder="Platform (e.g., Facebook)"
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe outline-none"
                />
              </div>
              <div className="w-full md:w-2/3 flex items-center gap-2">
                <input
                  type="url"
                  value={link.url}
                  onChange={e => {
                    const newLinks = [...formData.social_links];
                    newLinks[idx].url = e.target.value;
                    handleSocialChange(newLinks);
                  }}
                  placeholder="https://..."
                  className="flex-1 px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newLinks = formData.social_links.filter((_, i) => i !== idx);
                    handleSocialChange(newLinks);
                  }}
                  className="p-2 text-[#B26959] hover:bg-[#B26959]/10 rounded-lg transition-colors"
                  title="Remove link"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {(!formData.social_links || formData.social_links.length === 0) && (
            <div className="text-center py-6 bg-[#FAF6F3] rounded-xl border border-dashed border-[#EBE6E0]">
              <p className="text-sm text-[#827A73]">No social links added yet.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Booking Flow Setup */}
      {activeTab === 'booking_flow' && (
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Booking Flow Setup</h2>
        <div className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="booking-policy" className="text-sm font-medium text-[#524A44]">
              Cancellation Policy & Service Description
            </label>
            <textarea
              id="booking-policy"
              name="booking_policy"
              value={formData.booking_policy || ''}
              onChange={onChange}
              rows={4}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="max-appointments-per-day" className="text-sm font-medium text-[#524A44]">
              Max Appointments Per Day (Optional)
            </label>
            <input
              id="max-appointments-per-day"
              type="number"
              min={1}
              value={formData.max_appointments_per_day ?? ''}
              onChange={e => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, max_appointments_per_day: val === '' ? null : Number.parseInt(val, 10) }));
              }}
              placeholder="Leave blank for unlimited"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm max-w-xs"
            />
            <p className="text-[11px] text-[#827A73]">
              During peak season, blocks further online bookings once a day hits this cap — protects production quality instead of overcommitting. Doesn&apos;t apply to walk-ins you enter yourself.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#524A44]">Custom Booking Questions</span>
              <button
                onClick={() => handleAddQuestion()}
                className="text-xs text-taupe hover:text-taupe-hover"
                type="button"
              >
                + Add Question
              </button>
            </div>
 
            {(formData.booking_questions || []).map((q: string, idx: number) => (
              <div key={`question-${idx}`} className="flex gap-2">
                <input
                  type="text"
                  value={q}
                  onChange={e => handleQuestionChange(idx, e.target.value)}
                  placeholder={`Question ${idx + 1}`}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:outline-none focus:border-taupe"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(idx)}
                  className="px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <span className="sr-only">Remove</span>
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Map Coordinates */}
      {activeTab === 'map_coordinates' && (
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[#2D2A26]">Map Coordinates</h2>
          <p className="text-sm text-[#827A73] mt-1">
            Required for your shop to appear on the customer map discovery interface. Right-click your location on
            Google Maps to copy the Latitude and Longitude.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label htmlFor="shop-latitude" className="text-sm font-medium text-[#524A44]">Latitude (e.g. 7.1907)</label>
            <input
              id="shop-latitude"
              type="text"
              name="latitude"
              value={formData.latitude}
              onChange={onChange}
              placeholder="7.1907"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="shop-longitude" className="text-sm font-medium text-[#524A44]">Longitude (e.g. 125.4553)</label>
            <input
              id="shop-longitude"
              type="text"
              name="longitude"
              value={formData.longitude}
              onChange={onChange}
              placeholder="125.4553"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
            />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
