import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';
import React from 'react';

import SendForm from '@/components/bank/forms/sendForm';
import { clearAllMocks, mockModule, mockRouter } from '@/tests';
import { manifestAddr2, mockBalances, mockOneUnitBalance } from '@/tests/data';
import { renderWithChainProvider } from '@/tests/render';

function renderWithProps(props = {}) {
  const defaultProps = {
    address: 'manifest1address',
    balances: mockBalances,
    isBalancesLoading: false,
    refetchBalances: jest.fn(),
    ibcChains: [
      {
        id: 'osmosis',
        name: 'Osmosis',
        icon: 'https://osmosis.zone/assets/icons/osmo-logo-icon.svg',
        prefix: 'osmo',
      },
    ],
  };

  return renderWithChainProvider(<SendForm {...defaultProps} {...props} />);
}

describe('SendForm Component', () => {
  beforeEach(() => {
    mockRouter();
  });
  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  test('renders form with correct details', () => {
    renderWithProps();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Send To')).toBeInTheDocument();
  });

  test('empty balances', () => {
    renderWithProps({ balances: [] });
    expect(screen.queryByText('Amount')).not.toBeInTheDocument();
    expect(screen.queryByText('Send To')).not.toBeInTheDocument();
  });

  test('updates token dropdown correctly', () => {
    renderWithProps();
    const tokenSelector = screen.getByLabelText('token-selector');
    fireEvent.click(tokenSelector);
    expect(tokenSelector).toHaveTextContent('TOKEN 1');
  });
  test('updates recipient input correctly', () => {
    renderWithProps();
    const recipientInput = screen.getByPlaceholderText('Enter address');
    fireEvent.change(recipientInput, { target: { value: 'manifest1recipient' } });
    expect(recipientInput).toHaveValue('manifest1recipient');
  });

  test('updates amount input correctly', () => {
    renderWithProps();
    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '100' } });
    expect(amountInput).toHaveValue('100');
  });

  test('send button is disabled when inputs are invalid', () => {
    renderWithProps();
    const sendButton = screen.getByLabelText('send-btn');
    expect(sendButton).toBeDisabled();
  });

  test('send button is enabled when inputs are valid', () => {
    renderWithProps();
    fireEvent.change(screen.getByPlaceholderText('Enter address'), {
      target: { value: 'manifest1recipient' },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '100' },
    });
    const tokenSelector = screen.getByLabelText('token-selector');
    fireEvent.click(tokenSelector);
    const dropdownItems = screen.getAllByText('TOKEN 1');
    fireEvent.click(dropdownItems[dropdownItems.length - 1]);
    const sendButton = screen.getByRole('button', { name: 'send-btn' });
    expect(sendButton).not.toBeDisabled();
  });
});

describe('SendForm amounts', () => {
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

  test('shows and sends a one-unit token in display units, like MFX', async () => {
    renderWithProps({ balances: [mockOneUnitBalance] });

    // 5,000,000 base units show as 5 (they showed as "5M"), and 1.5 sends 1,500,000.
    expect(screen.getByText('5')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter address'), {
      target: { value: manifestAddr2 },
    });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1.5' } });
    const sendButton = screen.getByRole('button', { name: 'send-btn' });
    await waitFor(() => expect(sendButton).not.toBeDisabled());
    fireEvent.click(sendButton);

    await waitFor(() => expect(tx).toHaveBeenCalledTimes(1));
    const [msgs] = tx.mock.calls[0];
    expect(msgs[0].value.amount).toEqual([{ denom: mockOneUnitBalance.base, amount: '1500000' }]);
  });

  test('rejects more decimals than the display unit has instead of rounding them', async () => {
    renderWithProps({ balances: [mockOneUnitBalance] });
    fireEvent.change(screen.getByPlaceholderText('Enter address'), {
      target: { value: manifestAddr2 },
    });
    const amountInput = screen.getByPlaceholderText('0.00');
    const sendButton = screen.getByRole('button', { name: 'send-btn' });

    // Seven decimals of a 6-decimal token would be rounded to a whole base unit.
    fireEvent.change(amountInput, { target: { value: '0.0000005' } });
    expect(await screen.findByText('Amount can have at most 6 decimal places')).toBeInTheDocument();
    expect(sendButton).toBeDisabled();
    fireEvent.click(sendButton);
    expect(tx).not.toHaveBeenCalled();
  });
});
