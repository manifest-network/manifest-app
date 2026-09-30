import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';
import React from 'react';

import MintForm from '@/components/factory/forms/MintForm';
import { clearAllMocks, mockModule, mockRouter } from '@/tests';
import {
  manifestAddr2,
  mockDenomMeta1,
  mockFakeMfxDenom,
  mockMfxDenom,
  mockOneUnitDenomMeta,
} from '@/tests/data';
import { renderWithChainProvider } from '@/tests/render';

const mockProps = {
  isAdmin: true,
  admin: 'cosmos1adminaddress',
  denom: {
    ...mockDenomMeta1,
    balance: '1000000',
    totalSupply: '1000000',
  },
  address: 'cosmos1address',
  refetch: jest.fn(),
  balance: '1000000',
  totalSupply: '1000000',
};

function renderWithProps(props = {}) {
  return renderWithChainProvider(<MintForm {...mockProps} {...props} />);
}

describe('MintForm Component', () => {
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
    expect(screen.getByText('CIRCULATING SUPPLY')).toBeInTheDocument();
  });

  test('renders not affiliated message when not admin and token is mfx', () => {
    renderWithProps({ isAdmin: false, denom: mockMfxDenom });
    expect(
      screen.getByText('You must be a member of the admin group to mint MFX.')
    ).toBeInTheDocument();
  });

  test('updates amount input correctly', async () => {
    renderWithProps();
    const amountInput = screen.getByLabelText('AMOUNT');
    fireEvent.change(amountInput, { target: { value: '100' } });
    await waitFor(() => {
      expect(amountInput).toHaveValue(100);
    });
  });

  test('updates recipient input correctly', async () => {
    renderWithProps();
    const recipientInput = screen.getByPlaceholderText('Recipient address');
    fireEvent.change(recipientInput, { target: { value: 'cosmos1recipient' } });
    await waitFor(() => {
      expect(recipientInput).toHaveValue('cosmos1recipient');
    });
  });

  test('mint button is disabled when inputs are invalid', async () => {
    renderWithProps();
    const mintButton = screen.getByLabelText(`mint-btn-${mockDenomMeta1.display}`);
    expect(mintButton).toBeDisabled();

    const amountInput = screen.getByLabelText('AMOUNT');
    fireEvent.change(amountInput, { target: { value: '-100' } });

    await waitFor(() => {
      expect(mintButton).toBeDisabled();
    });
  });

  test('mint button is enabled when inputs are valid', async () => {
    renderWithProps();
    const amountInput = screen.getByLabelText('AMOUNT');
    const recipientInput = screen.getByLabelText('RECIPIENT');
    const mintButton = screen.getByLabelText(`mint-btn-${mockDenomMeta1.display}`);

    fireEvent.change(amountInput, { target: { value: '1' } });
    fireEvent.change(recipientInput, {
      target: { value: 'manifest1aucdev30u9505dx9t6q5fkcm70sjg4rh7rn5nf' },
    });

    await waitFor(() => {
      expect(mintButton).toBeEnabled();
    });
  });

  test('fake MFX can be minted', async () => {
    renderWithProps({ isAdmin: false, denom: mockFakeMfxDenom });
    const amountInput = screen.getByLabelText('AMOUNT');
    const recipientInput = screen.getByLabelText('RECIPIENT');
    const mintButton = screen.getByLabelText(`mint-btn-${mockFakeMfxDenom.display}`);

    fireEvent.change(amountInput, { target: { value: '1' } });
    fireEvent.change(recipientInput, {
      target: { value: 'manifest1aucdev30u9505dx9t6q5fkcm70sjg4rh7rn5nf' },
    });

    await waitFor(() => {
      expect(mintButton).toBeEnabled();
    });
  });
});

describe('MintForm amounts', () => {
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

  test('mints the typed amount of a one-unit token, not 10^6 times it', async () => {
    const denom = { ...mockOneUnitDenomMeta, balance: '5000000', totalSupply: '5000000' };
    renderWithProps({ denom, totalSupply: '5000000' });

    // The supply is shown in the unit the amount is typed in.
    expect(screen.getAllByText('5,000,000').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('AMOUNT'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('RECIPIENT'), { target: { value: manifestAddr2 } });
    const mintButton = screen.getByLabelText(`mint-btn-${denom.display}`);
    await waitFor(() => expect(mintButton).toBeEnabled());
    fireEvent.click(mintButton);

    await waitFor(() => expect(tx).toHaveBeenCalledTimes(1));
    const [msgs] = tx.mock.calls[0];
    expect(msgs[0].value.amount).toEqual({ denom: denom.base, amount: '1' });
  });

  test('rejects fractional amounts of a one-unit token', async () => {
    const denom = { ...mockOneUnitDenomMeta, balance: '5000000', totalSupply: '5000000' };
    renderWithProps({ denom, totalSupply: '5000000' });
    const amountInput = screen.getByLabelText('AMOUNT');
    fireEvent.change(screen.getByLabelText('RECIPIENT'), { target: { value: manifestAddr2 } });
    const mintButton = screen.getByLabelText(`mint-btn-${denom.display}`);

    fireEvent.change(amountInput, { target: { value: '2' } });
    await waitFor(() => expect(mintButton).toBeEnabled());
    fireEvent.change(amountInput, { target: { value: '1.5' } });
    await waitFor(() => expect(mintButton).toBeDisabled());
  });

  test('checks the typed amount, not its rounded double', async () => {
    const supply = '5000000000000000';
    const denom = { ...mockOneUnitDenomMeta, balance: supply, totalSupply: supply };
    renderWithProps({ denom, totalSupply: supply });
    const amountInput = screen.getByLabelText('AMOUNT');
    fireEvent.change(screen.getByLabelText('RECIPIENT'), { target: { value: manifestAddr2 } });
    const mintButton = screen.getByLabelText(`mint-btn-${denom.display}`);

    fireEvent.change(amountInput, { target: { value: '4503599627370496' } });
    await waitFor(() => expect(mintButton).toBeEnabled());
    // As a double this is 4503599627370496, but it would be signed as 4503599627370497.
    fireEvent.change(amountInput, { target: { value: '4503599627370496.5' } });
    await waitFor(() => expect(mintButton).toBeDisabled());
  });
});
