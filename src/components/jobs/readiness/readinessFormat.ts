export const peso = (n: number | string | null | undefined) =>
  `₱${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const CORRECTION_KIND_LABELS = {
  defect: 'Defect at quality check',
  fitting_issue: 'Fitting issue',
  change_request: 'Customer change request',
} as const;
