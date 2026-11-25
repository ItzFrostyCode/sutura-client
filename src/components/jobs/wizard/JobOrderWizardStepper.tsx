'use client';

import React from 'react';
import { Check, User, Ruler, Sparkles, Receipt } from 'lucide-react';

export interface WizardStep {
  id: number;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    label: 'Customer Information',
    description: 'Client profile & contacts',
    icon: User,
  },
  {
    id: 2,
    label: 'Measurements',
    description: 'Body metrics & size sheet',
    icon: Ruler,
  },
  {
    id: 3,
    label: 'Order Specifications',
    description: 'Style, fabric & tailoring',
    icon: Sparkles,
  },
  {
    id: 4,
    label: 'Invoice & Payment',
    description: 'Pricing, deposit & schedule',
    icon: Receipt,
  },
];

interface JobOrderWizardStepperProps {
  currentStep: number;
  onStepClick: (stepId: number) => void;
  maxCompletedStep: number;
}

export default function JobOrderWizardStepper({
  currentStep,
  onStepClick,
  maxCompletedStep,
}: JobOrderWizardStepperProps) {
  return (
    <div className="w-full bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs">
      <div className="relative">
        {/* Horizontal Connector Line for Desktop */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-5 left-10 right-10 h-0.5 bg-line -translate-y-1/2 z-0"
        >
          <div
            className="h-full bg-taupe transition-all duration-300"
            style={{
              width: `${((Math.max(currentStep, maxCompletedStep) - 1) / (WIZARD_STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps List */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10">
          {WIZARD_STEPS.map((step) => {
            const isCompleted = step.id < currentStep || maxCompletedStep >= step.id;
            const isActive = step.id === currentStep;
            const isClickable = step.id <= maxCompletedStep + 1;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step.id)}
                className={`flex items-center md:flex-col md:text-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all text-left md:text-center ${
                  isClickable ? 'cursor-pointer hover:bg-canvas/60' : 'cursor-not-allowed opacity-60'
                } ${isActive ? 'bg-taupe/10 md:bg-transparent' : ''}`}
              >
                {/* Numbered Step Circle */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isActive
                      ? 'bg-taupe text-white ring-4 ring-taupe/20 shadow-xs scale-105'
                      : isCompleted && step.id < currentStep
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-surface border-2 border-line text-ink-muted'
                  }`}
                >
                  {isCompleted && step.id < currentStep ? (
                    <Check size={16} className="stroke-[2.5]" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step Labels */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 md:justify-center">
                    <p
                      className={`text-xs sm:text-sm font-bold truncate ${
                        isActive
                          ? 'text-ink'
                          : isCompleted && step.id < currentStep
                          ? 'text-emerald-800'
                          : 'text-ink-muted'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  <p className="text-[11px] text-ink-muted/80 truncate hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
