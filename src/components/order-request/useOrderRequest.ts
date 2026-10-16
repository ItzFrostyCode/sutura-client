import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';

export interface RequestService {
  id: number;
  name: string;
  service_types?: string[] | null;
}

export interface SentRequest {
  id: number;
  order_number: string;
}

/** Services a customer can send a general request for: everything except repairs and bulk orders, which have their own forms. */
const isRequestable = (s: RequestService) => !(s.service_types ?? []).some((t) => t === 'alteration_repair' || t === 'bulk_sublimation');

export function useOrderRequest(storeId: string, preselected: string | null) {
  const [services, setServices] = useState<RequestService[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceId, setServiceId] = useState(preselected ?? '');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [ownFabric, setOwnFabric] = useState(false);
  const [measurements, setMeasurements] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<SentRequest | null>(null);

  useEffect(() => {
    api.get(`/public/stores/${storeId}/services`)
      .then((res) => setServices((res.data.data ?? []).filter(isRequestable)))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [storeId]);

  const upload = useCallback(async (file: File) => {
    if (images.length >= 5) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(`/public/stores/${storeId}/upload-reference-image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImages((prev) => [...prev, res.data.data.url]);
    } catch {
      setError('The photo could not be uploaded. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [images.length, storeId]);

  const canSend = Boolean(serviceId) && description.trim().length >= 5 && !submitting;

  const send = useCallback(async () => {
    if (!canSend) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/stores/${storeId}/order-requests`, {
        service_id: Number(serviceId),
        garment_description: description.trim(),
        quantity,
        own_fabric: ownFabric,
        measurements_note: measurements.trim() || undefined,
        reference_images: images,
      });
      setSent({ id: res.data.data.id, order_number: res.data.data.order_number });
    } catch (err) {
      setError(getErrorMessage(err, 'Your request could not be sent. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }, [canSend, storeId, serviceId, description, quantity, ownFabric, measurements, images]);

  return {
    services, loading, serviceId, setServiceId, description, setDescription, quantity, setQuantity,
    ownFabric, setOwnFabric, measurements, setMeasurements, images, setImages, uploading, upload,
    submitting, error, sent, canSend, send,
  };
}
