import { GasPrice } from '@cosmjs/stargate';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, jest, test } from 'bun:test';
import React from 'react';

import { MaxButton } from '@/components';
import { MaxQuote, quoteMax } from '@/hooks/useFeeEstimation';
import { formatComponent } from '@/tests';
import { mockBalances, mockMfxBalance, spendable } from '@/tests/data';

// 2 MFX less a 55_000 umfx fee.
const mfxQuote = quoteMax('manifest1sender', spendable('umfx', mockMfxBalance.amount), 55_000, {
  denom: 'umfx',
  gasPrice: GasPrice.fromString('1umfx'),
})!;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => (resolve = r));
  return { promise, resolve };
}

describe('MaxButton', () => {
  afterEach(cleanup);

  // Defaults to the whole balance.
  test('works', async () => {
    const setTokenAmount = jest.fn();
    const wrapper = render(
      <MaxButton token={mockBalances[0]} amount="" setTokenAmount={setTokenAmount} />
    );

    expect(screen.getByText('MAX')).toBeInTheDocument();
    fireEvent.click(screen.getByText('MAX'));
    await waitFor(() => expect(setTokenAmount).toHaveBeenCalledWith('0.001', null));
    expect(document.querySelector('.tooltip')).not.toBeInTheDocument();

    expect(formatComponent(wrapper.asFragment())).toMatchSnapshot();
  });

  test('uses the estimated max and passes its quote on', async () => {
    const estimateMax = jest.fn().mockResolvedValue(mfxQuote);
    const setTokenAmount = jest.fn();
    render(
      <MaxButton
        token={mockMfxBalance}
        amount=""
        setTokenAmount={setTokenAmount}
        estimateMax={estimateMax}
      />
    );

    fireEvent.click(screen.getByText('MAX'));
    await waitFor(() => expect(setTokenAmount).toHaveBeenCalledWith('1.945', mfxQuote));
    expect(estimateMax).toHaveBeenCalledWith(mockMfxBalance);
    expect(document.querySelector('.tooltip')).toBeInTheDocument();
  });

  test('leaves the amount alone when the estimate fails', async () => {
    const estimateMax = jest.fn().mockResolvedValue(null);
    const setTokenAmount = jest.fn();
    render(
      <MaxButton
        token={mockMfxBalance}
        amount=""
        setTokenAmount={setTokenAmount}
        estimateMax={estimateMax}
      />
    );

    fireEvent.click(screen.getByText('MAX'));
    await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());
    expect(estimateMax).toHaveBeenCalled();
    expect(setTokenAmount).not.toHaveBeenCalled();
  });

  test('ignores a quote for another token', async () => {
    const estimateMax = jest.fn().mockResolvedValue(mfxQuote);
    const setTokenAmount = jest.fn();
    render(
      <MaxButton
        token={mockBalances[0]}
        amount=""
        setTokenAmount={setTokenAmount}
        estimateMax={estimateMax}
      />
    );

    fireEvent.click(screen.getByText('MAX'));
    await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());
    expect(setTokenAmount).not.toHaveBeenCalled();
  });

  describe('drops an estimate that is still running when', () => {
    function startEstimate() {
      const pending = deferred<MaxQuote | null>();
      const estimateMax = jest.fn(() => pending.promise);
      const setTokenAmount = jest.fn();
      const view = (token = mockMfxBalance, amount = '') => (
        <MaxButton
          token={token}
          amount={amount}
          setTokenAmount={setTokenAmount}
          estimateMax={estimateMax}
        />
      );
      const { rerender, unmount } = render(view());
      fireEvent.click(screen.getByText('MAX'));
      return { pending, estimateMax, setTokenAmount, view, rerender, unmount };
    }

    test('the token changes', async () => {
      const { pending, estimateMax, setTokenAmount, view, rerender } = startEstimate();
      await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());

      rerender(view(mockBalances[0]));
      await act(async () => pending.resolve(mfxQuote));
      expect(setTokenAmount).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());

      // A new MAX after the change goes through.
      rerender(view(mockMfxBalance));
      estimateMax.mockResolvedValueOnce(mfxQuote);
      fireEvent.click(screen.getByText('MAX'));
      await waitFor(() => expect(setTokenAmount).toHaveBeenCalledWith('1.945', mfxQuote));
    });

    test('the amount is edited', async () => {
      const { pending, setTokenAmount, view, rerender } = startEstimate();

      rerender(view(mockMfxBalance, '1'));
      await act(async () => pending.resolve(mfxQuote));
      expect(setTokenAmount).not.toHaveBeenCalled();
    });

    test('the button unmounts', async () => {
      const { pending, setTokenAmount, unmount } = startEstimate();

      unmount();
      await act(async () => pending.resolve(mfxQuote));
      expect(setTokenAmount).not.toHaveBeenCalled();
    });
  });

  test('keeps the zeros of a whole amount', async () => {
    const token = {
      ...mockBalances[0],
      amount: '1000',
      metadata: {
        ...mockBalances[0].metadata!,
        denom_units: [
          { denom: 'utoken1', exponent: 0, aliases: [] },
          { denom: 'token1', exponent: 0, aliases: [] },
        ],
      },
    };
    const setTokenAmount = jest.fn();
    render(<MaxButton token={token} amount="" setTokenAmount={setTokenAmount} />);

    fireEvent.click(screen.getByText('MAX'));
    await waitFor(() => expect(setTokenAmount).toHaveBeenCalledWith('1000', null));
  });
});
