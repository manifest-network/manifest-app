import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, jest, test } from 'bun:test';
import React from 'react';

import { MaxButton } from '@/components';
import { formatComponent } from '@/tests';
import { mockBalances, mockMfxBalance } from '@/tests/data';

describe('MaxButton', () => {
  afterEach(cleanup);

  // Defaults to the whole balance.
  test('works', async () => {
    const token = mockBalances[0];

    let amount = 0;
    const wrapper = render(
      <MaxButton token={token} setTokenAmount={a => (amount = parseFloat(a))} />
    );

    expect(amount).toBe(0);
    expect(screen.getByText('MAX')).toBeInTheDocument();
    screen.getByText('MAX').click();
    await waitFor(() => expect(amount).toBe(0.001));
    expect(document.querySelector('.tooltip')).not.toBeInTheDocument();

    expect(formatComponent(wrapper.asFragment())).toMatchSnapshot();
  });

  test('uses the estimated max and shows the fee hint', async () => {
    const token = mockMfxBalance;
    const estimateMax = jest.fn().mockResolvedValue('1945000');

    let amount = 0;
    render(
      <MaxButton
        token={token}
        setTokenAmount={a => (amount = parseFloat(a))}
        estimateMax={estimateMax}
      />
    );

    screen.getByText('MAX').click();
    await waitFor(() => expect(amount).toBe(1.945));
    expect(estimateMax).toHaveBeenCalledWith(token);
    expect(document.querySelector('.tooltip')).toBeInTheDocument();
  });

  test('leaves the amount alone when the estimate fails', async () => {
    const estimateMax = jest.fn().mockResolvedValue(null);
    const setTokenAmount = jest.fn();
    render(
      <MaxButton token={mockMfxBalance} setTokenAmount={setTokenAmount} estimateMax={estimateMax} />
    );

    screen.getByText('MAX').click();
    await waitFor(() => expect(estimateMax).toHaveBeenCalled());
    expect(setTokenAmount).not.toHaveBeenCalled();
  });
});
