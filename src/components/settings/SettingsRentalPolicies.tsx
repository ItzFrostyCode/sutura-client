import React from 'react';

export interface ShopSettingsData {
  name: string;
  description: string;
  logo_path: string;
  banner_path: string;
  address: string;
  landmark?: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  booking_policy: string;
  booking_questions: string[];
  max_appointments_per_day: number | null;
  latitude: string;
  longitude: string;
  social_links: { label: string; url: string }[];
  gallery_images: string[];
  business_type: string;
  operating_hours: Record<string, { is_open: boolean; open: string; close: string }>;
  security_deposit: number;
  rental_duration_days: number;
  overdue_penalty_per_day: number;
  fitting_fee: number;
  fitting_limit: number;
  reschedule_fee_percent: number;
  change_reserved_hours: number;
  change_reserved_fee_percent: number;
  supported_couriers: string[];
  specializations: string[];
  is_featured: boolean;
  is_hidden: boolean;
}

interface SettingsRentalPoliciesProps {
  readonly formData: ShopSettingsData;
  readonly setFormData: React.Dispatch<React.SetStateAction<ShopSettingsData>>;
}

export default function SettingsRentalPolicies({
  formData,
  setFormData,
}: SettingsRentalPoliciesProps) {
  const handleCourierToggle = (courier: string) => {
    const list = formData.supported_couriers || [];
    if (list.includes(courier)) {
      setFormData(prev => ({
        ...prev,
        supported_couriers: list.filter(c => c !== courier),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supported_couriers: [...list, courier],
      }));
    }
  };

  const couriersList = [
    // Same-Day / Local Delivery
    { id: 'lalamove', label: 'Lalamove' },
    { id: 'grab', label: 'Grab Express' },
    { id: 'transportify', label: 'Transportify' },
    { id: 'toktok', label: 'Toktok' },
    { id: 'borzo', label: 'Borzo (Mr. Speedy)' },
    { id: 'joyride', label: 'JoyRide Delivery' },
    { id: 'angkas', label: 'Angkas Express' },
    { id: 'moveit', label: 'Move It Delivery' },
    { id: 'dingdong', label: 'Dingdong Delivery' },

    // Standard Shipping / Nationwide Express
    { id: 'jnt', label: 'J&T Express' },
    { id: 'lbc', label: 'LBC Express' },
    { id: 'flash', label: 'Flash Express' },
    { id: 'ninjavan', label: 'Ninja Van' },
    { id: 'jrs', label: 'JRS Express' },
    { id: '2go', label: '2GO Express' },
    { id: 'abest', label: 'Abest Express' },
    { id: 'entrego', label: 'Entrego' },
    { id: 'apcargo', label: 'AP Cargo' },
    { id: 'airspeed', label: 'Airspeed' },
    { id: 'xde', label: 'XDE Logistics' },
    { id: 'spx', label: 'SPX Express (Shopee)' },

    // Store Pickup
    { id: 'pickup', label: 'Store Pickup' },
  ];

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 transition-all duration-300">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[#2D2A26] flex items-center gap-2">
          <span className="text-xl">👗</span>{' '}
          Rental &amp; Store Policies
        </h2>
        <p className="text-sm text-[#827A73] mt-1">
          Configure rental rules, fees, limits, and shipping options for customers renting gowns, barongs, or
          other items.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-1">
          <label htmlFor="security-deposit" className="text-sm font-medium text-[#524A44]">Security Deposit (₱)</label>
          <input
            id="security-deposit"
            type="number"
            name="security_deposit"
            value={formData.security_deposit}
            onChange={e =>
              setFormData(prev => ({ ...prev, security_deposit: Number.parseFloat(e.target.value) || 0 }))
            }
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073] text-sm"
          />
          <p className="text-[11px] text-[#827A73]">
            Refunded to renter once the item is returned on time in good condition.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="rental-duration" className="text-sm font-medium text-[#524A44]">Max Rental Duration (Days)</label>
          <input
            id="rental-duration"
            type="number"
            name="rental_duration_days"
            value={formData.rental_duration_days}
            onChange={e =>
              setFormData(prev => ({ ...prev, rental_duration_days: Number.parseInt(e.target.value, 10) || 0 }))
            }
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073] text-sm"
          />
          <p className="text-[11px] text-[#827A73]">Standard rental window (e.g. 3 days).</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="overdue-penalty" className="text-sm font-medium text-[#524A44]">Overdue Return Penalty (₱ / Day)</label>
          <input
            id="overdue-penalty"
            type="number"
            name="overdue_penalty_per_day"
            value={formData.overdue_penalty_per_day}
            onChange={e =>
              setFormData(prev => ({ ...prev, overdue_penalty_per_day: Number.parseFloat(e.target.value) || 0 }))
            }
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073] text-sm"
          />
          <p className="text-[11px] text-[#827A73]">Deducted from security deposit for late returns.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="fitting-fee" className="text-sm font-medium text-[#524A44]">Fitting Session Fee (₱)</label>
          <input
            id="fitting-fee"
            type="number"
            name="fitting_fee"
            value={formData.fitting_fee}
            onChange={e =>
              setFormData(prev => ({ ...prev, fitting_fee: Number.parseFloat(e.target.value) || 0 }))
            }
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073] text-sm"
          />
          <p className="text-[11px] text-[#827A73]">
            Charged if no rental is booked after fitting session. Put 0 if free.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="fitting-limit" className="text-sm font-medium text-[#524A44]">Max Items to Fit per Session</label>
          <input
            id="fitting-limit"
            type="number"
            name="fitting_limit"
            value={formData.fitting_limit}
            onChange={e =>
              setFormData(prev => ({ ...prev, fitting_limit: Number.parseInt(e.target.value, 10) || 0 }))
            }
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073] text-sm"
          />
          <p className="text-[11px] text-[#827A73]">Maximum number of garments a client can try on per booking.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="reschedule-fee" className="text-sm font-medium text-[#524A44]">Rescheduling Fee (%)</label>
          <input
            id="reschedule-fee"
            type="number"
            name="reschedule_fee_percent"
            value={formData.reschedule_fee_percent}
            onChange={e =>
              setFormData(prev => ({ ...prev, reschedule_fee_percent: Number.parseInt(e.target.value, 10) || 0 }))
            }
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073] text-sm"
          />
          <p className="text-[11px] text-[#827A73]">
            Percentage penalty fee of total rental price for rescheduling.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="change-reserved-hours" className="text-sm font-medium text-[#524A44]">Change Reserved Item Window (Hours)</label>
          <input
            id="change-reserved-hours"
            type="number"
            name="change_reserved_hours"
            value={formData.change_reserved_hours}
            onChange={e =>
              setFormData(prev => ({ ...prev, change_reserved_hours: Number.parseInt(e.target.value, 10) || 0 }))
            }
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073] text-sm"
          />
          <p className="text-[11px] text-[#827A73]">
            Hours allowed to change the selected gown/barong free of charge.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="late-change-fee" className="text-sm font-medium text-[#524A44]">Late Change Charge (%)</label>
          <input
            id="late-change-fee"
            type="number"
            name="change_reserved_fee_percent"
            value={formData.change_reserved_fee_percent}
            onChange={e =>
              setFormData(prev => ({ ...prev, change_reserved_fee_percent: Number.parseInt(e.target.value, 10) || 0 }))
            }
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073] text-sm"
          />
          <p className="text-[11px] text-[#827A73]">
            Percentage penalty fee of total rental price for changes made after the window.
          </p>
        </div>
      </div>

      <div className="h-px bg-[#EBE6E0] my-6" />

      {/* Courier Preferences */}
      <div>
        <h3 className="text-sm font-semibold text-[#2D2A26] mb-3">Supported Delivery / Courier Services</h3>
        <p className="text-xs text-[#827A73] mb-4">
          Select the couriers and shipping options your shop supports. Customers will see these during
          checkout/order confirmation.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {couriersList.map(courier => {
            const isChecked = (formData.supported_couriers || []).includes(courier.id);
            return (
              <button
                key={courier.id}
                type="button"
                onClick={() => handleCourierToggle(courier.id)}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                  isChecked
                    ? 'border-[#9A8073] bg-[#FAF6F3] text-[#2D2A26]'
                    : 'border-[#EBE6E0] bg-white text-[#524A44] hover:bg-[#FAF6F3]'
                }`}
              >
                <span>{courier.label}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                    isChecked ? 'border-[#9A8073] bg-[#9A8073] text-white' : 'border-[#EBE6E0]'
                  }`}
                >
                  {isChecked ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
