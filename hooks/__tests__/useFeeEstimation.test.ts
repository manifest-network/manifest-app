import { GasPrice } from '@cosmjs/stargate';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';

import env from '@/config/env';
import { FeeToken, maxAfterFee, messageSpends, selectFee, useFeeEstimation } from '@/hooks';
import { clearAllMocks, mockModule } from '@/tests';

const ADDRESS = 'manifest1sender';
const PWR = env.pwrTokenDenom;

const mfxFee: FeeToken = { denom: 'umfx', gasPrice: GasPrice.fromString('1.1umfx') };
const pwrFee: FeeToken = { denom: PWR, gasPrice: GasPrice.fromString(`0.5${PWR}`) };
const feeTokens = [mfxFee, pwrFee];

const sendMsg = (denom: string, amount: string, fromAddress = ADDRESS) => ({
  typeUrl: '/cosmos.bank.v1beta1.MsgSend',
  value: { fromAddress, toAddress: 'manifest1recipient', amount: [{ denom, amount }] },
});

const convertMsg = (amount: string, sender = ADDRESS) => ({
  typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
  value: { sender, contract: 'manifest1contract', msg: [], funds: [{ denom: 'umfx', amount }] },
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
      selectFee(100_000, feeTokens, balances, messageSpends(ADDRESS, [sendMsg(PWR, '950000')]))
    ).not.toBeNull();
    expect(
      selectFee(100_000, feeTokens, balances, messageSpends(ADDRESS, [sendMsg(PWR, '950001')]))
    ).toBeNull();
  });

  test('pays in PWR when converting leaves too little MFX for the fee', () => {
    const fee = selectFee(
      100_000,
      feeTokens,
      [
        { denom: 'umfx', amount: '1000000' },
        { denom: PWR, amount: '1000000' },
      ],
      messageSpends(ADDRESS, [convertMsg('950000')])
    );
    expect(fee?.amount[0].denom).toBe(PWR);
  });

  test('returns null when no fee token is affordable', () => {
    expect(selectFee(100_000, feeTokens, [{ denom: 'utoken', amount: '999999999' }])).toBeNull();
  });
});

describe('messageSpends', () => {
  test('sums sends and contract funds from the address by denom', () => {
    const spends = messageSpends(ADDRESS, [
      sendMsg(PWR, '10'),
      sendMsg(PWR, '5'),
      sendMsg('umfx', '7'),
      convertMsg('3'),
    ]);
    expect(spends.get(PWR)?.toFixed()).toBe('15');
    expect(spends.get('umfx')?.toFixed()).toBe('10');
    expect(spends.size).toBe(2);
  });

  test('ignores other senders and group proposals', () => {
    const spends = messageSpends(ADDRESS, [
      sendMsg(PWR, '1000', 'manifest1someoneelse'),
      convertMsg('1000', 'manifest1grouppolicy'),
      { typeUrl: '/cosmos.group.v1.MsgSubmitProposal', value: { proposers: [ADDRESS] } },
    ]);
    expect(spends.size).toBe(0);
  });
});

describe('maxAfterFee', () => {
  test('leaves exactly the fee, so amount + fee is the balance', () => {
    const max = maxAfterFee('1000000', 100_000, pwrFee);
    expect(max?.fee.amount).toEqual([{ denom: PWR, amount: '50000' }]);
    expect(max?.amount).toBe('950000');
    // The send then fits exactly: selectFee accepts this amount with this gas.
    expect(
      selectFee(
        100_000,
        [pwrFee],
        [{ denom: PWR, amount: '1000000' }],
        messageSpends(ADDRESS, [sendMsg(PWR, max!.amount)])
      )
    ).toEqual(max!.fee);
  });

  test('returns null when the balance does not cover the fee', () => {
    expect(maxAfterFee('50000', 100_000, pwrFee)).toBeNull();
    expect(maxAfterFee('49999', 100_000, pwrFee)).toBeNull();
  });
});

describe('useFeeEstimation MAX', () => {
  const balances: Record<string, string> = { umfx: '0', [PWR]: '1000000' };
  let client: any;

  beforeEach(() => {
    client = {
      getAccount: jest.fn().mockResolvedValue({ address: ADDRESS }),
      getBalance: jest.fn(async (_: string, denom: string) => ({
        denom,
        amount: balances[denom] ?? '0',
      })),
      simulate: jest.fn().mockResolvedValue(100_000),
    };
    mockModule('@cosmos-kit/react', () => ({
      useChain: () => ({
        getSigningStargateClient: async () => client,
        chain: {
          fees: {
            fee_tokens: [
              { denom: 'umfx', average_gas_price: 1.1 },
              { denom: PWR, average_gas_price: 0.5 },
            ],
          },
        },
      }),
    }));
    mockModule('@/contexts/toastContext', () => ({
      useToast: () => ({ setToastMessage: jest.fn() }),
    }));
  });

  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  test('a PWR-only wallet sends its whole balance, fee included', async () => {
    const { result } = renderHook(() => useFeeEstimation('manifest'));
    const build = (amount: string) => sendMsg(PWR, amount);

    let max: string | null = null;
    await act(async () => {
      max = await result.current.estimateMax(ADDRESS, PWR, build);
    });
    // 100_000 gas * 1.5 * 0.5 upwr = 75_000 upwr fee.
    expect(max).toBe('925000');

    // Sending exactly the max reuses that fee without simulating again.
    client.simulate.mockClear();
    const fee = await result.current.estimateFee(ADDRESS, [build(max!)]);
    expect(fee).toEqual({ amount: [{ denom: PWR, amount: '75000' }], gas: '150000' });
    expect(client.simulate).not.toHaveBeenCalled();

    // Any other amount is estimated afresh.
    const other = await result.current.estimateFee(ADDRESS, [build('900000')]);
    expect(client.simulate).toHaveBeenCalledTimes(1);
    expect(other?.amount[0].denom).toBe(PWR);
  });

  test('MAX gives nothing when the balance cannot cover the fee', async () => {
    balances[PWR] = '75000';
    const { result } = renderHook(() => useFeeEstimation('manifest'));
    const max = await result.current.estimateMax(ADDRESS, PWR, a => sendMsg(PWR, a));
    expect(max).toBeNull();
    balances[PWR] = '1000000';
  });
});
