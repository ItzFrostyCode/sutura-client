import React from 'react';
import { Store, FileText, Link as LinkIcon, Calendar, MapPin, Loader2, Save } from 'lucide-react';
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
    handleSave,
    handleDiscard,
  } = useSettings();

  return (
    <div className="bg-[#FAF6F3] rounded-2xl w-full flex flex-col shadow-sm border border-[#EBE6E0] overflow-hidden min-h-[600px] animate-in fade-in duration-300">
        
        {/* Body Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Sidebar Tabs */}
          <div className="w-full md:w-64 border-r border-[#EBE6E0] bg-white shrink-0 p-4 overflow-y-auto">
            <h2 className="text-xl font-extrabold text-[#2D2A26] mb-4 pl-2">About</h2>
            <div className="flex flex-row md:flex-col gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-[#9A8073] text-white shadow-sm'
                        : 'text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#524A44]'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={32} className="animate-spin text-[#9A8073]" />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
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
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#EBE6E0] bg-white shrink-0 flex justify-end gap-3 items-center">
          {isDirty && (
            <div className="flex-1 flex items-center gap-2 text-sm text-amber-600 font-semibold pl-4">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved changes
            </div>
          )}
          <button 
            onClick={() => { if (isDirty) handleDiscard(); }} 
            disabled={saving || !isDirty} 
            className="px-5 py-2.5 text-[15px] font-semibold text-[#524A44] hover:bg-[#FAF6F3] rounded-xl transition-colors disabled:opacity-50"
          >
            Discard
          </button>
          <button 
            onClick={async () => {
              await handleSave();
            }} 
            disabled={saving || !isDirty} 
            className="flex items-center gap-2 px-6 py-2.5 bg-[#9A8073] text-white text-[15px] font-semibold rounded-xl hover:bg-[#8A7063] transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>

      </div>
  );
}
