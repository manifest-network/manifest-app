import { Coin, EncodeObject } from '@cosmjs/proto-signing';
import { GasPrice, SigningStargateClient, StdFee, calculateFee } from '@cosmjs/stargate';
import { useChain } from '@cosmos-kit/react';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';

import { useToast } from '@/contexts/toastContext';
import { MFX_TOKEN_BASE, formatDenom } from '@/utils';

export interface FeeToken {
  denom: string;
  gasPrice: GasPrice;
}

const DEFAULT_GAS_MODIFIER = 1.5;

/**
 * Sum, by denom, what `address` itself spends in the messages (bank sends and contract
 * funds), so a fee paid in the same denom still has to fit in the balance. Messages
 * sent on behalf of a group policy are not counted: the policy pays, not `address`.
 */
export function messageSpends(address: string, messages: EncodeObject[]): Map<string, BigNumber> {
  const spends = new Map<string, BigNumber>();
  const add = (coins: Coin[] | undefined) => {
    for (const coin of coins ?? []) {
      spends.set(coin.denom, (spends.get(coin.denom) ?? new BigNumber(0)).plus(coin.amount));
    }
  };
  for (const msg of messages) {
    if (msg.typeUrl === '/cosmos.bank.v1beta1.MsgSend' && msg.value?.fromAddress === address) {
      add(msg.value.amount);
    } else if (
      msg.typeUrl === '/cosmwasm.wasm.v1.MsgExecuteContract' &&
      msg.value?.sender === address
    ) {
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
  balances: readonly Coin[],
  spends: Map<string, BigNumber> = new Map()
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
 * Largest amount of a fee token's balance that can be spent when the fee is paid in that
 * same token, and the fee to send it with. Null if the balance doesn't cover the fee.
 */
export function maxAfterFee(
  balance: string,
  gasLimit: number,
  feeToken: FeeToken
): { amount: string; fee: StdFee } | null {
  const fee = calculateFee(gasLimit, feeToken.gasPrice);
  const amount = new BigNumber(balance).minus(fee.amount[0].amount);
  return amount.gt(0) ? { amount: amount.toFixed(), fee } : null;
}

export const useFeeEstimation = (chainName: string) => {
  const { getSigningStargateClient, chain } = useChain(chainName);
  const { setToastMessage } = useToast();

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

  const estimateFee = async (
    address: string,
    messages: EncodeObject[],
    modifier?: number,
    memo?: string
  ) => {
    try {
      const stargateClient = await getClient();
      if (!stargateClient) {
        return null;
      }

      // Check if account exists before simulation
      try {
        const account = await stargateClient.getAccount(address);
        if (!account) {
          showError(
            'Account Error',
            `Account ${address} does not exist on chain. Please ensure you have funds in your wallet.`
          );
          return null;
        }
      } catch (accountError) {
        showError(
          'Account Error',
          `Account ${address} does not exist on chain. Please ensure you have funds in your wallet.`
        );
        return null;
      }

      const [gasEstimation, balances] = await Promise.all([
        stargateClient.simulate(address, messages, memo),
        Promise.all(feeTokens.map(t => stargateClient.getBalance(address, t.denom))).catch(
          () => null
        ),
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

      const gasLimit = Math.round(gasEstimation * (modifier || DEFAULT_GAS_MODIFIER));
      const fee = selectFee(gasLimit, feeTokens, balances, messageSpends(address, messages));
      if (!fee) {
        showError(
          'Insufficient Funds for Fees',
          `Not enough ${feeTokens.map(t => formatDenom(t.denom)).join(' or ')} to pay the transaction fee.`
        );
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
   * Max amount of `denom` that `buildMsg(amount)` can spend. For a fee token, the fee is
   * paid in that same token and taken out of the amount, so amount + fee is exactly the
   * balance; send with the returned fee. For any other token it is the whole balance.
   */
  const estimateMax = async (
    address: string,
    denom: string,
    buildMsg: (amount: string) => EncodeObject,
    memo?: string
  ): Promise<{ amount: string; fee?: StdFee } | null> => {
    try {
      const stargateClient = await getClient();
      if (!stargateClient) {
        return null;
      }
      const { amount: balance } = await stargateClient.getBalance(address, denom);
      const feeToken = feeTokens.find(t => t.denom === denom);
      if (!feeToken || new BigNumber(balance).isZero()) {
        return { amount: balance };
      }

      const gasEstimation = await stargateClient.simulate(address, [buildMsg(balance)], memo);
      const max = maxAfterFee(balance, Math.round(gasEstimation * DEFAULT_GAS_MODIFIER), feeToken);
      if (!max) {
        showError(
          'Insufficient Funds for Fees',
          `Your ${formatDenom(denom)} balance is too low to cover the transaction fee.`
        );
      }
      return max;
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
