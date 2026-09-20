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
