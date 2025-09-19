import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';
import React from 'react';

import ConvertForm from '@/components/bank/forms/convertForm';
import { clearAllMocks, mockModule, mockRouter } from '@/tests';
import { mockBalances } from '@/tests/data';
import { renderWithChainProvider } from '@/tests/render';

// Mock the hooks used by ConvertForm
const mockConfig = {
  rate: '1.5',
  target_denom: 'upwr',
};

const mockMetadata = {
  display: 'PWR',
  name: 'Power Token',
  symbol: 'PWR',
  description: 'Power Token Description',
  base: 'upwr',
  denom_units: [
    { denom: 'upwr', exponent: 0, aliases: ['upwr'] },
    { denom: 'pwr', exponent: 6, aliases: ['pwr'] },
  ],
};

function renderWithProps(props = {}) {
  const defaultProps = {
    address: 'manifest1address',
    balances: mockBalances[0], // Use single balance for convert form
    isBalancesLoading: false,
    isGroup: false,
    admin: undefined,
  };

  return renderWithChainProvider(<ConvertForm {...defaultProps} {...props} />);
}

describe('ConvertForm Component', () => {
  beforeEach(() => {
    mockRouter();

    // Mock the hooks used by ConvertForm
    mockModule('@/hooks', () => ({
      useMfxPwrConversionConfig: () => ({
        config: mockConfig,
        isConfigLoading: false,
        isConfigError: false,
        error: null,
      }),
      useTokenMetadata: () => ({
        metadata: mockMetadata,
        isMetadataLoading: false,
        isMetadataError: false,
        error: null,
      }),
      useFeeEstimation: () => ({
        estimateFee: jest.fn().mockResolvedValue({ amount: [{ denom: 'umfx', amount: '1000' }] }),
      }),
      useTx: () => ({
        isSigning: false,
        tx: jest.fn().mockResolvedValue({}),
      }),
    }));

    // Mock the toast context
    mockModule('@/contexts', () => ({
      useToast: () => ({
        setToastMessage: jest.fn(),
      }),
    }));

    // Mock React Query
    mockModule('@tanstack/react-query', () => ({
      useQueryClient: () => ({
        invalidateQueries: jest.fn(),
      }),
    }));
  });

  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  test('renders form with correct details', () => {
    renderWithProps();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Receiving Amount')).toBeInTheDocument();
    expect(screen.getByText('Memo (optional)')).toBeInTheDocument();
  });

  test('renders loading state when balances are loading', () => {
    renderWithProps({ isBalancesLoading: true });
    // Form labels still render
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Receiving Amount')).toBeInTheDocument();
    expect(screen.getByText('Memo (optional)')).toBeInTheDocument();

    // Balance row is replaced by a skeleton and Max button is hidden
    expect(screen.queryByLabelText('balance-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Balance:')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /max/i })).not.toBeInTheDocument();
  });

  test('renders loading state when config is loading', () => {
    mockModule(
      '@/hooks',
      () => ({
        useMfxPwrConversionConfig: () => ({
          config: null,
          isConfigLoading: true,
          isConfigError: false,
          error: null,
        }),
        useTokenMetadata: () => ({
          metadata: mockMetadata,
          isMetadataLoading: false,
          isMetadataError: false,
          error: null,
        }),
        useFeeEstimation: () => ({
          estimateFee: jest.fn(),
        }),
        useTx: () => ({
          isSigning: false,
          tx: jest.fn(),
        }),
      }),
      true
    );

    renderWithProps();
    expect(screen.queryByText('Amount')).toBeInTheDocument();
    expect(screen.queryByText('Receiving Amount')).toBeInTheDocument();
    expect(screen.queryByText('Memo (optional)')).toBeInTheDocument();
    expect(screen.queryByText('Conversion Rate')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('config-skeleton')).toBeInTheDocument();
  });

  test('renders loading state when metadata is loading', () => {
    mockModule(
      '@/hooks',
      () => ({
        useMfxPwrConversionConfig: () => ({
          config: mockConfig,
          isConfigLoading: false,
          isConfigError: false,
          error: null,
        }),
        useTokenMetadata: () => ({
          metadata: null,
          isMetadataLoading: true,
          isMetadataError: false,
          error: null,
        }),
        useFeeEstimation: () => ({
          estimateFee: jest.fn(),
        }),
        useTx: () => ({
          isSigning: false,
          tx: jest.fn(),
        }),
      }),
      true
    );

    renderWithProps();
    expect(screen.queryByText('Amount')).toBeInTheDocument();
    expect(screen.queryByText('Receiving Amount')).toBeInTheDocument();
    expect(screen.queryByText('Memo (optional)')).toBeInTheDocument();
    expect(screen.queryByLabelText('metadata-skeleton')).toBeInTheDocument();
  });

  test('handles config error', () => {
    const mockSetToastMessage = jest.fn();

    mockModule(
      '@/contexts',
      () => ({
        useToast: () => ({
          setToastMessage: mockSetToastMessage,
        }),
      }),
      true
    );

    mockModule(
      '@/hooks',
      () => ({
        useMfxPwrConversionConfig: () => ({
          config: null,
          isConfigLoading: false,
          isConfigError: true,
          error: { message: 'Config error' },
        }),
        useTokenMetadata: () => ({
          metadata: mockMetadata,
          isMetadataLoading: false,
          isMetadataError: false,
          error: null,
        }),
        useFeeEstimation: () => ({
          estimateFee: jest.fn(),
        }),
        useTx: () => ({
          isSigning: false,
          tx: jest.fn(),
        }),
      }),
      true
    );

    renderWithProps();
    expect(screen.queryByText('Amount')).toBeInTheDocument();
    expect(screen.queryByText('Receiving Amount')).toBeInTheDocument();
    expect(screen.queryByText('Memo (optional)')).toBeInTheDocument();
    expect(mockSetToastMessage).toHaveBeenCalledWith({
      type: 'alert-error',
      title: 'Error loading conversion config',
      description: 'Config error',
      bgColor: '#e74c3c',
    });
  });

  test('handles metadata error', () => {
    const mockSetToastMessage = jest.fn();

    mockModule(
      '@/contexts',
      () => ({
        useToast: () => ({
          setToastMessage: mockSetToastMessage,
        }),
      }),
      true
    );

    mockModule(
      '@/hooks',
      () => ({
        useMfxPwrConversionConfig: () => ({
          config: mockConfig,
          isConfigLoading: false,
          isConfigError: false,
          error: null,
        }),
        useTokenMetadata: () => ({
          metadata: null,
          isMetadataLoading: false,
          isMetadataError: true,
          error: { message: 'Metadata error' },
        }),
        useFeeEstimation: () => ({
          estimateFee: jest.fn(),
        }),
        useTx: () => ({
          isSigning: false,
          tx: jest.fn(),
        }),
      }),
      true
    );

    renderWithProps();
    expect(screen.queryByText('Amount')).toBeInTheDocument();
    expect(screen.queryByText('Receiving Amount')).toBeInTheDocument();
    expect(screen.queryByText('Memo (optional)')).toBeInTheDocument();
    expect(mockSetToastMessage).toHaveBeenCalledWith({
      type: 'alert-error',
      title: 'Error loading token metadata',
      description: 'Metadata error',
      bgColor: '#e74c3c',
    });
  });

  test('updates amount input correctly', () => {
    renderWithProps();
    const amountInput = screen.getByPlaceholderText('1.00');
    fireEvent.change(amountInput, { target: { value: '100' } });
    expect(amountInput).toHaveValue('100');
  });

  test('calculates receiving amount based on conversion rate', async () => {
    renderWithProps();
    const amountInput = screen.getByPlaceholderText('1.00');
    fireEvent.change(amountInput, { target: { value: '100' } });

    await waitFor(() => {
      const receivingAmountInput = screen.getByDisplayValue('150'); // 100 * 1.5 rate
      expect(receivingAmountInput).toBeInTheDocument();
    });
  });

  test('displays conversion rate', () => {
    renderWithProps();
    expect(screen.getByText('Conversion Rate: 1.5')).toBeInTheDocument();
  });

  test('updates memo input correctly', () => {
    renderWithProps();
    const memoInput = screen.getByLabelText('Memo (optional)');
    fireEvent.change(memoInput, { target: { value: 'Test memo' } });
    expect(memoInput).toHaveValue('Test memo');
  });

  test('convert button is disabled when amount is empty', () => {
    renderWithProps();
    const convertButton = screen.getByLabelText('convert-btn');
    expect(convertButton).toBeDisabled();
  });

  test('convert button is enabled when amount is valid', async () => {
    renderWithProps();
    const amountInput = screen.getByPlaceholderText('1.00');
    fireEvent.change(amountInput, { target: { value: '100' } });

    await waitFor(() => {
      const convertButton = screen.getByRole('button', { name: 'convert-btn' });
      expect(convertButton).toBeEnabled();
    });
  });

  test('shows loading state when signing transaction', () => {
    mockModule(
      '@/hooks',
      () => ({
        useMfxPwrConversionConfig: () => ({
          config: mockConfig,
          isConfigLoading: false,
          isConfigError: false,
          error: null,
        }),
        useTokenMetadata: () => ({
          metadata: mockMetadata,
          isMetadataLoading: false,
          isMetadataError: false,
          error: null,
        }),
        useFeeEstimation: () => ({
          estimateFee: jest.fn(),
        }),
        useTx: () => ({
          isSigning: true,
          tx: jest.fn(),
        }),
      }),
      true
    );

    renderWithProps();
    const convertButton = screen.getByLabelText('convert-btn');
    expect(convertButton).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays token balance and max button', () => {
    renderWithProps();
    expect(screen.getByText('Balance:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /max/i })).toBeInTheDocument();
  });

  test('displays token denomination correctly', () => {
    renderWithProps();
    expect(screen.getByText('TOKEN 1')).toBeInTheDocument();
  });

  test('displays receiving token denomination correctly', () => {
    renderWithProps();
    expect(screen.getByText('PWR')).toBeInTheDocument();
  });

  test('receiving amount input is disabled', () => {
    renderWithProps();
    const receivingAmountInputs = screen.getAllByDisplayValue('0');
    const receivingAmountInput = receivingAmountInputs.find(
      input => input.getAttribute('name') === 'receive-amount'
    );
    expect(receivingAmountInput).toBeDisabled();
  });

  test('shows balance with max button functionality', async () => {
    renderWithProps();
    const maxButton = screen.getByRole('button', { name: /max/i });
    fireEvent.click(maxButton);

    await waitFor(() => {
      expect(maxButton).toBeInTheDocument();
    });
  });
});
