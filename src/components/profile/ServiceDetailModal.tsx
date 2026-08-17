'use client';

import React, { useState } from 'react';
import { X, Clock, Tag, MessageCircle, Calendar, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export interface CustomField {
  name: string;
  label: string;
  type: 'dropdown' | 'short_text' | 'number' | 'single_choice' | 'multi_select';
  required?: boolean;
  options?: string[];
}

export interface SizeChartRow {
  size: string;
  values: string[];
}

export interface ServiceDetailModalItem {
  id: number;
  name: string;
  price?: number;
  base_price?: string | number;
  estimated_days?: number;
  description?: string;
  categories?: string[];
  image_url?: string | null;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: SizeChartRow[] | null;
  custom_fields?: CustomField[];
  tags?: string[];
  /** Packages and services share this modal but need different booking-link params. */
  kind?: 'service' | 'package';
}

interface ServiceDetailModalProps {
  readonly service: ServiceDetailModalItem | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly facebookUrl?: string;
  readonly shopId?: string | number;
}

const getMessengerUrl = (facebookUrl?: string, textSnippet?: string) => {
  let baseUrl = 'https://m.me/suturatailoring';
  if (facebookUrl) {
    try {
      const url = new URL(facebookUrl);
      const pathname = url.pathname.replace(/^\/|\/$/g, '');
      if (pathname && !pathname.includes('/') && pathname !== 'profile.php') {
        baseUrl = `https://m.me/${pathname}`;
      }
    } catch {
      // Ignore URL parse error
    }
  }
  return textSnippet ? `${baseUrl}?text=${encodeURIComponent(textSnippet)}` : baseUrl;
};

export default function ServiceDetailModal({
  service,
  isOpen,
  onClose,
  facebookUrl,
  shopId,
}: ServiceDetailModalProps) {
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});

  if (!isOpen || !service) return null;

  const displayPrice = service.price ?? service.base_price;
  const customFields: CustomField[] = Array.isArray(service.custom_fields)
    ? service.custom_fields
    : [];

  const handleInputChange = (fieldName: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleCheckboxChange = (fieldName: string, option: string, checked: boolean) => {
    setFormData(prev => {
      const currentVal = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      const newVal = checked
        ? [...currentVal, option]
        : currentVal.filter((v: string) => v !== option);
      return {
        ...prev,
        [fieldName]: newVal,
      };
    });
  };

  // Construct inquiry message for Messenger
  const getInquiryText = () => {
    let text = `Hi! I'm interested in your service: "${service.name}".\n\n`;
    if (customFields.length > 0) {
      text += `My specifications:\n`;
      customFields.forEach(field => {
        const val = formData[field.name];
        if (val) {
          const displayVal = Array.isArray(val) ? val.join(', ') : val;
          text += `- ${field.label}: ${displayVal}\n`;
        }
      });
    }
    return text;
  };

  const bookingParam = service.kind === 'package' ? 'package_id' : 'service_id';
  const bookingUrl = shopId ? `/shop/${shopId}/book?${bookingParam}=${service.id}` : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="relative bg-white rounded-3xl border border-line overflow-hidden max-w-2xl w-full flex flex-col max-h-[90vh] animate-scale-in z-10">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 transition-colors z-20 cursor-pointer focus:outline-none"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header Cover Image */}
        <div className="h-60 sm:h-72 w-full bg-canvas relative shrink-0">
          {service.image_url ? (
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-ink-faint">
              <ImageIcon size={48} className="opacity-30" />
              <span className="text-sm font-medium">No Image Available</span>
            </div>
          )}
          {/* Category Tag Overlay */}
          {service.categories && service.categories.length > 0 && (
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5">
              {service.categories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-taupe px-3.5 py-1.5 rounded-full uppercase tracking-wider animate-fade-in">
                  <Tag size={12} />
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-ink tracking-tight pr-8">{service.name}</h3>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {displayPrice !== undefined && displayPrice !== null ? (
                <div className="text-xl font-bold text-taupe">
                  ₱{Number(displayPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <span className="text-xs text-ink-muted font-medium tracking-normal ml-1">starting price</span>
                </div>
              ) : (
                <div className="text-xl font-bold text-taupe">
                  Custom Quote
                </div>
              )}
              {service.estimated_days !== undefined && (
                <div className="flex items-center gap-1.5 text-ink-muted font-medium bg-canvas border border-line px-3 py-1 rounded-full text-xs">
                  <Clock size={13} />
                  <span>{service.estimated_days} Days Est. Turnaround</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {service.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Description</h4>
              <p className="text-sm text-ink-body leading-relaxed whitespace-pre-wrap">{service.description}</p>
            </div>
          )}

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Includes</h4>
              <div className="flex flex-wrap gap-1.5">
                {service.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-canvas text-ink-body border border-line">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Size Chart */}
          {(service.size_chart_image_url || (service.size_chart_columns && service.size_chart_columns.length > 0)) && (
            <div className="space-y-3 pt-2 border-t border-line">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Size Chart</h4>
              {service.size_chart_image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={service.size_chart_image_url}
                  alt="Size chart"
                  className="w-full rounded-xl border border-line"
                />
              )}
              {service.size_chart_columns && service.size_chart_columns.length > 0 && service.size_chart_rows && service.size_chart_rows.length > 0 && (
                <div className="overflow-x-auto border border-line rounded-xl">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-canvas">
                        <th className="px-3 py-2 text-left font-bold text-ink-muted uppercase tracking-wide">Size</th>
                        {service.size_chart_columns.map(col => (
                          <th key={col} className="px-3 py-2 text-left font-bold text-ink-muted uppercase tracking-wide">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {service.size_chart_rows.map(row => (
                        <tr key={row.size} className="border-t border-line">
                          <td className="px-3 py-2 font-semibold text-ink whitespace-nowrap">{row.size}</td>
                          {row.values.map((val, i) => (
                            <td key={`${row.size}-${i}`} className="px-3 py-2 text-ink-body">{val || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[11px] text-ink-faint">Follow this shop&apos;s own size chart when submitting measurements — sizing can vary between shops.</p>
            </div>
          )}

          {/* Custom Specifications Form */}
          {customFields.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-line">
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Custom Order Specifications</h4>
                <p className="text-[11px] text-ink-muted mt-0.5">Please provide details to build your customized order quote.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {customFields.map(field => {
                  const fieldId = `field-${field.name}`;
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <label htmlFor={fieldId} className="block text-xs font-bold text-ink uppercase tracking-wider">
                        {field.label} {field.required && <span className="text-danger">*</span>}
                      </label>

                      {/* Dropdown Type */}
                      {(field.type === 'dropdown' || field.type === 'single_choice') && (
                        <select
                          id={fieldId}
                          value={formData[field.name] || ''}
                          onChange={e => handleInputChange(field.name, e.target.value)}
                          required={field.required}
                          className="w-full bg-canvas border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe/50 focus:ring-1 focus:ring-taupe/50 transition-all"
                        >
                          <option value="">Select option...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Text Input Type */}
                      {field.type === 'short_text' && (
                        <input
                          id={fieldId}
                          type="text"
                          value={formData[field.name] || ''}
                          onChange={e => handleInputChange(field.name, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          required={field.required}
                          className="w-full bg-canvas border border-line rounded-xl px-4 py-2.5 text-base sm:text-sm text-ink focus:outline-none focus:border-taupe/50 focus:ring-1 focus:ring-taupe/50 transition-all"
                        />
                      )}

                      {/* Number Input Type */}
                      {field.type === 'number' && (
                        <input
                          id={fieldId}
                          type="number"
                          value={formData[field.name] || ''}
                          onChange={e => handleInputChange(field.name, e.target.value)}
                          placeholder="0"
                          required={field.required}
                          className="w-full bg-canvas border border-line rounded-xl px-4 py-2.5 text-base sm:text-sm text-ink focus:outline-none focus:border-taupe/50 focus:ring-1 focus:ring-taupe/50 transition-all"
                        />
                      )}

                      {/* Multi Select Type */}
                      {field.type === 'multi_select' && (
                        <div className="bg-canvas border border-line rounded-xl p-3 grid grid-cols-2 gap-2">
                          {field.options?.map(opt => {
                            const isChecked = Array.isArray(formData[field.name]) && (formData[field.name] as string[]).includes(opt);
                            return (
                              <label key={opt} className="flex items-center gap-2 text-xs font-semibold text-ink-body cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => handleCheckboxChange(field.name, opt, e.target.checked)}
                                  className="w-4 h-4 accent-[#9A8073] rounded border-line"
                                />
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-canvas border-t border-line flex flex-col sm:flex-row gap-3">
          <a
            href={getMessengerUrl(facebookUrl, getInquiryText())}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#2D2A26] hover:bg-taupe text-white py-3 px-6 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2.5 transition-all"
          >
            <MessageCircle size={16} />
            Inquire via Messenger
          </a>
          
          {shopId && (
            <a
              href={bookingUrl}
              className="flex-1 bg-white hover:bg-line text-ink border border-line py-3 px-6 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2.5 transition-all"
            >
              <Calendar size={16} />
              Book Appointment
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
