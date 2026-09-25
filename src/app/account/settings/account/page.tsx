'use client';

import AccountHeader from '@/components/account/AccountHeader';
import AccountAvatarCard from '@/components/account/settings/AccountAvatarCard';
import AccountRowsList from '@/components/account/settings/AccountRowsList';
import AccountEditSheet from '@/components/account/settings/AccountEditSheet';
import { useAccountDetail } from '@/components/account/settings/useAccountDetail';

export default function AccountDetailPage() {
  const {
    user,
    fileInputRef,
    openField,
    name,
    setName,
    phone,
    setPhone,
    savingProfile,
    profileMessage,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    savingPassword,
    passwordMessage,
    uploadingAvatar,
    openSheet,
    closeSheet,
    handleAvatarClick,
    handleAvatarChange,
    handleProfileSubmit,
    handlePasswordSubmit,
  } = useAccountDetail();

  if (!user) return null;

  return (
    <div className="w-full">
      <AccountHeader title="Account Settings" backHref="/account/settings" />

      <AccountAvatarCard
        user={user}
        uploadingAvatar={uploadingAvatar}
        fileInputRef={fileInputRef}
        onAvatarClick={handleAvatarClick}
        onAvatarChange={handleAvatarChange}
      />

      <AccountRowsList
        user={user}
        uploadingAvatar={uploadingAvatar}
        onAvatarClick={handleAvatarClick}
        onOpenSheet={openSheet}
      />

      {openField && (
        <AccountEditSheet
          openField={openField}
          onClose={closeSheet}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          savingProfile={savingProfile}
          profileMessage={profileMessage}
          onProfileSubmit={handleProfileSubmit}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          savingPassword={savingPassword}
          passwordMessage={passwordMessage}
          onPasswordSubmit={handlePasswordSubmit}
        />
      )}
    </div>
  );
}
