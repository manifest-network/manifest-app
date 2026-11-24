import React, { ReactNode } from 'react';

export default function StepIndicator({
  currentStep,
  steps,
}: Readonly<{
  currentStep: number;
  steps: { label: ReactNode; mobileLabel?: ReactNode; step: number }[];
}>) {
  const getMobileSteps = () => {
    if (steps.length <= 3) return steps;

    // Show current step and adjacent steps on mobile
    const mobileSteps = [];
    if (currentStep === 1) {
      // At start, show first 2 steps + ellipsis
      mobileSteps.push(steps[0], steps[1], { label: '...', step: -1 });
    } else if (currentStep === steps.length) {
      // At end, show ellipsis + last 2 steps
      mobileSteps.push(
        { label: '...', step: -1 },
        steps[steps.length - 2],
        steps[steps.length - 1]
      );
    } else {
      // In middle, show ellipsis + current step + next step
      mobileSteps.push({ label: '...', step: -1 }, steps[currentStep - 1], steps[currentStep]);
    }
    return mobileSteps;
  };

  return (
    <div className="flex items-stretch h-[52px] bg-surface-inset w-full rounded-full p-1">
      {/* Desktop view - show all steps */}
      <div className="hidden sm:flex w-full">
        {steps.map(({ label, step }) => (
          <div
            key={step}
            className={`flex items-center justify-center flex-1 text-center transition-all ${
              step === currentStep
                ? 'bg-surface-raised text-base-content rounded-full'
                : 'text-content-muted'
            }`}
          >
            <span className="px-6">
              {step}.&nbsp;{label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile view - show condensed version */}
      <div className="flex sm:hidden w-full">
        {getMobileSteps().map(({ label, mobileLabel, step }) => (
          <div
            key={step}
            className={`flex items-center justify-center flex-1 text-center transition-all ${
              step === currentStep
                ? 'bg-surface-raised text-base-content rounded-full'
                : 'text-content-muted'
            }`}
          >
            <span className="px-6">
              {step !== -1 && `${step}.`}&nbsp;{mobileLabel ?? label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
