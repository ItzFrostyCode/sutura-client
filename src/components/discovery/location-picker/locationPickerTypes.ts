export interface StoreMapPin {
  id: number;
  slug: string;
  name: string;
  branchName: string;
  isMain: boolean;
  logoPath: string | null;
  district: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  isOpen: boolean;
}

export const DAVAO_CENTER: [number, number] = [7.0731, 125.6128];
