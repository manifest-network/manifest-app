import { Coin, EncodeObject } from '@cosmjs/proto-signing';
import { GasPrice, StdFee, calculateFee } from '@cosmjs/stargate';
import { useChain } from '@cosmos-kit/react';
import BigNumber from 'bignumber.js';

import env from '@/config/env';
import { useToast } from '@/contexts/toastContext';
import { MFX_TOKEN_BASE } from '@/utils';

export interface FeeToken {
  denom: string;
  gasPrice: number;
}

/**
 * Sum, by denom, what `address` sends directly in bank `MsgSend` messages, so a fee
 * paid in the same denom as the transfer still has to fit in the balance.
 */
export function bankSpends(address: string, messages: EncodeObject[]): Map<string, BigNumber> {
  const spends = new Map<string, BigNumber>();
  for (const msg of messages) {
    if (msg.typeUrl !== '/cosmos.bank.v1beta1.MsgSend' || msg.value?.fromAddress !== address) {
      continue;
    }
    for (const coin of (msg.value.amount ?? []) as Coin[]) {
      spends.set(coin.denom, (spends.get(coin.denom) ?? new BigNumber(0)).plus(coin.amount));
    }
  }
  return spends;
}

/**
 * Pick the fee from the first fee token (in chain order, so MFX first) whose balance
 * covers the fee plus anything sent in that denom. Returns null if none does.
 */
export function selectFee(
  gasLimit: number,
  feeTokens: FeeToken[],
  balances: readonly Coin[],
  spends: Map<string, BigNumber> = new Map()
): StdFee | null {
  for (const token of feeTokens) {
    const fee = calculateFee(gasLimit, GasPrice.fromString(`${token.gasPrice}${token.denom}`));
    const balance = new BigNumber(balances.find(b => b.denom === token.denom)?.amount ?? 0);
    const needed = new BigNumber(fee.amount[0].amount).plus(spends.get(token.denom) ?? 0);
    if (balance.gte(needed)) {
      return fee;
    }
  }
  return null;
}

const feeTokenName = (denom: string) =>
  denom === MFX_TOKEN_BASE ? 'MFX' : denom === env.pwrTokenDenom ? 'PWR' : denom;

export const useFeeEstimation = (chainName: string) => {
  const { getSigningStargateClient, chain } = useChain(chainName);
  const { setToastMessage } = useToast();

  const chainFeeTokens: FeeToken[] = (chain.fees?.fee_tokens ?? []).flatMap(t => {
    const gasPrice = t.average_gas_price ?? t.low_gas_price ?? t.fixed_min_gas_price;
    return gasPrice ? [{ denom: t.denom, gasPrice }] : [];
  });
  const feeTokens: FeeToken[] = chainFeeTokens.length
    ? chainFeeTokens
    : [{ denom: MFX_TOKEN_BASE, gasPrice: 0.025 }];

  const estimateFee = async (
    address: string,
    messages: EncodeObject[],
    modifier?: number,
    memo?: string
  ) => {
    try {
      const stargateClient = await getSigningStargateClient();
      if (!stargateClient) {
        setToastMessage({
          type: 'alert-error',
          title: 'Fee Estimation Error',
          description: 'Unable to connect to the network. Please try again.',
          bgColor: '#e74c3c',
        });
        return null;
      }

      // Check if account exists before simulation
      try {
        const account = await stargateClient.getAccount(address);
        if (!account) {
          setToastMessage({
            type: 'alert-error',
            title: 'Account Error',
            description: `Account ${address} does not exist on chain. Please ensure you have funds in your wallet.`,
            bgColor: '#e74c3c',
          });
          return null;
        }
      } catch (accountError) {
        setToastMessage({
          type: 'alert-error',
          title: 'Account Error',
          description: `Account ${address} does not exist on chain. Please ensure you have funds in your wallet.`,
          bgColor: '#e74c3c',
        });
        return null;
      }

      const gasEstimation = await stargateClient.simulate(address, messages, memo);
      if (!gasEstimation) {
        setToastMessage({
          type: 'alert-error',
          title: 'Fee Estimation Error',
          description: 'Failed to estimate transaction fees. Please try again.',
          bgColor: '#e74c3c',
        });
        return null;
      }

      const gasLimit = Math.round(gasEstimation * (modifier || 1.5));

      let balances: readonly Coin[];
      try {
        balances = await stargateClient.getAllBalances(address);
      } catch {
        // Can't see balances: fall back to the preferred fee token and let the chain decide.
        return calculateFee(
          gasLimit,
          GasPrice.fromString(`${feeTokens[0].gasPrice}${feeTokens[0].denom}`)
        );
      }

      const fee = selectFee(gasLimit, feeTokens, balances, bankSpends(address, messages));
      if (!fee) {
        setToastMessage({
          type: 'alert-error',
          title: 'Insufficient Funds for Fees',
          description: `Not enough ${feeTokens.map(t => feeTokenName(t.denom)).join(' or ')} to pay the transaction fee.`,
          bgColor: '#e74c3c',
        });
        return null;
      }
      return fee;
    } catch (error: any) {
      setToastMessage({
        type: 'alert-error',
        title: 'Fee Estimation Error',
        description: error.message || 'Failed to estimate transaction fees. Please try again.',
        bgColor: '#e74c3c',
      });
      return null;
    }
  };

  return { estimateFee };
};
