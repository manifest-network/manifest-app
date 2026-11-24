import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'bun:test';
import React from 'react';

import StepIndicator from '@/components/react/StepIndicator';

describe('StepIndicator Component', () => {
  afterEach(cleanup);

  const steps = [
    { label: 'Step 1', step: 1 },
    { label: 'Step 2', step: 2 },
    { label: 'Step 3', step: 3 },
  ];

  test('renders steps correctly', () => {
    const { container } = render(<StepIndicator currentStep={1} steps={steps} />);

    // Check desktop view steps
    const stepElements = container.querySelectorAll('.hidden.sm\\:flex .px-6');

    steps.forEach(step => {
      const stepText = `${step.step}. ${step.label}`;
      const hasStep = Array.from(stepElements).some(
        el => el.textContent?.replace(/\s+/g, ' ').trim() === stepText
      );
      expect(hasStep).toBe(true);
    });
  });

  test('highlights the current step correctly', () => {
    const { container } = render(<StepIndicator currentStep={2} steps={steps} />);

    const currentStepElement = container.querySelector('.bg-surface-raised .px-6');
    expect(currentStepElement).toBeTruthy();
    expect(currentStepElement?.textContent?.replace(/\s+/g, ' ').trim()).toBe('2. Step 2');
  });

  test('display the step before the current step correctly', () => {
    const { container } = render(<StepIndicator currentStep={2} steps={steps} />);

    const stepElements = container.querySelectorAll('.hidden.sm\\:flex .px-6');
    const previousStep = Array.from(stepElements).find(
      el => el.textContent?.replace(/\s+/g, ' ').trim() === '1. Step 1'
    );
    expect(previousStep).toBeTruthy();
  });

  test('display the step after the current step correctly', () => {
    const { container } = render(<StepIndicator currentStep={2} steps={steps} />);

    const stepElements = container.querySelectorAll('.hidden.sm\\:flex .px-6');
    const nextStep = Array.from(stepElements).find(
      el => el.textContent?.replace(/\s+/g, ' ').trim() === '3. Step 3'
    );
    expect(nextStep).toBeTruthy();
  });
});
