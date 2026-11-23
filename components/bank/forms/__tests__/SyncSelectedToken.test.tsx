import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'bun:test';
import { Formik } from 'formik';
import React from 'react';

import { SyncSelectedToken } from '@/components/bank/forms/SyncSelectedToken';
import { mockBalances } from '@/tests/data';
import { CombinedBalanceInfo } from '@/utils/types';

function renderSync(selected: CombinedBalanceInfo, latest: CombinedBalanceInfo | undefined) {
  const view = (latest: CombinedBalanceInfo | undefined) => (
    <Formik initialValues={{ selectedToken: selected }} onSubmit={() => {}}>
      {({ values }) => (
        <>
          <SyncSelectedToken latest={latest} />
          <span data-testid="selected">
            {values.selectedToken.base}:{values.selectedToken.amount}
          </span>
        </>
      )}
    </Formik>
  );
  const { rerender } = render(view(latest));
  return { rerender: (next: CombinedBalanceInfo | undefined) => rerender(view(next)) };
}

describe('SyncSelectedToken', () => {
  afterEach(cleanup);
  const token = mockBalances[0];
  const selected = () => screen.getByTestId('selected').textContent;

  test("takes the selected token's latest balance", async () => {
    const { rerender } = renderSync(token, token);
    expect(selected()).toBe(`${token.base}:1000`);

    rerender({ ...token, amount: '3000' });
    await waitFor(() => expect(selected()).toBe(`${token.base}:3000`));
  });

  test('never switches to another token', async () => {
    renderSync(token, mockBalances[1]);
    await new Promise(r => setTimeout(r, 20));
    expect(selected()).toBe(`${token.base}:1000`);
  });

  test('keeps the selection while the latest balance is unknown', async () => {
    renderSync(token, undefined);
    await new Promise(r => setTimeout(r, 20));
    expect(selected()).toBe(`${token.base}:1000`);
  });
});
