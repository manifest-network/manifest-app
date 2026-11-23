import { Coin, EncodeObject } from '@cosmjs/proto-signing';
import { GasPrice, SigningStargateClient, StdFee, calculateFee } from '@cosmjs/stargate';
import { useChain } from '@cosmos-kit/react';
import { MsgSend } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/tx';
import { MsgExecuteContract } from '@manifest-network/manifestjs/dist/codegen/cosmwasm/wasm/v1/tx';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import env from '@/config/env';
import { useToast } from '@/contexts/toastContext';
import { MFX_TOKEN_BASE, formatDenom } from '@/utils';

import { useLcdQueryClient, useOsmosisLcdQueryClient } from './useLcdQueryClient';

export interface FeeToken {
  denom: string;
  gasPrice: GasPrice;
}

const DEFAULT_GAS_MODIFIER = 1.5;
// Smallest margin over the simulated gas that a MAX quote's gas limit must still leave for
// its fee to be paid. MAX prices its fee at DEFAULT_GAS_MODIFIER, so the send may need up
// to ~15% more gas than the MAX simulation (a longer memo, say) and still pay that fee.
export const MIN_GAS_MODIFIER = 1.3;

/**
 * A balance that can be spent now: the bank balance less anything still locked, such as
 * unvested tokens. Fee selection and MAX take only these, so a total balance (what
 * StargateClient.getBalance returns) can't be passed in by mistake. useFeeEstimation
 * fetches them.
 */
export type SpendableCoin = Readonly<Coin> & { readonly __spendable: never };

/**
 * What MAX worked out for a fee token: the largest amount `address` can spend when the fee
 * is paid in that same token, and that fee. amount + fee was the whole spendable balance
 * when quoted.
 *
 * Only quoteMax makes one, so an amount and a fee that don't belong together can't be
 * passed off as a quote. Hand it to useTx (or estimateFee) with the transaction: the fee
 * is paid only if checkMaxQuote accepts it for that transaction.
 */
export type MaxQuote = Readonly<{
  address: string;
  denom: string;
  /** Base units. */
  amount: string;
  fee: StdFee;
}> & { readonly __maxQuote: never };

/** Whether a transaction pays a MAX quote's fee. See checkMaxQuote. */
export type MaxQuoteCheck =
  | { readonly kind: 'pay'; readonly fee: StdFee }
  // The transaction doesn't spend exactly the quoted amount, so the quote doesn't apply.
  | { readonly kind: 'unrelated' }
  // It does, but the fee no longer fits: it needs more gas, or the balance went down.
  | { readonly kind: 'stale' };

/**
 * Sum, by denom, what `address` itself spends in the messages (bank sends and contract
 * funds), so a fee paid in the same denom still has to fit in the balance. Messages
 * sent on behalf of a group policy are not counted: the policy pays, not `address`.
 * Other message types that spend a fee token (e.g. a token factory burn) are not counted.
 */
export function messageSpends(address: string, messages: EncodeObject[]): Map<string, BigNumber> {
  const spends = new Map<string, BigNumber>();
  const add = (coins: Coin[] | undefined) => {
    for (const coin of coins ?? []) {
      spends.set(coin.denom, (spends.get(coin.denom) ?? new BigNumber(0)).plus(coin.amount));
    }
  };
  for (const msg of messages) {
    if (msg.typeUrl === MsgSend.typeUrl && msg.value?.fromAddress === address) {
      add(msg.value.amount);
    } else if (msg.typeUrl === MsgExecuteContract.typeUrl && msg.value?.sender === address) {
      add(msg.value.funds);
    }
  }
  return spends;
}

/**
 * Pick the fee from the first fee token (in chain order, so MFX first) whose balance
 * covers the fee plus anything spent in that denom. Returns null if none does.
 */
export function selectFee(
  gasLimit: number,
  feeTokens: FeeToken[],
  balances: readonly SpendableCoin[],
  spends: ReadonlyMap<string, BigNumber> = new Map()
): StdFee | null {
  for (const token of feeTokens) {
    const fee = calculateFee(gasLimit, token.gasPrice);
    const balance = new BigNumber(balances.find(b => b.denom === token.denom)?.amount ?? 0);
    const needed = new BigNumber(fee.amount[0].amount).plus(spends.get(token.denom) ?? 0);
    if (balance.gte(needed)) {
      return fee;
    }
  }
  return null;
}

/**
 * Quote MAX for `address`'s spendable `balance` of a fee token: the balance minus the fee
 * for `gasLimit`, with the fee paid in that token. Null if the balance doesn't cover the
 * fee.
 */
export function quoteMax(
  address: string,
  balance: SpendableCoin,
  gasLimit: number,
  feeToken: FeeToken
): MaxQuote | null {
  if (balance.denom !== feeToken.denom) {
    throw new Error(`Cannot quote MAX for ${balance.denom} with a ${feeToken.denom} fee`);
  }
  const fee = calculateFee(gasLimit, feeToken.gasPrice);
  const amount = new BigNumber(balance.amount).minus(fee.amount[0].amount);
  if (!amount.gt(0)) {
    return null;
  }
  return { address, denom: feeToken.denom, amount: amount.toFixed(), fee } as MaxQuote;
}

/**
 * Decide whether a transaction pays a MAX quote's fee. It must spend exactly the quoted
 * amount of the quoted token from the quoted address (see messageSpends). Its simulation
 * must have succeeded at `gasEstimation`, and the quote's gas limit must still be at
 * least MIN_GAS_MODIFIER times that. The balance must also still cover amount + fee.
 */
export function checkMaxQuote(
  quote: MaxQuote,
  address: string,
  spends: ReadonlyMap<string, BigNumber>,
  gasEstimation: number,
  balances: readonly SpendableCoin[]
): MaxQuoteCheck {
  if (quote.address !== address || !spends.get(quote.denom)?.eq(quote.amount)) {
    return { kind: 'unrelated' };
  }
  const balance = new BigNumber(balances.find(b => b.denom === quote.denom)?.amount ?? 0);
  const gasFits = gasEstimation * MIN_GAS_MODIFIER <= Number(quote.fee.gas);
  const balanceCovers = balance.gte(new BigNumber(quote.amount).plus(quote.fee.amount[0].amount));
  return gasFits && balanceCovers ? { kind: 'pay', fee: quote.fee } : { kind: 'stale' };
}

export interface FeeOptions {
  /** Gas limit as a multiple of the simulated gas. Defaults to DEFAULT_GAS_MODIFIER. */
  modifier?: number;
  memo?: string;
  /** Pay this MAX quote's fee if checkMaxQuote accepts it for the transaction. */
  maxQuote?: MaxQuote | null;
}

export const useFeeEstimation = (chainName: string) => {
  const { getSigningStargateClient, chain } = useChain(chainName);
  const { setToastMessage } = useToast();
  const { lcdQueryClient: manifestLcd } = useLcdQueryClient();
  const { lcdQueryClient: osmosisLcd } = useOsmosisLcdQueryClient();
  const lcdQueryClient = chainName === env.osmosisChain ? osmosisLcd : manifestLcd;

  const feeTokens = useMemo<FeeToken[]>(() => {
    const tokens = (chain.fees?.fee_tokens ?? []).flatMap(t => {
      const price = t.average_gas_price ?? t.low_gas_price ?? t.fixed_min_gas_price;
      return price
        ? [
            {
              denom: t.denom,
              gasPrice: GasPrice.fromString(`${new BigNumber(price).toFixed()}${t.denom}`),
            },
          ]
        : [];
    });
    return tokens.length
      ? tokens
      : [{ denom: MFX_TOKEN_BASE, gasPrice: GasPrice.fromString(`0.025${MFX_TOKEN_BASE}`) }];
  }, [chain]);

  const isFeeDenom = (denom: string) => feeTokens.some(t => t.denom === denom);

  const showError = (title: string, description: string) =>
    setToastMessage({ type: 'alert-error', title, description, bgColor: '#e74c3c' });

  const getClient = async (): Promise<SigningStargateClient | null> => {
    const stargateClient = await getSigningStargateClient();
    if (!stargateClient) {
      showError('Fee Estimation Error', 'Unable to connect to the network. Please try again.');
    }
    return stargateClient ?? null;
  };

  // The only source of SpendableCoin. Like the bank page, it leaves out locked funds.
  const getSpendable = async (address: string, denom: string): Promise<SpendableCoin> => {
    if (!lcdQueryClient) {
      throw new Error('Unable to connect to the network. Please try again.');
    }
    const { balance } = await lcdQueryClient.cosmos.bank.v1beta1.spendableBalanceByDenom({
      address,
      denom,
    });
    return { denom, amount: balance?.amount ?? '0' } as SpendableCoin;
  };

  /**
   * Simulate the transaction and return its fee: the MAX quote's fee if checkMaxQuote
   * accepts it, otherwise the first fee token that covers it (see selectFee). Null, with
   * an error toast, if the simulation fails or no fee token covers the fee.
   */
  const estimateFee = async (
    address: string,
    messages: EncodeObject[],
    { modifier, memo, maxQuote }: FeeOptions = {}
  ): Promise<StdFee | null> => {
    try {
      const stargateClient = await getClient();
      if (!stargateClient) {
        return null;
      }

      // Check if account exists before simulation
      const account = await stargateClient.getAccount(address).catch(() => null);
      if (!account) {
        showError(
          'Account Error',
          `Account ${address} does not exist on chain. Please ensure you have funds in your wallet.`
        );
        return null;
      }

      const [gasEstimation, balances] = await Promise.all([
        stargateClient.simulate(address, messages, memo),
        Promise.all(feeTokens.map(t => getSpendable(address, t.denom))).catch(() => null),
      ]);
      if (!gasEstimation) {
        showError('Fee Estimation Error', 'Failed to estimate transaction fees. Please try again.');
        return null;
      }
      if (!balances) {
        showError(
          'Fee Estimation Error',
          'Unable to check your balance to pay the fee. Please try again.'
        );
        return null;
      }

      const spends = messageSpends(address, messages);
      const quote: MaxQuoteCheck = maxQuote
        ? checkMaxQuote(maxQuote, address, spends, gasEstimation, balances)
        : { kind: 'unrelated' };
      if (quote.kind === 'pay') {
        return quote.fee;
      }

      const gasLimit = Math.round(gasEstimation * (modifier || DEFAULT_GAS_MODIFIER));
      const fee = selectFee(gasLimit, feeTokens, balances, spends);
      if (!fee) {
        if (quote.kind === 'stale') {
          showError(
            'Fee Changed',
            'The network fee or your balance changed since you clicked MAX. Click MAX again to update the amount.'
          );
        } else {
          showError(
            'Insufficient Funds for Fees',
            `Not enough ${feeTokens.map(t => formatDenom(t.denom)).join(' or ')} to pay the transaction fee.`
          );
        }
        return null;
      }
      return fee;
    } catch (error: any) {
      showError(
        'Fee Estimation Error',
        error.message || 'Failed to estimate transaction fees. Please try again.'
      );
      return null;
    }
  };

  /**
   * Quote MAX for fee token `denom`: simulate `buildMsg` spending the whole spendable
   * balance and take the fee, paid in that same token, out of it (see quoteMax). Null, with an error
   * toast, if that fails or the balance doesn't cover the fee. Only for fee tokens (see
   * isFeeDenom); other tokens max out at the whole balance.
   */
  const estimateMax = async (
    address: string,
    denom: string,
    buildMsg: (amount: string) => EncodeObject,
    memo?: string
  ): Promise<MaxQuote | null> => {
    const feeToken = feeTokens.find(t => t.denom === denom);
    if (!feeToken) {
      return null;
    }
    try {
      const stargateClient = await getClient();
      if (!stargateClient) {
        return null;
      }
      const balance = await getSpendable(address, denom);
      const gasEstimation = new BigNumber(balance.amount).isZero()
        ? 0
        : await stargateClient.simulate(address, [buildMsg(balance.amount)], memo);
      const quote = quoteMax(
        address,
        balance,
        Math.round(gasEstimation * DEFAULT_GAS_MODIFIER),
        feeToken
      );
      if (!quote) {
        showError(
          'Insufficient Funds for Fees',
          `Your ${formatDenom(denom)} balance is too low to cover the transaction fee.`
        );
      }
      return quote;
    } catch (error: any) {
      showError(
        'Fee Estimation Error',
        error.message || 'Failed to estimate the maximum amount. Please try again.'
      );
      return null;
    }
  };

  return { estimateFee, estimateMax, isFeeDenom };
};
