// typescript
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import React from 'react';

import { clearAllMocks, mockModule, mockRouter } from '@/tests';
import { mockBalances } from '@/tests/data';
import { renderWithChainProvider } from '@/tests/render';

type Props = {
  address?: string;
  balances?: any;
  isBalancesLoading?: boolean;
  isGroup?: boolean;
  admin?: string;
};

async function renderWithPropsAsync(props: Props = {}) {
  const defaultProps: Required<Props> = {
    address: 'manifest1addressxyz',
    balances: mockBalances[0],
    isBalancesLoading: false,
    isGroup: false,
    admin: '',
  };

  const { default: ConvertBox } = await import('@/components/bank/components/convertBox');
  return renderWithChainProvider(<ConvertBox {...defaultProps} {...props} />);
}

describe('ConvertBox', () => {
  beforeEach(() => {
    mockRouter();
    // Mock the child to isolate ConvertBox prop forwarding
    mockModule('@/components/bank/forms/convertForm', () => ({
      default: (props: any) => {
        const { address, balances, isBalancesLoading, isGroup, admin } = props;
        return (
          <div
            aria-label="convert-form"
            data-address={address}
            data-is-balances-loading={isBalancesLoading ? 'true' : 'false'}
            data-is-group={isGroup ? 'true' : 'false'}
            data-admin={admin ?? ''}
          >
            <span aria-label="balances-json">{JSON.stringify(balances)}</span>
          </div>
        );
      },
    }));
  });

  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  test('renders ConvertForm', async () => {
    await renderWithPropsAsync();
    expect(screen.getByLabelText('convert-form')).toBeInTheDocument();
  });

  test('forwards basic props (address, balances, loading)', async () => {
    const balances = mockBalances[0];
    await renderWithPropsAsync({
      address: 'manifest1abc',
      balances,
      isBalancesLoading: true,
    });

    const form = screen.getByLabelText('convert-form');
    expect(form).toHaveAttribute('data-address', 'manifest1abc');
    expect(form).toHaveAttribute('data-is-balances-loading', 'true');

    const raw = screen.getByLabelText('balances-json').textContent ?? '{}';
    expect(JSON.parse(raw)).toEqual(balances);
  });

  test('forwards group/admin props', async () => {
    await renderWithPropsAsync({
      isGroup: true,
      admin: 'manifest1adminxyz',
    });

    const form = screen.getByLabelText('convert-form');
    expect(form).toHaveAttribute('data-is-group', 'true');
    expect(form).toHaveAttribute('data-admin', 'manifest1adminxyz');
  });
});
