'use client';

import React from 'react';
import { Store, FileText, Link as LinkIcon, Calendar, MapPin, Loader2, Save, Undo2, CheckCircle2 } from 'lucide-react';
import { useSettings, SettingsTab } from '@/components/settings/useSettings';
import SettingsBusinessType from '@/components/settings/SettingsBusinessType';
import SettingsBasicInfo from '@/components/settings/SettingsBasicInfo';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'business_type', label: 'Business Type', icon: Store },
  { id: 'basic_info', label: 'Basic Info & Contact', icon: FileText },
  { id: 'social_links', label: 'Social Media Links', icon: LinkIcon },
  { id: 'booking_flow', label: 'Booking Flow Setup', icon: Calendar },
  { id: 'map_coordinates', label: 'Map Coordinates', icon: MapPin },
];

export default function ProfileAboutTab() {
  const {
    loading,
    saving,
    isDirty,
    activeTab,
    setActiveTab,
    formData,
    setFormDataWithDirty,
    handleChange,
    handleBusinessTypeChange,
    handleSocialChange,
    handleLogoUpload,
    handleBannerUpload,
    handleGcashQrUpload,
    handleBankQrUpload,
    handleSave,
    handleDiscard,
  } = useSettings();

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Action Header Bar — Cancel & Save are at the TOP for quick review and action */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight">Shop Settings & Profile</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Configure your shop branding, contact information, social links, and booking flow.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          {isDirty && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => { if (isDirty) handleDiscard(); }}
            disabled={saving || !isDirty}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-ink-body hover:bg-sunken bg-canvas border border-line rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <Undo2 size={14} />
            <span>Discard</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              await handleSave();
            }}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-5 py-2 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-[#8A7063] transition-all disabled:opacity-40 shadow-sm cursor-pointer"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Body Layout: Compact Sidebar + Content Panel */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Left Sidebar Navigation — natural compact height matching the 5 items */}
        <div className="w-full md:w-60 bg-white rounded-2xl p-2.5 shadow-sm shrink-0 self-start">
          <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-taupe text-white shadow-xs'
                      : 'text-ink-muted hover:bg-canvas hover:text-ink'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-ink-faint'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 w-full min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm text-ink-muted">
              <Loader2 size={28} className="animate-spin text-taupe mb-2" />
              <span className="text-xs font-medium">Loading shop settings...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'business_type' && (
                <SettingsBusinessType
                  businessType={formData.business_type}
                  onChange={handleBusinessTypeChange}
                  specializations={formData.specializations}
                  onSpecializationsChange={(specializations) => setFormDataWithDirty(prev => ({ ...prev, specializations }))}
                  isFeatured={formData.is_featured}
                  onFeaturedChange={(is_featured) => setFormDataWithDirty(prev => ({ ...prev, is_featured }))}
                  isHidden={formData.is_hidden}
                  onHiddenChange={(is_hidden) => setFormDataWithDirty(prev => ({ ...prev, is_hidden }))}
                />
              )}

              {activeTab !== 'business_type' && (
                <SettingsBasicInfo
                  formData={formData}
                  onChange={handleChange}
                  handleSocialChange={handleSocialChange}
                  setFormData={setFormDataWithDirty}
                  activeTab={activeTab as 'basic_info' | 'social_links' | 'booking_flow' | 'map_coordinates'}
                  onLogoUpload={handleLogoUpload}
                  onBannerUpload={handleBannerUpload}
                  onGcashQrUpload={handleGcashQrUpload}
                  onBankQrUpload={handleBankQrUpload}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
