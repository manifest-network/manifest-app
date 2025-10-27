import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import React from 'react';

import { ValidatorDetailsModal } from '@/components/admins/modals/validatorModal';
import { clearAllMocks, mockPendingValidators, mockRouter, mockUnbondingValidators } from '@/tests';
import { mockActiveValidators } from '@/tests/data';
import { renderWithChainProvider } from '@/tests/render';

const validator = mockActiveValidators[0];
const admin = 'manifest1adminaddress';
const totalvp = '10000';
const validatorVPArray = [{ vp: BigInt(1000), moniker: 'Validator One' }];

function renderWithProps(props = {}) {
  return renderWithChainProvider(
    <ValidatorDetailsModal
      openValidatorModal={true}
      setOpenValidatorModal={() => {}}
      validator={validator}
      admin={admin}
      totalvp={totalvp}
      validatorVPArray={validatorVPArray}
      hasUnbonding={false}
      {...props}
    />
  );
}

describe('ValidatorDetailsModal Component', () => {
  const TIMEOUT = 30000;

  beforeEach(() => {
    mockRouter();
  });
  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  test(
    'renders modal with correct details',
    () => {
      renderWithProps();
      expect(screen.getByText('Validator Details')).toBeInTheDocument();
      expect(screen.getByText('Validator One')).toBeInTheDocument();
      expect(screen.getByText('security1@foobar.com')).toBeInTheDocument();
      const detailsContainer = screen.getByLabelText('details');
      expect(within(detailsContainer).getByText('details1')).toBeInTheDocument();
    },
    TIMEOUT
  );

  test(
    'updates input field correctly',
    async () => {
      renderWithProps();
      const input = screen.getByPlaceholderText('1000');
      fireEvent.change(input, { target: { value: '2000' } });
      await waitFor(() => {
        expect(input).toHaveValue(2000);
      });
    },
    TIMEOUT
  );

  test(
    'enables upgrade button when input is valid',
    async () => {
      renderWithProps();
      const input = screen.getByPlaceholderText('1000');
      fireEvent.change(input, { target: { value: '2000' } });
      await waitFor(() => {
        const updateButton = screen.getByText('Update');
        expect(updateButton).not.toBeDisabled();
      });
    },
    TIMEOUT
  );

  test(
    'disables upgrade button when input is invalid',
    async () => {
      renderWithProps();
      const input = screen.getByPlaceholderText('1000');
      fireEvent.change(input, { target: { value: '-1' } });
      fireEvent.blur(input);
      await waitFor(() => {
        const updateButton = screen.getByText('Update');
        expect(updateButton).toBeDisabled();
      });
    },
    TIMEOUT
  );

  test(
    'shows error message for invalid power input',
    async () => {
      renderWithProps();
      const input = screen.getByPlaceholderText('1000');
      fireEvent.change(input, { target: { value: '-1' } });
      fireEvent.blur(input);
      await waitFor(() => {
        const errorMessage = screen.getByText(
          (_content, element) =>
            (element as HTMLElement)?.dataset?.tip === 'Power must be greater than 0'
        );
        expect(errorMessage).toBeInTheDocument();
      });
    },
    TIMEOUT
  );

  test(
    'shows warning message for unsafe power upgrade',
    async () => {
      renderWithProps();
      const input = screen.getByPlaceholderText('1000');
      fireEvent.change(input, { target: { value: '9000' } });
      fireEvent.blur(input);
      await waitFor(() => {
        const warningMessage = screen.getByText(/Warning: This power update may be unsafe/i);
        expect(warningMessage).toBeInTheDocument();
      });
    },
    TIMEOUT
  );

  test(
    'show banner when hasUnbonding is true (active)',
    () => {
      renderWithProps({ hasUnbonding: true });

      expect(
        screen.queryByText(
          /You cannot update validator power while validator\(s\) are unbonding\./i
        )
      ).toBeInTheDocument();

      const updateButton = screen.getByText('Update');
      expect(updateButton).toBeDisabled();
    },
    TIMEOUT
  );

  test(
    'show banner when hasUnbonding is true (pending)',
    () => {
      renderWithProps({ validator: mockPendingValidators[0], hasUnbonding: true });

      expect(
        screen.queryByText(
          /You cannot update validator power while validator\(s\) are unbonding\./i
        )
      ).toBeInTheDocument();

      const updateButton = screen.getByText('Update');
      expect(updateButton).toBeDisabled();
    },
    TIMEOUT
  );

  test(
    'shows UNBONDING TIME and hides POWER when unbonding_time is set',
    () => {
      renderWithProps({ validator: mockUnbondingValidators[0], hasUnbonding: true });

      expect(screen.getByText('UNBONDING TIME (UTC)')).toBeInTheDocument();
      expect(screen.queryByText('POWER')).not.toBeInTheDocument();
      expect(screen.queryByText('Update')).not.toBeInTheDocument();
    },
    TIMEOUT
  );

  test(
    'ignores Unix epoch 0 unbonding_time and shows POWER',
    () => {
      renderWithProps({});

      expect(screen.queryByText('UNBONDING TIME (UTC)')).not.toBeInTheDocument();
      expect(screen.getByText('POWER')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
    },
    TIMEOUT
  );
});
