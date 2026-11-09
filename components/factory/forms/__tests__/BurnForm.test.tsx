import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';
import React from 'react';

import BurnForm from '@/components/factory/forms/BurnForm';
import { clearAllMocks, mockModule, mockRouter } from '@/tests';
import {
  manifestAddr1,
  mockDenomMeta1,
  mockFakeMfxDenom,
  mockMfxDenom,
  mockOneUnitDenomMeta,
} from '@/tests/data';
import { renderWithChainProvider } from '@/tests/render';

const mockProps = {
  isAdmin: true,
  admin: 'cosmos1adminaddress',
  denom: { ...mockDenomMeta1, balance: '1000000', totalSupply: '1000000' },
  address: 'cosmos1address',
  refetch: jest.fn(),
  balance: '1000000',
  totalSupply: '1000000',
};

function renderWithProps(props = {}) {
  return renderWithChainProvider(<BurnForm {...mockProps} {...props} />);
}

describe('BurnForm Component', () => {
  beforeEach(() => {
    mockRouter();
  });
  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  test('renders form with correct details', () => {
    renderWithProps();
    expect(screen.getByText('NAME')).toBeInTheDocument();
    expect(screen.getByText('BALANCE')).toBeInTheDocument();
  });

  test('renders not affiliated message when not admin and token is mfx', () => {
    renderWithProps({ isAdmin: false, denom: mockMfxDenom });
    expect(
      screen.getByText('You must be a member of the admin group to burn MFX.')
    ).toBeInTheDocument();
  });

  test('updates amount input correctly', async () => {
    renderWithProps();
    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(amountInput, { target: { value: '100' } });
    await waitFor(() => {
      expect(amountInput).toHaveValue(100);
    });
  });

  test('burn button is disabled when inputs are invalid', async () => {
    renderWithProps();
    const burnButton = screen.getByLabelText(`burn-btn-${mockDenomMeta1.base}`);
    expect(burnButton).toBeDisabled();

    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(amountInput, { target: { value: '-100' } });

    await waitFor(() => {
      expect(burnButton).toBeDisabled();
    });
  });

  test('burn button is enabled when inputs are valid', async () => {
    renderWithProps();
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Recipient address');
    const burnButton = screen.getByLabelText(`burn-btn-${mockDenomMeta1.base}`);

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: manifestAddr1 } });

    await waitFor(() => {
      expect(burnButton).toBeEnabled();
    });
  });

  test('burn button is disabled when inputs are invalid', () => {
    renderWithProps();
    const burnButton = screen.getByLabelText(`burn-btn-${mockDenomMeta1.base}`);
    expect(burnButton).toBeDisabled();
  });

  test('fake MFX can be burnt', async () => {
    renderWithProps({ isAdmin: false, denom: mockFakeMfxDenom });
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Recipient address');
    const burnButton = screen.getByLabelText(`burn-btn-${mockFakeMfxDenom.base}`);

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: manifestAddr1 } });

    await waitFor(() => {
      expect(burnButton).toBeEnabled();
    });
  });
});

describe('BurnForm amounts', () => {
  // The form shows the amount's validation error in a tooltip once the field is touched.
  const amountError = (message: string) => document.querySelector(`[data-tip="${message}"]`);

  const tx = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    mockRouter();
    mockModule('@/hooks', () => ({
      useTx: () => ({ isSigning: false, tx }),
      useFeeEstimation: () => ({ estimateFee: jest.fn() }),
    }));
  });
  afterEach(() => {
    cleanup();
    clearAllMocks();
    tx.mockClear();
  });

  test('burns a one-unit token in display units, like MFX', async () => {
    const balance = '5000000000000';
    const denom = { ...mockOneUnitDenomMeta, balance, totalSupply: balance };
    renderWithProps({ denom, balance, totalSupply: balance });
    fireEvent.change(screen.getByPlaceholderText('Recipient address'), {
      target: { value: manifestAddr1 },
    });
    // It burned base units: 1 was 1 base unit, not 1 token.
    fireEvent.change(screen.getByPlaceholderText('Enter amount'), { target: { value: '1' } });
    const burnButton = screen.getByLabelText(`burn-btn-${denom.base}`);
    await waitFor(() => expect(burnButton).toBeEnabled());
    fireEvent.click(burnButton);

    await waitFor(() => expect(tx).toHaveBeenCalledTimes(1));
    const [msgs] = tx.mock.calls[0];
    expect(msgs[0].value.amount).toEqual({ denom: denom.base, amount: '1000000' });
  });

  test('rejects more decimals than the display unit has', async () => {
    const balance = '5000000000000';
    const denom = { ...mockOneUnitDenomMeta, balance, totalSupply: balance };
    renderWithProps({ denom, balance, totalSupply: balance });
    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(screen.getByPlaceholderText('Recipient address'), {
      target: { value: manifestAddr1 },
    });
    const burnButton = screen.getByLabelText(`burn-btn-${denom.base}`);

    fireEvent.change(amountInput, { target: { value: '0.000001' } });
    await waitFor(() => expect(burnButton).toBeEnabled());
    fireEvent.change(amountInput, { target: { value: '0.0000005' } });
    fireEvent.blur(amountInput);
    await waitFor(() =>
      expect(amountError('Amount can have at most 6 decimal places')).not.toBeNull()
    );
    expect(burnButton).toBeDisabled();
  });

  test('checks the typed amount, not its rounded double', async () => {
    const balance = '500000000000000000';
    const denom = { ...mockOneUnitDenomMeta, balance, totalSupply: balance };
    renderWithProps({ denom, balance, totalSupply: balance });
    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(screen.getByPlaceholderText('Recipient address'), {
      target: { value: manifestAddr1 },
    });
    const burnButton = screen.getByLabelText(`burn-btn-${denom.base}`);

    fireEvent.change(amountInput, { target: { value: '100000000000' } });
    await waitFor(() => expect(burnButton).toBeEnabled());
    // As a double this is 100000000000 (no decimals), but it has 7 and would be signed
    // rounded up, as 100000000000000001 base units.
    fireEvent.change(amountInput, { target: { value: '100000000000.0000005' } });
    fireEvent.blur(amountInput);
    await waitFor(() =>
      expect(amountError('Amount can have at most 6 decimal places')).not.toBeNull()
    );
    expect(burnButton).toBeDisabled();
  });

  test('compares the typed amount to the balance exactly', async () => {
    // 1,000,000,000,000 tokens. One base unit more compares equal to it as a double.
    const balance = '1000000000000000000';
    const denom = { ...mockOneUnitDenomMeta, balance, totalSupply: balance };
    renderWithProps({ denom, balance, totalSupply: balance });
    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(screen.getByPlaceholderText('Recipient address'), {
      target: { value: manifestAddr1 },
    });
    const burnButton = screen.getByLabelText(`burn-btn-${denom.base}`);

    fireEvent.change(amountInput, { target: { value: '1000000000000' } });
    await waitFor(() => expect(burnButton).toBeEnabled());
    fireEvent.change(amountInput, { target: { value: '1000000000000.000001' } });
    fireEvent.blur(amountInput);
    await waitFor(() => expect(amountError('Amount exceeds balance')).not.toBeNull());
    expect(burnButton).toBeDisabled();
  });
});
