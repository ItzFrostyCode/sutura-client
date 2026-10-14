import type { DavaoDistrict } from './davaoLocations';

/**
 * Streets, malls, markets and landmarks people use to say where a shop is, per district — from the team's research
 * table (2026-10-15). These are NOT barangays (those are the official list in davaoLocations.ts) and never a district
 * value: the search screen sends `area` and the server finds branches whose address, landmark or barangay mentions it
 * (StoreBranch::placeFilter). `match` holds the spellings an address may use, separated by "|".
 * Marilog's commercial areas still need to be identified, so it has none yet.
 */
export interface DavaoArea {
  readonly label: string;
  readonly match: string;
}

const a = (label: string, match: string): DavaoArea => ({ label, match });

export const DAVAO_AREAS: Record<DavaoDistrict, readonly DavaoArea[]> = {
  Poblacion: [
    a('San Pedro Street', 'san pedro'), a('Ilustre Street', 'ilustre'), a('Anda Street', 'anda'), a('City Hall', 'city hall'),
    a('Pelayo Street', 'pelayo'), a('Bolton Street', 'bolton'), a('Claveria', 'claveria'), a('C.M. Recto Avenue', 'recto'),
    a('Bonifacio Street', 'bonifacio'), a('Roxas Avenue', 'roxas'), a('Jacinto Extension', 'jacinto'), a('Artiaga Street', 'artiaga'),
    a('Mabini Street', 'mabini'), a('Bajada', 'bajada'), a('Obrero', 'obrero'), a('J.P. Laurel Avenue', 'laurel'),
    a('Abreeza Mall', 'abreeza'), a('Gaisano Mall', 'gaisano'), a('R. Magsaysay Avenue', 'magsaysay'),
    a('Sta. Ana Avenue', 'sta. ana|santa ana|sta ana'), a('Chinatown', 'chinatown'), a('Boulevard', 'boulevard'), a('Piapi', 'piapi'),
  ],
  Talomo: [
    a('Ecoland', 'ecoland'), a('SM City Davao', 'sm city|sm ecoland'), a('Quimpo Boulevard', 'quimpo'),
    a('McArthur Highway', 'mcarthur|macarthur|mc arthur'), a('Ma-a Road', 'ma-a'), a('Bangkal', 'bangkal'),
  ],
  Agdao: [a('Agdao Public Market', 'agdao public market|agdao market'), a('Cabaguio Avenue', 'cabaguio')],
  Buhangin: [
    a('Km. 5 Buhangin', 'km. 5|km 5|kilometer 5'), a('Sasa Highway', 'sasa'),
    a('Km. 9–11 Sasa Highway', 'km. 9|km 9|km. 10|km 10|km. 11'), a('SM Lanang', 'lanang'),
  ],
  Bunawan: [a('Davao–Agusan Highway', 'agusan')],
  Paquibato: [],
  Toril: [
    a('Saavedra Street', 'saavedra'), a('General Lao Street', 'gen. lao|general lao|gen lao'), a('Rasay Street', 'rasay'),
    a('Agton Street', 'agton'),
  ],
  Tugbok: [a('Davao–Bukidnon Highway', 'bukidnon'), a('Mintal Public Market', 'mintal public market|mintal market')],
  Calinan: [
    a('Davao–Bukidnon Highway', 'bukidnon'), a('Villafuerte Street', 'villafuerte'),
    a('Calinan Public Market', 'calinan public market|calinan market'),
  ],
  Baguio: [],
  Marilog: [],
};

/** The areas of one district (none for an unknown district). */
export function areasOf(district: string | null | undefined): readonly DavaoArea[] {
  return district && district in DAVAO_AREAS ? DAVAO_AREAS[district as DavaoDistrict] : [];
}
