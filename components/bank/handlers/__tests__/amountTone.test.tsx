import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { AMOUNT_TONE_CLASS, AmountTone } from '@/components/bank/handlers/amountTone';
import { createTokenMessage } from '@/components/bank/handlers/createMessageUtils';
import { clearAllMocks, mockRouter } from '@/tests';
import { renderWithChainProvider } from '@/tests/render';

const tones = Object.keys(AMOUNT_TONE_CLASS) as AmountTone[];

describe('transaction amount tones', () => {
  beforeEach(() => {
    mockRouter();
  });

  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  test('each tone has its own theme color class', () => {
    expect(AMOUNT_TONE_CLASS).toEqual({
      negative: 'text-error',
      positive: 'text-success',
      caution: 'text-warning',
      neutral: 'text-content-muted',
    });
  });

  test.each(tones)('a %s amount is rendered in its tone', tone => {
    renderWithChainProvider(
      <div>
        {createTokenMessage(
          'You sent {0} to {1}',
          [{ amount: '2000000', denom: 'utoken' }],
          'address2',
          tone
        )}
      </div>
    );

    const amount = screen.getByText('2 TOKEN');
    expect(amount.closest(`.${AMOUNT_TONE_CLASS[tone]}`)).not.toBeNull();
    for (const other of tones.filter(name => name !== tone)) {
      expect(amount.closest(`.${AMOUNT_TONE_CLASS[other]}`)).toBeNull();
    }
  });
});
