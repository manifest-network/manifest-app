import BigNumber from 'bignumber.js';
import React, { useEffect, useRef, useState } from 'react';

import { HelpIcon } from '@/components';
import type { MaxQuote } from '@/hooks/useFeeEstimation';
import { CombinedBalanceInfo } from '@/utils';

export interface MaxButtonProps {
  token: CombinedBalanceInfo | null;
  /**
   * The amount field's current value. Changing it, or the token, while an estimate is
   * running drops that estimate, so it can't overwrite what the user did in the meantime.
   */
  amount: string;
  /** Sets the amount field, in display units, along with the MAX quote it came from. */
  setTokenAmount: (amount: string, quote: MaxQuote | null) => void;
  disabled?: boolean;
  /**
   * Quotes MAX with the network fee taken out, or returns null to leave the amount
   * unchanged. Without it, MAX is the whole balance and there is no quote.
   */
  estimateMax?: (token: CombinedBalanceInfo) => Promise<MaxQuote | null>;
}

export const MaxButton = ({
  token,
  amount,
  setTokenAmount,
  disabled,
  estimateMax,
}: MaxButtonProps) => {
  const [isEstimating, setIsEstimating] = useState(false);

  // A new controller for each token and amount. Changing either, or unmounting, aborts the
  // previous one, and an estimate started under an aborted controller is dropped.
  const tokenBase = token?.base;
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const current = new AbortController();
    controller.current = current;
    return () => current.abort();
  }, [tokenBase, amount]);

  return (
    <button
      className="text-xs text-primary cursor-pointer"
      disabled={disabled || isEstimating}
      type="button"
      onClick={async () => {
        if (!token) return;
        const signal = controller.current?.signal;

        setIsEstimating(true);
        try {
          let quote: MaxQuote | null = null;
          if (estimateMax) {
            quote = await estimateMax(token);
            if (!quote || quote.denom !== token.base || signal?.aborted) return;
          }

          const decimals = token.metadata?.denom_units[1]?.exponent ?? 6;
          const max = new BigNumber(quote?.amount ?? token.amount).shiftedBy(-decimals);
          setTokenAmount(max.toFixed(), quote);
        } finally {
          setIsEstimating(false);
        }
      }}
    >
      MAX
      {token && estimateMax && (
        <span
          className="tooltip tooltip-primary align-baseline"
          data-tip="Network fee is deducted from the max amount"
        >
          <HelpIcon role="contentinfo" aria-label="info" className="w-3 h-3 ml-1 text-primary" />
        </span>
      )}
    </button>
  );
};
