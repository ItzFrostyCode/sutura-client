// Regenerates src/lib/davaoLocations.ts from the server's App\Support\DavaoLocations.
// Run from sutura-client with the sutura-server repo next to it:  node scripts/gen-davao-locations.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const php = 'require "vendor/autoload.php"; echo json_encode(App\\Support\\DavaoLocations::BARANGAYS, JSON_UNESCAPED_UNICODE);';
const data = JSON.parse(execFileSync('php', ['-r', php], { cwd: '../sutura-server', encoding: 'utf8' }));
const outPath = 'src/lib/davaoLocations.ts';

const wrap = (names) => {
  const lines = [];
  let line = '    ';
  for (const n of names) {
    const piece = `'${n.replace(/'/g, "\\'")}', `;
    if ((line + piece).length > 118) { lines.push(line.trimEnd()); line = '    '; }
    line += piece;
  }
  lines.push(line.trimEnd());
  return lines.join('\n');
};

const body = Object.entries(data)
  .map(([district, names]) => `  ${district}: [\n${wrap(names)}\n  ],`)
  .join('\n');

const out = `/**
 * Davao City's 11 administrative districts and their 182 barangays, in 3 congressional districts.
 * Generated from the server's App\\Support\\DavaoLocations (names as on Wikipedia "Districts of Davao City",
 * checked 2026-10-14). Regenerate with \`node scripts/gen-davao-locations.mjs\`; do not edit by hand. Not yet checked against PSA PSGC: "Balenggaeng" / "Balengaeng" and
 * "Biao Guinga" / "Biao Guianga".
 */
export const DAVAO_BARANGAYS = {
${body}
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
`;

writeFileSync(outPath, out);
console.log('wrote', outPath);
