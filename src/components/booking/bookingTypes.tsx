import React from 'react';
import { MessageSquare, Ruler, Scissors } from 'lucide-react';
import type { BookingKind } from './hooks/useBookingWizard';
import type { BookingTypeOption, Service } from './types';

interface Args {
  kind: BookingKind;
  refName: string | null;
  selectedService: Service | null;
  serviceIdParam: string | null;
  serviceNameParam: string | null;
}

// What a visit can be for. A shop visit is Consultation, Measurement or Other. A service visit follows the
// service: an alteration or repair service means "bring the garment", anything else is a consultation or a
// measurement. Fitting and pickup are never offered: the shop's production order makes those.
export function buildBookingTypes({ kind, refName, selectedService, serviceIdParam, serviceNameParam }: Args): BookingTypeOption[] {
  const consultationBase: BookingTypeOption = {
    value: 'consultation',
    label: 'Consultation',
    duration: 30,
    icon: React.createElement(MessageSquare, { size: 18 }),
    hint: 'Discuss your garment idea, materials, design, and pricing with the store.',
  };

  const measurementBase: BookingTypeOption = {
    value: 'measurement',
    label: 'Measurement',
    duration: 60,
    icon: React.createElement(Ruler, { size: 18 }),
    hint: 'Get measured in person for your garment.',
  };

  const alterationBase: BookingTypeOption = {
    value: 'alteration',
    label: 'Alteration / Repair',
    duration: 30,
    icon: React.createElement(Scissors, { size: 18 }),
    hint: 'Bring an existing garment for adjustment or repair.',
  };

  const otherBase: BookingTypeOption = {
    value: 'other',
    label: 'Other',
    duration: 30,
    icon: React.createElement(MessageSquare, { size: 18 }),
    hint: 'Something else, like choosing fabric or asking a question. Tell the shop what it is for.',
  };

  // A shop visit: not tied to any service.
  if (kind === 'shop') {
    return [consultationBase, measurementBase, otherBase];
  }

  const withExisting = (baseList: BookingTypeOption[]) => baseList;

  // 1. SPECIFIC CATALOG DESIGN CONTEXT
  // Discuss design/pricing or take in-person measurements.
  if (refName) {
    return withExisting([consultationBase, measurementBase]);
  }

  // 2. SPECIFIC SERVICE CONTEXT
  const sName = (selectedService?.name || serviceNameParam || '').toLowerCase();
  const hasSpecificService = !!selectedService || !!serviceIdParam || !!serviceNameParam;

  if (hasSpecificService && sName) {
    // Real functional taxonomy wins when the service is actually tagged —
    // only falls back to guessing from the name for an older/untyped
    // service that has no service_types set at all. isPrinting has no
    // dedicated backend type (it's a marketing category, not a functional
    // one), so it always goes by name.
    const types = selectedService?.service_types ?? [];
    const hasTypes = types.length > 0;

    const isAlteration = hasTypes
      ? types.includes('alteration_repair')
      : (
        sName.includes('alter') ||
        sName.includes('repair') ||
        sName.includes('hem') ||
        sName.includes('adjust') ||
        sName.includes('taper') ||
        sName.includes('patch') ||
        sName.includes('fix') ||
        sName.includes('resize') ||
        sName.includes('shorten') ||
        sName.includes('lengthen') ||
        sName.includes('resew')
      );

    if (isAlteration) {
      return withExisting([
        {
          ...alterationBase,
          label: 'Alteration / Repair',
          hint: 'Bring your garment for adjustment or repair with the store.',
        },
      ]);
    }

    const isPrinting =
      sName.includes('print') ||
      sName.includes('sublimat') ||
      sName.includes('embroid') ||
      sName.includes('silkscreen') ||
      sName.includes('dtf') ||
      sName.includes('heat press') ||
      sName.includes('vinyl');

    if (isPrinting) {
      return withExisting([
        {
          ...consultationBase,
          label: 'Consultation / Order Discussion',
          hint: 'Discuss your artwork, print placement, fabrics, quantities, and pricing with the store.',
        },
      ]);
    }

    const isBulk = hasTypes
      ? types.includes('bulk_sublimation')
      : (
        sName.includes('bulk') ||
        sName.includes('uniform') ||
        sName.includes('corporate') ||
        sName.includes('organization') ||
        sName.includes('course') ||
        sName.includes('batch') ||
        sName.includes('team') ||
        sName.includes('intramural')
      );

    if (isBulk) {
      return withExisting([
        {
          ...consultationBase,
          label: 'Consultation / Order Discussion',
          hint: 'Discuss bulk garment requirements, fabric, sizing strategy, and quotation with the store.',
        },
        {
          ...measurementBase,
          hint: 'Get measured in person for your group or individual uniform.',
        },
      ]);
    }

    // Other custom tailoring / bespoke / made-to-measure services
    return withExisting([
      consultationBase,
      {
        ...measurementBase,
        hint: 'Get measured in person for your custom garment.',
      },
    ]);
  }

  // 3. A service visit with no service picked yet: the purpose follows the service once it is chosen.
  return withExisting([consultationBase, measurementBase]);
}
