import { BulletItem, ImageItem, CatalogFormData } from '../catalogTypes';
import { SizeChartValue } from '@/components/shared/SizeChartEditor';
import { buildSavePayload } from '../catalogHelpers';

export const MAX_CATALOG_IMAGES = 10;
export const QUICK_ANGLE_LABELS = ['Front', 'Left Side', 'Right Side', 'Back'];

export interface SectionImageUploadProps {
  readonly imageUrl: string;
  readonly uploading: boolean;
  readonly uploadId: string;
  readonly alt: string;
  readonly onRemove: () => void;
  readonly onChange: (file: File | undefined) => void;
}

export interface CatalogFormInitialData {
  features: BulletItem[];
  featuresImage: string;
  sizeChart: SizeChartValue;
  careImage: string;
  formData: CatalogFormData;
  images: ImageItem[];
}

export interface CatalogFormProps {
  readonly title: string;
  readonly description: string;
  readonly submitLabel: string;
  readonly initialData?: CatalogFormInitialData;
  readonly onSubmit: (payload: ReturnType<typeof buildSavePayload>) => Promise<void>;
  readonly submitting: boolean;
}

export interface StoreServiceOption {
  id: number;
  name: string;
  service_types?: string[];
}
