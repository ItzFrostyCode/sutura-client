import type { SavedLocation } from '@/lib/customerLocation';

export interface SuggestedHub extends SavedLocation {
  name: string;
  type: 'tailor_store' | 'mall' | 'district' | 'landmark';
}

// Bounded within Davao City only (lat 6.85-7.40, lng 125.30-125.80)
export const DAVAO_LANDMARKS: SuggestedHub[] = [
  // Commercial Malls & Tailoring Centers
  {
    name: 'Abreeza Ayala Mall',
    address: 'Abreeza Mall, J.P. Laurel Avenue, Bajada, Davao City',
    district: 'Bajada',
    lat: 7.0917,
    lng: 125.6105,
    type: 'mall',
  },
  {
    name: 'SM City Davao (Ecoland)',
    address: 'SM City Davao, Quimpo Boulevard, Ecoland, Matina, Davao City',
    district: 'Matina',
    lat: 7.0494,
    lng: 125.5908,
    type: 'mall',
  },
  {
    name: 'SM Lanang Premier',
    address: 'SM Lanang Premier, J.P. Laurel Ave, Lanang, Davao City',
    district: 'Lanang',
    lat: 7.0988,
    lng: 125.6322,
    type: 'mall',
  },
  {
    name: 'Gaisano Mall of Davao',
    address: 'Gaisano Mall, J.P. Laurel Ave, Bajada, Poblacion, Davao City',
    district: 'Poblacion',
    lat: 7.0776,
    lng: 125.6141,
    type: 'mall',
  },
  {
    name: 'NCCC Mall Buhangin',
    address: 'NCCC Mall Buhangin, Km 6, Buhangin, Davao City',
    district: 'Buhangin',
    lat: 7.1106,
    lng: 125.6119,
    type: 'mall',
  },
  {
    name: 'Victoria Plaza (NCCC VP)',
    address: 'Victoria Plaza Commercial Center, J.P. Laurel Ave, Bajada, Davao City',
    district: 'Bajada',
    lat: 7.0825,
    lng: 125.6146,
    type: 'mall',
  },
  {
    name: 'Gaisano Grand Mall Toril',
    address: 'Gaisano Grand Toril, MacArthur Highway, Toril, Davao City',
    district: 'Toril',
    lat: 7.0125,
    lng: 125.4909,
    type: 'mall',
  },

  // Key Davao Landmarks & Commercial Hubs
  {
    name: 'Ateneo de Davao University',
    address: 'Ateneo de Davao University, E. Jacinto St, Poblacion, Davao City',
    district: 'Poblacion',
    lat: 7.0718,
    lng: 125.6133,
    type: 'landmark',
  },
  {
    name: 'San Pedro Street / City Hall',
    address: 'San Pedro Street, Poblacion District, Davao City',
    district: 'Poblacion',
    lat: 7.0645,
    lng: 125.6083,
    type: 'landmark',
  },
  {
    name: 'Agdao Public Market',
    address: 'Agdao Public Market, Lapu-Lapu St, Agdao, Davao City',
    district: 'Agdao',
    lat: 7.0822,
    lng: 125.6268,
    type: 'landmark',
  },
  {
    name: 'Damosa Gateway Lanang',
    address: 'Damosa Gateway, Mamay Rd, Lanang, Davao City',
    district: 'Lanang',
    lat: 7.1042,
    lng: 125.6375,
    type: 'landmark',
  },
  {
    name: 'Matina Crossing / Center',
    address: 'Matina Crossing, MacArthur Highway, Matina, Davao City',
    district: 'Matina',
    lat: 7.0583,
    lng: 125.5861,
    type: 'district',
  },
  {
    name: 'Bangkal Junction',
    address: 'Bangkal, MacArthur Highway, Talomo, Davao City',
    district: 'Talomo',
    lat: 7.0425,
    lng: 125.5614,
    type: 'district',
  },
  {
    name: 'Mintal UP Junction',
    address: 'Mintal Proper, Tugbok District, Davao City',
    district: 'Tugbok',
    lat: 7.0875,
    lng: 125.5089,
    type: 'district',
  },
  {
    name: 'Calinan Public Market',
    address: 'Calinan Public Market, Calinan District, Davao City',
    district: 'Calinan',
    lat: 7.1856,
    lng: 125.4578,
    type: 'district',
  },
  {
    name: 'Sasa Wharf / Terminal',
    address: 'Sasa Wharf, R. Castillo St, Sasa, Davao City',
    district: 'Buhangin',
    lat: 7.1264,
    lng: 125.6569,
    type: 'landmark',
  },
];
