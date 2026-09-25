'use client';

import { Bell } from 'lucide-react';
import { useAccountSettings } from '@/components/account-settings/useAccountSettings';
import PageHeader from '@/components/shared/PageHeader';
import AccountProfileCard from '@/components/account-settings/AccountProfileCard';
import PersonalTab from '@/components/account-settings/PersonalTab';
import SecurityTab from '@/components/account-settings/SecurityTab';
import NotificationsTab from '@/components/account-settings/NotificationsTab';

export default function AccountSettingsPage() {
  const {
    user,
    roleName,
    activeTab,
    setActiveTab,
    tabs: baseTabs,
    personalForm,
    setPersonalForm,
    personalErrors,
    setPersonalErrors,
    passwordForm,
    setPasswordForm,
    passwordErrors,
    setPasswordErrors,
    showCurrent,
    setShowCurrent,
    showNew,
    setShowNew,
    showConfirm,
    setShowConfirm,
    loadingPersonal,
    loadingPassword,
    uploadingAvatar,
    togglingAvailability,
    isStaffOnly,
    staffProfile,
    handlePersonalSubmit,
    handlePasswordSubmit,
    handleAvatarUpload,
    handleToggleAvailability,
  } = useAccountSettings();

  const tabs = [...baseTabs, { id: 'notifications' as const, label: 'Notifications', icon: Bell }];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Your Account"
        title="Account Settings"
        description="Manage your personal details and security preferences."
      />

      <AccountProfileCard
        user={user}
        roleName={roleName}
        uploadingAvatar={uploadingAvatar}
        onAvatarUpload={(file) => void handleAvatarUpload(file)}
        isStaffOnly={isStaffOnly}
        staffProfile={staffProfile}
        togglingAvailability={togglingAvailability}
        onToggleAvailability={handleToggleAvailability}
      />

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-sunken p-1 rounded-xl w-fit max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'personal' | 'security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive ? 'bg-white text-ink shadow-xs' : 'text-ink-muted hover:text-ink-body'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Personal Info */}
      {(activeTab as string) === 'personal' && (
        <PersonalTab
          personalForm={personalForm}
          setPersonalForm={setPersonalForm}
          personalErrors={personalErrors}
          setPersonalErrors={setPersonalErrors}
          handlePersonalSubmit={handlePersonalSubmit}
          loadingPersonal={loadingPersonal}
          userEmail={user?.email || ''}
        />
      )}

      {/* Tab: Security */}
      {(activeTab as string) === 'security' && (
        <SecurityTab
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          passwordErrors={passwordErrors}
          setPasswordErrors={setPasswordErrors}
          handlePasswordSubmit={handlePasswordSubmit}
          loadingPassword={loadingPassword}
          showCurrent={showCurrent}
          setShowCurrent={setShowCurrent}
          showNew={showNew}
          setShowNew={setShowNew}
          showConfirm={showConfirm}
          setShowConfirm={setShowConfirm}
        />
      )}

      {/* Tab: Notifications */}
      {(activeTab as string) === 'notifications' && <NotificationsTab />}
    </div>
  );
}
