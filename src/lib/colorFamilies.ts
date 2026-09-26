export interface ColorOption {
  label: string;
  hex: string;
}

export interface ColorFamily {
  name: string;
  dotColor: string;
  colors: ColorOption[];
}

export const COLOR_FAMILIES: ColorFamily[] = [
  {
    name: 'White & Neutrals',
    dotColor: '#F5F5F0',
    colors: [
      { label: 'White', hex: '#FFFFFF' },
      { label: 'Ivory', hex: '#FFFFF0' },
      { label: 'Cream', hex: '#FFFDD0' },
      { label: 'Beige', hex: '#D9CDB8' },
      { label: 'Champagne', hex: '#F7E7CE' },
    ],
  },
  {
    name: 'Black & Grays',
    dotColor: '#1A1A1A',
    colors: [
      { label: 'Black', hex: '#1A1A1A' },
      { label: 'Charcoal', hex: '#374151' },
      { label: 'Gray', hex: '#6B7280' },
      { label: 'Silver', hex: '#94A3B8' },
    ],
  },
  {
    name: 'Blues',
    dotColor: '#3B82F6',
    colors: [
      { label: 'Sky Blue', hex: '#7DD3FC' },
      { label: 'Light Blue', hex: '#93C5FD' },
      { label: 'Blue', hex: '#3B82F6' },
      { label: 'Royal Blue', hex: '#1D4ED8' },
      { label: 'Navy', hex: '#1E3A8A' },
    ],
  },
  {
    name: 'Reds & Burgundies',
    dotColor: '#EF4444',
    colors: [
      { label: 'Red', hex: '#EF4444' },
      { label: 'Crimson', hex: '#DC2626' },
      { label: 'Burgundy', hex: '#800020' },
      { label: 'Maroon', hex: '#800000' },
    ],
  },
  {
    name: 'Pinks & Peaches',
    dotColor: '#F472B6',
    colors: [
      { label: 'Pink', hex: '#F472B6' },
      { label: 'Blush', hex: '#DE5D83' },
      { label: 'Rose Gold', hex: '#B76E79' },
      { label: 'Peach', hex: '#FFDAB9' },
    ],
  },
  {
    name: 'Greens',
    dotColor: '#22C55E',
    colors: [
      { label: 'Emerald', hex: '#047857' },
      { label: 'Green', hex: '#22C55E' },
      { label: 'Teal', hex: '#0D9488' },
      { label: 'Olive', hex: '#556B2F' },
      { label: 'Sage', hex: '#9CAF88' },
    ],
  },
  {
    name: 'Yellows & Golds',
    dotColor: '#EAB308',
    colors: [
      { label: 'Gold', hex: '#EAB308' },
    ],
  },
  {
    name: 'Purples',
    dotColor: '#A855F7',
    colors: [
      { label: 'Purple', hex: '#A855F7' },
      { label: 'Lavender', hex: '#E9D5FF' },
    ],
  },
  {
    name: 'Browns & Earth Tones',
    dotColor: '#78350F',
    colors: [
      { label: 'Brown', hex: '#78350F' },
      { label: 'Bronze', hex: '#CD7F32' },
    ],
  },
];

export function parseSelectedColors(colorStr?: string | null): string[] {
  if (!colorStr) return [];
  return colorStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toggleColorSelection(currentStr: string | undefined | null, targetLabel: string): string {
  const current = parseSelectedColors(currentStr);
  const targetLower = targetLabel.toLowerCase();
  const exists = current.some((c) => c.toLowerCase() === targetLower);

  let updated: string[];
  if (exists) {
    updated = current.filter((c) => c.toLowerCase() !== targetLower);
  } else {
    updated = [...current, targetLabel];
  }
  return updated.join(',');
}

export function toggleFamilySelection(currentStr: string | undefined | null, family: ColorFamily): string {
  const current = parseSelectedColors(currentStr);
  const familyLabelsLower = family.colors.map((c) => c.label.toLowerCase());
  const allSelected = familyLabelsLower.every((fl) => current.some((c) => c.toLowerCase() === fl));

  let updated: string[];
  if (allSelected) {
    // deselect all in family
    updated = current.filter((c) => !familyLabelsLower.includes(c.toLowerCase()));
  } else {
    // add missing ones
    const missing = family.colors.filter((c) => !current.some((curr) => curr.toLowerCase() === c.label.toLowerCase()));
    updated = [...current, ...missing.map((c) => c.label)];
  }
  return updated.join(',');
}
