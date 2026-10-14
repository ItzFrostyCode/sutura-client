/**
 * Davao City's 11 administrative districts and their 182 barangays, in 3 congressional districts.
 * Generated from the server's App\Support\DavaoLocations (names as on Wikipedia "Districts of Davao City",
 * checked 2026-10-14). Regenerate with `node scripts/gen-davao-locations.mjs`; do not edit by hand. Not yet checked against PSA PSGC: "Balenggaeng" / "Balengaeng" and
 * "Biao Guinga" / "Biao Guianga".
 */
export const DAVAO_BARANGAYS = {
  Poblacion: [
    'Barangay 1-A', 'Barangay 2-A', 'Barangay 3-A', 'Barangay 4-A', 'Barangay 5-A', 'Barangay 6-A', 'Barangay 7-A',
    'Barangay 8-A', 'Barangay 9-A', 'Barangay 10-A', 'Barangay 11-B', 'Barangay 12-B', 'Barangay 13-B',
    'Barangay 14-B', 'Barangay 15-B', 'Barangay 16-B', 'Barangay 17-B', 'Barangay 18-B', 'Barangay 19-B',
    'Barangay 20-B', 'Barangay 21-C', 'Barangay 22-C', 'Barangay 23-C', 'Barangay 24-C', 'Barangay 25-C',
    'Barangay 26-C', 'Barangay 27-C', 'Barangay 28-C', 'Barangay 29-C', 'Barangay 30-C', 'Barangay 31-D',
    'Barangay 32-D', 'Barangay 33-D', 'Barangay 34-D', 'Barangay 35-D', 'Barangay 36-D', 'Barangay 37-D',
    'Barangay 38-D', 'Barangay 39-D', 'Barangay 40-D',
  ],
  Talomo: [
    'Bago Aplaya', 'Bago Gallera', 'Baliok', 'Bucana', 'Catalunan Grande', 'Catalunan Pequeño', 'Dumoy', 'Langub',
    'Ma-a', 'Magtuod', 'Matina Aplaya', 'Matina Crossing', 'Matina Pangi', 'Talomo Proper',
  ],
  Agdao: [
    'Agdao Proper', 'Centro (San Juan)', 'Gov. Paciano Bangoy', 'Gov. Vicente Duterte', 'Kap. Tomas Monteverde, Sr.',
    'Lapu-Lapu', 'Leon Garcia', 'Rafael Castillo', 'San Antonio', 'Ubalde', 'Wilfredo Aquino',
  ],
  Buhangin: [
    'Acacia', 'Alfonso Angliongto Sr.', 'Buhangin Proper', 'Cabantian', 'Callawa', 'Communal', 'Indangan', 'Mandug',
    'Pampanga', 'Sasa', 'Tigatto', 'Vicente Hizon Sr.', 'Waan',
  ],
  Bunawan: [
    'Alejandra Navarro (Lasang)', 'Bunawan Proper', 'Gatungan', 'Ilang', 'Mahayag', 'Mudiang', 'Panacan',
    'San Isidro (Licanan)', 'Tibungco',
  ],
  Paquibato: [
    'Colosas', 'Fatima (Benowang)', 'Lumiad', 'Mabuhay', 'Malabog', 'Mapula', 'Panalum', 'Pandaitan',
    'Paquibato Proper', 'Paradise Embak', 'Salapawan', 'Sumimao', 'Tapak',
  ],
  Baguio: [
    'Baguio Proper', 'Cadalian', 'Carmen', 'Gumalang', 'Malagos', 'Tambobong', 'Tawan-Tawan', 'Wines',
  ],
  Calinan: [
    'Biao Joaquin', 'Calinan Proper', 'Cawayan', 'Dacudao', 'Dalagdag', 'Dominga', 'Inayangan', 'Lacson', 'Lamanan',
    'Lampianao', 'Megkawayan', 'Pangyan', 'Riverside', 'Saloy', 'Sirib', 'Subasta', 'Talomo River', 'Tamayong',
    'Wangan',
  ],
  Marilog: [
    'Baganihan', 'Bantol', 'Buda', 'Dalag', 'Datu Salumay', 'Gumitan', 'Magsaysay', 'Malamba', 'Marilog Proper',
    'Salaysay', 'Suawan (Tuli)', 'Tamugan',
  ],
  Toril: [
    'Alambre', 'Atan-Awe', 'Bangkas Heights', 'Baracatan', 'Bato', 'Bayabas', 'Binugao', 'Camansi', 'Catigan',
    'Crossing Bayabas', 'Daliao', 'Daliaon Plantation', 'Eden', 'Kilate', 'Lizada', 'Lubogan', 'Marapangi', 'Mulig',
    'Sibulan', 'Sirawan', 'Tagluno', 'Tagurano', 'Tibuloy', 'Toril Proper', 'Tungkalan',
  ],
  Tugbok: [
    'Angalan', 'Bago Oshiro', 'Balenggaeng', 'Biao Escuela', 'Biao Guinga', 'Los Amigos', 'Manambulan',
    'Manuel Guianga', 'Matina Biao', 'Mintal', 'New Carmen', 'New Valencia', 'Santo Niño', 'Tacunan', 'Tagakpan',
    'Talandang', 'Tugbok Proper', 'Ula',
  ],
} as const;

export type DavaoDistrict = keyof typeof DAVAO_BARANGAYS;

/** The 11 districts, in congressional-district order (Poblacion, Talomo, Agdao …). */
export const DAVAO_DISTRICTS = Object.keys(DAVAO_BARANGAYS) as DavaoDistrict[];

export const CONGRESSIONAL_DISTRICTS: Record<'1st' | '2nd' | '3rd', readonly DavaoDistrict[]> = {
  '1st': ['Poblacion', 'Talomo'],
  '2nd': ['Agdao', 'Buhangin', 'Bunawan', 'Paquibato'],
  '3rd': ['Baguio', 'Calinan', 'Marilog', 'Toril', 'Tugbok'],
};

/** The barangays of one district (empty for an unknown district). */
export function barangaysOf(district: string | null | undefined): readonly string[] {
  return district && district in DAVAO_BARANGAYS ? DAVAO_BARANGAYS[district as DavaoDistrict] : [];
}

/** The district a barangay belongs to, by its exact official name. */
export function districtOfBarangay(name: string | null | undefined): DavaoDistrict | null {
  if (!name) return null;
  for (const d of DAVAO_DISTRICTS) {
    if ((DAVAO_BARANGAYS[d] as readonly string[]).includes(name)) return d;
  }
  return null;
}
