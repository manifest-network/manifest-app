import { GasPrice } from '@cosmjs/stargate';
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, jest, test } from 'bun:test';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import env from '@/config/env';
import { quoteMax, useTx } from '@/hooks';
import { clearAllMocks, mockModule } from '@/tests';

const ADDRESS = 'manifest1sender';
const PWR = env.pwrTokenDenom;

const sendMsg = (amount: string) => ({
  typeUrl: '/cosmos.bank.v1beta1.MsgSend',
  value: {
    fromAddress: ADDRESS,
    toAddress: 'manifest1recipient',
    amount: [{ denom: PWR, amount }],
  },
});

describe('useTx fees', () => {
  let client: any;
  const setToastMessage = jest.fn();

  beforeEach(() => {
    setToastMessage.mockClear();
    // A PWR-only wallet.
    const balances: Record<string, string> = { umfx: '0', [PWR]: '1000000' };
    client = {
      getAccount: jest.fn().mockResolvedValue({ address: ADDRESS }),
      getBalance: jest.fn(async (_: string, denom: string) => ({
        denom,
        amount: balances[denom] ?? '0',
      })),
      simulate: jest.fn().mockResolvedValue(100_000),
      sign: jest.fn().mockResolvedValue(TxRaw.fromPartial({})),
      broadcastTx: jest.fn().mockResolvedValue({ code: 0, transactionHash: 'HASH', events: [] }),
    };
    mockModule('@cosmos-kit/react', () => ({
      useChain: () => ({
        address: ADDRESS,
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

  // 150_000 gas at 0.5 upwr is a 75_000 upwr fee, leaving 925_000 of 1_000_000 upwr.
  const quote = quoteMax(ADDRESS, '1000000', 150_000, {
    denom: PWR,
    gasPrice: GasPrice.fromString(`0.5${PWR}`),
  })!;

  test('pays a MAX quote, estimated for the messages and memo it signs', async () => {
    const { result } = renderHook(() => useTx('manifest'));
    const msg = sendMsg(quote.amount);
    // Priced afresh, 105_000 gas would be a 78_750 upwr fee, too much next to the amount.
    client.simulate.mockResolvedValueOnce(105_000);

    const res = await result.current.tx([msg], {
      memo: 'thanks',
      maxQuote: quote,
      returnError: true,
    });

    expect(res).toEqual({ error: null });
    expect(client.simulate).toHaveBeenCalledWith(ADDRESS, [msg], 'thanks');
    expect(client.sign).toHaveBeenCalledWith(ADDRESS, [msg], quote.fee, 'thanks');
  });

  test('signs nothing when the MAX transaction fails simulation', async () => {
    const { result } = renderHook(() => useTx('manifest'));
    client.simulate.mockRejectedValueOnce(new Error('recipient is not allowed to receive funds'));

    const res = await result.current.tx([sendMsg(quote.amount)], {
      maxQuote: quote,
      returnError: true,
    });

    expect(res).toEqual({ error: 'Fee estimation failed' });
    expect(client.sign).not.toHaveBeenCalled();
  });

  test('pays the fee in PWR from a PWR-only wallet', async () => {
    const { result } = renderHook(() => useTx('manifest'));
    const msg = sendMsg('500000');

    await result.current.tx([msg], {});

    expect(client.sign).toHaveBeenCalledWith(
      ADDRESS,
      [msg],
      { amount: [{ denom: PWR, amount: '75000' }], gas: '150000' },
      ''
    );
  });

  test('signs with a given fee as is', async () => {
    const { result } = renderHook(() => useTx('manifest'));
    const fee = { amount: [{ denom: 'umfx', amount: '1' }], gas: '1' };

    await result.current.tx([sendMsg('1')], { fee });

    expect(client.simulate).not.toHaveBeenCalled();
    expect(client.sign).toHaveBeenCalledWith(ADDRESS, [sendMsg('1')], fee, '');
  });
});
