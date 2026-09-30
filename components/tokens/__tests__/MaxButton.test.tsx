import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, jest, mock, test } from 'bun:test';
import React from 'react';

import { MaxButton } from '@/components';
import { formatComponent } from '@/tests';
import { mockBalances, mockMfxBalance, mockOneUnitBalance } from '@/tests/data';

describe('MaxButton', () => {
  afterEach(cleanup);

  test('works', () => {
    const token = mockBalances[0];

    let amount = 0;
    const wrapper = render(
      <MaxButton token={token} setTokenAmount={a => (amount = parseFloat(a))} />
    );

    expect(amount).toBe(0);
    expect(screen.getByText('MAX')).toBeInTheDocument();
    screen.getByText('MAX').click();
    expect(amount).toBe(0.001);
    expect(document.querySelector('.tooltip')).not.toBeInTheDocument();

    expect(formatComponent(wrapper.asFragment())).toMatchSnapshot();
  });

  test('works for MFX', () => {
    const token = mockMfxBalance;

    let amount = 0;
    const wrapper = render(
      <MaxButton token={token} setTokenAmount={a => (amount = parseFloat(a))} />
    );

    expect(amount).toBe(0);
    expect(screen.getByText('MAX')).toBeInTheDocument();
    screen.getByText('MAX').click();
    expect(amount).toBe(1.9);
    expect(document.querySelector('.tooltip')).toBeInTheDocument();
  });

  test('keeps the zeros of an integer amount', () => {
    let amount = '';
    render(<MaxButton token={mockOneUnitBalance} setTokenAmount={a => (amount = a)} />);

    screen.getByText('MAX').click();
    // One-unit token: exponent 0, so MAX is the whole balance as an integer.
    expect(amount).toBe('5000000');
  });
});
