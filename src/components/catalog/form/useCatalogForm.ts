import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { BulletItem, ImageItem, ColorItem, CatalogFormData } from '../catalogTypes';
import { uploadSectionImage, buildSavePayload } from '../catalogHelpers';
import { SizeChartValue, emptySizeChart } from '@/components/shared/SizeChartEditor';
import { CatalogFormProps, StoreServiceOption } from './formTypes';

export function useCatalogForm({
  initialData,
  onSubmit,
  submitting,
}: Pick<CatalogFormProps, 'initialData' | 'onSubmit' | 'submitting'>) {
  const { store } = useAuthStore();

  const [formData, setFormData] = useState<CatalogFormData>({
    name: '',
    price: '',
    service_id: '',
    estimated_days: '',
    estimated_days_max: '',
    material: '',
    fabric_image_url: '',
    description: '',
    care_instructions: '',
    measurement_guide: '',
    garment_type: '',
    department: '',
    subcategory: '',
    garment_structure: '',
    sizes: [],
    external_gallery_url: '',
    is_active: true,
  });

  const [storeServices, setStoreServices] = useState<StoreServiceOption[]>([]);
  useEffect(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/services`)
      .then(res => setStoreServices(res.data.data ?? []))
      .catch(() => setStoreServices([]));
  }, [store?.id]);

  const [fabricImageUploading, setFabricImageUploading] = useState(false);
  const fabricImageInputRef = useRef<HTMLInputElement>(null);
  const [sizeInput, setSizeInput] = useState('');

  const addSize = () => {
    const size = sizeInput.trim();
    if (!size || formData.sizes.includes(size)) return;
    setFormData(prev => ({ ...prev, sizes: [...prev.sizes, size] }));
    setSizeInput('');
  };

  const removeSize = (size: string) => {
    setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== size) }));
  };

  const [features, setFeatures] = useState<BulletItem[]>([{ id: 'init', text: '' }]);
  const [sizeChart, setSizeChart] = useState<SizeChartValue>(emptySizeChart);
  const [colorItems, setColorItems] = useState<ColorItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([
    { id: 'init', url: '', angle: 'Default', is_primary: true },
  ]);

  const [featuresImage, setFeaturesImage] = useState<string>('');
  const [careImage, setCareImage] = useState<string>('');
  const [measurementGuideImage, setMeasurementGuideImage] = useState<string>('');
  const [uploadingSection, setUploadingSection] = useState<'specs' | 'care' | 'measurement_guide' | null>(null);

  const [accordionOpen, setAccordionOpen] = useState({
    specs: false,
    care: false,
    measurement_guide: false,
  });

  const [showMoreDetails, setShowMoreDetails] = useState(false);

  useEffect(() => {
    if (!initialData) return;
    const timer = setTimeout(() => {
      setFormData(initialData.formData);
      setFeatures(initialData.features);
      setSizeChart(initialData.sizeChart);
      setColorItems(initialData.colorItems);
      setImages(initialData.images);
      setFeaturesImage(initialData.featuresImage);
      setCareImage(initialData.careImage);
      setMeasurementGuideImage(initialData.measurementGuideImage);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialData]);

  const toggleAccordion = (section: 'specs' | 'care' | 'measurement_guide') => {
    setAccordionOpen(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSectionUpload = (file: File | undefined, section: 'specs' | 'care' | 'measurement_guide') => {
    if (!file || !store?.id) return;
    uploadSectionImage({
      file,
      storeId: store.id,
      section,
      setUploadingSection,
      setFeaturesImage,
      setCareImage,
      setMeasurementGuideImage,
    });
  };

  const handleFabricImageUpload = async (file: File | undefined) => {
    if (!file || !store?.id) return;
    setFabricImageUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${store.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url || '';
      setFormData(prev => ({ ...prev, fabric_image_url: url }));
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to upload fabric image.'));
    } finally {
      setFabricImageUploading(false);
    }
  };

  const saveDisabled = submitting || !formData.name || !formData.price || images.every(i => !i.url) || images.some(i => i.uploading);

  const handleFormSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = buildSavePayload(
      formData,
      features,
      featuresImage,
      sizeChart,
      careImage,
      images,
      measurementGuideImage,
      colorItems
    );
    await onSubmit(payload);
  };

  return {
    store,
    formData,
    setFormData,
    storeServices,
    fabricImageUploading,
    fabricImageInputRef,
    sizeInput,
    setSizeInput,
    addSize,
    removeSize,
    features,
    setFeatures,
    sizeChart,
    setSizeChart,
    colorItems,
    setColorItems,
    images,
    setImages,
    featuresImage,
    setFeaturesImage,
    careImage,
    setCareImage,
    measurementGuideImage,
    setMeasurementGuideImage,
    uploadingSection,
    accordionOpen,
    toggleAccordion,
    showMoreDetails,
    setShowMoreDetails,
    handleChange,
    handleSectionUpload,
    handleFabricImageUpload,
    saveDisabled,
    handleFormSubmit,
  };
}
