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
  beforeEach(() => {
    mockRouter();
  });
  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  test('rejects fractional amounts of a one-unit token', async () => {
    const denom = { ...mockOneUnitDenomMeta, balance: '5000000', totalSupply: '5000000' };
    renderWithProps({ denom, balance: '5000000', totalSupply: '5000000' });
    const amountInput = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(screen.getByPlaceholderText('Recipient address'), {
      target: { value: manifestAddr1 },
    });
    const burnButton = screen.getByLabelText(`burn-btn-${denom.base}`);

    fireEvent.change(amountInput, { target: { value: '2' } });
    await waitFor(() => expect(burnButton).toBeEnabled());
    fireEvent.change(amountInput, { target: { value: '1.5' } });
    await waitFor(() => expect(burnButton).toBeDisabled());
  });
});
