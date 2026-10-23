import { describe, expect, test } from 'bun:test';

import env from '@/config/env';
import { FeeToken, bankSpends, selectFee } from '@/hooks';

const ADDRESS = 'manifest1sender';
const PWR = env.pwrTokenDenom;

const feeTokens: FeeToken[] = [
  { denom: 'umfx', gasPrice: 1.1 },
  { denom: PWR, gasPrice: 0.5 },
];

const sendMsg = (denom: string, amount: string, fromAddress = ADDRESS) => ({
  typeUrl: '/cosmos.bank.v1beta1.MsgSend',
  value: { fromAddress, toAddress: 'manifest1recipient', amount: [{ denom, amount }] },
});

describe('selectFee', () => {
  test('prefers MFX when the MFX balance covers the fee', () => {
    const fee = selectFee(100_000, feeTokens, [
      { denom: 'umfx', amount: '1000000' },
      { denom: PWR, amount: '1000000' },
    ]);
    expect(fee?.amount).toEqual([{ denom: 'umfx', amount: '110000' }]);
    expect(fee?.gas).toBe('100000');
  });

  test('pays in PWR when the wallet holds only PWR', () => {
    const fee = selectFee(100_000, feeTokens, [{ denom: PWR, amount: '1000000' }]);
    expect(fee?.amount).toEqual([{ denom: PWR, amount: '50000' }]);
  });

  test('pays in PWR when MFX is too low for the fee', () => {
    const fee = selectFee(100_000, feeTokens, [
      { denom: 'umfx', amount: '109999' },
      { denom: PWR, amount: '50000' },
    ]);
    expect(fee?.amount[0].denom).toBe(PWR);
  });

  test('counts what is being sent in the fee denom', () => {
    const balances = [{ denom: PWR, amount: '1000000' }];
    expect(
      selectFee(100_000, feeTokens, balances, bankSpends(ADDRESS, [sendMsg(PWR, '950000')]))
    ).not.toBeNull();
    expect(
      selectFee(100_000, feeTokens, balances, bankSpends(ADDRESS, [sendMsg(PWR, '950001')]))
    ).toBeNull();
  });

  test('returns null when no fee token is affordable', () => {
    expect(selectFee(100_000, feeTokens, [{ denom: 'utoken', amount: '999999999' }])).toBeNull();
  });
});

describe('bankSpends', () => {
  test('sums sends from the address by denom and ignores other senders and messages', () => {
    const spends = bankSpends(ADDRESS, [
      sendMsg(PWR, '10'),
      sendMsg(PWR, '5'),
      sendMsg('umfx', '7'),
      sendMsg(PWR, '1000', 'manifest1someoneelse'),
      { typeUrl: '/cosmos.group.v1.MsgSubmitProposal', value: { proposers: [ADDRESS] } },
    ]);
    expect(spends.get(PWR)?.toFixed()).toBe('15');
    expect(spends.get('umfx')?.toFixed()).toBe('7');
    expect(spends.size).toBe(2);
  });
});
