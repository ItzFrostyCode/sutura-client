// Real store-level specialization enum — matches UpdateStoreRequest's
// validation list exactly (`in:barong,gown,suit,filipiniana,uniform,
// lab_gown,scrub_suit,corporate_wear,alteration_repair`), same labels the
// owner-side specialization picker (SettingsBusinessType.tsx) already uses.
// Distinct from garmentCategories.tsx, which filters catalog *items* by
// garment_type — this filters *stores* by what they specialize in.
export const STORE_SPECIALIZATIONS = [
  { value: 'barong', label: 'Barong Tagalog' },
  { value: 'gown', label: 'Gowns' },
  { value: 'suit', label: 'Suits' },
  { value: 'filipiniana', label: 'Filipiniana' },
  { value: 'uniform', label: 'School / Corporate Uniforms' },
  { value: 'lab_gown', label: 'Lab Gowns' },
  { value: 'scrub_suit', label: 'Scrub Suits' },
  { value: 'corporate_wear', label: 'Corporate Wear' },
  { value: 'alteration_repair', label: 'Alterations & Repair' },
];
