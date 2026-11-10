import { GasPrice } from '@cosmjs/stargate';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';
import React from 'react';

import SendForm from '@/components/bank/forms/sendForm';
import { quoteMax } from '@/hooks/useFeeEstimation';
import { clearAllMocks, mockModule, mockRouter } from '@/tests';
import { mockBalances } from '@/tests/data';
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

describe('SendForm MAX', () => {
  const SENDER = 'manifest1address';
  const RECIPIENT = 'manifest1hj5fveer5cjtn4wd6wstzugjfdxzl0xp8ws9ct';
  // TOKEN 1's 1000 base units less a 100 fee, paid in TOKEN 1.
  const quote = quoteMax(SENDER, mockBalances[0].amount, 100, {
    denom: mockBalances[0].base,
    gasPrice: GasPrice.fromString(`1${mockBalances[0].base}`),
  })!;
  let estimateMax: jest.Mock;
  let tx: jest.Mock;

  beforeEach(() => {
    mockRouter();
    estimateMax = jest.fn().mockResolvedValue(quote);
    tx = jest.fn().mockResolvedValue(undefined);
    mockModule('@/hooks', () => ({
      useFeeEstimation: () => ({ estimateMax, isFeeDenom: () => true }),
      useTx: () => ({ isSigning: false, tx }),
    }));
  });
  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  const clickMax = async () => {
    fireEvent.click(screen.getByRole('button', { name: /max/i }));
    await waitFor(() => expect(screen.getByPlaceholderText('0.00')).toHaveValue('0.0009'));
  };
  // The recipient of the message MAX simulated.
  const simulatedRecipient = () => {
    const [, , buildMsg] = estimateMax.mock.calls[0];
    return buildMsg('1').value.toAddress;
  };

  test('simulates a send to self until the recipient is valid', async () => {
    renderWithProps();
    fireEvent.change(screen.getByPlaceholderText('Enter address'), {
      target: { value: 'manifest1notyet' },
    });
    await clickMax();
    expect(simulatedRecipient()).toBe(SENDER);
  });

  test('simulates the send to the recipient once it is valid', async () => {
    renderWithProps();
    fireEvent.change(screen.getByPlaceholderText('Enter address'), {
      target: { value: RECIPIENT },
    });
    await clickMax();
    expect(simulatedRecipient()).toBe(RECIPIENT);
  });

  test('hands the quote to tx, which estimates the fee itself', async () => {
    renderWithProps();
    fireEvent.change(screen.getByPlaceholderText('Enter address'), {
      target: { value: RECIPIENT },
    });
    await clickMax();

    await waitFor(() => expect(screen.getByRole('button', { name: 'send-btn' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'send-btn' }));

    await waitFor(() => expect(tx).toHaveBeenCalled());
    const [[msg], options] = tx.mock.calls[0];
    expect(msg.value).toMatchObject({
      fromAddress: SENDER,
      toAddress: RECIPIENT,
      amount: [{ denom: quote.denom, amount: quote.amount }],
    });
    expect(options.maxQuote).toBe(quote);
    expect(options).not.toHaveProperty('fee');
  });
});
