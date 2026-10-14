/** Save and Cancel, two round buttons side by side: the dark one saves. */
export default function FormActions({ saving, label, savingLabel, onCancel }: { readonly saving: boolean; readonly label: string; readonly savingLabel: string; readonly onCancel: () => void }) {
  return (
    <div className="mt-4 flex gap-3">
      <button type="submit" disabled={saving} className="flex h-12 flex-1 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-60">
        {saving ? savingLabel : label}
      </button>
      <button type="button" onClick={onCancel} className="flex h-12 flex-1 items-center justify-center rounded-full bg-sunken text-sm font-semibold text-ink transition-opacity active:opacity-70">
        Cancel
      </button>
    </div>
  );
}
