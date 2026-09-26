/**
 * Shared fabric swatch resolver and fallback helper for SUTURA catalog items.
 * Maps garment types, materials, and keywords to authentic high-resolution fabric textures
 * (Piña Cocoon, Bridal Chiffon/Tulle, Duchess Satin, Wool Twill, Sublimation Drifit Mesh, Peach Twill, etc.).
 */

export interface FabricResolveOptions {
  garment_type?: string | null;
  material?: string | null;
  name?: string | null;
  fabric_image_url?: string | null;
}

export function getFabricFallback(item: FabricResolveOptions): string {
  const name = (item.name ?? '').toLowerCase();
  const gt = (item.garment_type ?? '').toLowerCase();
  const mat = (item.material ?? '').toLowerCase();

  // 1. Philippine Barong Tagalog (Piña Cocoon / Jusi / Callado Weave)
  if (name.includes('barong') || gt === 'barong' || mat.includes('pina') || mat.includes('jusi')) {
    return '/catalog/fabrics/pina_cocoon_fabric.jpg';
  }

  // 2. Emerald Green / Dark Teal Satin & Lace
  if (name.includes('green') || name.includes('greed') || name.includes('teal')) {
    return '/catalog/fabrics/emerald_lace_fabric.jpg';
  }

  // 3. Crimson / Ruby Red Duchess Satin & Couture Embroidery
  if (name.includes('red') && (name.includes('satin') || name.includes('dress') || name.includes('gown'))) {
    return '/catalog/fabrics/crimson_satin_fabric.jpg';
  }

  // 4. Rose / Blush / Pink Duchess Satin & Silk
  if (name.includes('satin') || name.includes('pink') || name.includes('maid') || name.includes('bridesmaid') || mat.includes('satin')) {
    return '/catalog/fabrics/satin_silk_fabric.jpg';
  }

  // 5. Sky Blue Floral Tulle & Sheer Chiffon
  const col = ((item as any).color ?? '').toLowerCase();
  if (name.includes('blue') || col.includes('blue') || name.includes('andrea') || name.includes('a1237')) {
    return '/catalog/fabrics/sky_blue_chiffon_tulle_fabric.jpg';
  }

  // 6. Bridal White Wedding Gowns (Chiffon, Tulle, Lace, Mikado)
  if (gt === 'gown' || name.includes('gown') || name.includes('wedding') || name.includes('tulle') || mat.includes('chiffon')) {
    return '/catalog/fabrics/bridal_chiffon_fabric.jpg';
  }

  // 6. Bespoke Suits, Tuxedos & Formal Tailoring (Worsted Wool Twill)
  if (gt === 'suit' || name.includes('suit') || name.includes('tuxedo') || mat.includes('wool')) {
    return '/catalog/fabrics/wool_twill_fabric.jpg';
  }

  // 7. Athletic Compression & Stretch Spandex (Rashguards, Riders)
  if (name.includes('rashguard') || name.includes('riders') || name.includes('spandex')) {
    return '/catalog/fabrics/compression_spandex_fabric.jpg';
  }

  // 8. High-Performance Sublimation Drifit Honeycomb Mesh (Jerseys, Sportswear)
  if (gt === 'uniform' || name.includes('jersey') || name.includes('esport') || name.includes('volleyball') || name.includes('basketball') || mat.includes('drifit') || mat.includes('mesh')) {
    return '/catalog/fabrics/drifit_mesh_fabric.jpg';
  }

  // 9. Standard Tailoring / Uniform Cloth (Peach Twill / Cotton Twill)
  return '/catalog/fabrics/peach_twill_fabric.jpg';
}

export function resolveFabricImage(item: FabricResolveOptions): string {
  if (item.fabric_image_url && item.fabric_image_url.trim() !== '') {
    return item.fabric_image_url.trim();
  }
  return getFabricFallback(item);
}

export function getFabricLabel(item: FabricResolveOptions): string {
  const fallback = resolveFabricImage(item);
  if (fallback.includes('pina_cocoon')) return 'Piña Cocoon Weave';
  if (fallback.includes('emerald_lace')) return 'Emerald Lace & Satin';
  if (fallback.includes('crimson_satin')) return 'Crimson Duchess Satin';
  if (fallback.includes('satin_silk')) return 'Duchess Satin & Silk';
  if (fallback.includes('sky_blue_chiffon_tulle')) return 'Floral Chiffon & Tulle';
  if (fallback.includes('bridal_chiffon')) return 'Bridal Chiffon & Tulle';
  if (fallback.includes('wool_twill')) return 'Worsted Wool Twill';
  if (fallback.includes('compression_spandex')) return 'Stretch Compression Spandex';
  if (fallback.includes('drifit_mesh')) return 'Sublimation Drifit Mesh';
  return item.material || 'Peach Twill Fabric';
}

const COLOR_HEX_MAP: Record<string, string> = {
  'white': '#FFFFFF',
  'ivory': '#FFFFF0',
  'cream': '#FFFDD0',
  'beige': '#D9CDB8',
  'black': '#1A1A1A',
  'sky blue': '#7DD3FC',
  'light blue': '#93C5FD',
  'blue': '#3B82F6',
  'royal blue': '#1D4ED8',
  'navy': '#1E3A8A',
  'red': '#EF4444',
  'crimson': '#DC2626',
  'burgundy': '#800020',
  'maroon': '#800000',
  'pink': '#F472B6',
  'blush': '#DE5D83',
  'rose gold': '#B76E79',
  'peach': '#FFDAB9',
  'gold': '#EAB308',
  'champagne': '#F7E7CE',
  'silver': '#94A3B8',
  'gray': '#6B7280',
  'charcoal': '#374151',
  'emerald': '#047857',
  'green': '#22C55E',
  'olive': '#556B2F',
  'teal': '#0D9488',
  'sage': '#9CAF88',
  'purple': '#A855F7',
  'lavender': '#E9D5FF',
  'brown': '#78350F',
  'bronze': '#CD7F32',
};

export function getColorHex(colorName?: string | null): string {
  if (!colorName) return '#94A3B8';
  const clean = colorName.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (clean.includes(key)) return hex;
  }
  return '#94A3B8';
}
