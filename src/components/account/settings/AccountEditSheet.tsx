import { type EditableField } from './useAccountDetail';
import ProfileFieldForm from './ProfileFieldForm';
import PasswordForm from './PasswordForm';

interface AccountEditSheetProps {
  openField: EditableField;
  onClose: () => void;
  name: string;
  setName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  savingProfile: boolean;
  profileMessage: { type: 'success' | 'error'; text: string } | null;
  onProfileSubmit: (e: React.FormEvent) => void;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  savingPassword: boolean;
  passwordMessage: { type: 'success' | 'error'; text: string } | null;
  onPasswordSubmit: (e: React.FormEvent) => void;
}

const SHEET_TITLES: Record<EditableField, string> = {
  name: 'Edit Name',
  phone: 'Edit Phone',
  password: 'Change Password',
};

/** The bottom sheet that edits one field. */
export default function AccountEditSheet({ openField, onClose, name, setName, phone, setPhone, savingProfile, profileMessage, onProfileSubmit, currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, savingPassword, passwordMessage, onPasswordSubmit }: Readonly<AccountEditSheetProps>) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 animate-in fade-in bg-ink/40 backdrop-blur-[2px] duration-200" />
      <div
        className="relative mx-auto w-full max-w-[599px] animate-in slide-in-from-bottom rounded-t-[28px] bg-surface px-5 pb-8 pt-3 duration-300 sm:max-w-2xl sm:px-8"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
        <h2 className="mobile-h3 mb-4 text-center text-ink">{SHEET_TITLES[openField]}</h2>

        {(openField === 'name' || openField === 'phone') && (
          <ProfileFieldForm
            field={openField}
            value={openField === 'name' ? name : phone}
            onChange={openField === 'name' ? setName : setPhone}
            saving={savingProfile}
            message={profileMessage}
            onSubmit={onProfileSubmit}
            onClose={onClose}
          />
        )}

        {openField === 'password' && (
          <PasswordForm
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            saving={savingPassword}
            message={passwordMessage}
            onSubmit={onPasswordSubmit}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
