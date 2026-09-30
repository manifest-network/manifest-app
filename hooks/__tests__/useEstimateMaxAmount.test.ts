import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { useEstimateMaxTokenAmount } from '@/hooks';
import { mockOneUnitBalance } from '@/tests/data';
import { CombinedBalanceInfo, MFX_TOKEN_BASE, unsafeConvertTokenBase } from '@/utils';

const mockBalances: CombinedBalanceInfo[] = [
  {
    display: 'utoken1',
    amount: '1000',
    base: unsafeConvertTokenBase('token1'),
    metadata: {
      name: 'Token 1',
      uri: 'https://token1.com',
      uri_hash: 'hash1',
      description: 'My First Token',
      base: 'token1',
      display: 'Token 1',
      symbol: 'TK1',
      denom_units: [
        { denom: 'utoken1', exponent: 0, aliases: ['utoken1'] },
        { denom: 'token1', exponent: 6, aliases: ['token1'] },
      ],
    },
  },
  {
    display: 'mfx',
    amount: '2000000',
    base: MFX_TOKEN_BASE,
    metadata: {
      name: 'Token 2',
      uri: 'https://token2.com',
      uri_hash: 'hash2',
      description: 'My Second Token',
      base: 'token2',
      display: 'Token 2',
      symbol: 'TK2',
      denom_units: [
        { denom: 'utoken2', exponent: 0, aliases: ['utoken2'] },
        { denom: 'token2', exponent: 6, aliases: ['token2'] },
      ],
    },
  },
];

describe('useEstimateMaxTokenAmount', () => {
  test('works', () => {
    const estimateMax = useEstimateMaxTokenAmount();

    expect(estimateMax(mockBalances[0]).toFixed()).toBe('0.001');
    // MFX should have 0.1 subtracted from the max amount.
    expect(estimateMax(mockBalances[1]).toFixed()).toBe('1.9');
  });
});

describe('useEstimateMaxTokenAmount display exponent', () => {
  test('keeps one-unit token amounts in base units', () => {
    const estimateMax = useEstimateMaxTokenAmount();

    // One-unit metadata has exponent 0: the whole balance, not balance / 10^6.
    expect(estimateMax(mockOneUnitBalance).toFixed()).toBe('5000000');
  });
});
