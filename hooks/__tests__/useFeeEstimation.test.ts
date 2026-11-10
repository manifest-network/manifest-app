import { GasPrice } from '@cosmjs/stargate';
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';

import env from '@/config/env';
import {
  FeeToken,
  MIN_GAS_MODIFIER,
  checkMaxQuote,
  messageSpends,
  quoteMax,
  selectFee,
  useFeeEstimation,
} from '@/hooks';
import { clearAllMocks, mockModule } from '@/tests';

const ADDRESS = 'manifest1sender';
const PWR = env.pwrTokenDenom;

const mfxFee: FeeToken = { denom: 'umfx', gasPrice: GasPrice.fromString('1.1umfx') };
const pwrFee: FeeToken = { denom: PWR, gasPrice: GasPrice.fromString(`0.5${PWR}`) };
const feeTokens = [mfxFee, pwrFee];

const sendMsg = (
  denom: string,
  amount: string,
  fromAddress = ADDRESS,
  toAddress = 'manifest1recipient'
) => ({
  typeUrl: '/cosmos.bank.v1beta1.MsgSend',
  value: { fromAddress, toAddress, amount: [{ denom, amount }] },
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

describe('quoteMax', () => {
  test('leaves exactly the fee, so amount + fee is the balance', () => {
    const quote = quoteMax(ADDRESS, '1000000', 100_000, pwrFee);
    expect(quote).toMatchObject({
      address: ADDRESS,
      denom: PWR,
      amount: '950000',
      fee: { amount: [{ denom: PWR, amount: '50000' }], gas: '100000' },
    });
    // The send then fits exactly: selectFee accepts this amount with this gas.
    expect(
      selectFee(
        100_000,
        [pwrFee],
        [{ denom: PWR, amount: '1000000' }],
        messageSpends(ADDRESS, [sendMsg(PWR, quote!.amount)])
      )
    ).toEqual(quote!.fee);
  });

  test('returns null when the balance does not cover the fee', () => {
    expect(quoteMax(ADDRESS, '50000', 100_000, pwrFee)).toBeNull();
    expect(quoteMax(ADDRESS, '49999', 100_000, pwrFee)).toBeNull();
  });
});

describe('checkMaxQuote', () => {
  // 150_000 gas at 0.5 upwr is a 75_000 upwr fee, leaving 925_000 of 1_000_000 upwr.
  const quote = quoteMax(ADDRESS, '1000000', 150_000, pwrFee)!;
  const balances = [{ denom: PWR, amount: '1000000' }];
  const sending = (amount: string) => messageSpends(ADDRESS, [sendMsg(PWR, amount)]);

  test('pays the quote for a send of exactly the quoted amount', () => {
    expect(checkMaxQuote(quote, ADDRESS, sending('925000'), 100_000, balances)).toEqual({
      kind: 'pay',
      fee: quote.fee,
    });
  });

  test('does not apply to another amount, token or account', () => {
    const check = (address: string, spends: ReturnType<typeof messageSpends>) =>
      checkMaxQuote(quote, address, spends, 100_000, balances).kind;

    expect(check(ADDRESS, sending('924999'))).toBe('unrelated');
    expect(check(ADDRESS, messageSpends(ADDRESS, [sendMsg('umfx', '925000')]))).toBe('unrelated');
    const other = 'manifest1other';
    expect(check(other, messageSpends(other, [sendMsg(PWR, '925000', other)]))).toBe('unrelated');
    // A group proposal spends from the policy, not from the proposer.
    expect(check(ADDRESS, new Map())).toBe('unrelated');
  });

  test('is stale once the send needs more gas than the quote leaves room for', () => {
    const mostGas = 150_000 / MIN_GAS_MODIFIER;
    const check = (gas: number) => checkMaxQuote(quote, ADDRESS, sending('925000'), gas, balances);

    expect(check(Math.floor(mostGas))).toEqual({ kind: 'pay', fee: quote.fee });
    expect(check(Math.ceil(mostGas)).kind).toBe('stale');
  });

  test('is stale once the balance no longer covers amount + fee', () => {
    const withBalance = (amount: string) =>
      checkMaxQuote(quote, ADDRESS, sending('925000'), 100_000, [{ denom: PWR, amount }]).kind;

    expect(withBalance('999999')).toBe('stale');
    expect(withBalance('2000000')).toBe('pay');
  });
});

describe('useFeeEstimation', () => {
  let balances: Record<string, string>;
  let client: any;
  const setToastMessage = jest.fn();
  const toastTitles = () => setToastMessage.mock.calls.map(([toast]) => toast.title);

  beforeEach(() => {
    balances = { umfx: '0', [PWR]: '1000000' };
    setToastMessage.mockClear();
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
      useToast: () => ({ setToastMessage }),
    }));
  });

  afterEach(() => {
    cleanup();
    clearAllMocks();
  });

  // MAX on a PWR-only wallet: 100_000 gas * 1.5 * 0.5 upwr is a 75_000 upwr fee.
  async function maxPwr() {
    const { result } = renderHook(() => useFeeEstimation('manifest'));
    const quote = await result.current.estimateMax(ADDRESS, PWR, a => sendMsg(PWR, a));
    expect(quote?.amount).toBe('925000');
    return { estimateFee: result.current.estimateFee, quote: quote! };
  }

  test('a PWR-only wallet sends its whole balance, fee included', async () => {
    const { estimateFee, quote } = await maxPwr();
    const msg = sendMsg(PWR, quote.amount);
    // The real send takes a bit more gas than the MAX simulation. Priced afresh, its fee
    // (105_000 * 1.5 * 0.5 = 78_750 upwr) would no longer fit next to the amount.
    client.simulate.mockResolvedValueOnce(105_000);

    const fee = await estimateFee(ADDRESS, [msg], { memo: 'thanks', maxQuote: quote });
    expect(fee).toEqual({ amount: [{ denom: PWR, amount: '75000' }], gas: '150000' });
    // The transaction itself is still simulated, memo included.
    expect(client.simulate).toHaveBeenLastCalledWith(ADDRESS, [msg], 'thanks');
    expect(setToastMessage).not.toHaveBeenCalled();
  });

  test('never pays the quote for a transaction that fails simulation', async () => {
    const { estimateFee, quote } = await maxPwr();
    // For example the fee collector, which the chain blocks from receiving funds.
    const blocked = 'manifest17xpfvakm2amg962yls6f84z3kell8c5l3mphl4';
    client.simulate.mockRejectedValueOnce(new Error(`${blocked} is not allowed to receive funds`));

    const fee = await estimateFee(ADDRESS, [sendMsg(PWR, quote.amount, ADDRESS, blocked)], {
      maxQuote: quote,
    });
    expect(fee).toBeNull();
    expect(toastTitles()).toEqual(['Fee Estimation Error']);
  });

  test('asks for MAX again once the balance went down', async () => {
    const { estimateFee, quote } = await maxPwr();
    balances[PWR] = '990000';

    const fee = await estimateFee(ADDRESS, [sendMsg(PWR, quote.amount)], { maxQuote: quote });
    expect(fee).toBeNull();
    expect(toastTitles()).toEqual(['Fee Changed']);
  });

  test('asks for MAX again once the send needs more gas than the quote allows', async () => {
    const { estimateFee, quote } = await maxPwr();
    // 120_000 * 1.3 = 156_000, over the quote's 150_000 gas limit.
    client.simulate.mockResolvedValueOnce(120_000);

    const fee = await estimateFee(ADDRESS, [sendMsg(PWR, quote.amount)], { maxQuote: quote });
    expect(fee).toBeNull();
    expect(toastTitles()).toEqual(['Fee Changed']);
  });

  test('pays in MFX instead when the quote is stale and MFX covers the fee', async () => {
    const { estimateFee, quote } = await maxPwr();
    balances.umfx = '1000000';
    client.simulate.mockResolvedValueOnce(120_000);

    const fee = await estimateFee(ADDRESS, [sendMsg(PWR, quote.amount)], { maxQuote: quote });
    // 120_000 * 1.5 = 180_000 gas at 1.1 umfx.
    expect(fee).toEqual({ amount: [{ denom: 'umfx', amount: '198000' }], gas: '180000' });
  });

  test('without the quote, the same send does not fit', async () => {
    const { estimateFee, quote } = await maxPwr();
    client.simulate.mockResolvedValueOnce(105_000);

    expect(await estimateFee(ADDRESS, [sendMsg(PWR, quote.amount)])).toBeNull();
    expect(toastTitles()).toEqual(['Insufficient Funds for Fees']);
  });

  test('estimates any other amount afresh', async () => {
    const { estimateFee, quote } = await maxPwr();
    client.simulate.mockResolvedValueOnce(80_000);

    const fee = await estimateFee(ADDRESS, [sendMsg(PWR, '900000')], { maxQuote: quote });
    expect(fee).toEqual({ amount: [{ denom: PWR, amount: '60000' }], gas: '120000' });
  });

  test('MAX gives nothing when the balance cannot cover the fee', async () => {
    balances[PWR] = '75000';
    const { result } = renderHook(() => useFeeEstimation('manifest'));

    expect(await result.current.estimateMax(ADDRESS, PWR, a => sendMsg(PWR, a))).toBeNull();
    expect(toastTitles()).toEqual(['Insufficient Funds for Fees']);
  });

  test('MAX gives nothing for a token that cannot pay fees', async () => {
    const { result } = renderHook(() => useFeeEstimation('manifest'));

    const quote = await result.current.estimateMax(ADDRESS, 'utoken', a => sendMsg('utoken', a));
    expect(quote).toBeNull();
    expect(client.simulate).not.toHaveBeenCalled();
  });
});
